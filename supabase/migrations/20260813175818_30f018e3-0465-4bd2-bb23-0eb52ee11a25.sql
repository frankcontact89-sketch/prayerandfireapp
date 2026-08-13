
-- ============ Community admins ============
CREATE TABLE IF NOT EXISTS public.community_admins (
  user_id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin')),
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_admins TO authenticated;
GRANT ALL ON public.community_admins TO service_role;
ALTER TABLE public.community_admins ENABLE ROW LEVEL SECURITY;

-- ============ Access requests ============
CREATE TABLE IF NOT EXISTS public.community_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_access_requests TO authenticated;
GRANT ALL ON public.community_access_requests TO service_role;
ALTER TABLE public.community_access_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS community_access_requests_updated_at ON public.community_access_requests;
CREATE TRIGGER community_access_requests_updated_at
BEFORE UPDATE ON public.community_access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Seed owner + preserve existing access ============
INSERT INTO public.community_admins (user_id, role)
SELECT user_id, 'owner' FROM public.user_roles WHERE role = 'admin'
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

INSERT INTO public.community_admins (user_id, role)
SELECT DISTINCT created_by, 'admin' FROM public.community_groups
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.community_access_requests (user_id, status, reviewed_at)
SELECT DISTINCT user_id, 'approved', now() FROM public.community_group_members
ON CONFLICT (user_id) DO UPDATE SET status = 'approved';

INSERT INTO public.community_access_requests (user_id, status, reviewed_at)
SELECT user_id, 'approved', now() FROM public.community_admins
ON CONFLICT (user_id) DO UPDATE SET status = 'approved';

-- ============ Helper functions (security definer, no recursion) ============
CREATE OR REPLACE FUNCTION public.is_community_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.community_admins WHERE user_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_community_boss(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.community_admins WHERE user_id = _user_id AND role = 'owner')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_community_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.is_community_staff(_user_id)
    OR EXISTS (SELECT 1 FROM public.community_access_requests WHERE user_id = _user_id AND status = 'approved')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.is_community_staff(_user_id)
    OR EXISTS (SELECT 1 FROM public.community_groups WHERE id = _group_id AND created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _group_id AND user_id = _user_id AND role IN ('owner','admin'))
  )
$$;

-- ============ Policies: community_admins ============
DROP POLICY IF EXISTS "Approved users view community admins" ON public.community_admins;
CREATE POLICY "Approved users view community admins" ON public.community_admins
FOR SELECT TO authenticated USING (public.is_community_approved(auth.uid()));

DROP POLICY IF EXISTS "Owner manages admins insert" ON public.community_admins;
CREATE POLICY "Owner manages admins insert" ON public.community_admins
FOR INSERT TO authenticated WITH CHECK (public.is_community_boss(auth.uid()) AND role = 'admin');

DROP POLICY IF EXISTS "Owner manages admins delete" ON public.community_admins;
CREATE POLICY "Owner manages admins delete" ON public.community_admins
FOR DELETE TO authenticated USING (public.is_community_boss(auth.uid()) AND role <> 'owner');

-- ============ Policies: access requests ============
DROP POLICY IF EXISTS "Users see own request" ON public.community_access_requests;
CREATE POLICY "Users see own request" ON public.community_access_requests
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_community_staff(auth.uid()));

DROP POLICY IF EXISTS "Users create own request" ON public.community_access_requests;
CREATE POLICY "Users create own request" ON public.community_access_requests
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Staff review requests" ON public.community_access_requests;
CREATE POLICY "Staff review requests" ON public.community_access_requests
FOR UPDATE TO authenticated USING (public.is_community_staff(auth.uid())) WITH CHECK (public.is_community_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete requests" ON public.community_access_requests;
CREATE POLICY "Staff delete requests" ON public.community_access_requests
FOR DELETE TO authenticated USING (public.is_community_staff(auth.uid()));

-- ============ Policies: groups ============
DROP POLICY IF EXISTS "Users create groups" ON public.community_groups;
CREATE POLICY "Only staff create groups" ON public.community_groups
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_community_staff(auth.uid()));

DROP POLICY IF EXISTS "Owners update groups" ON public.community_groups;
CREATE POLICY "Group admins update groups" ON public.community_groups
FOR UPDATE TO authenticated USING (public.is_group_admin(id, auth.uid())) WITH CHECK (public.is_group_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Owners delete groups" ON public.community_groups;
CREATE POLICY "Group admins delete groups" ON public.community_groups
FOR DELETE TO authenticated USING (public.is_group_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Members view their groups" ON public.community_groups;
CREATE POLICY "Members view their groups" ON public.community_groups
FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_community_member(id, auth.uid()));

-- ============ Policies: memberships ============
DROP POLICY IF EXISTS "Owners or self add membership" ON public.community_group_members;
CREATE POLICY "Group admins add membership" ON public.community_group_members
FOR INSERT TO authenticated WITH CHECK (
  public.is_group_admin(group_id, auth.uid())
  OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id = group_id AND g.created_by = auth.uid()))
);

DROP POLICY IF EXISTS "Own membership settings" ON public.community_group_members;
CREATE POLICY "Own membership settings" ON public.community_group_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Leave or remove membership" ON public.community_group_members;
CREATE POLICY "Leave or remove membership" ON public.community_group_members
FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- ============ Policies: messages ============
DROP POLICY IF EXISTS "Senders delete own messages" ON public.community_messages;
CREATE POLICY "Delete own messages or admin" ON public.community_messages
FOR DELETE TO authenticated USING (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Senders update own messages" ON public.community_messages;
CREATE POLICY "Update own messages or admin" ON public.community_messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
WITH CHECK (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- ============ Storage: community-media ============
DROP POLICY IF EXISTS "Community media read" ON storage.objects;
CREATE POLICY "Community media read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'community-media' AND public.is_community_approved(auth.uid()));

DROP POLICY IF EXISTS "Community media upload own folder" ON storage.objects;
CREATE POLICY "Community media upload own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_community_approved(auth.uid()));

DROP POLICY IF EXISTS "Community media delete own folder" ON storage.objects;
CREATE POLICY "Community media delete own folder" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'community-media' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_community_staff(auth.uid())));

-- ============ Realtime ============
ALTER TABLE public.community_access_requests REPLICA IDENTITY FULL;
ALTER TABLE public.community_admins REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.community_access_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.community_admins; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
