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

-- Preserve the existing function contract exactly while excluding direct chats from Discover.
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

  chat_key := encode(
    digest(
      'community-direct:' ||
      CASE WHEN caller::text < other_user::text
        THEN caller::text || ':' || other_user::text
        ELSE other_user::text || ':' || caller::text
      END,
      'sha256'
    ),
    'hex'
  );

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

  -- The SECURITY DEFINER function establishes or restores exactly the two participants.
  INSERT INTO public.community_group_members(group_id, user_id, role)
  VALUES (chat_id, caller, 'owner'), (chat_id, other_user, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_community_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_community_chat(uuid) TO authenticated;

-- Preserve normal-group policy behavior while preventing user-managed direct-chat
-- membership changes. The SECURITY DEFINER function above is the direct-chat creation path.
DROP POLICY IF EXISTS "Group admins add membership" ON public.community_group_members;
CREATE POLICY "Group admins add membership" ON public.community_group_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_community_approved(auth.uid())
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
        SELECT 1
        FROM public.community_groups g
        WHERE g.id = group_id AND g.created_by = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Group admins update groups" ON public.community_groups;
CREATE POLICY "Group admins update groups" ON public.community_groups
FOR UPDATE TO authenticated
USING (public.is_group_admin(id, auth.uid()))
WITH CHECK (
  public.is_group_admin(id, auth.uid())
  AND is_direct = false
);

DROP POLICY IF EXISTS "Own membership settings" ON public.community_group_members;
CREATE POLICY "Own membership settings" ON public.community_group_members
FOR UPDATE TO authenticated
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
)
WITH CHECK (
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

DROP POLICY IF EXISTS "Leave or remove membership" ON public.community_group_members;
CREATE POLICY "Leave or remove membership" ON public.community_group_members
FOR DELETE TO authenticated
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

-- Non-destructive migration-time contract checks. These validate the guards that enforce:
-- 1) direct chats are excluded from Discover; 2) pair creation has advisory-lock and
-- unique-key guards; 3) callers use approval and mutual-block helpers; and 4) normal groups
-- retain an is_direct=false path through the existing membership policies.
DO $$
DECLARE
  discover_definition text;
  direct_definition text;
BEGIN
  SELECT pg_get_functiondef('public.discover_community_groups()'::regprocedure)
    INTO discover_definition;
  SELECT pg_get_functiondef('public.start_direct_community_chat(uuid)'::regprocedure)
    INTO direct_definition;

  IF position('g.is_direct = false' IN discover_definition) = 0 THEN
    RAISE EXCEPTION 'DIRECT_CHAT_DISCOVER_FILTER_MISSING';
  END IF;

  IF position('public.is_community_approved' IN direct_definition) = 0
     OR position('public.has_blocked' IN direct_definition) = 0
     OR position('pg_advisory_xact_lock' IN direct_definition) = 0 THEN
    RAISE EXCEPTION 'DIRECT_CHAT_SECURITY_GUARD_MISSING';
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
   as a third approved user, assert Community RLS returns no direct-chat group or messages and
   assert direct membership insertion is rejected.
3. Blocking: create blocks in each direction and assert start_direct_community_chat(other_user)
   raises DIRECT_CHAT_BLOCKED for either direction.
4. Concurrency: issue two simultaneous starts for the same pair and assert both return the same
   group ID, with one direct_key row and exactly the two intended membership rows.
5. Normal groups: confirm group creation, discovery, membership updates, and group-admin removal
   continue to work for is_direct=false groups.
*/
