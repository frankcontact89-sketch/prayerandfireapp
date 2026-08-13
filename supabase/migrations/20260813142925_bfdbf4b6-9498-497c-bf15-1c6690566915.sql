ALTER TABLE public.community_groups REPLICA IDENTITY FULL;
ALTER TABLE public.community_group_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_members;