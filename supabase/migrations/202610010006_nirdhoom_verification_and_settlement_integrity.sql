-- NIRDHOOM V7.2: close remaining trust-boundary gaps.
-- Verification requires an operational evidence chain; buyer allocation must
-- actually claim the lot; the legacy client-supplied booking RPC is retired.

revoke execute on function public.reserve_clearance_booking(uuid,date,numeric,numeric,date,numeric,text,jsonb) from authenticated;

create or replace function public.record_verification_review(
  p_field_id uuid,
  p_result text,
  p_confidence numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns public.verification_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.verification_events%rowtype;
  role_name text;
  completed_job uuid;
  evidence_count integer;
  lot_count integer;
begin
  select role into role_name from public.profiles where id=auth.uid();
  if role_name not in ('verifier','dispatcher','admin') then
    raise exception 'Verifier role required';
  end if;
  if p_result not in ('VERIFIED_NON_BURN','REVIEW_REQUIRED','REJECTED') then
    raise exception 'Invalid verification result';
  end if;
  if p_confidence < 0 or p_confidence > 100 then
    raise exception 'Confidence must be between 0 and 100';
  end if;

  select j.id into completed_job
  from public.jobs j
  join public.bookings b on b.id=j.booking_id
  where b.field_id=p_field_id and j.status='COMPLETED'
  order by j.actual_completed_at desc nulls last
  limit 1;

  select count(*) into evidence_count
  from public.evidence_assets e
  where e.field_id=p_field_id
    and (e.booking_id is null or e.booking_id=(select booking_id from public.jobs where id=completed_job));

  select count(*) into lot_count
  from public.residue_lots l
  where l.field_id=p_field_id
    and (completed_job is null or l.job_id=completed_job or l.booking_id=(select booking_id from public.jobs where id=completed_job));

  if p_result='VERIFIED_NON_BURN' and (completed_job is null or evidence_count < 1 or lot_count < 1) then
    raise exception 'Verification requires completed job, evidence asset and residue lot';
  end if;

  insert into public.verification_events(field_id,method,result,confidence,metadata)
  values(
    p_field_id,
    'field_evidence_plus_firms',
    p_result,
    p_confidence,
    coalesce(p_metadata,'{}'::jsonb)
      || jsonb_build_object(
        'server_evidence_count', evidence_count,
        'server_lot_count', lot_count,
        'completed_job_id', completed_job
      )
  ) returning * into v;

  if p_result='VERIFIED_NON_BURN' then
    update public.fields set status='VERIFIED_NON_BURN',updated_at=now() where id=p_field_id;
    update public.bookings b
      set status='VERIFIED',updated_at=now()
      where b.field_id=p_field_id and b.status='CLEARED_PENDING_AUDIT';
  end if;
  return v;
end;
$$;

grant execute on function public.record_verification_review(uuid,text,numeric,jsonb) to authenticated;

create or replace function public.accept_buyer_offer(p_offer_id uuid)
returns public.buyer_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.buyer_offers%rowtype;
  role_name text;
  claimed integer;
begin
  select role into role_name from public.profiles where id=auth.uid();
  if role_name not in ('buyer','dispatcher','admin') then
    raise exception 'Buyer/dispatcher role required';
  end if;

  select * into o from public.buyer_offers where id=p_offer_id and status='OPEN' for update;
  if not found then raise exception 'Offer is no longer open'; end if;

  if role_name='buyer' and not exists(
    select 1 from public.buyers b
    where b.id=o.buyer_id and b.profile_id=auth.uid() and b.active=true
  ) then
    raise exception 'Offer does not belong to the authenticated buyer';
  end if;

  update public.residue_lots
  set assigned_buyer_id=o.buyer_id,status='ALLOCATED',updated_at=now()
  where id=o.lot_id and status in ('AVAILABLE','OPEN');
  get diagnostics claimed = row_count;
  if claimed <> 1 then
    raise exception 'Residue lot is no longer available';
  end if;

  update public.buyer_offers
  set status='ACCEPTED'
  where id=p_offer_id and status='OPEN'
  returning * into o;
  if not found then raise exception 'Offer changed during acceptance'; end if;
  return o;
end;
$$;

grant execute on function public.accept_buyer_offer(uuid) to authenticated;

create unique index if not exists payments_provider_reference_idx
on public.payments(provider, provider_reference)
where provider is not null and provider_reference is not null;
