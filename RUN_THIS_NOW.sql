-- ⚡ RUN THIS SQL NOW - Fixes All Issues
-- Copy and paste this entire file into Supabase SQL Editor and click RUN

-- STEP 1: Create missing user profiles
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

-- STEP 2: Initialize leaderboard entries
INSERT INTO public.leaderboard (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- STEP 3: Fix Officer RLS Policies
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Users can create own officer profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;

CREATE POLICY "Anyone can view officers"
  ON officers FOR SELECT USING (true);

CREATE POLICY "Users can create own officer profile"
  ON officers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Officers can update own profile"
  ON officers FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON officers TO authenticated;

-- STEP 4: Fix Complaint RLS Policies
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can create own complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can view department complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update department complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update all complaints" ON complaints;

CREATE POLICY "Authenticated users can create complaints"
  ON complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Officers can view department complaints"
  ON complaints FOR SELECT TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM officers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Officers can update department complaints"
  ON complaints FOR UPDATE TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM officers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all complaints"
  ON complaints FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all complaints"
  ON complaints FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

GRANT ALL ON complaints TO authenticated;

-- STEP 5: Fix Complaint Updates RLS
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view updates" ON complaint_updates;
DROP POLICY IF EXISTS "Authenticated users can create updates" ON complaint_updates;

CREATE POLICY "Anyone can view updates"
  ON complaint_updates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create updates"
  ON complaint_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = updated_by);

GRANT ALL ON complaint_updates TO authenticated;

-- SUCCESS MESSAGE
SELECT 
  'SUCCESS! All policies applied.' as status,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT o.id) as total_officers,
  COUNT(DISTINCT c.id) as total_complaints
FROM users u
LEFT JOIN officers o ON o.user_id = u.id
LEFT JOIN complaints c ON c.user_id = u.id;
