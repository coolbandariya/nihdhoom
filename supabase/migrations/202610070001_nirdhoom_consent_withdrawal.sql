-- NIRDHOOM 2026-10-07 consent withdrawal boundary.
-- Adds the missing self-service withdrawal path without changing prior migrations.

create policy "profile revokes own consent"
on public.consents
for update
to authenticated
using (
  profile_id = (select auth.uid())
  and revoked_at is null
)
with check (
  profile_id = (select auth.uid())
  and revoked_at is not null
);

grant update on public.consents to authenticated;

create or replace function public.revoke_farmer_network_consent()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.consents
  set revoked_at = coalesce(revoked_at, now())
  where profile_id = (select auth.uid())
    and consent_type = 'farmer_network'
    and revoked_at is null;

  update public.profiles
  set consent_status = 'REVOKED'
  where id = (select auth.uid());

  if not found then
    raise exception 'Authenticated farmer profile was not found';
  end if;
end;
$$;

revoke all on function public.revoke_farmer_network_consent() from public;
grant execute on function public.revoke_farmer_network_consent() to authenticated;
