create function public.provision_community_profile(_id uuid, _email text, _metadata jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  suggested text := left(btrim(coalesce(_metadata->>'username', _metadata->>'display_name', '')), 80);
  fallback text := 'member-' || replace(_id::text, '-', '');
begin
  if _email is null then return; end if;
  insert into public.profiles(id, email, username)
  values (_id, _email, coalesce(nullif(suggested, ''), fallback))
  on conflict do nothing;
  insert into public.profiles(id, email, username)
  values (_id, _email, fallback)
  on conflict do nothing;
end;
$$;
revoke all on function public.provision_community_profile(uuid,text,jsonb) from public, anon, authenticated;

create function public.sync_community_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null then
    perform public.provision_community_profile(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;
revoke all on function public.sync_community_profile() from public, anon, authenticated;

create trigger prayer_community_profile_after_signup
after insert or update of email_confirmed_at on auth.users
for each row execute function public.sync_community_profile();

select public.provision_community_profile(u.id, u.email, u.raw_user_meta_data)
from auth.users u where u.email_confirmed_at is not null
  and not exists (select 1 from public.profiles p where p.id = u.id);
