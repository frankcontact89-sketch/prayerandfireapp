-- Add welcome_seen column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_seen boolean DEFAULT false;