-- Add custom font URL to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_font_url text;

-- Create storage bucket for custom fonts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fonts', 'fonts', false);

-- RLS policies for fonts bucket
CREATE POLICY "Users can view their own fonts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fonts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own fonts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fonts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own fonts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'fonts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own fonts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'fonts' AND auth.uid()::text = (storage.foldername(name))[1]);