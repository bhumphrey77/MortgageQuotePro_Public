-- Add logo_aspect_ratio column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN logo_aspect_ratio text DEFAULT '2:1' CHECK (logo_aspect_ratio IN ('1:1', '16:9', '2:1', 'free'));