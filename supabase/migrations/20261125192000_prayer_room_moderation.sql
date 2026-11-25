create table public.prayer_room_participant_controls (
  room text not null,
  user_id uuid not null references auth.users on delete cascade,
  moderator_until timestamptz,
  turn_requested_at timestamptz,
  removed_until timestamptz,
  primary key (room, user_id)
);
alter table public.prayer_room_participant_controls enable row level security;
revoke all on public.prayer_room_participant_controls from public, anon, authenticated;

create function public.prayer_room_member(_room text, _user uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select _user is not null and (_room = 'community-general' or exists (
    select 1 from public.community_group_members gm
    where gm.group_id::text = _room and gm.user_id = _user
  ));
$$;
revoke all on function public.prayer_room_member(text, uuid) from public, anon, authenticated;

create function public.prayer_room_admin(_room text, _user uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select case when _room = 'community-general' then exists (
    select 1 from public.community_admins ca where ca.user_id = _user
  ) else exists (
    select 1 from public.community_group_members gm
    where gm.group_id::text = _room and gm.user_id = _user and gm.role in ('admin', 'owner')
  ) end;
$$;
revoke all on function public.prayer_room_admin(text, uuid) from public, anon, authenticated;

create function public.prayer_room_not_removed(_room text)
returns boolean language sql stable security definer set search_path=''
as $$
  select not exists (
    select 1 from public.prayer_room_participant_controls pc
    where pc.room = _room and pc.user_id = auth.uid() and pc.removed_until > now()
  );
$$;
revoke all on function public.prayer_room_not_removed(text) from public, anon;
grant execute on function public.prayer_room_not_removed(text) to authenticated;

create policy "Prayer room removal restricts signaling reads" on realtime.messages
  as restrictive for select to authenticated using (
    realtime.topic() not like 'voice-room:%' or public.prayer_room_not_removed(split_part(realtime.topic(), ':', 2))
  );
create policy "Prayer room removal restricts signaling writes" on realtime.messages
  as restrictive for insert to authenticated with check (
    realtime.topic() not like 'voice-room:%' or public.prayer_room_not_removed(split_part(realtime.topic(), ':', 2))
  );

create function public.prayer_room_controls(_room text)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  caller uuid := auth.uid();
  caller_admin boolean;
begin
  if not coalesce(public.prayer_room_member(_room, caller), false) then
    raise exception 'Prayer room access denied' using errcode='42501';
  end if;
  caller_admin := public.prayer_room_admin(_room, caller);
  return jsonb_build_object(
    'admin', caller_admin,
    'moderator', caller_admin or exists (
      select 1 from public.prayer_room_participant_controls pc
      where pc.room = _room and pc.user_id = caller and pc.moderator_until > now()
    ),
    'removed_users', coalesce((
      select jsonb_agg(pc.user_id) from public.prayer_room_participant_controls pc
      where pc.room = _room and pc.removed_until > now()
    ), '[]'::jsonb),
    'turn_at', (
      select pc.turn_requested_at from public.prayer_room_participant_controls pc
      where pc.room = _room and pc.user_id = caller and pc.turn_requested_at > now() - interval '30 seconds'
    )
  );
end;
$$;
revoke all on function public.prayer_room_controls(text) from public, anon;
grant execute on function public.prayer_room_controls(text) to authenticated;

create function public.prayer_room_moderate(_room text, _target uuid, _action text)
returns void language plpgsql security definer set search_path=''
as $$
declare
  caller uuid := auth.uid();
  caller_admin boolean;
begin
  if not coalesce(public.prayer_room_member(_room, caller), false)
     or not coalesce(public.prayer_room_member(_room, _target), false)
     or not public.prayer_room_not_removed(_room)
     or caller = _target
     or _action is null or _action not in ('turn', 'moderator', 'remove') then
    raise exception 'Prayer room action denied' using errcode='42501';
  end if;
  caller_admin := public.prayer_room_admin(_room, caller);
  if not caller_admin and (_action = 'moderator' or not exists (
    select 1 from public.prayer_room_participant_controls pc
    where pc.room = _room and pc.user_id = caller and pc.moderator_until > now()
  )) then
    raise exception 'Prayer room moderation required' using errcode='42501';
  end if;
  if _action = 'remove' and (
    public.prayer_room_admin(_room, _target)
    or (not caller_admin and exists (
      select 1 from public.prayer_room_participant_controls pc
      where pc.room = _room and pc.user_id = _target and pc.moderator_until > now()
    ))
  ) then
    raise exception 'Cannot remove a room administrator or peer moderator' using errcode='42501';
  end if;
  insert into public.prayer_room_participant_controls (room, user_id)
  values (_room, _target) on conflict do nothing;
  update public.prayer_room_participant_controls
  set moderator_until = case when _action = 'moderator' then now() + interval '2 hours' when _action = 'remove' then null else moderator_until end,
      turn_requested_at = case when _action = 'turn' then now() when _action = 'remove' then null else turn_requested_at end,
      removed_until = case when _action = 'remove' then now() + interval '10 minutes' else removed_until end
  where room = _room and user_id = _target;
end;
$$;
revoke all on function public.prayer_room_moderate(text, uuid, text) from public, anon;
grant execute on function public.prayer_room_moderate(text, uuid, text) to authenticated;
