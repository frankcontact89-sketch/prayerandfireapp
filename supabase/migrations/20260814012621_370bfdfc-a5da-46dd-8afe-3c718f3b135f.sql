REVOKE EXECUTE ON FUNCTION public.discover_community_groups() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.discover_community_groups() TO authenticated;