-- NIRDHOOM residue-first marketplace layer.
-- Pool fragmented supply against buyer demand; impact remains downstream of verified evidence.

create table if not exists public.buyer_demands (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  buyer_name text not null,
  residue_type text not null default 'PADDY_STRAW',
  target_tonnes numeric(12,2) not null check (target_tonnes > 0),
  pickup_deadline date not null,
  radius_km numeric(8,2) not null default 50 check (radius_km > 0),
  max_moisture_pct numeric(5,2),
  status text not null default 'OPEN' check (status in ('OPEN','MATCHED','FULFILLED','CANCELLED','EXPIRED')),
  created_at timestamptz not null default now()
);

create table if not exists public.residue_pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  buyer_demand_id uuid references public.buyer_demands(id) on delete set null,
  target_tonnes numeric(12,2) not null check (target_tonnes > 0),
  current_tonnes numeric(12,2) not null default 0 check (current_tonnes >= 0),
  status text not null default 'FILLING' check (status in ('FILLING','MATCHED','LOCKED','COLLECTING','COMPLETED','CANCELLED')),
  pickup_deadline date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.residue_pool_members (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.residue_pools(id) on delete cascade,
  residue_lot_id uuid not null references public.residue_lots(id) on delete restrict,
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  committed_tonnes numeric(12,2) not null check (committed_tonnes > 0),
  status text not null default 'COMMITTED' check (status in ('COMMITTED','WITHDRAWN','FULFILLED')),
  created_at timestamptz not null default now(),
  unique(pool_id, residue_lot_id)
);

create table if not exists public.impact_methodologies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  source_url text,
  assumptions jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(name, version)
);

create index if not exists buyer_demands_status_idx on public.buyer_demands(status, pickup_deadline);
create index if not exists residue_pools_status_idx on public.residue_pools(status, created_at desc);
create index if not exists residue_pool_members_pool_idx on public.residue_pool_members(pool_id);
create index if not exists residue_pool_members_lot_idx on public.residue_pool_members(residue_lot_id);

alter table public.buyer_demands enable row level security;
alter table public.residue_pools enable row level security;
alter table public.residue_pool_members enable row level security;
alter table public.impact_methodologies enable row level security;

drop policy if exists "buyers read own demands" on public.buyer_demands;
create policy "buyers read own demands" on public.buyer_demands for select to authenticated using (
  buyer_id=(select auth.uid())
  or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('dispatcher','admin'))
);

drop policy if exists "buyers create own demands" on public.buyer_demands;
create policy "buyers create own demands" on public.buyer_demands for insert to authenticated with check (
  buyer_id=(select auth.uid())
  and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='buyer')
);

drop policy if exists "operational read pools" on public.residue_pools;
create policy "operational read pools" on public.residue_pools for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('farmer','buyer','operator','dispatcher','verifier','admin'))
);

drop policy if exists "operational read pool members" on public.residue_pool_members;
create policy "operational read pool members" on public.residue_pool_members for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('farmer','buyer','operator','dispatcher','verifier','admin'))
);

drop policy if exists "verified lot owners can commit" on public.residue_pool_members;
create policy "verified lot owners can commit" on public.residue_pool_members for insert to authenticated with check (
  farmer_id=(select auth.uid())
  and exists(
    select 1 from public.residue_lots l
    join public.fields f on f.id=l.field_id
    where l.id=residue_lot_id and f.owner_id=(select auth.uid())
      and l.status in ('AVAILABLE','VERIFIED','VERIFIED_NON_BURN')
  )
);

create or replace function public.join_residue_pool(p_pool_id uuid, p_quantity_tonnes numeric)
returns public.residue_pool_members
language plpgsql
security definer
set search_path = public
as $$
declare
  lot_row public.residue_lots%rowtype;
  member_row public.residue_pool_members%rowtype;
  remaining numeric;
  actor uuid := (select auth.uid());
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_quantity_tonnes <= 0 then raise exception 'quantity must be positive'; end if;

  select l.* into lot_row
  from public.residue_lots l
  join public.fields f on f.id=l.field_id
  where f.owner_id=actor and l.status in ('AVAILABLE','VERIFIED','VERIFIED_NON_BURN')
  order by l.created_at asc
  for update of l
  limit 1;

  if lot_row.id is null then raise exception 'no eligible residue lot'; end if;

  select greatest(0, p.target_tonnes - p.current_tonnes) into remaining
  from public.residue_pools p where p.id=p_pool_id and p.status='FILLING' for update;

  if remaining is null then raise exception 'pool is not accepting commitments'; end if;
  if p_quantity_tonnes > remaining then raise exception 'commitment exceeds pool remaining capacity'; end if;
  if exists(select 1 from public.residue_pool_members m where m.pool_id=p_pool_id and m.residue_lot_id=lot_row.id and m.status='COMMITTED') then
    raise exception 'residue lot already committed to this pool';
  end if;

  insert into public.residue_pool_members(pool_id,residue_lot_id,farmer_id,committed_tonnes)
  values(p_pool_id,lot_row.id,actor,p_quantity_tonnes)
  returning * into member_row;

  update public.residue_pools set current_tonnes=current_tonnes+p_quantity_tonnes where id=p_pool_id;
  return member_row;
end;
$$;

grant select on public.buyer_demands, public.residue_pools, public.residue_pool_members, public.impact_methodologies to authenticated;
grant execute on function public.join_residue_pool(uuid,numeric) to authenticated;

drop policy if exists "read active methodologies" on public.impact_methodologies;
create policy "read active methodologies" on public.impact_methodologies for select to authenticated using (
  active=true or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('verifier','admin'))
);


create or replace function public.create_residue_pool(
  p_name text,
  p_target_tonnes numeric,
  p_pickup_deadline date,
  p_buyer_demand_id uuid default null
)
returns public.residue_pools
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := (select auth.uid());
  role_name text;
  row_out public.residue_pools%rowtype;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if p_target_tonnes <= 0 then raise exception 'target quantity must be positive'; end if;

  select role into role_name from public.profiles where id=actor;
  if role_name not in ('buyer','dispatcher','admin') then
    raise exception 'only buyers or operations roles can create pools';
  end if;

  if p_buyer_demand_id is not null and not exists (
    select 1 from public.buyer_demands d
    where d.id=p_buyer_demand_id
      and d.status='OPEN'
      and (
        d.buyer_id=actor
        or role_name in ('dispatcher','admin')
      )
  ) then
    raise exception 'buyer demand is not available to this user';
  end if;

  insert into public.residue_pools(name,buyer_demand_id,target_tonnes,pickup_deadline,created_by)
  values(p_name,p_buyer_demand_id,p_target_tonnes,p_pickup_deadline,actor)
  returning * into row_out;

  return row_out;
end;
$$;

grant execute on function public.create_residue_pool(text,numeric,date,uuid) to authenticated;
