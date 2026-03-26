-- Fix Missing User Profiles
-- This script creates user profiles in the users table for any auth users that don't have one
-- Run this in Supabase SQL Editor

-- First, let's see which auth users are missing profiles
-- (This is just for information, won't insert anything)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'role' as role,
  CASE WHEN u.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Now create missing profiles
-- This will insert a row in users table for each auth user that doesn't have one
INSERT INTO public.users (id, email, name, phone, role, profile_picture)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'citizen'::user_role) as role,
  NULL as profile_picture
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL  -- Only insert if profile doesn't exist
ON CONFLICT (id) DO NOTHING;  -- Skip if somehow already exists

-- Initialize leaderboard entries for all users
INSERT INTO public.leaderboard (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Verify the fix
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles,
  COUNT(*) - COUNT(u.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;

-- Show the result
SELECT 'User profiles created successfully!' as status;
