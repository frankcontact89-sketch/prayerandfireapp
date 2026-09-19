CREATE TABLE public.community_message_stars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.community_message_stars TO authenticated;
GRANT ALL ON public.community_message_stars TO service_role;

ALTER TABLE public.community_message_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own stars" ON public.community_message_stars
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Star visible messages" ON public.community_message_stars
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_see_community_message(message_id, auth.uid()));

CREATE POLICY "Unstar own stars" ON public.community_message_stars
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_community_message_stars_user ON public.community_message_stars(user_id);