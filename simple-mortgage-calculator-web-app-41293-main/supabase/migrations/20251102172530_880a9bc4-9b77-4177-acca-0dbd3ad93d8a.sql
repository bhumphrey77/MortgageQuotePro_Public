-- Make storage buckets private and update policies
-- Update avatars bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Update logos bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'logos';

-- Drop the public "Anyone can view" policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;

-- Create authenticated-only view policies for avatars
CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Create authenticated-only view policies for logos
CREATE POLICY "Authenticated users can view logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'logos');