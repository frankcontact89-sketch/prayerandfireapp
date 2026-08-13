-- ============ COMMUNITY TABLES ============
CREATE TABLE public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  muted boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  media_url text,
  media_type text,
  reply_to uuid REFERENCES public.community_messages(id) ON DELETE SET NULL,
  starred boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE TABLE public.community_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE TABLE public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  message_id uuid,
  group_id uuid,
  reason text NOT NULL DEFAULT 'inappropriate_content',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX idx_cgm_user ON public.community_group_members(user_id);
CREATE INDEX idx_cgm_group ON public.community_group_members(group_id);
CREATE INDEX idx_cmsg_group ON public.community_messages(group_id, created_at);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_groups TO authenticated;
GRANT ALL ON public.community_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_group_members TO authenticated;
GRANT ALL ON public.community_group_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_reactions TO authenticated;
GRANT ALL ON public.community_reactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_message_reads TO authenticated;
GRANT ALL ON public.community_message_reads TO service_role;
GRANT SELECT, INSERT ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
GRANT SELECT, INSERT, DELETE ON public.community_blocks TO authenticated;
GRANT ALL ON public.community_blocks TO service_role;

-- ============ HELPER FUNCTIONS (avoid RLS recursion) ============
CREATE OR REPLACE FUNCTION public.is_community_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _group_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_community_owner(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_groups WHERE id = _group_id AND created_by = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_see_community_message(_message_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_messages m
    JOIN public.community_group_members gm ON gm.group_id = m.group_id
    WHERE m.id = _message_id AND gm.user_id = _user_id
  )
$$;

-- ============ RLS ============
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their groups" ON public.community_groups FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_community_member(id, auth.uid()));
CREATE POLICY "Users create groups" ON public.community_groups FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners update groups" ON public.community_groups FOR UPDATE TO authenticated
USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners delete groups" ON public.community_groups FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Members view membership" ON public.community_group_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_community_member(group_id, auth.uid()) OR public.is_community_owner(group_id, auth.uid()));
CREATE POLICY "Owners or self add membership" ON public.community_group_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_community_owner(group_id, auth.uid()));
CREATE POLICY "Own membership settings" ON public.community_group_members FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_community_owner(group_id, auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_community_owner(group_id, auth.uid()));
CREATE POLICY "Leave or remove membership" ON public.community_group_members FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_community_owner(group_id, auth.uid()));

CREATE POLICY "Members read messages" ON public.community_messages FOR SELECT TO authenticated
USING (public.is_community_member(group_id, auth.uid()));
CREATE POLICY "Members send messages" ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_community_member(group_id, auth.uid()));
CREATE POLICY "Senders update own messages" ON public.community_messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Senders delete own messages" ON public.community_messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Members read reactions" ON public.community_reactions FOR SELECT TO authenticated
USING (public.can_see_community_message(message_id, auth.uid()));
CREATE POLICY "Own reactions insert" ON public.community_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_see_community_message(message_id, auth.uid()));
CREATE POLICY "Own reactions update" ON public.community_reactions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own reactions delete" ON public.community_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Own reads select" ON public.community_message_reads FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Own reads insert" ON public.community_message_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_see_community_message(message_id, auth.uid()));
CREATE POLICY "Own reads update" ON public.community_message_reads FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own reads delete" ON public.community_message_reads FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Own reports select" ON public.community_reports FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own reports insert" ON public.community_reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Own blocks select" ON public.community_blocks FOR SELECT TO authenticated
USING (blocker_id = auth.uid());
CREATE POLICY "Own blocks insert" ON public.community_blocks FOR INSERT TO authenticated
WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Own blocks delete" ON public.community_blocks FOR DELETE TO authenticated
USING (blocker_id = auth.uid());

-- ============ TRIGGERS ============
CREATE TRIGGER community_groups_updated_at BEFORE UPDATE ON public.community_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER community_messages_updated_at BEFORE UPDATE ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.touch_community_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.community_groups SET updated_at = now() WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_message_touches_group AFTER INSERT ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_community_group();

-- ============ REALTIME ============
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.community_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_reactions;

-- ============ STORAGE POLICIES ============
CREATE POLICY "Community media read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-media');
CREATE POLICY "Community media upload own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Community media update own folder" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Community media delete own folder" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);