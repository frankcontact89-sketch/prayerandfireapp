ALTER TABLE public.community_groups
  ADD COLUMN IF NOT EXISTS is_direct boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS direct_key text;

CREATE UNIQUE INDEX IF NOT EXISTS community_groups_direct_key_unique
  ON public.community_groups(direct_key)
  WHERE direct_key IS NOT NULL;

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

  IF NOT (
    EXISTS (SELECT 1 FROM community_admins WHERE user_id = caller)
    OR EXISTS (SELECT 1 FROM community_access_requests WHERE user_id = caller AND status = 'approved')
  ) OR NOT (
    EXISTS (SELECT 1 FROM community_admins WHERE user_id = other_user)
    OR EXISTS (SELECT 1 FROM community_access_requests WHERE user_id = other_user AND status = 'approved')
  ) THEN
    RAISE EXCEPTION 'COMMUNITY_ACCESS_REQUIRED';
  END IF;

  chat_key := CASE WHEN caller::text < other_user::text
    THEN caller::text || ':' || other_user::text
    ELSE other_user::text || ':' || caller::text END;

  SELECT id INTO chat_id FROM community_groups WHERE direct_key = chat_key;
  IF chat_id IS NULL THEN
    INSERT INTO community_groups(name, description, created_by, is_public, is_direct, direct_key)
    VALUES ('Direct chat', NULL, caller, false, true, chat_key)
    RETURNING id INTO chat_id;
    INSERT INTO community_group_members(group_id, user_id, role)
    VALUES (chat_id, caller, 'owner'), (chat_id, other_user, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_community_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_community_chat(uuid) TO authenticated;
