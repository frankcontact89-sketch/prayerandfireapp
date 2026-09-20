-- Harden Prayer & Fire Community permissions and media privacy.

-- Community media was originally created public in an older migration.
-- Force it private now and remove permissive legacy read policies.
UPDATE storage.buckets
SET public = false
WHERE id = 'community-media';

DROP POLICY IF EXISTS "community media public read" ON storage.objects;
DROP POLICY IF EXISTS "Community media read" ON storage.objects;
DROP POLICY IF EXISTS "community media read" ON storage.objects;

CREATE POLICY "Community media member read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'community-media'
  AND public.is_community_approved(auth.uid())
  AND (
    -- Group avatars live under <uploader>/groups/...
    (storage.foldername(name))[2] = 'groups'
    OR (
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      AND public.is_community_member(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  )
);

-- Only the group creator/owner (or the global Community owner) may delete a group.
DROP POLICY IF EXISTS "Group admins delete groups" ON public.community_groups;
DROP POLICY IF EXISTS "owners delete groups" ON public.community_groups;
DROP POLICY IF EXISTS "Owners delete groups" ON public.community_groups;

CREATE POLICY "Group owner deletes group"
ON public.community_groups
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_community_boss(auth.uid())
);

-- Prevent members from promoting themselves by directly editing their own membership row.
CREATE OR REPLACE FUNCTION public.enforce_community_member_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_group_admin(OLD.group_id, auth.uid()) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;

    -- Group admins may not demote/remove the owner role. Only the Community owner can.
    IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner' AND NOT public.is_community_boss(auth.uid()) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;

    -- Only the Community owner can assign the owner role.
    IF NEW.role = 'owner' AND OLD.role IS DISTINCT FROM 'owner' AND NOT public.is_community_boss(auth.uid()) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_group_members_role_guard ON public.community_group_members;
CREATE TRIGGER community_group_members_role_guard
BEFORE UPDATE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_community_member_role_change();

-- Prevent a regular group admin from deleting the owner's membership row.
CREATE OR REPLACE FUNCTION public.enforce_community_owner_membership_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner'
     AND auth.uid() IS DISTINCT FROM OLD.user_id
     AND NOT public.is_community_boss(auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS community_group_members_owner_delete_guard ON public.community_group_members;
CREATE TRIGGER community_group_members_owner_delete_guard
BEFORE DELETE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_community_owner_membership_delete();
