-- Prayer & Fire Community: groups, memberships, messages, reactions and media
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  avatar_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_group_members (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  message_type text not null default 'text' check (message_type in ('text','image','video','audio','document')),
  media_url text,
  media_name text,
  reply_to uuid references public.community_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.community_message_reactions (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.community_message_reads (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists idx_community_members_user on public.community_group_members(user_id);
create index if not exists idx_community_messages_group_created on public.community_messages(group_id, created_at desc);
create index if not exists idx_community_reactions_message on public.community_message_reactions(message_id);

alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_message_reactions enable row level security;
alter table public.community_message_reads enable row level security;

-- Group members may read groups they belong to.
drop policy if exists "community groups readable by members" on public.community_groups;
create policy "community groups readable by members" on public.community_groups for select to authenticated
using (created_by = auth.uid() or exists (select 1 from public.community_group_members gm where gm.group_id = id and gm.user_id = auth.uid()));

drop policy if exists "authenticated can create community groups" on public.community_groups;
create policy "authenticated can create community groups" on public.community_groups for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "group owners admins can update groups" on public.community_groups;
create policy "group owners admins can update groups" on public.community_groups for update to authenticated
using (created_by = auth.uid() or exists (select 1 from public.community_group_members gm where gm.group_id = id and gm.user_id = auth.uid() and gm.role in ('owner','admin')));

-- Membership policies.
drop policy if exists "members can view memberships" on public.community_group_members;
create policy "members can view memberships" on public.community_group_members for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.community_group_members self where self.group_id = group_id and self.user_id = auth.uid()));

drop policy if exists "users can join created groups" on public.community_group_members;
create policy "users can join created groups" on public.community_group_members for insert to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.community_groups g where g.id = group_id and g.created_by = auth.uid()));

drop policy if exists "owners admins can manage memberships" on public.community_group_members;
create policy "owners admins can manage memberships" on public.community_group_members for delete to authenticated
using (user_id = auth.uid() or exists (select 1 from public.community_group_members self where self.group_id = group_id and self.user_id = auth.uid() and self.role in ('owner','admin')));

-- Messages visible/sendable only inside user's groups.
drop policy if exists "members can read community messages" on public.community_messages;
create policy "members can read community messages" on public.community_messages for select to authenticated
using (exists (select 1 from public.community_group_members gm where gm.group_id = group_id and gm.user_id = auth.uid()));

drop policy if exists "members can send community messages" on public.community_messages;
create policy "members can send community messages" on public.community_messages for insert to authenticated
with check (sender_id = auth.uid() and exists (select 1 from public.community_group_members gm where gm.group_id = group_id and gm.user_id = auth.uid()));

drop policy if exists "senders can update own community messages" on public.community_messages;
create policy "senders can update own community messages" on public.community_messages for update to authenticated
using (sender_id = auth.uid());

drop policy if exists "senders can delete own community messages" on public.community_messages;
create policy "senders can delete own community messages" on public.community_messages for delete to authenticated
using (sender_id = auth.uid());

-- Reactions and reads.
drop policy if exists "members can read reactions" on public.community_message_reactions;
create policy "members can read reactions" on public.community_message_reactions for select to authenticated
using (exists (select 1 from public.community_messages m join public.community_group_members gm on gm.group_id = m.group_id where m.id = message_id and gm.user_id = auth.uid()));

drop policy if exists "users manage own reactions" on public.community_message_reactions;
create policy "users manage own reactions" on public.community_message_reactions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "members can read message receipts" on public.community_message_reads;
create policy "members can read message receipts" on public.community_message_reads for select to authenticated
using (exists (select 1 from public.community_messages m join public.community_group_members gm on gm.group_id = m.group_id where m.id = message_id and gm.user_id = auth.uid()));

drop policy if exists "users manage own reads" on public.community_message_reads;
create policy "users manage own reads" on public.community_message_reads for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Community media bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('community-media','community-media',true,104857600)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "community media public read" on storage.objects;
create policy "community media public read" on storage.objects for select using (bucket_id = 'community-media');

drop policy if exists "authenticated upload community media" on storage.objects;
create policy "authenticated upload community media" on storage.objects for insert to authenticated
with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners update community media" on storage.objects;
create policy "owners update community media" on storage.objects for update to authenticated
using (bucket_id = 'community-media' and owner_id = auth.uid()::text);

drop policy if exists "owners delete community media" on storage.objects;
create policy "owners delete community media" on storage.objects for delete to authenticated
using (bucket_id = 'community-media' and owner_id = auth.uid()::text);

-- Realtime for messages and reactions.
do $$ begin
  alter publication supabase_realtime add table public.community_messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.community_message_reactions;
exception when duplicate_object then null; end $$;
