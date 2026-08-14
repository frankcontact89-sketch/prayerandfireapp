-- Prayer & Fire community: pinned messages and per-user preferences
CREATE TABLE IF NOT EXISTS public.community_pinned_messages (
  group_id uuid PRIMARY KEY REFERENCES public.community_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_pinned_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.community_pinned_messages TO authenticated;
DROP POLICY IF EXISTS "Members see group pin" ON public.community_pinned_messages;
CREATE POLICY "Members see group pin" ON public.community_pinned_messages FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.community_group_members gm WHERE gm.group_id=community_pinned_messages.group_id AND gm.user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins manage group pin" ON public.community_pinned_messages;
CREATE POLICY "Admins manage group pin" ON public.community_pinned_messages FOR ALL TO authenticated
USING (public.is_group_admin(group_id,auth.uid())) WITH CHECK (public.is_group_admin(group_id,auth.uid()));

CREATE TABLE IF NOT EXISTS public.community_user_preferences (
  user_id uuid NOT NULL,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
  wallpaper text NOT NULL DEFAULT 'default',
  bubble_color text NOT NULL DEFAULT '#f97316',
  notifications jsonb NOT NULL DEFAULT '{"messages":true,"groups":true,"reactions":true,"sound":true,"vibrate":true,"preview":true,"badge":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,group_id)
);
ALTER TABLE public.community_user_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.community_user_preferences TO authenticated;
DROP POLICY IF EXISTS "Users manage own community preferences" ON public.community_user_preferences;
CREATE POLICY "Users manage own community preferences" ON public.community_user_preferences FOR ALL TO authenticated
USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
