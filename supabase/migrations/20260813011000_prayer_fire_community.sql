-- Prayer & Fire Community
-- Groups, membership, messages, reactions and read receipts.

create extension if not exists pgcrypto;

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  avatar_url text,
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_group_members (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','moderator','member')),
  joined_at timestamptz not null default now(),
  muted_until timestamptz,
  primary key (group_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  message_type text not null default 'text' check (message_type in ('text','image','video','audio','file','location','poll','event')),
  media_url text,
  media_duration_seconds integer,
  reply_to uuid references public.community_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_message_has_content check (body is not null or media_url is not null)
);

create index if not exists community_messages_group_created_idx
  on public.community_messages(group_id, created_at desc);

create table if not exists public.community_message_reactions (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.community_read_receipts (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_message_id uuid references public.community_messages(id) on delete set null,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_message_reactions enable row level security;
alter table public.community_read_receipts enable row level security;

create policy "community groups visible to members or public"
on public.community_groups for select to authenticated
using (
  is_public or exists (
    select 1 from public.community_group_members m
    where m.group_id = id and m.user_id = auth.uid()
  )
);

create policy "community members can view membership"
on public.community_group_members for select to authenticated
using (
  user_id = auth.uid() or exists (
    select 1 from public.community_group_members self
    where self.group_id = group_id and self.user_id = auth.uid()
  )
);

create policy "community users can join public groups"
on public.community_group_members for insert to authenticated
with check (
  user_id = auth.uid() and exists (
    select 1 from public.community_groups g where g.id = group_id and g.is_public
  )
);

create policy "community members can read messages"
on public.community_messages for select to authenticated
using (exists (
  select 1 from public.community_group_members m
  where m.group_id = community_messages.group_id and m.user_id = auth.uid()
));

create policy "community members can send messages"
on public.community_messages for insert to authenticated
with check (
  sender_id = auth.uid() and exists (
    select 1 from public.community_group_members m
    where m.group_id = community_messages.group_id and m.user_id = auth.uid()
  )
);

create policy "senders can edit their messages"
on public.community_messages for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create policy "community members can view reactions"
on public.community_message_reactions for select to authenticated
using (exists (
  select 1 from public.community_messages msg
  join public.community_group_members m on m.group_id = msg.group_id
  where msg.id = message_id and m.user_id = auth.uid()
));

create policy "community members can react"
on public.community_message_reactions for insert to authenticated
with check (
  user_id = auth.uid() and exists (
    select 1 from public.community_messages msg
    join public.community_group_members m on m.group_id = msg.group_id
    where msg.id = message_id and m.user_id = auth.uid()
  )
);

create policy "users can remove their reactions"
on public.community_message_reactions for delete to authenticated
using (user_id = auth.uid());

create policy "users manage own read receipts"
on public.community_read_receipts for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Realtime publication (safe if publication already contains a table).
do $$ begin
  alter publication supabase_realtime add table public.community_messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.community_message_reactions;
exception when duplicate_object then null; end $$;
