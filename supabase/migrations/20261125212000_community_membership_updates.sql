create or replace function public.community_can_create_group()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.community_admins a
      where a.user_id = auth.uid() and (a.role = 'owner' or a.can_create_groups is true)
    ) or exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
$$;
alter publication supabase_realtime add table public.community_group_members;
