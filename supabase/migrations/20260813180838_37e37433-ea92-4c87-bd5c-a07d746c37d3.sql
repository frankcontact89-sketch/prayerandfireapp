ALTER TABLE public.community_admins ADD COLUMN IF NOT EXISTS can_create_groups boolean NOT NULL DEFAULT true;

UPDATE public.community_admins SET can_create_groups = true WHERE role = 'owner';

CREATE OR REPLACE FUNCTION public.can_create_community_group(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND (
    public.is_community_boss(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.community_admins
      WHERE user_id = _user_id AND role IN ('owner','admin') AND can_create_groups
    )
  )
$$;

DROP POLICY IF EXISTS "Only staff create groups" ON public.community_groups;
CREATE POLICY "Only authorized staff create groups"
ON public.community_groups FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.can_create_community_group(auth.uid()));

DROP POLICY IF EXISTS "Members send messages" ON public.community_messages;
CREATE POLICY "Approved members send messages"
ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_community_member(group_id, auth.uid())
  AND public.is_community_approved(auth.uid())
);

DROP POLICY IF EXISTS "Group admins add membership" ON public.community_group_members;
CREATE POLICY "Group admins add approved membership"
ON public.community_group_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_community_approved(user_id)
  AND (
    public.is_group_admin(group_id, auth.uid())
    OR (
      user_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id = group_id AND g.created_by = auth.uid())
    )
  )
);