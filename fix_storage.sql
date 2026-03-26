-- Fix Storage Buckets and Policies
-- Run in Supabase SQL Editor

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('complaint-images', 'complaint-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public read complaint images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload complaint images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete complaint images" ON storage.objects;
DROP POLICY IF EXISTS "Public read profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload profile pictures" ON storage.objects;

-- Allow anyone to read complaint images (public bucket)
CREATE POLICY "Public read complaint images"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-images');

-- Allow authenticated users to upload complaint images
CREATE POLICY "Authenticated upload complaint images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complaint-images');

-- Allow authenticated users to delete their own complaint images
CREATE POLICY "Authenticated delete complaint images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'complaint-images');

-- Allow anyone to read profile pictures
CREATE POLICY "Public read profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload profile pictures
CREATE POLICY "Authenticated upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Verify buckets exist
SELECT id, name, public FROM storage.buckets;
