CREATE TABLE public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'ios',
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token)
);
CREATE INDEX idx_user_push_tokens_user ON public.user_push_tokens(user_id) WHERE enabled;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tokens select" ON public.user_push_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own tokens insert" ON public.user_push_tokens FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tokens update" ON public.user_push_tokens FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tokens delete" ON public.user_push_tokens FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER user_push_tokens_updated_at BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.community_message_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX idx_message_deliveries_message ON public.community_message_deliveries(message_id);

GRANT SELECT, INSERT ON public.community_message_deliveries TO authenticated;
GRANT ALL ON public.community_message_deliveries TO service_role;
ALTER TABLE public.community_message_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery insert own" ON public.community_message_deliveries
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_see_community_message(message_id, auth.uid()));

CREATE POLICY "delivery select own or sender" ON public.community_message_deliveries
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.community_messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.ack_message_delivery(_message_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _n integer := 0;
BEGIN
  IF _uid IS NULL OR _message_ids IS NULL OR array_length(_message_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.community_message_deliveries (message_id, user_id)
  SELECT m.id, _uid
  FROM public.community_messages m
  JOIN public.community_group_members gm
    ON gm.group_id = m.group_id AND gm.user_id = _uid
  WHERE m.id = ANY(_message_ids)
    AND m.sender_id <> _uid
    AND m.deleted_at IS NULL
  ON CONFLICT (message_id, user_id) DO NOTHING;

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_push_targets(_message_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.user_id
  FROM public.community_messages m
  JOIN public.community_group_members gm ON gm.group_id = m.group_id
  WHERE m.id = _message_id
    AND m.deleted_at IS NULL
    AND gm.user_id <> m.sender_id
    AND NOT (gm.muted IS TRUE AND (gm.muted_until IS NULL OR gm.muted_until > now()))
    AND NOT EXISTS (
      SELECT 1 FROM public.community_blocks b
      WHERE (b.blocker_id = gm.user_id AND b.blocked_id = m.sender_id)
         OR (b.blocker_id = m.sender_id AND b.blocked_id = gm.user_id)
    );
$$;

REVOKE ALL ON FUNCTION public.community_push_targets(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_push_targets(uuid) TO service_role;