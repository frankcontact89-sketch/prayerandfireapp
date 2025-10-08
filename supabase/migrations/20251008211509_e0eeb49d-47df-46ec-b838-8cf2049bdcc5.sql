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