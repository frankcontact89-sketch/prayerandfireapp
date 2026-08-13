-- 1. Reports: audit + moderation columns
ALTER TABLE public.community_reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS action text;

ALTER TABLE public.community_reports
  DROP CONSTRAINT IF EXISTS community_reports_no_self;
ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_no_self
  CHECK (reported_user_id IS NULL OR reported_user_id <> reporter_id);

CREATE INDEX IF NOT EXISTS community_reports_status_idx ON public.community_reports (status, created_at DESC);

DROP POLICY IF EXISTS "Own reports select" ON public.community_reports;
CREATE POLICY "Reports visible to reporter and staff"
  ON public.community_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_community_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff review reports" ON public.community_reports;
CREATE POLICY "Staff review reports"
  ON public.community_reports FOR UPDATE TO authenticated
  USING (public.is_community_staff(auth.uid()))
  WITH CHECK (public.is_community_staff(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;

-- 2. Blocks: no self-block
ALTER TABLE public.community_blocks DROP CONSTRAINT IF EXISTS community_blocks_no_self;
ALTER TABLE public.community_blocks
  ADD CONSTRAINT community_blocks_no_self CHECK (blocker_id <> blocked_id);

CREATE OR REPLACE FUNCTION public.has_blocked(_blocker uuid, _blocked uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_blocks
    WHERE blocker_id = _blocker AND blocked_id = _blocked
  )
$$;

-- 3. Hide blocked senders' messages from the blocker
DROP POLICY IF EXISTS "Members read messages" ON public.community_messages;
CREATE POLICY "Members read messages"
  ON public.community_messages FOR SELECT TO authenticated
  USING (
    public.is_community_member(group_id, auth.uid())
    AND NOT public.has_blocked(auth.uid(), sender_id)
  );

-- 4. Owner protection on access status changes
CREATE OR REPLACE FUNCTION public.protect_owner_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_community_boss(NEW.user_id)
     AND NEW.status IS DISTINCT FROM 'approved'
     AND NOT public.is_community_boss(auth.uid()) THEN
    RAISE EXCEPTION 'Only the community owner can change owner-level access';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_access_protect_owner ON public.community_access_requests;
CREATE TRIGGER community_access_protect_owner
BEFORE UPDATE ON public.community_access_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_access();

-- 5. Server-side content filter (authoritative)
CREATE OR REPLACE FUNCTION public.community_text_blocked(_t text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  s text;
BEGIN
  IF _t IS NULL OR btrim(_t) = '' THEN RETURN false; END IF;
  s := lower(_t);
  -- collapse common obfuscation
  s := translate(s, '@$!013', 'asiiole');
  s := regexp_replace(s, '[^a-z0-9\s]', '', 'g');
  s := regexp_replace(s, '\s+', ' ', 'g');

  IF s ~ '\y(fuck|fuk|motherfucker|cunt|whore|slut|bitch|bastard|nigger|nigga|faggot|fag|kike|spic|chink|tranny|retard|puta|puto|pendejo|cabron|maricon|marica|verga|cono|chinga|mierda|hijueputa|vadia|vagabunda|viado|caralho|porra|buceta|foda se|filho da puta)\y' THEN
    RETURN true;
  END IF;
  IF s ~ '\y(child porn|childporn|cp porn|porn|porno|pornhub|xxx|nudes|sexo explicito|sexting|onlyfans)\y' THEN
    RETURN true;
  END IF;
  IF s ~ '(i will kill you|im going to kill you|kill yourself|kys|te voy a matar|te vou matar|vou te matar|matate|se mate|rape you)' THEN
    RETURN true;
  END IF;
  IF s ~ '(free crypto|bitcoin giveaway|make money fast|click this link to earn|whatsapp \+?[0-9]{8,}|telegram me for money|forex profit|investment guaranteed profit)' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_community_message()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.community_text_blocked(NEW.body) THEN
    RAISE EXCEPTION 'CONTENT_BLOCKED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_messages_moderation ON public.community_messages;
CREATE TRIGGER community_messages_moderation
BEFORE INSERT OR UPDATE OF body ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.moderate_community_message();

CREATE OR REPLACE FUNCTION public.moderate_community_group()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.community_text_blocked(NEW.name) OR public.community_text_blocked(NEW.description) THEN
    RAISE EXCEPTION 'CONTENT_BLOCKED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_groups_moderation ON public.community_groups;
CREATE TRIGGER community_groups_moderation
BEFORE INSERT OR UPDATE OF name, description ON public.community_groups
FOR EACH ROW EXECUTE FUNCTION public.moderate_community_group();