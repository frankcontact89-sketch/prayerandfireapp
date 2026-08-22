-- Isolated local PostgreSQL fixture for executable Community RLS regression tests.
-- This file does NOT execute the production migration and must only run in the dedicated
-- local database created by scripts/test-community-direct-chat-rls.sh.

CREATE SCHEMA auth;
CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE TABLE public.community_groups (
  id uuid PRIMARY KEY,
  is_direct boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  name text NOT NULL DEFAULT 'Group'
);

CREATE TABLE public.community_group_members (
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  muted boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE public.community_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE public.community_messages (
  id bigserial PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL
);

CREATE FUNCTION public.is_community_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.community_group_members
       WHERE group_id = _group_id AND user_id = _user_id
     )
$$;

CREATE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.community_group_members
       WHERE group_id = _group_id
         AND user_id = _user_id
         AND role IN ('owner', 'admin')
     )
$$;

CREATE FUNCTION public.is_community_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT _user_id IS NOT NULL $$;

CREATE FUNCTION public.has_blocked(_blocker uuid, _blocked uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_blocks
    WHERE blocker_id = _blocker AND blocked_id = _blocked
  )
$$;

-- This is the same fail-closed peer lookup model used by the PR migration. Membership SELECT
-- below deliberately exposes only the caller's own row, so a plain policy subquery would hide
-- the peer. SECURITY DEFINER makes the direct-chat decision independent of caller RLS visibility.
CREATE FUNCTION public.direct_community_chat_is_blocked(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  direct_group boolean;
  member_count integer;
  caller_is_member boolean;
  peer_id uuid;
BEGIN
  SELECT g.is_direct INTO direct_group
  FROM public.community_groups g
  WHERE g.id = _group_id;

  IF COALESCE(direct_group, false) = false THEN
    RETURN false;
  END IF;

  IF caller IS NULL THEN
    RETURN true;
  END IF;

  SELECT count(*), bool_or(m.user_id = caller),
         (array_agg(m.user_id) FILTER (WHERE m.user_id <> caller))[1]
    INTO member_count, caller_is_member, peer_id
  FROM public.community_group_members m
  WHERE m.group_id = _group_id;

  IF member_count <> 2 OR COALESCE(caller_is_member, false) = false OR peer_id IS NULL THEN
    RETURN true;
  END IF;

  RETURN public.has_blocked(caller, peer_id)
      OR public.has_blocked(peer_id, caller);
END;
$$;

CREATE FUNCTION public.protect_community_membership_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_direct_group boolean;
BEGIN
  IF NEW.group_id IS DISTINCT FROM OLD.group_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'COMMUNITY_MEMBERSHIP_IDENTITY_IMMUTABLE';
  END IF;

  SELECT g.is_direct INTO is_direct_group
  FROM public.community_groups g
  WHERE g.id = OLD.group_id;

  IF COALESCE(is_direct_group, false)
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'DIRECT_CHAT_MEMBERSHIP_ROLE_IMMUTABLE';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_community_membership_identity
BEFORE UPDATE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_community_membership_identity();

CREATE FUNCTION public.protect_community_group_creator_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.group_id ELSE NEW.group_id END;
  target_user_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  creator_id uuid;
BEGIN
  SELECT created_by INTO creator_id
  FROM public.community_groups
  WHERE id = target_group_id;

  IF creator_id IS NOT NULL
     AND target_user_id = creator_id
     AND auth.uid() IS DISTINCT FROM creator_id THEN
    RAISE EXCEPTION 'COMMUNITY_GROUP_CREATOR_MEMBERSHIP_PROTECTED';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_community_group_creator_membership
BEFORE UPDATE OR DELETE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_community_group_creator_membership();

CREATE FUNCTION public.set_community_membership_preferences(
  _group_id uuid,
  _muted boolean DEFAULT NULL,
  _archived boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  IF _muted IS NULL AND _archived IS NULL THEN
    RAISE EXCEPTION 'PREFERENCE_VALUE_REQUIRED';
  END IF;

  UPDATE public.community_group_members
  SET muted = COALESCE(_muted, muted),
      archived = COALESCE(_archived, archived)
  WHERE group_id = _group_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COMMUNITY_MEMBERSHIP_NOT_FOUND';
  END IF;
END;
$$;

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Normal groups are discoverable in the fixture; a direct group is visible only to a participant.
-- This gives the normal-group admin membership policy access to group type while retaining hidden
-- peer membership rows inside direct chats.
CREATE POLICY "Fixture group visibility" ON public.community_groups
FOR SELECT TO authenticated
USING (
  NOT is_direct
  OR public.is_community_member(id, auth.uid())
);

-- Direct-chat participants can see only their own membership row. Normal-group administrators can
-- see memberships for their own normal groups, which is required for intended admin management.
-- The hidden direct peer proves the direct-chat helper cannot fail open under membership RLS.
CREATE POLICY "Members view own membership only" ON public.community_group_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (
    COALESCE((
      SELECT NOT g.is_direct
      FROM public.community_groups g
      WHERE g.id = group_id
    ), false)
    AND public.is_group_admin(group_id, auth.uid())
  )
);

CREATE POLICY "Group admins add approved membership" ON public.community_group_members
FOR INSERT TO authenticated
WITH CHECK (
  COALESCE((SELECT NOT g.is_direct FROM public.community_groups g WHERE g.id = group_id), false)
  AND public.is_group_admin(group_id, auth.uid())
);

CREATE POLICY "Normal group admins manage membership" ON public.community_group_members
FOR UPDATE TO authenticated
USING (
  COALESCE((SELECT NOT g.is_direct FROM public.community_groups g WHERE g.id = group_id), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
)
WITH CHECK (
  COALESCE((SELECT NOT g.is_direct FROM public.community_groups g WHERE g.id = group_id), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
);

CREATE POLICY "Normal group admins remove membership" ON public.community_group_members
FOR DELETE TO authenticated
USING (
  COALESCE((SELECT NOT g.is_direct FROM public.community_groups g WHERE g.id = group_id), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
);

CREATE POLICY "Members read messages" ON public.community_messages
FOR SELECT TO authenticated
USING (
  public.is_community_member(group_id, auth.uid())
  AND NOT public.has_blocked(auth.uid(), sender_id)
  AND NOT public.direct_community_chat_is_blocked(group_id)
);

CREATE POLICY "Approved members send messages" ON public.community_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_community_member(group_id, auth.uid())
  AND public.is_community_approved(auth.uid())
  AND NOT public.direct_community_chat_is_blocked(group_id)
);

GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_groups, public.community_group_members, public.community_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_blocks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.community_messages_id_seq TO authenticated;
REVOKE ALL ON FUNCTION public.direct_community_chat_is_blocked(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_community_membership_preferences(uuid, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direct_community_chat_is_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_community_membership_preferences(uuid, boolean, boolean) TO authenticated;

-- Fixed identities used by the executable shell tests.
INSERT INTO public.community_groups (id, is_direct, created_by, name) VALUES
  ('00000000-0000-0000-0000-000000000101', false, '00000000-0000-0000-0000-000000000001', 'Normal managed group'),
  ('00000000-0000-0000-0000-000000000102', false, '00000000-0000-0000-0000-000000000003', 'Other normal group'),
  ('00000000-0000-0000-0000-000000000201', true,  '00000000-0000-0000-0000-000000000001', 'Direct chat');

INSERT INTO public.community_group_members (group_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'member'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000004', 'admin'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002', 'member');

INSERT INTO public.community_messages (group_id, sender_id, body)
VALUES ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002', 'Seed direct message');
