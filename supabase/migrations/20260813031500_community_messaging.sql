-- Prayer & Fire Community: groups, messaging, reactions, moderation and storage
create extension if not exists pgcrypto;

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text default '',
  avatar_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_group_members (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  muted boolean not null default false,
  archived boolean not null default false,
  favorite boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  media_url text,
  media_type text check (media_type in ('image','video','audio','document') or media_type is null),
  reply_to uuid references public.community_messages(id) on delete set null,
  starred boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint community_message_has_content check (
    deleted_at is not null or coalesce(length(trim(body)),0) > 0 or media_url is not null
  )
);

create table if not exists public.community_reactions (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.community_message_reads (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  message_id uuid references public.community_messages(id) on delete set null,
  group_id uuid references public.community_groups(id) on delete set null,
  reason text not null default 'inappropriate_content',
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists community_messages_group_created_idx on public.community_messages(group_id, created_at);
create index if not exists community_members_user_idx on public.community_group_members(user_id);
create index if not exists community_reports_status_idx on public.community_reports(status, created_at);

alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_message_reads enable row level security;
alter table public.community_blocks enable row level security;
alter table public.community_reports enable row level security;

-- Helper used by policies.
create or replace function public.is_community_member(_group uuid, _user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.community_group_members m where m.group_id = _group and m.user_id = _user);
$$;

create or replace function public.is_community_admin(_group uuid, _user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.community_group_members m where m.group_id = _group and m.user_id = _user and m.role in ('owner','admin'));
$$;

do $$ begin
  create policy "members read groups" on public.community_groups for select using (public.is_community_member(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users create groups" on public.community_groups for insert with check (created_by = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins update groups" on public.community_groups for update using (public.is_community_admin(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners delete groups" on public.community_groups for delete using (created_by = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members read membership" on public.community_group_members for select using (public.is_community_member(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins add members" on public.community_group_members for insert with check (user_id = auth.uid() or public.is_community_admin(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "self or admins update membership" on public.community_group_members for update using (user_id = auth.uid() or public.is_community_admin(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "self or admins remove membership" on public.community_group_members for delete using (user_id = auth.uid() or public.is_community_admin(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members read messages" on public.community_messages for select using (public.is_community_member(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members send messages" on public.community_messages for insert with check (sender_id = auth.uid() and public.is_community_member(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sender edits own messages" on public.community_messages for update using (sender_id = auth.uid() or public.is_community_admin(group_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sender or admin deletes messages" on public.community_messages for delete using (sender_id = auth.uid() or public.is_community_admin(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members read reactions" on public.community_reactions for select using (exists(select 1 from public.community_messages m where m.id=message_id and public.is_community_member(m.group_id)));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members react" on public.community_reactions for insert with check (user_id=auth.uid() and exists(select 1 from public.community_messages m where m.id=message_id and public.is_community_member(m.group_id)));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users change own reaction" on public.community_reactions for update using (user_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users remove own reaction" on public.community_reactions for delete using (user_id=auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members read receipts" on public.community_message_reads for select using (exists(select 1 from public.community_messages m where m.id=message_id and public.is_community_member(m.group_id)));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users write own receipts" on public.community_message_reads for insert with check (user_id=auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users read own blocks" on public.community_blocks for select using (blocker_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users block" on public.community_blocks for insert with check (blocker_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users unblock" on public.community_blocks for delete using (blocker_id=auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users create reports" on public.community_reports for insert with check (reporter_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users read own reports" on public.community_reports for select using (reporter_id=auth.uid());
exception when duplicate_object then null; end $$;

-- User-generated media bucket. 25 MB file limit; client applies tighter limits per media type.
insert into storage.buckets (id, name, public, file_size_limit)
values ('community-media','community-media',false,26214400)
on conflict (id) do update set file_size_limit=26214400;

do $$ begin
  create policy "community media read" on storage.objects for select using (
    bucket_id='community-media' and auth.role()='authenticated'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "community media upload own folder" on storage.objects for insert with check (
    bucket_id='community-media' and auth.role()='authenticated' and (storage.foldername(name))[1]=auth.uid()::text
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "community media delete own folder" on storage.objects for delete using (
    bucket_id='community-media' and auth.role()='authenticated' and (storage.foldername(name))[1]=auth.uid()::text
  );
exception when duplicate_object then null; end $$;

-- Realtime support.
do $$ begin
  alter publication supabase_realtime add table public.community_messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.community_reactions;
exception when duplicate_object then null; end $$;
