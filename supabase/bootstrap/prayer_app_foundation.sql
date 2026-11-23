-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  avatar_url text,
  welcome_seen boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read profiles (for username lookups)
CREATE POLICY "Signed-in members can view profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.set_prayer_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Content management tables
CREATE TABLE public.app_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active links"
ON public.app_links
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage links"
ON public.app_links
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.app_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    category TEXT,
    is_live BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active videos"
ON public.app_videos
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage videos"
ON public.app_videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    image_url TEXT,
    is_online BOOLEAN DEFAULT false,
    registration_url TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active events"
ON public.events
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can send notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_app_links_updated_at
BEFORE UPDATE ON public.app_links
FOR EACH ROW
EXECUTE FUNCTION public.set_prayer_app_updated_at();

CREATE TRIGGER update_app_videos_updated_at
BEFORE UPDATE ON public.app_videos
FOR EACH ROW
EXECUTE FUNCTION public.set_prayer_app_updated_at();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_prayer_app_updated_at();

-- Create messages table for live chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages
CREATE POLICY "Everyone can view messages"
ON public.messages
FOR SELECT
USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add RSVP functionality to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS rsvp_count integer DEFAULT 0;

-- Create event_rsvps table
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS for RSVPs
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view all RSVPs
CREATE POLICY "Everyone can view RSVPs"
ON public.event_rsvps
FOR SELECT
USING (true);

-- Users can RSVP to events
CREATE POLICY "Users can create their own RSVPs"
ON public.event_rsvps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete their own RSVPs"
ON public.event_rsvps
FOR DELETE
USING (auth.uid() = user_id);

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- CommunityV2 admits signed-in accounts. Only the dedicated general topic
-- follows that rule; membership policies for group rooms remain in effect.
create policy "Community members receive general prayer signaling"
on realtime.messages for select to authenticated
using ((select auth.uid()) is not null and realtime.topic() = 'voice-room:community-general');

create policy "Community members send general prayer signaling"
on realtime.messages for insert to authenticated
with check ((select auth.uid()) is not null and realtime.topic() = 'voice-room:community-general');


ALTER TABLE public.community_admins ADD COLUMN IF NOT EXISTS can_create_groups boolean NOT NULL DEFAULT true;
