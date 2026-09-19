-- 1) Pinned messages
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid;

CREATE OR REPLACE FUNCTION public.enforce_message_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pinned_at IS DISTINCT FROM OLD.pinned_at OR NEW.pinned_by IS DISTINCT FROM OLD.pinned_by THEN
    IF NOT public.is_group_admin(NEW.group_id, auth.uid()) THEN
      RAISE EXCEPTION 'NO_PERMISSION';
    END IF;
    IF NEW.pinned_at IS NOT NULL THEN
      NEW.pinned_by := auth.uid();
    ELSE
      NEW.pinned_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_messages_enforce_pin ON public.community_messages;
CREATE TRIGGER community_messages_enforce_pin
BEFORE UPDATE ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_pin();

-- 2) Mute durations (backward compatible with the existing boolean)
ALTER TABLE public.community_group_members
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

-- 3) Secure group invite links
CREATE TABLE IF NOT EXISTS public.community_group_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_group_invite_links TO authenticated;
GRANT ALL ON public.community_group_invite_links TO service_role;

ALTER TABLE public.community_group_invite_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group leaders manage invite links" ON public.community_group_invite_links;
CREATE POLICY "Group leaders manage invite links"
ON public.community_group_invite_links
FOR ALL
TO authenticated
USING (public.is_group_admin(group_id, auth.uid()))
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

DROP TRIGGER IF EXISTS community_group_invite_links_updated_at ON public.community_group_invite_links;
CREATE TRIGGER community_group_invite_links_updated_at
BEFORE UPDATE ON public.community_group_invite_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS community_group_invite_links_group_idx
  ON public.community_group_invite_links(group_id);

CREATE OR REPLACE FUNCTION public.create_group_invite_link(_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
BEGIN
  IF NOT public.is_group_admin(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;

  UPDATE public.community_group_invite_links
     SET revoked = true, updated_at = now()
   WHERE group_id = _group_id AND revoked = false;

  _token := replace(gen_random_uuid()::text, '-', '') || substr(md5(gen_random_uuid()::text), 1, 8);

  INSERT INTO public.community_group_invite_links (group_id, token, created_by)
  VALUES (_group_id, _token, auth.uid());

  RETURN _token;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_group_invite_links(_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_group_admin(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  UPDATE public.community_group_invite_links
     SET revoked = true, updated_at = now()
   WHERE group_id = _group_id AND revoked = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_invite_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _link public.community_group_invite_links%ROWTYPE;
  _name text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;
  IF NOT public.is_community_approved(_uid) THEN
    RETURN jsonb_build_object('status', 'not_approved');
  END IF;

  SELECT * INTO _link
    FROM public.community_group_invite_links
   WHERE token = _token
     AND revoked = false
     AND expires_at > now()
     AND (max_uses IS NULL OR uses < max_uses)
   LIMIT 1;

  IF _link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT name INTO _name FROM public.community_groups WHERE id = _link.group_id;
  IF _name IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _link.group_id AND user_id = _uid) THEN
    RETURN jsonb_build_object('status', 'already_member', 'group_id', _link.group_id, 'name', _name);
  END IF;

  INSERT INTO public.community_group_members (group_id, user_id, role)
  VALUES (_link.group_id, _uid, 'member')
  ON CONFLICT DO NOTHING;

  UPDATE public.community_group_invite_links
     SET uses = uses + 1, updated_at = now()
   WHERE id = _link.id;

  RETURN jsonb_build_object('status', 'joined', 'group_id', _link.group_id, 'name', _name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_group_invite_link(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_group_invite_links(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_group_by_invite_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_invite_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_group_invite_links(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_invite_token(text) TO authenticated;