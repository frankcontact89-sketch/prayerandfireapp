
ALTER TABLE public.greek_words
  ADD COLUMN IF NOT EXISTS ipa text,
  ADD COLUMN IF NOT EXISTS literal_meaning_en text,
  ADD COLUMN IF NOT EXISTS literal_meaning_es text,
  ADD COLUMN IF NOT EXISTS literal_meaning_pt text,
  ADD COLUMN IF NOT EXISTS biblical_meaning_en text,
  ADD COLUMN IF NOT EXISTS biblical_meaning_es text,
  ADD COLUMN IF NOT EXISTS biblical_meaning_pt text,
  ADD COLUMN IF NOT EXISTS historical_background_en text,
  ADD COLUMN IF NOT EXISTS historical_background_es text,
  ADD COLUMN IF NOT EXISTS historical_background_pt text,
  ADD COLUMN IF NOT EXISTS practical_application_en text,
  ADD COLUMN IF NOT EXISTS practical_application_es text,
  ADD COLUMN IF NOT EXISTS practical_application_pt text,
  ADD COLUMN IF NOT EXISTS related_words text;
