alter table public.user_push_tokens add column locale text not null default 'en'
  check (locale in ('en', 'es', 'pt'));

create table public.community_call_push_cooldowns (
  group_id uuid primary key references public.community_groups(id) on delete cascade,
  sent_at timestamptz not null
);

alter table public.community_call_push_cooldowns enable row level security;
revoke all on public.community_call_push_cooldowns from public, anon, authenticated;

create function public.community_call_push_targets(_group_id uuid, _caller_id uuid)
returns table(user_id uuid)
language sql
security definer
set search_path = ''
as $$
  with claim as (
    insert into public.community_call_push_cooldowns as cooldown (group_id, sent_at)
    select _group_id, now()
    where exists (
      select 1 from public.community_group_members gm
      where gm.group_id = _group_id and gm.user_id = _caller_id
    )
    on conflict (group_id) do update set sent_at = excluded.sent_at
    where cooldown.sent_at <= excluded.sent_at - interval '1 minute'
    returning group_id
  )
  select gm.user_id
  from claim c
  join public.community_group_members gm on gm.group_id = c.group_id
  where gm.user_id <> _caller_id
    and not (gm.muted is true and (gm.muted_until is null or gm.muted_until > now()))
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id = gm.user_id and b.blocked_id = _caller_id)
         or (b.blocker_id = _caller_id and b.blocked_id = gm.user_id)
    );
$$;

revoke all on function public.community_call_push_targets(uuid, uuid) from public, anon, authenticated;
grant execute on function public.community_call_push_targets(uuid, uuid) to service_role;
