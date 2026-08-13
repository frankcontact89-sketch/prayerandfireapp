REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_community_owner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_see_community_message(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_community_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_see_community_message(uuid, uuid) TO authenticated, service_role;