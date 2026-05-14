
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  button_label TEXT DEFAULT 'Learn More',
  link_url TEXT,
  link_type TEXT NOT NULL DEFAULT 'info' CHECK (link_type IN ('internal','stripe','external','info')),
  price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active courses"
ON public.courses FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.courses (title, description, link_type, button_label, order_index) VALUES
('Prayer Foundations', 'Learn the foundations of a powerful and consistent prayer life.', 'info', 'Coming Soon', 1),
('Spiritual Discipline', 'Build daily habits that strengthen your walk with God.', 'info', 'Coming Soon', 2),
('Bible Study Basics', 'A practical introduction to studying the Bible with depth and clarity.', 'info', 'Coming Soon', 3);
