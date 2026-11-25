create table public.community_general_prayer_cooldown (
  room text primary key check (room = 'community-general'),
  sent_at timestamptz not null
);
alter table public.community_general_prayer_cooldown enable row level security;
revoke all on public.community_general_prayer_cooldown from public, anon, authenticated;

create function public.community_general_prayer_targets(_caller uuid, _groups uuid[])
returns table(user_id uuid)
language sql security definer set search_path = ''
as $$
  with claim as (
    insert into public.community_general_prayer_cooldown as cooldown (room, sent_at)
    select 'community-general', now()
    where exists (select 1 from public.community_admins staff where staff.user_id = _caller)
      and (_groups is null or (
        cardinality(_groups) between 1 and 100
        and not exists (
          select 1 from unnest(_groups) as requested(id)
          where not exists (
            select 1 from public.community_group_members gm
            where gm.group_id = requested.id and gm.user_id = _caller
          )
        )
      ))
    on conflict (room) do update set sent_at = excluded.sent_at
    where cooldown.sent_at <= excluded.sent_at - interval '1 minute'
    returning room
  )
  select distinct token.user_id
  from claim
  cross join public.user_push_tokens token
  where token.enabled and token.user_id <> _caller
    and (_groups is null or exists (
      select 1 from public.community_group_members gm
      where gm.group_id = any(_groups) and gm.user_id = token.user_id
        and not (gm.muted is true and (gm.muted_until is null or gm.muted_until > now()))
    ))
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id = _caller and b.blocked_id = token.user_id)
         or (b.blocker_id = token.user_id and b.blocked_id = _caller)
    );
$$;
revoke all on function public.community_general_prayer_targets(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.community_general_prayer_targets(uuid, uuid[]) to service_role;
