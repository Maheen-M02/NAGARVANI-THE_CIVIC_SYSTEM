-- Fix Officer Profile Creation 409 Error
-- Run this in Supabase SQL Editor

-- First, check if RLS is causing issues by temporarily disabling it
ALTER TABLE officers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Officers can view their own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update their own profile" ON officers;
DROP POLICY IF EXISTS "Officers can insert their own profile" ON officers;
DROP POLICY IF EXISTS "Admins can view all officers" ON officers;
DROP POLICY IF EXISTS "Users can create officer profile" ON officers;
DROP POLICY IF EXISTS "Officers can create their profile" ON officers;

-- Create new permissive policies
CREATE POLICY "Anyone can insert officer profile"
ON officers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Officers can view their own profile"
ON officers FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR auth.uid() IN (
  SELECT user_id FROM officers WHERE is_active = true
));

CREATE POLICY "Officers can update their own profile"
ON officers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can do everything"
ON officers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Re-enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON officers TO authenticated;
GRANT ALL ON officers TO anon;

-- Ensure the table has the correct structure
ALTER TABLE officers 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN department_id SET NOT NULL;

-- Add unique constraint if not exists (this might be causing the 409)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'officers_user_id_key'
  ) THEN
    ALTER TABLE officers ADD CONSTRAINT officers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Check for existing officer profiles and show them
SELECT 
  id,
  user_id,
  department_id,
  badge_number,
  is_active,
  created_at
FROM officers
ORDER BY created_at DESC;
