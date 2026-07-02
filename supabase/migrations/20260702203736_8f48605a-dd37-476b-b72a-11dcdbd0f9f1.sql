ALTER TABLE public.greek_words
  ADD COLUMN IF NOT EXISTS pronunciation_text TEXT,
  ADD COLUMN IF NOT EXISTS pronunciation_locale TEXT;