create function public.community_can_create_group()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and (
    public.is_community_global_admin(auth.uid())
    or exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
$$;
revoke all on function public.community_can_create_group() from public, anon;
grant execute on function public.community_can_create_group() to authenticated;

create function public.community_create_group(_id uuid, _name text, _description text, _avatar text, _members uuid[])
returns uuid language plpgsql security definer set search_path = ''
as $$
declare caller uuid := auth.uid();
begin
  if not public.community_can_create_group() then
    raise exception 'Group creation requires an administrator' using errcode = '42501';
  end if;
  if _id is null or _name is null or length(btrim(_name)) not between 1 and 80
     or length(coalesce(_description, '')) > 2000 or coalesce(cardinality(_members), 0) > 100
     or (_avatar is not null and _avatar not like caller::text || '/groups/%') then
    raise exception 'Invalid group details' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(_members) requested(id)
    where id is distinct from caller and (
      not exists (select 1 from public.profiles p where p.id = requested.id)
      or not public.can_send_community_direct_message(requested.id)
    )
  ) then raise exception 'A selected participant is unavailable' using errcode = '42501'; end if;

  insert into public.community_groups(id, name, description, avatar_url, created_by)
  values (_id, btrim(_name), nullif(btrim(_description), ''), _avatar, caller)
  on conflict (id) do nothing;
  if not exists (select 1 from public.community_groups g where g.id = _id and g.created_by = caller)
  then raise exception 'Group identifier unavailable' using errcode = '42501'; end if;

  insert into public.community_group_members(group_id, user_id, role)
  select _id, id, case when id = caller then 'owner' else 'member' end
  from (select caller as id union select unnest(_members)) requested
  on conflict do nothing;
  return _id;
end;
$$;
revoke all on function public.community_create_group(uuid,text,text,text,uuid[]) from public, anon;
grant execute on function public.community_create_group(uuid,text,text,text,uuid[]) to authenticated;

create function public.community_find_contacts(_query text)
returns table(id uuid, username text, avatar_url text)
language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  term text := left(btrim(coalesce(_query, '')), 100);
  number text;
begin
  if caller is null or length(term) < 2 then return; end if;
  if term ~ '^\+?[0-9(). -]+$' then
    number := public.normalize_phone_e164(term);
    if number is null then return; end if;
    perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
    if (select count(*) from public.phone_lookup_attempts a
        where a.user_id = caller and a.created_at > now() - interval '1 hour') >= 20
    then raise exception 'Phone lookup rate limit reached' using errcode = '42501'; end if;
    insert into public.phone_lookup_attempts (user_id) values (caller);
    return query
      select p.id, p.username, p.avatar_url
      from public.user_phone_numbers n join public.profiles p on p.id = n.user_id
      where n.phone = number and n.discoverable = true
        and public.can_send_community_direct_message(p.id)
      limit 1;
  else
    return query select p.id, p.username, p.avatar_url from public.profiles p
      where strpos(lower(p.username), lower(ltrim(term, '@'))) > 0
        and length(ltrim(term, '@')) >= 2
        and public.can_send_community_direct_message(p.id)
      order by p.username, p.id limit 25;
  end if;
end;
$$;
revoke all on function public.community_find_contacts(text) from public, anon;
grant execute on function public.community_find_contacts(text) to authenticated;

alter table public.community_direct_messages add column read_at timestamptz;
grant update (read_at) on public.community_direct_messages to authenticated;
create policy "Recipients mark direct messages read" on public.community_direct_messages
  for update to authenticated using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid() and read_at is not null);

create function public.community_direct_threads()
returns table(id uuid, username text, avatar_url text, body text, created_at timestamptz, unread bigint)
language sql stable set search_path = ''
as $$
  with messages as (
    select m.*, case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end as peer
    from public.community_direct_messages m
    where auth.uid() in (m.sender_id, m.recipient_id)
  ), latest as (
    select distinct on (peer) peer, messages.body, messages.created_at
    from messages order by peer, created_at desc, messages.id desc
  ), unread as (
    select peer, count(*) as total from messages
    where recipient_id = auth.uid() and read_at is null group by peer
  )
  select latest.peer, p.username, p.avatar_url, latest.body, latest.created_at, coalesce(unread.total,0)
  from latest left join public.profiles p on p.id = latest.peer
  left join unread on unread.peer = latest.peer
  order by latest.created_at desc limit 100;
$$;
revoke all on function public.community_direct_threads() from public, anon;
grant execute on function public.community_direct_threads() to authenticated;

alter publication supabase_realtime add table public.community_direct_messages;
