create function public.prayer_app_can_read_profile(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    target = (select auth.uid())
    or public.has_role((select auth.uid()), 'admin')
    or public.is_community_global_admin((select auth.uid()))
    or exists (select 1 from public.community_group_members viewer
      join public.community_group_members member on member.group_id=viewer.group_id
      where viewer.user_id=(select auth.uid()) and member.user_id=target)
  )
$$;
revoke all on function public.prayer_app_can_read_profile(uuid) from public, anon;
grant execute on function public.prayer_app_can_read_profile(uuid) to authenticated;
drop policy "Signed-in members can view profiles" on public.profiles;
create policy "Prayer app profile visibility" on public.profiles for select to authenticated
using (public.prayer_app_can_read_profile(id));

create table public.community_audio_plays (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  played_at timestamptz not null default now(),
  primary key(message_id,user_id)
);
alter table public.community_audio_plays enable row level security;
grant select,insert,update on public.community_audio_plays to authenticated;
grant all on public.community_audio_plays to service_role;
create policy "Listen receipts visible to listener and sender" on public.community_audio_plays
for select to authenticated using (
  user_id=(select auth.uid()) or exists(select 1 from public.community_messages m where m.id=message_id and m.sender_id=(select auth.uid()))
);
create policy "Members can save their listen receipt" on public.community_audio_plays
for insert to authenticated with check (user_id=(select auth.uid()) and public.can_see_community_message(message_id,user_id));
create policy "Members can update their listen receipt" on public.community_audio_plays
for update to authenticated using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()) and public.can_see_community_message(message_id,user_id));
