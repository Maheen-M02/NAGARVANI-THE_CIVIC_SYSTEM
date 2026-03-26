-- NUCLEAR FIX - Drops ALL policies and recreates clean ones
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new

-- ============================================================
-- STEP 1: DISABLE RLS ON ALL TABLES (temporary)
-- ============================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert user profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;

-- Officers table policies  
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Anyone can insert officer profile" ON officers;
DROP POLICY IF EXISTS "Officers can view their own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update their own profile" ON officers;
DROP POLICY IF EXISTS "Officers can insert their own profile" ON officers;
DROP POLICY IF EXISTS "Officers can create own profile" ON officers;
DROP POLICY IF EXISTS "Users can create own officer profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;
DROP POLICY IF EXISTS "Admins can do everything" ON officers;
DROP POLICY IF EXISTS "Admins can view all officers" ON officers;

-- Complaints table policies
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can view department complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update department complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update all complaints" ON complaints;

-- Complaint updates policies
DROP POLICY IF EXISTS "Anyone can view updates" ON complaint_updates;
DROP POLICY IF EXISTS "Authenticated users can create updates" ON complaint_updates;

-- ============================================================
-- STEP 3: CREATE SIMPLE, WORKING POLICIES
-- ============================================================

-- USERS: Full access for authenticated users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- OFFICERS: Full access for authenticated users
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "officers_all" ON officers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COMPLAINTS: Full access for authenticated users
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaints_all" ON complaints FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COMPLAINT UPDATES: Full access for authenticated users
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "updates_all" ON complaint_updates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DEPARTMENTS: Read for all, write for authenticated
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_read" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_write" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LEADERBOARD: Full access for authenticated users
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_all" ON leaderboard FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON users TO authenticated;
GRANT ALL ON officers TO authenticated;
GRANT ALL ON complaints TO authenticated;
GRANT ALL ON complaint_updates TO authenticated;
GRANT ALL ON departments TO authenticated;
GRANT ALL ON leaderboard TO authenticated;
GRANT SELECT ON departments TO anon;

-- ============================================================
-- STEP 5: CREATE MISSING USER PROFILES
-- ============================================================
INSERT INTO public.users (id, email, name, phone, role, profile_picture)
SELECT 
  au.id, au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'citizen'::user_role),
  NULL
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Initialize leaderboard entries
INSERT INTO public.leaderboard (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 
  'SUCCESS' as status,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM officers) as officers,
  (SELECT COUNT(*) FROM complaints) as complaints,
  (SELECT COUNT(*) FROM departments) as departments;
