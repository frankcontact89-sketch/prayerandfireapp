CREATE OR REPLACE FUNCTION public.shares_community_group(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members m1
    JOIN public.community_group_members m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  )
$$;

CREATE POLICY "Community staff view community profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_community_staff(auth.uid()) AND (public.is_community_approved(id) OR public.is_community_staff(id)));

CREATE POLICY "Group members view each other profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.shares_community_group(auth.uid(), id));