-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view logos" ON storage.objects;

-- Create restrictive policies that only allow viewing own files
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);