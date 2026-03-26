-- Fix RLS Policies for Complaints Table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can create own complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can view department complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update department complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Anyone can create complaints" ON complaints;

-- Allow authenticated users to create complaints
CREATE POLICY "Authenticated users can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own complaints
CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow officers to view complaints in their department
CREATE POLICY "Officers can view department complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id 
      FROM officers 
      WHERE user_id = auth.uid()
    )
  );

-- Allow officers to update complaints in their department
CREATE POLICY "Officers can update department complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id 
      FROM officers 
      WHERE user_id = auth.uid()
    )
  );

-- Allow admins to view all complaints
CREATE POLICY "Admins can view all complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update all complaints
CREATE POLICY "Admins can update all complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON complaints TO authenticated;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'complaints';
