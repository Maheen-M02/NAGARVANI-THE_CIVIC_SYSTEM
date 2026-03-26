-- Storage Policies for NagarVani
-- Run this in Supabase SQL Editor after creating the storage buckets

-- ==================== COMPLAINT IMAGES BUCKET ====================

-- Policy: Anyone can view complaint images (public bucket)
CREATE POLICY "Anyone can view complaint images"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-images');

-- Policy: Authenticated users can upload complaint images
CREATE POLICY "Authenticated users can upload complaint images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own complaint images
CREATE POLICY "Users can update own complaint images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'complaint-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own complaint images
CREATE POLICY "Users can delete own complaint images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'complaint-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==================== PROFILE PICTURES BUCKET ====================

-- Policy: Anyone can view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Policy: Users can upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own profile picture
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==================== ATTACHMENTS BUCKET ====================

-- Policy: Users can view their own attachments
CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload their own attachments
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==================== VERIFICATION ====================

-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Success message
SELECT 'Storage policies created successfully! Users can now upload files.' as status;
