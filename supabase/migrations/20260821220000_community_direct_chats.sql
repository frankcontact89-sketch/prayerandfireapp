-- Direct Community chats are private, two-member groups. This migration is additive:
-- it does not delete messages, groups, or memberships.

ALTER TABLE public.community_groups
  ADD COLUMN IF NOT EXISTS is_direct boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_key text;

-- direct_key is a SHA-256 digest of the sorted participant UUIDs, never the UUID pair itself.
-- The key is an idempotency identifier, not an authorization mechanism.
CREATE UNIQUE INDEX IF NOT EXISTS community_groups_direct_key_unique
  ON public.community_groups(direct_key)
  WHERE direct_key IS NOT NULL;

-- Lovable/Supabase deployments may install pgcrypto in public or extensions. The direct-chat
-- function resolves it explicitly at runtime; this preflight fails safely if neither contract exists.
DO $$
BEGIN
  IF to_regprocedure('extensions.digest(text,text)') IS NULL
     AND to_regprocedure('public.digest(text,text)') IS NULL THEN
    RAISE EXCEPTION 'PGCRYPTO_DIGEST_NOT_FOUND';
  END IF;
END;
$$;

-- Preserve the existing Discover contract while excluding direct chats.
CREATE OR REPLACE FUNCTION public.discover_community_groups()
RETURNS TABLE(id uuid, name text, description text, avatar_url text, member_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT g.id, g.name, g.description, g.avatar_url,
         (SELECT count(*) FROM public.community_group_members m WHERE m.group_id = g.id)
  FROM public.community_groups g
  WHERE public.is_community_approved(auth.uid())
    AND g.is_direct = false
    AND NOT EXISTS (
      SELECT 1 FROM public.community_group_members m2
      WHERE m2.group_id = g.id AND m2.user_id = auth.uid()
    )
  ORDER BY g.updated_at DESC
$$;

-- Existing production baseline explicitly reserves Discover for authenticated users.
-- CREATE OR REPLACE retains the function owner; these statements retain the verified grant contract.
REVOKE EXECUTE ON FUNCTION public.discover_community_groups() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.discover_community_groups() TO authenticated;

-- Direct chats are created only for two approved, non-blocked users. The advisory lock
-- serializes concurrent starts for the same hashed pair; the unique index is a second guard.
CREATE OR REPLACE FUNCTION public.start_direct_community_chat(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  pair_input text;
  chat_key text;
  chat_id uuid;
BEGIN
  IF caller IS NULL OR other_user IS NULL OR caller = other_user THEN
    RAISE EXCEPTION 'INVALID_DIRECT_CHAT';
  END IF;

  IF NOT public.is_community_approved(caller)
     OR NOT public.is_community_approved(other_user) THEN
    RAISE EXCEPTION 'COMMUNITY_ACCESS_REQUIRED';
  END IF;

  IF public.has_blocked(caller, other_user)
     OR public.has_blocked(other_user, caller) THEN
    RAISE EXCEPTION 'DIRECT_CHAT_BLOCKED';
  END IF;

  pair_input := 'community-direct:' ||
    CASE WHEN caller::text < other_user::text
      THEN caller::text || ':' || other_user::text
      ELSE other_user::text || ':' || caller::text
    END;

  -- Resolve pgcrypto explicitly so SECURITY DEFINER search_path=public never accidentally
  -- binds an attacker-controlled digest function. The migration preflight verifies one branch.
  IF to_regprocedure('extensions.digest(text,text)') IS NOT NULL THEN
    EXECUTE 'SELECT encode(extensions.digest($1, ''sha256''), ''hex'')'
      INTO chat_key USING pair_input;
  ELSIF to_regprocedure('public.digest(text,text)') IS NOT NULL THEN
    EXECUTE 'SELECT encode(public.digest($1, ''sha256''), ''hex'')'
      INTO chat_key USING pair_input;
  ELSE
    RAISE EXCEPTION 'PGCRYPTO_DIGEST_NOT_FOUND';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(chat_key, 0));

  SELECT id INTO chat_id
  FROM public.community_groups
  WHERE direct_key = chat_key;

  IF chat_id IS NULL THEN
    INSERT INTO public.community_groups(name, description, created_by, is_direct, direct_key)
    VALUES ('Direct chat', NULL, caller, true, chat_key)
    ON CONFLICT (direct_key) WHERE direct_key IS NOT NULL DO NOTHING
    RETURNING id INTO chat_id;

    IF chat_id IS NULL THEN
      SELECT id INTO chat_id
      FROM public.community_groups
      WHERE direct_key = chat_key;
    END IF;
  END IF;

  -- This SECURITY DEFINER function is the sole direct-chat membership creation path.
  INSERT INTO public.community_group_members(group_id, user_id, role)
  VALUES (chat_id, caller, 'owner'), (chat_id, other_user, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_community_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_community_chat(uuid) TO authenticated;

-- This helper runs with the table owner and therefore cannot fail open if a direct-chat peer row
-- is hidden by the community_group_members SELECT policy. It fails closed if a direct group is
-- malformed, if the caller is not a member, or if it has anything other than exactly two members.
-- The caller is deliberately not an argument. Deriving it within the helper prevents a caller from
-- supplying another user's UUID and changing the authorization decision.
DROP FUNCTION IF EXISTS public.direct_community_chat_is_blocked(uuid, uuid);
CREATE OR REPLACE FUNCTION public.direct_community_chat_is_blocked(_group_id uuid)
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

  -- The helper applies only to direct chats; normal groups retain their existing behavior.
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

REVOKE ALL ON FUNCTION public.direct_community_chat_is_blocked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.direct_community_chat_is_blocked(uuid) TO authenticated;

-- Existing direct chats stay safe after either participant blocks the other. The direct-chat
-- helper uses SECURITY DEFINER membership lookup to avoid an RLS-hidden peer fail-open.
DROP POLICY IF EXISTS "Approved members send messages" ON public.community_messages;
CREATE POLICY "Approved members send messages"
ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_community_member(group_id, auth.uid())
  AND public.is_community_approved(auth.uid())
  AND NOT public.direct_community_chat_is_blocked(group_id)
);

-- Read behavior preserves the normal one-way blocked-sender filter while applying bilateral
-- direct-chat blocking through the RLS-safe helper.
DROP POLICY IF EXISTS "Members read messages" ON public.community_messages;
CREATE POLICY "Members read messages"
ON public.community_messages FOR SELECT TO authenticated
USING (
  public.is_community_member(group_id, auth.uid())
  AND NOT public.has_blocked(auth.uid(), sender_id)
  AND NOT public.direct_community_chat_is_blocked(group_id)
);

-- A membership row must never be moved to another group or reassigned to another user. Direct
-- membership roles are immutable even for administrators. Preferences are changed only through the
-- narrowly scoped RPC below, which never receives membership identity or role parameters.
CREATE OR REPLACE FUNCTION public.protect_community_membership_identity()
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

DROP TRIGGER IF EXISTS protect_community_membership_identity ON public.community_group_members;
CREATE TRIGGER protect_community_membership_identity
BEFORE UPDATE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_community_membership_identity();

REVOKE ALL ON FUNCTION public.protect_community_membership_identity() FROM PUBLIC, anon, authenticated;

-- A normal-group creator's membership is the database-level owner anchor. No non-creator,
-- including a normal-group admin, may demote, reassign, or delete it.
CREATE OR REPLACE FUNCTION public.protect_community_group_creator_membership()
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

DROP TRIGGER IF EXISTS protect_community_group_creator_membership ON public.community_group_members;
CREATE TRIGGER protect_community_group_creator_membership
BEFORE UPDATE OR DELETE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_community_group_creator_membership();

REVOKE ALL ON FUNCTION public.protect_community_group_creator_membership() FROM PUBLIC, anon, authenticated;

-- Preserve normal-group administrator actions while removing all ordinary-member direct UPDATE
-- and DELETE access. The identity trigger additionally prevents an admin from moving/reassigning a row.
DROP POLICY IF EXISTS "Group admins add membership" ON public.community_group_members;
DROP POLICY IF EXISTS "Group admins add approved membership" ON public.community_group_members;
CREATE POLICY "Group admins add approved membership" ON public.community_group_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_community_approved(user_id)
  AND COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND public.is_group_admin(group_id, auth.uid())
);

DROP POLICY IF EXISTS "Own membership settings" ON public.community_group_members;
DROP POLICY IF EXISTS "Normal group admins manage membership" ON public.community_group_members;
CREATE POLICY "Normal group admins manage membership" ON public.community_group_members
FOR UPDATE TO authenticated
USING (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
)
WITH CHECK (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Leave or remove membership" ON public.community_group_members;
DROP POLICY IF EXISTS "Normal group admins remove membership" ON public.community_group_members;
CREATE POLICY "Normal group admins remove membership" ON public.community_group_members
FOR DELETE TO authenticated
USING (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND public.is_group_admin(group_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.community_groups g
    WHERE g.id = group_id
      AND g.created_by = user_id
      AND g.created_by IS DISTINCT FROM auth.uid()
  )
);

-- Members retain only their own muted/archived preference through this fixed-field RPC. It works
-- for normal and direct chats, but cannot alter group_id, user_id, role, or any administrative field.
CREATE OR REPLACE FUNCTION public.set_community_membership_preferences(
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

REVOKE ALL ON FUNCTION public.set_community_membership_preferences(uuid, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_community_membership_preferences(uuid, boolean, boolean) TO authenticated;

DROP POLICY IF EXISTS "Group admins update groups" ON public.community_groups;
CREATE POLICY "Group admins update groups" ON public.community_groups
FOR UPDATE TO authenticated
USING (
  is_direct = false
  AND public.is_group_admin(id, auth.uid())
)
WITH CHECK (
  is_direct = false
  AND public.is_group_admin(id, auth.uid())
);

DROP POLICY IF EXISTS "Group admins delete groups" ON public.community_groups;
CREATE POLICY "Group admins delete groups" ON public.community_groups
FOR DELETE TO authenticated
USING (
  is_direct = false
  AND public.is_group_admin(id, auth.uid())
);

-- Non-destructive migration-time contract checks. These validate the guards that enforce:
-- 1) direct chats are excluded from Discover; 2) pair creation has extension-resolution,
-- advisory-lock, and unique-key guards; 3) callers use approval and mutual-block helpers;
-- 4) existing direct chats block read/send after either block direction; 5) ordinary members do
-- not have membership UPDATE/DELETE; 6) normal groups retain an administrator management path; and
-- 7) non-creator administrators cannot mutate the creator's membership.
DO $$
DECLARE
  discover_definition text;
  direct_definition text;
  block_helper_definition text;
  send_check text;
  read_qual text;
  update_roles text[];
  delete_roles text[];
  update_qual text;
  delete_qual text;
  creator_guard_definition text;
  preference_definition text;
BEGIN
  SELECT pg_get_functiondef('public.discover_community_groups()'::regprocedure)
    INTO discover_definition;
  SELECT pg_get_functiondef('public.start_direct_community_chat(uuid)'::regprocedure)
    INTO direct_definition;
  SELECT pg_get_functiondef('public.direct_community_chat_is_blocked(uuid)'::regprocedure)
    INTO block_helper_definition;
  SELECT with_check INTO send_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_messages'
      AND policyname = 'Approved members send messages';
  SELECT qual INTO read_qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_messages'
      AND policyname = 'Members read messages';
  SELECT roles, qual INTO update_roles, update_qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_group_members'
      AND policyname = 'Normal group admins manage membership';
  SELECT roles, qual INTO delete_roles, delete_qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_group_members'
      AND policyname = 'Normal group admins remove membership';
  SELECT pg_get_functiondef('public.protect_community_group_creator_membership()'::regprocedure)
    INTO creator_guard_definition;
  SELECT pg_get_functiondef('public.set_community_membership_preferences(uuid,boolean,boolean)'::regprocedure)
    INTO preference_definition;

  IF position('g.is_direct = false' IN discover_definition) = 0 THEN
    RAISE EXCEPTION 'DIRECT_CHAT_DISCOVER_FILTER_MISSING';
  END IF;

  IF position('extensions.digest' IN direct_definition) = 0
     OR position('public.digest' IN direct_definition) = 0
     OR position('public.is_community_approved' IN direct_definition) = 0
     OR position('public.has_blocked' IN direct_definition) = 0
     OR position('pg_advisory_xact_lock' IN direct_definition) = 0 THEN
    RAISE EXCEPTION 'DIRECT_CHAT_SECURITY_GUARD_MISSING';
  END IF;

  IF position('SECURITY DEFINER' IN block_helper_definition) = 0
     OR position('caller uuid := auth.uid()' IN block_helper_definition) = 0
     OR position('_caller' IN block_helper_definition) > 0
     OR position('member_count <> 2' IN block_helper_definition) = 0
     OR position('public.has_blocked' IN block_helper_definition) = 0
     OR COALESCE(send_check, '') NOT LIKE '%direct_community_chat_is_blocked(group_id)%'
     OR COALESCE(read_qual, '') NOT LIKE '%direct_community_chat_is_blocked(group_id)%'
     OR update_roles IS DISTINCT FROM ARRAY['authenticated']::name[]
     OR delete_roles IS DISTINCT FROM ARRAY['authenticated']::name[]
     OR COALESCE(update_qual, '') NOT LIKE '%created_by = user_id%'
     OR COALESCE(delete_qual, '') NOT LIKE '%created_by = user_id%'
     OR position('COMMUNITY_GROUP_CREATOR_MEMBERSHIP_PROTECTED' IN creator_guard_definition) = 0
     OR position('UPDATE public.community_group_members' IN preference_definition) = 0
     OR position('role' IN preference_definition) > 0 THEN
    RAISE EXCEPTION 'DIRECT_CHAT_POLICY_GUARD_MISSING';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'community_groups'
      AND indexname = 'community_groups_direct_key_unique'
  ) THEN
    RAISE EXCEPTION 'DIRECT_CHAT_UNIQUE_KEY_MISSING';
  END IF;
END;
$$;

/*
Manual authenticated integration validation (run outside this production migration, with
approved non-production test accounts):

1. Discover exclusion: create a direct chat, then call discover_community_groups() as either
   participant and assert the direct chat ID is absent; assert an existing is_direct=false group
   remains present when the caller is not already a member.
2. Participant access: as both participants, read the chat group and its messages successfully;
   as a third approved user, assert Community RLS returns no direct-chat group, membership data,
   or messages and assert direct membership insertion is rejected.
3. Blocking at creation: create blocks in each direction and assert start_direct_community_chat()
   raises DIRECT_CHAT_BLOCKED for either direction.
4. Blocking after creation: create the direct chat first, then create each block direction in turn.
   Assert both participants cannot send a new message, and neither participant can read direct-chat
   messages through RLS while the block exists. Remove the block and assert normal access returns.
5. Membership immutability: as a normal member, assert UPDATE cannot change role, group_id, or
   user_id, and cannot join another group by updating an existing row. As a normal-group admin,
   assert allowed add/remove/role management still works for ordinary members but group_id/user_id
   cannot change; assert that the same admin cannot demote, reassign, or delete the membership whose
   user_id is community_groups.created_by. As the creator, assert ordinary-member management still
   works. As a direct participant or third user, assert direct INSERT, UPDATE, DELETE, group UPDATE,
   and group DELETE are rejected. Verify the preference RPC changes only the caller's muted/archived
   flags.
6. Caller binding: assert direct_community_chat_is_blocked accepts only its group UUID and derives
   its caller from auth.uid(); a two-UUID invocation must be rejected.
7. Concurrency: issue two simultaneous starts for the same pair and assert both return the same
   group ID, with one direct_key row and exactly the two intended membership rows.
8. Extension location: run `SELECT to_regprocedure('extensions.digest(text,text)'),
   to_regprocedure('public.digest(text,text)');` in Lovable staging and record which non-null
   schema branch was used before production approval.
*/
