-- Fix RLS Policies for NagarVani
-- Run this in Supabase SQL Editor if you're getting permission errors

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update complaints" ON complaints;
DROP POLICY IF EXISTS "Users can create complaint updates" ON complaint_updates;
DROP POLICY IF EXISTS "Users can view complaint updates" ON complaint_updates;
DROP POLICY IF EXISTS "Users can view own leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Users can update own leaderboard" ON leaderboard;

-- USERS TABLE POLICIES
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- DEPARTMENTS TABLE POLICIES (Public read)
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  USING (true);

-- OFFICERS TABLE POLICIES (Public read)
CREATE POLICY "Anyone can view officers"
  ON officers FOR SELECT
  USING (true);

-- COMPLAINTS TABLE POLICIES
CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Officers and admins can view all complaints"
  ON complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

CREATE POLICY "Officers and admins can update complaints"
  ON complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

-- COMPLAINT UPDATES TABLE POLICIES
CREATE POLICY "Users can create complaint updates"
  ON complaint_updates FOR INSERT
  WITH CHECK (
    auth.uid() = updated_by
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

CREATE POLICY "Users can view complaint updates for their complaints"
  ON complaint_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_updates.complaint_id
      AND complaints.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

-- LEADERBOARD TABLE POLICIES
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can update own leaderboard"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert leaderboard entries"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
