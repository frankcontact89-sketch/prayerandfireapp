-- Admin-managed visual identity; applying this migration is required before the editor works.
CREATE TABLE IF NOT EXISTS public.app_branding (
  id text PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  logo_path text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_branding ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_branding TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_branding TO authenticated;
CREATE POLICY "Brand logo is readable" ON public.app_branding FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert brand logo" ON public.app_branding FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "Admins update brand logo" ON public.app_branding FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'));
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pf-branding', 'pf-branding', true, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view branded images" ON storage.objects FOR SELECT TO anon, authenticated
 USING (bucket_id = 'pf-branding');
CREATE POLICY "Only admins upload branded images" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id = 'pf-branding' AND EXISTS
  (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'));
