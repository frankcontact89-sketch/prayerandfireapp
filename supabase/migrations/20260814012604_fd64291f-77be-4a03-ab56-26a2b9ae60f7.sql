CREATE OR REPLACE FUNCTION public.discover_community_groups()
RETURNS TABLE(id uuid, name text, description text, avatar_url text, member_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT g.id, g.name, g.description, g.avatar_url,
         (SELECT count(*) FROM public.community_group_members m WHERE m.group_id = g.id)
  FROM public.community_groups g
  WHERE public.is_community_approved(auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.community_group_members m2
      WHERE m2.group_id = g.id AND m2.user_id = auth.uid()
    )
  ORDER BY g.updated_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.discover_community_groups() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
BEGIN
  _name := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'user'
  );
  INSERT INTO public.profiles (id, email, username, welcome_seen)
  VALUES (NEW.id, COALESCE(NEW.email, ''), _name, false)
  ON CONFLICT (id) DO UPDATE
    SET username = COALESCE(NULLIF(btrim(EXCLUDED.username), ''), public.profiles.username);
  RETURN NEW;
END;
$$;