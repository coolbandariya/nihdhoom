-- Telegram integration persistence for NIRDHOOM.
-- Server-only access is intentional: these tables contain Telegram identifiers and link tokens.

create table if not exists public.telegram_webhook_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

create table if not exists public.telegram_link_tokens (
  token_hash text primary key,
  profile_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_tokens_profile_id_idx
  on public.telegram_link_tokens(profile_id);

create index if not exists telegram_link_tokens_expires_at_idx
  on public.telegram_link_tokens(expires_at);

create table if not exists public.telegram_identities (
  profile_id uuid not null,
  telegram_user_id bigint not null,
  telegram_chat_id bigint not null unique,
  username text,
  first_name text,
  language_code text,
  notification_enabled boolean not null default true,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id)
);

create index if not exists telegram_identities_telegram_user_id_idx
  on public.telegram_identities(telegram_user_id);

alter table public.telegram_webhook_updates enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.telegram_identities enable row level security;

create or replace function public.consume_telegram_link_token(
  p_token_hash text,
  p_telegram_user_id bigint,
  p_telegram_chat_id bigint,
  p_username text default null,
  p_first_name text default null,
  p_language_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  token_row public.telegram_link_tokens%rowtype;
begin
  select *
    into token_row
    from public.telegram_link_tokens
   where token_hash = p_token_hash
     and expires_at > now()
   for update;

  if not found then
    return null;
  end if;

  insert into public.telegram_identities (
    profile_id,
    telegram_user_id,
    telegram_chat_id,
    username,
    first_name,
    language_code,
    notification_enabled,
    linked_at,
    updated_at
  )
  values (
    token_row.profile_id,
    p_telegram_user_id,
    p_telegram_chat_id,
    p_username,
    p_first_name,
    p_language_code,
    true,
    now(),
    now()
  )
  on conflict (profile_id) do update set
    telegram_user_id = excluded.telegram_user_id,
    telegram_chat_id = excluded.telegram_chat_id,
    username = excluded.username,
    first_name = excluded.first_name,
    language_code = excluded.language_code,
    notification_enabled = true,
    updated_at = now();

  delete from public.telegram_link_tokens
   where token_hash = p_token_hash;

  return jsonb_build_object('profile_id', token_row.profile_id);
end;
$$;

revoke all on public.telegram_webhook_updates from anon, authenticated;
revoke all on public.telegram_link_tokens from anon, authenticated;
revoke all on public.telegram_identities from anon, authenticated;
revoke all on function public.consume_telegram_link_token(text, bigint, bigint, text, text, text) from public;
grant execute on function public.consume_telegram_link_token(text, bigint, bigint, text, text, text) to service_role;
