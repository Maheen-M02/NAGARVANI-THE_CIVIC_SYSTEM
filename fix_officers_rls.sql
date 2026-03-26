-- Fix RLS Policies for Officers Table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Officers can create own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;

-- Allow anyone to view officers (for assignment purposes)
CREATE POLICY "Anyone can view officers"
  ON officers FOR SELECT
  USING (true);

-- Allow users to create their own officer profile
CREATE POLICY "Users can create own officer profile"
  ON officers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow officers to update their own profile
CREATE POLICY "Officers can update own profile"
  ON officers FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON officers TO authenticated;
