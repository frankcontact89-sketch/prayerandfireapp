CREATE OR REPLACE FUNCTION public.normalize_phone_e164(_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
BEGIN
  IF _phone IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(_phone, '[^0-9]', '', 'g');
  IF length(d) < 8 OR length(d) > 15 THEN RETURN NULL; END IF;
  RETURN '+' || d;
END;
$$;

CREATE TABLE public.user_phone_numbers (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  phone_private boolean NOT NULL DEFAULT true,
  discoverable boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_phone_numbers TO authenticated;
GRANT ALL ON public.user_phone_numbers TO service_role;

ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own phone" ON public.user_phone_numbers
FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own phone" ON public.user_phone_numbers
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.normalize_phone_e164(phone) = phone);
CREATE POLICY "Update own phone" ON public.user_phone_numbers
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.normalize_phone_e164(phone) = phone);
CREATE POLICY "Delete own phone" ON public.user_phone_numbers
FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER user_phone_numbers_updated_at
BEFORE UPDATE ON public.user_phone_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.phone_lookup_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.phone_lookup_attempts TO service_role;
ALTER TABLE public.phone_lookup_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_phone_lookup_attempts_user_time ON public.phone_lookup_attempts(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.find_member_by_phone(_group_id uuid, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _norm text := public.normalize_phone_e164(_phone);
  _recent integer;
  _target uuid;
  _name text;
  _avatar text;
BEGIN
  IF _uid IS NULL OR NOT public.is_group_admin(_group_id, _uid) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;

  SELECT count(*) INTO _recent FROM public.phone_lookup_attempts
   WHERE user_id = _uid AND created_at > now() - interval '1 hour';
  IF _recent >= 20 THEN
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;
  INSERT INTO public.phone_lookup_attempts (user_id) VALUES (_uid);

  IF _norm IS NULL THEN
    RETURN jsonb_build_object('status', 'none');
  END IF;

  SELECT p.user_id INTO _target
    FROM public.user_phone_numbers p
   WHERE p.phone = _norm AND p.discoverable = true
   LIMIT 1;

  IF _target IS NULL OR _target = _uid OR NOT public.is_community_approved(_target) THEN
    RETURN jsonb_build_object('status', 'none');
  END IF;

  IF EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _group_id AND user_id = _target) THEN
    RETURN jsonb_build_object('status', 'already_member');
  END IF;

  SELECT username, avatar_url INTO _name, _avatar FROM public.profiles WHERE id = _target;
  RETURN jsonb_build_object('status', 'found', 'user_id', _target, 'name', coalesce(_name, 'Member'), 'avatar', _avatar);
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_group_member_by_phone(_group_id uuid, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _found jsonb;
  _target uuid;
BEGIN
  _found := public.find_member_by_phone(_group_id, _phone);
  IF _found->>'status' <> 'found' THEN
    RETURN _found;
  END IF;
  _target := (_found->>'user_id')::uuid;

  INSERT INTO public.community_group_members (group_id, user_id, role)
  VALUES (_group_id, _target, 'member')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('status', 'added', 'name', _found->>'name');
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_phone_e164(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_member_by_phone(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invite_group_member_by_phone(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalize_phone_e164(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_member_by_phone(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.invite_group_member_by_phone(uuid, text) TO authenticated, service_role;