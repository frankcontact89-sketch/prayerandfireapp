-- 1. Prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS community_group_members_unique ON public.community_group_members(group_id, user_id);

-- 2. Invitations table
CREATE TABLE IF NOT EXISTS public.community_group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  invited_by uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_group_invites_unique ON public.community_group_invites(group_id, lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_group_invites TO authenticated;
GRANT ALL ON public.community_group_invites TO service_role;

ALTER TABLE public.community_group_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group leaders read invites" ON public.community_group_invites;
CREATE POLICY "Group leaders read invites" ON public.community_group_invites
FOR SELECT TO authenticated USING (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group leaders create invites" ON public.community_group_invites;
CREATE POLICY "Group leaders create invites" ON public.community_group_invites
FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group leaders update invites" ON public.community_group_invites;
CREATE POLICY "Group leaders update invites" ON public.community_group_invites
FOR UPDATE TO authenticated USING (public.is_group_admin(group_id, auth.uid())) WITH CHECK (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group leaders delete invites" ON public.community_group_invites;
CREATE POLICY "Group leaders delete invites" ON public.community_group_invites
FOR DELETE TO authenticated USING (public.is_group_admin(group_id, auth.uid()));

DROP TRIGGER IF EXISTS community_group_invites_updated_at ON public.community_group_invites;
CREATE TRIGGER community_group_invites_updated_at BEFORE UPDATE ON public.community_group_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Invite by email (links existing account or stores pending invite)
CREATE OR REPLACE FUNCTION public.invite_group_member_by_email(_group_id uuid, _email text, _full_name text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid;
  _mail text := lower(btrim(coalesce(_email, '')));
BEGIN
  IF NOT public.is_group_admin(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  IF _mail = '' OR _mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  SELECT id INTO _uid FROM public.profiles WHERE lower(email) = _mail LIMIT 1;

  IF _uid IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _group_id AND user_id = _uid) THEN
      RETURN 'already_member';
    END IF;
    INSERT INTO public.community_group_members (group_id, user_id, role) VALUES (_group_id, _uid, 'member')
    ON CONFLICT DO NOTHING;
    UPDATE public.community_group_invites SET status = 'accepted' WHERE group_id = _group_id AND lower(email) = _mail;
    RETURN 'added';
  END IF;

  INSERT INTO public.community_group_invites (group_id, email, full_name, invited_by, status)
  VALUES (_group_id, _mail, nullif(btrim(coalesce(_full_name, '')), ''), auth.uid(), 'pending')
  ON CONFLICT (group_id, lower(email)) DO UPDATE
    SET full_name = coalesce(excluded.full_name, public.community_group_invites.full_name),
        status = 'pending',
        updated_at = now();
  RETURN 'invited';
END;
$$;

REVOKE ALL ON FUNCTION public.invite_group_member_by_email(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.invite_group_member_by_email(uuid, text, text) TO authenticated;

-- 4. Protect the group owner from other admins
CREATE OR REPLACE FUNCTION public.protect_group_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target record;
  _creator uuid;
BEGIN
  _target := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  SELECT created_by INTO _creator FROM public.community_groups WHERE id = _target.group_id;

  IF (_target.role = 'owner' OR _target.user_id = _creator) AND _target.user_id IS DISTINCT FROM auth.uid() THEN
    IF NOT (public.is_community_boss(auth.uid()) OR auth.uid() = _creator) THEN
      RAISE EXCEPTION 'OWNER_PROTECTED';
    END IF;
  END IF;
  RETURN _target;
END;
$$;

DROP TRIGGER IF EXISTS community_group_members_protect_owner_upd ON public.community_group_members;
CREATE TRIGGER community_group_members_protect_owner_upd BEFORE UPDATE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_group_owner();

DROP TRIGGER IF EXISTS community_group_members_protect_owner_del ON public.community_group_members;
CREATE TRIGGER community_group_members_protect_owner_del BEFORE DELETE ON public.community_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_group_owner();

-- 5. Auto-accept pending invites when the invited person joins later
CREATE OR REPLACE FUNCTION public.accept_group_invites_for_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.community_group_members (group_id, user_id, role)
  SELECT i.group_id, NEW.id, 'member'
  FROM public.community_group_invites i
  WHERE lower(i.email) = lower(NEW.email) AND i.status = 'pending'
  ON CONFLICT DO NOTHING;

  UPDATE public.community_group_invites SET status = 'accepted', updated_at = now()
  WHERE lower(email) = lower(NEW.email) AND status = 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_accept_group_invites ON public.profiles;
CREATE TRIGGER profiles_accept_group_invites AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.accept_group_invites_for_new_profile();