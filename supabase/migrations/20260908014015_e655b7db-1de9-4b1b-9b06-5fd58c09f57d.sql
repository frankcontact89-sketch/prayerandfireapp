-- 1) Prevent role self-escalation on membership rows
CREATE OR REPLACE FUNCTION public.enforce_group_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT created_by INTO _creator FROM public.community_groups WHERE id = NEW.group_id;
    -- only group admins/owners/staff may change roles at all
    IF NOT public.is_group_admin(NEW.group_id, auth.uid()) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;
    -- only the creator/owner or community leadership may assign the owner role
    IF NEW.role = 'owner' AND NOT (public.is_community_boss(auth.uid()) OR auth.uid() = _creator) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_group_members_enforce_roles ON public.community_group_members;
CREATE TRIGGER community_group_members_enforce_roles
BEFORE UPDATE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_group_role_changes();

-- also block role escalation at insert time for self-joins
CREATE OR REPLACE FUNCTION public.enforce_group_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
BEGIN
  SELECT created_by INTO _creator FROM public.community_groups WHERE id = NEW.group_id;
  IF NEW.role IS DISTINCT FROM 'member'
     AND NOT (public.is_community_boss(auth.uid()) OR auth.uid() = _creator OR public.is_group_admin(NEW.group_id, auth.uid())) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  IF NEW.role = 'owner' AND NOT (public.is_community_boss(auth.uid()) OR auth.uid() = _creator) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_group_members_enforce_role_insert ON public.community_group_members;
CREATE TRIGGER community_group_members_enforce_role_insert
BEFORE INSERT ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_group_role_insert();

-- 2) Only the creator/owner or community leadership may delete a whole group
DROP POLICY IF EXISTS "Group admins delete groups" ON public.community_groups;
CREATE POLICY "Owners delete groups"
ON public.community_groups
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.is_community_boss(auth.uid()));