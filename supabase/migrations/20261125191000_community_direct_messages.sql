create table public.community_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index community_direct_messages_parties
  on public.community_direct_messages (recipient_id, sender_id, created_at desc);
create index community_direct_messages_sender
  on public.community_direct_messages (sender_id, recipient_id, created_at desc);

create function public.can_send_community_direct_message(_recipient uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and auth.uid() <> _recipient
    and exists (select 1 from public.profiles where id = _recipient)
    and not exists (
      select 1 from public.community_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = _recipient)
         or (b.blocker_id = _recipient and b.blocked_id = auth.uid())
    );
$$;
revoke all on function public.can_send_community_direct_message(uuid) from public, anon;
grant execute on function public.can_send_community_direct_message(uuid) to authenticated;

alter table public.community_direct_messages enable row level security;
revoke all on public.community_direct_messages from public, anon, authenticated;
grant select, insert (recipient_id, body) on public.community_direct_messages to authenticated;
create policy "Parties read direct messages" on public.community_direct_messages
  for select to authenticated using (auth.uid() in (sender_id, recipient_id));
create policy "Users send direct messages as themselves" on public.community_direct_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.can_send_community_direct_message(recipient_id)
  );
