-- Fix Volunteer System RLS Policies
-- Run this in Supabase SQL Editor

-- STEP 1: Drop ALL existing policies
DROP POLICY IF EXISTS "System can create tasks" ON volunteer_tasks;
DROP POLICY IF EXISTS "System can create notifications" ON volunteer_notifications;
DROP POLICY IF EXISTS "Anyone can create volunteer tasks" ON volunteer_tasks;
DROP POLICY IF EXISTS "Anyone can create volunteer notifications" ON volunteer_notifications;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON volunteer_tasks;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON volunteer_notifications;

-- STEP 2: Temporarily disable RLS for testing
ALTER TABLE volunteer_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_notifications DISABLE ROW LEVEL SECURITY;

-- STEP 3: Allow volunteers to update complaints (for accepting/completing tasks)
DROP POLICY IF EXISTS "Volunteers can update assigned complaints" ON complaints;
CREATE POLICY "Volunteers can update assigned complaints"
    ON complaints FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- STEP 4: Grant all permissions
GRANT ALL ON volunteer_tasks TO anon;
GRANT ALL ON volunteer_tasks TO authenticated;
GRANT ALL ON volunteer_notifications TO anon;
GRANT ALL ON volunteer_notifications TO authenticated;
GRANT ALL ON volunteers TO anon;
GRANT ALL ON volunteers TO authenticated;
GRANT UPDATE ON complaints TO authenticated;

-- Success message
SELECT 'RLS DISABLED for volunteer tables! Volunteers can now accept and complete tasks.' as status;

-- NOTE: After testing, you can re-enable RLS with proper policies:
-- ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE volunteer_notifications ENABLE ROW LEVEL SECURITY;
-- Then add proper policies
