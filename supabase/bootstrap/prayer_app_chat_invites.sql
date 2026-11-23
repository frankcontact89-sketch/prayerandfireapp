-- App invitation RPCs use an explicit authenticated actor.
create function public.is_group_admin(_group_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select _user_id = (select auth.uid()) and (
    public.is_community_global_admin(_user_id)
    or exists(select 1 from public.community_group_members
      where group_id=_group_id and user_id=_user_id and role in ('owner','admin'))
  )
$$;
revoke all on function public.is_group_admin(uuid,uuid) from public, anon;
grant execute on function public.is_group_admin(uuid,uuid) to authenticated;

-- 1. Prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS community_group_members_unique ON public.community_group_members(group_id, user_id);

-- 2. Invitations table
CREATE TABLE IF NOT EXISTS public.community_group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  email text …1388 tokens truncated…roup_invite_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group leaders manage invite links" ON public.community_group_invite_links;
CREATE POLICY "Group leaders manage invite links"
ON public.community_group_invite_links
FOR ALL
TO authenticated
USING (public.is_group_admin(group_id, auth.uid()))
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

DROP TRIGGER IF EXISTS community_group_invite_links_updated_at ON public.community_group_invite_links;
CREATE TRIGGER community_group_invite_links_updated_at
BEFORE UPDATE ON public.community_group_invite_links
FOR EACH ROW EXECUTE FUNCTION public.set_prayer_app_updated_at();

CREATE INDEX IF NOT EXISTS community_group_invite_links_group_idx
  ON public.community_group_invite_links(group_id);

CREATE OR REPLACE FUNCTION public.create_group_invite_link(_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
BEGIN
  IF NOT public.is_group_admin(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;

  UPDATE public.community_group_invite_links
     SET revoked = true, updated_at = now()
   WHERE group_id = _group_id AND revoked = false;

  _token := replace(gen_random_uuid()::text, '-', '') || substr(md5(gen_random_uuid()::text), 1, 8);

  INSERT INTO public.community_group_invite_links (group_id, token, created_by)
  VALUES (_group_id, _token, auth.uid());

  RETURN _token;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_group_invite_links(_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_group_admin(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'NO_PERMISSION';
  END IF;
  UPDATE public.community_group_invite_links
     SET revoked = true, updated_at = now()
   WHERE group_id = _group_id AND revoked = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_invite_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _link public.community_group_invite_links%ROWTYPE;
  _name text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  SELECT * INTO _link
    FROM public.community_group_invite_links
   WHERE token = _token
     AND revoked = false
     AND expires_at > now()
     AND (max_uses IS NULL OR uses < max_uses)
   LIMIT 1 FOR UPDATE;

  IF _link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT name INTO _name FROM public.community_groups WHERE id = _link.group_id;
  IF _name IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF EXISTS (SELECT 1 FROM public.community_group_members WHERE group_id = _link.group_id AND user_id = _uid) THEN
    RETURN jsonb_build_object('status', 'already_member', 'group_id', _link.group_id, 'name', _name);
  END IF;

  INSERT INTO public.community_group_members (group_id, user_id, role)
  VALUES (_link.group_id, _uid, 'member')
  ON CONFLICT DO NOTHING;

  UPDATE public.community_group_invite_links
     SET uses = uses + 1, updated_at = now()
   WHERE id = _link.id;

  RETURN jsonb_build_object('status', 'joined', 'group_id', _link.group_id, 'name', _name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_group_invite_link(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_group_invite_links(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_group_by_invite_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_invite_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_group_invite_links(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_invite_token(text) TO authenticated;
alter table public.user_push_tokens alter column locale set default 'en';

create table public.community_call_push_cooldowns (
  group_id uuid primary key references public.community_groups(id) on delete cascade,
  sent_at timestamptz not null
);

alter table public.community_call_push_cooldowns enable row level security;
revoke all on public.community_call_push_cooldowns from public, anon, authenticated;

create function public.community_call_push_targets(_group_id uuid, _caller_id uuid)
returns table(user_id uuid)
language sql
security definer
set search_path = ''
as $$
  with claim as (
    insert into public.community_call_push_cooldowns as cooldown (group_id, sent_at)
    select _group_id, now()
    where exists (
      select 1 from public.community_group_members gm
      where gm.group_id = _group_id and gm.user_id = _caller_id
    )
    on conflict (group_id) do update set sent_at = excluded.sent_at
    where cooldown.sent_at <= excluded.sent_at - interval '1 minute'
    returning group_id
  )
  select gm.user_id
  from claim c
  join public.community_group_members gm on gm.group_id = c.group_id
  where gm.user_id <> _caller_id
    and not (gm.muted is true and (gm.muted_until is null or gm.muted_until > now()))
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id = gm.user_id and b.blocked_id = _caller_id)
         or (b.blocker_id = _caller_id and b.blocked_id = gm.user_id)
    );
$$;

revoke all on function public.community_call_push_targets(uuid, uuid) from public, anon, authenticated;
grant execute on function public.community_call_push_targets(uuid, uuid) to service_role;
