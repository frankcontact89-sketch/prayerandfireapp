CREATE OR REPLACE FUNCTION public.community_text_blocked(_t text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  s text;
BEGIN
  IF _t IS NULL OR btrim(_t) = '' THEN RETURN false; END IF;
  s := lower(_t);
  s := translate(s, '@$!013', 'asiiole');
  s := regexp_replace(s, '[^a-z0-9\s]', '', 'g');
  s := regexp_replace(s, '\s+', ' ', 'g');

  IF s ~ '\y(fuck|fuk|fck|phuck|motherfucker|cunt|whore|slut|bitch|btch|bastard|nigger|nigga|nigg|faggot|fag|kike|spic|chink|tranny|retard|puta|puto|pendejo|cabron|maricon|marica|verga|cono|chinga|mierda|hijueputa|vadia|vagabunda|viado|caralho|porra|buceta|foda se|filho da puta)\y' THEN
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