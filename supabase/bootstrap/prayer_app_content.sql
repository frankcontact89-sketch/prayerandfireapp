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
FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();



CREATE TABLE public.app_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT,
  value_en TEXT,
  value_es TEXT,
  value_pt TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view content"
ON public.app_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage content"
ON public.app_content FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_app_content_updated_at
BEFORE UPDATE ON public.app_content
FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

CREATE TABLE public.verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_en TEXT,
  ref_en TEXT,
  text_es TEXT,
  ref_es TEXT,
  text_pt TEXT,
  ref_pt TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active verses"
ON public.verses FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage verses"
ON public.verses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_verses_updated_at
BEFORE UPDATE ON public.verses
FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();



CREATE TABLE IF NOT EXISTS public.solas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  latin text NOT NULL,
  name_en text NOT NULL,
  name_es text NOT NULL,
  name_pt text NOT NULL,
  translation_en text NOT NULL,
  translation_es text NOT NULL,
  translation_pt text NOT NULL,
  explanation_en text,
  explanation_es text,
  explanation_pt text,
  history_en text,
  history_es text,
  history_pt text,
  verses_en text,
  verses_es text,
  verses_pt text,
  application_en text,
  application_es text,
  application_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.solas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solas TO authenticated;
GRANT ALL ON public.solas TO service_role;

ALTER TABLE public.solas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view solas" ON public.solas FOR SELECT USING (true);
CREATE POLICY "Admins can insert solas" ON public.solas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update solas" ON public.solas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete solas" ON public.solas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER solas_updated_at BEFORE UPDATE ON public.solas
  FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- ============ GREEK WORDS ============
CREATE TABLE IF NOT EXISTS public.greek_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  greek text NOT NULL,
  transliteration text NOT NULL,
  pronunciation text NOT NULL,
  meaning_en text NOT NULL,
  meaning_es text NOT NULL,
  meaning_pt text NOT NULL,
  biblical_usage_en text,
  biblical_usage_es text,
  biblical_usage_pt text,
  scripture_refs text,
  explanation_en text,
  explanation_es text,
  explanation_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.greek_words TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.greek_words TO authenticated;
GRANT ALL ON public.greek_words TO service_role;

ALTER TABLE public.greek_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view greek_words" ON public.greek_words FOR SELECT USING (true);
CREATE POLICY "Admins can insert greek_words" ON public.greek_words FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update greek_words" ON public.greek_words FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete greek_words" ON public.greek_words FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER greek_words_updated_at BEFORE UPDATE ON public.greek_words
  FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- ============ SEED SOLAS ============



-- Enum for library categories
DO $$ BEGIN
  CREATE TYPE public.library_category AS ENUM (
    'bible_studies','doctrine','christology','pneumatology','soteriology',
    'hermeneutics','homiletics','church_history','apologetics','leadership',
    'missions','sermons','articles'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DEVOTIONALS
CREATE TABLE public.devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT true,
  title_en text NOT NULL, title_es text, title_pt text,
  scripture_reference_en text, scripture_reference_es text, scripture_reference_pt text,
  scripture_text_en text, scripture_text_es text, scripture_text_pt text,
  context_en text, context_es text, context_pt text,
  reflection_en text, reflection_es text, reflection_pt text,
  application_en text, application_es text, application_pt text,
  prayer_en text, prayer_es text, prayer_pt text,
  questions_en text[] DEFAULT '{}', questions_es text[] DEFAULT '{}', questions_pt text[] DEFAULT '{}',
  related_verses text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.devotionals TO anon, authenticated;
GRANT ALL ON public.devotionals TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.devotionals TO authenticated;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published devotionals" ON public.devotionals FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage devotionals" ON public.devotionals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_devotionals_updated BEFORE UPDATE ON public.devotionals FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- READING PLANS
CREATE TABLE public.reading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  duration_days integer NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  title_en text NOT NULL, title_es text, title_pt text,
  description_en text, description_es text, description_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reading_plans TO anon, authenticated;
GRANT ALL ON public.reading_plans TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.reading_plans TO authenticated;
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published plans" ON public.reading_plans FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reading plans" ON public.reading_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reading_plans_updated BEFORE UPDATE ON public.reading_plans FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- READING PLAN DAYS
CREATE TABLE public.reading_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title_en text, title_es text, title_pt text,
  passages text[] NOT NULL DEFAULT '{}',
  UNIQUE (plan_id, day_number),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reading_plan_days TO anon, authenticated;
GRANT ALL ON public.reading_plan_days TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.reading_plan_days TO authenticated;
ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan days" ON public.reading_plan_days FOR SELECT USING (true);
CREATE POLICY "Admins manage plan days" ON public.reading_plan_days FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- READING PLAN PROGRESS
CREATE TABLE public.reading_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_plan_progress TO authenticated;
GRANT ALL ON public.reading_plan_progress TO service_role;
ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.reading_plan_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LIBRARY ARTICLES
CREATE TABLE public.library_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category public.library_category NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  cover_image_url text,
  title_en text NOT NULL, title_es text, title_pt text,
  summary_en text, summary_es text, summary_pt text,
  body_en text, body_es text, body_pt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_articles TO anon, authenticated;
GRANT ALL ON public.library_articles TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.library_articles TO authenticated;
ALTER TABLE public.library_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published articles" ON public.library_articles FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage articles" ON public.library_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_library_articles_updated BEFORE UPDATE ON public.library_articles FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();




CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. User notes
CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT ALL ON public.user_notes TO service_role;

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
  ON public.user_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

CREATE INDEX IF NOT EXISTS user_notes_user_item_idx ON public.user_notes(user_id, item_type, item_id);
CREATE INDEX IF NOT EXISTS favorites_user_item_idx ON public.favorites(user_id, item_type, item_id);


-- Create purchases table for tracking user purchases
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price_paid NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_product_id ON public.purchases(product_id);
