-- NIRDHOOM V7.1: server-owned quote integrity.
-- The browser may preview a quote, but it may not choose the financial terms
-- that become authoritative in a booking.

create or replace function public.reserve_clearance_booking_v2(
  p_field_id uuid,
  p_requested_date date
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.fields%rowtype;
  b public.bookings%rowtype;
  v_days numeric;
  v_urgency numeric;
  v_day_factor numeric;
  v_rate numeric;
  v_amount numeric;
  v_guaranteed date;
  v_penalty numeric;
  v_band text;
begin
  select * into f from public.fields where id=p_field_id for update;
  if not found or f.owner_id <> auth.uid() then
    raise exception 'Field is not owned by the current farmer';
  end if;
  if not exists (
    select 1 from public.consents c
    where c.profile_id=auth.uid()
      and c.consent_type='farmer_network'
      and c.revoked_at is null
  ) then
    raise exception 'Active farmer consent is required before booking';
  end if;
  if p_requested_date < current_date then
    raise exception 'Requested date is in the past';
  end if;
  if f.acreage <= 0 or f.acreage > 500 then
    raise exception 'Field acreage is outside the supported booking range';
  end if;

  v_days := coalesce(f.expected_harvest_date::date-current_date, 14);
  v_urgency := case when v_days <= 3 then 1.28 when v_days <= 7 then 1.14 when v_days <= 14 then 1.04 else 0.94 end;
  v_day_factor := case when extract(isodow from p_requested_date)=7 then 1.08 else 1 end;
  v_rate := round(greatest(1000, least(3200, 1500*v_urgency*v_day_factor))/10)*10;
  v_amount := round(v_rate*f.acreage, 2);
  v_guaranteed := p_requested_date;
  v_penalty := greatest(2500, f.acreage*2500);
  v_band := case when v_urgency >= 1.2 then 'urgent' when v_urgency >= 1 then 'standard' else 'early-booking' end;

  insert into public.bookings(
    field_id, requested_date, rate_per_acre, quoted_amount,
    guaranteed_by_date, penalty_amount, pricing_band, quote_metadata,
    status, accepted_at
  ) values (
    p_field_id, p_requested_date, v_rate, v_amount,
    v_guaranteed, v_penalty, v_band,
    jsonb_build_object('engine','nirdhoom-pricing-v1','server_authoritative',true,'days_to_harvest',v_days),
    'BOOKED', now()
  ) returning * into b;

  update public.fields
  set status='BOOKED',
      clearance_deadline=(v_guaranteed::text||'T18:00:00+05:30')::timestamptz,
      updated_at=now()
  where id=p_field_id;

  return b;
exception when unique_violation then
  raise exception 'This field already has an active booking for that date';
end;
$$;

grant execute on function public.reserve_clearance_booking_v2(uuid,date) to authenticated;
