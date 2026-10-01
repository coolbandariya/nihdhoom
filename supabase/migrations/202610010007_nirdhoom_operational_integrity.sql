-- NIRDHOOM V7.3: operational integrity.
-- Close remaining client-write and cross-tenant trust gaps.

create or replace function public.prevent_self_privileged_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.id = auth.uid() and coalesce(new.role,'farmer') <> 'farmer' then
    raise exception 'New self-created profiles must start as farmer';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_insert_role on public.profiles;
create trigger protect_profile_insert_role
before insert on public.profiles
for each row execute function public.prevent_self_privileged_profile();

alter table public.buyers add column if not exists profile_id uuid references public.profiles(id);
create unique index if not exists buyers_profile_unique_idx
on public.buyers(profile_id) where profile_id is not null;

drop policy if exists "buyer creates offer" on public.buyer_offers;
create policy "buyer creates own offer" on public.buyer_offers
for insert to authenticated
with check (
  exists(
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role in ('dispatcher','admin')
  )
  or exists(
    select 1 from public.buyers b
    where b.id=buyer_id and b.profile_id=auth.uid() and b.active=true
  )
);

alter table public.machine_locations
  drop constraint if exists machine_locations_latitude_check;
alter table public.machine_locations
  add constraint machine_locations_latitude_check check (latitude between -90 and 90);
alter table public.machine_locations
  drop constraint if exists machine_locations_longitude_check;
alter table public.machine_locations
  add constraint machine_locations_longitude_check check (longitude between -180 and 180);
alter table public.machine_locations
  drop constraint if exists machine_locations_speed_check;
alter table public.machine_locations
  add constraint machine_locations_speed_check check (speed_kmh is null or speed_kmh between 0 and 250);

create or replace function public.validate_evidence_asset()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare booking_field uuid;
begin
  if new.booking_id is not null then
    select field_id into booking_field from public.bookings where id=new.booking_id;
    if booking_field is null or booking_field <> new.field_id then
      raise exception 'Evidence booking does not belong to the supplied field';
    end if;
  end if;

  if new.created_by is not null and new.storage_path is not null
     and split_part(new.storage_path,'/',1) <> new.created_by::text then
    raise exception 'Evidence storage path must belong to its creator';
  end if;

  if new.latitude is not null and (new.latitude < -90 or new.latitude > 90) then
    raise exception 'Evidence latitude is invalid';
  end if;
  if new.longitude is not null and (new.longitude < -180 or new.longitude > 180) then
    raise exception 'Evidence longitude is invalid';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_evidence_asset on public.evidence_assets;
create trigger validate_evidence_asset
before insert or update on public.evidence_assets
for each row execute function public.validate_evidence_asset();

drop policy if exists "nirdhoom evidence read" on storage.objects;
create policy "nirdhoom evidence read" on storage.objects
for select to authenticated
using(
  bucket_id='evidence'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or exists(
      select 1 from public.profiles p
      where p.id=(select auth.uid()) and p.role in ('verifier','dispatcher','admin')
    )
  )
);

revoke insert on public.firms_observations from authenticated;

drop policy if exists "operator/verifier inserts evidence" on public.evidence_assets;
drop policy if exists "operator/verifier inserts linked evidence" on public.evidence_assets;
create policy "operator inserts linked evidence" on public.evidence_assets
for insert to authenticated
with check (
  (select p.role from public.profiles p where p.id=auth.uid())='operator'
  and created_by=auth.uid()
  and exists(
    select 1
    from public.jobs j
    join public.bookings b on b.id=j.booking_id
    where j.operator_id=auth.uid()
      and j.status in ('ARRIVED','BALING','PROOF_PENDING','COMPLETED')
      and b.id=evidence_assets.booking_id
      and b.field_id=evidence_assets.field_id
  )
);

grant execute on function public.accept_buyer_offer(uuid) to authenticated;
