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

-- Existing direct chats stay safe after either participant blocks the other. The direct-chat
-- branch applies the bilateral block check; normal-group message behavior remains unchanged.
DROP POLICY IF EXISTS "Approved members send messages" ON public.community_messages;
CREATE POLICY "Approved members send messages"
ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_community_member(group_id, auth.uid())
  AND public.is_community_approved(auth.uid())
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = group_id AND g.is_direct
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.community_group_members peer
      WHERE peer.group_id = group_id
        AND peer.user_id <> auth.uid()
        AND (
          public.has_blocked(auth.uid(), peer.user_id)
          OR public.has_blocked(peer.user_id, auth.uid())
        )
    )
  )
);

-- Read behavior is bilateral for direct chats. Once either party blocks the other, neither can
-- read existing or new direct-chat messages through the member message policy. Normal groups keep
-- the pre-existing one-way blocked-sender filter.
DROP POLICY IF EXISTS "Members read messages" ON public.community_messages;
CREATE POLICY "Members read messages"
ON public.community_messages FOR SELECT TO authenticated
USING (
  public.is_community_member(group_id, auth.uid())
  AND NOT public.has_blocked(auth.uid(), sender_id)
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = group_id AND g.is_direct
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.community_group_members peer
      WHERE peer.group_id = group_id
        AND peer.user_id <> auth.uid()
        AND (
          public.has_blocked(auth.uid(), peer.user_id)
          OR public.has_blocked(peer.user_id, auth.uid())
        )
    )
  )
);

-- Preserve normal-group management while making direct-chat membership and group records immutable
-- to user-managed policies. Direct membership rows can be inserted only by start_direct_community_chat.
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
  AND (
    public.is_group_admin(group_id, auth.uid())
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.community_groups g
        WHERE g.id = group_id AND g.created_by = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Own membership settings" ON public.community_group_members;
CREATE POLICY "Own membership settings" ON public.community_group_members
FOR UPDATE TO authenticated
USING (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  )
)
WITH CHECK (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Leave or remove membership" ON public.community_group_members;
CREATE POLICY "Leave or remove membership" ON public.community_group_members
FOR DELETE TO authenticated
USING (
  COALESCE((
    SELECT NOT g.is_direct
    FROM public.community_groups g
    WHERE g.id = group_id
  ), false)
  AND (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  )
);

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
-- 4) existing direct chats block read/send after either block direction; and 5) normal groups
-- retain an is_direct=false path through the existing membership policies.
DO $$
DECLARE
  discover_definition text;
  direct_definition text;
  send_check text;
  read_qual text;
  membership_update_qual text;
  membership_delete_qual text;
BEGIN
  SELECT pg_get_functiondef('public.discover_community_groups()'::regprocedure)
    INTO discover_definition;
  SELECT pg_get_functiondef('public.start_direct_community_chat(uuid)'::regprocedure)
    INTO direct_definition;
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
  SELECT qual INTO membership_update_qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_group_members'
      AND policyname = 'Own membership settings';
  SELECT qual INTO membership_delete_qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_group_members'
      AND policyname = 'Leave or remove membership';

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

  IF COALESCE(send_check, '') NOT LIKE '%has_blocked%'
     OR COALESCE(read_qual, '') NOT LIKE '%has_blocked%'
     OR COALESCE(membership_update_qual, '') NOT LIKE '%is_direct%'
     OR COALESCE(membership_delete_qual, '') NOT LIKE '%is_direct%' THEN
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
5. Membership immutability: as either participant and as a third approved user, assert direct-chat
   INSERT, UPDATE (including role/group_id/user_id), DELETE, group UPDATE, and group DELETE are all
   rejected. Confirm normal-group member self-settings, departure, admin membership management, and
   group management still work for is_direct=false groups.
6. Concurrency: issue two simultaneous starts for the same pair and assert both return the same
   group ID, with one direct_key row and exactly the two intended membership rows.
7. Extension location: run `SELECT to_regprocedure('extensions.digest(text,text)'),
   to_regprocedure('public.digest(text,text)');` in Lovable staging and record which non-null
   schema branch was used before production approval.
*/
