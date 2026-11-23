alter table public.community_access_requests add column id uuid not null default gen_random_uuid(), add column note text, add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now();
alter table public.community_admins add column granted_by uuid references auth.users(id) on delete set null;
alter table public.community_audio_plays add column id uuid not null default gen_random_uuid();
alter table public.community_blocks add column id uuid not null default gen_random_uuid();
alter table public.community_group_members add column id uuid not null default gen_random_uuid();
alter table public.community_message_reads add column id uuid not null default gen_random_uuid();
alter table public.community_reactions add column id uuid not null default gen_random_uuid();
alter table public.community_reports add column reviewed_by uuid references auth.users(id) on delete set null, add column reviewed_at timestamptz, add column action text;
alter table public.greek_words
  add column language_type text not null default 'greek' check (language_type in ('greek','hebrew','expression')),
  add column ipa text,
  add column literal_meaning_en text, add column literal_meaning_es text, add column literal_meaning_pt text,
  add column biblical_meaning_en text, add column biblical_meaning_es text, add column biblical_meaning_pt text,
  add column historical_background_en text, add column historical_background_es text, add column historical_background_pt text,
  add column practical_application_en text, add column practical_application_es text, add column practical_application_pt text,
  add column related_words text, add column pronunciation_text text, add column pronunciation_locale text;
