# Complete Setup - Run These SQL Scripts

You need to run 3 SQL scripts in Supabase to make everything work:

## Step 1: Create Missing User Profiles
**File:** `fix_missing_user_profiles.sql`
**Link:** https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new

```sql
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
```

## Step 2: Fix Officer RLS Policies
**File:** `fix_officers_rls.sql`

```sql
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
```

## Step 3: Fix Complaint RLS Policies
**File:** `fix_complaints_rls.sql`

```sql
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can create own complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can view department complaints" ON complaints;
DROP POLICY IF EXISTS "Officers can update department complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON complaints;

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

GRANT ALL ON complaints TO authenticated;
```

## After Running SQL

1. Clear browser cache (Ctrl+Shift+Delete)
2. Sign out completely
3. Sign in again
4. Test the flows:
   - Citizen files complaint → Gets ticket ID
   - Officer sees complaint in dashboard
   - Officer can update complaint status

## What Each Script Does

### Script 1: User Profiles
- Creates user profiles in `public.users` for all auth users
- Fixes foreign key constraint errors
- Required for officer profile creation

### Script 2: Officer Policies
- Allows officers to create their own profile
- Allows officers to update their own profile
- Allows anyone to view officers (for assignment)

### Script 3: Complaint Policies
- Allows citizens to create complaints
- Allows citizens to view their own complaints
- Allows officers to view complaints from their department
- Allows officers to update complaints from their department
- Allows admins to view/update all complaints

## Verification

After running all scripts, verify with:

```sql
-- Check user profiles exist
SELECT COUNT(*) FROM public.users;

-- Check officer profiles
SELECT o.*, u.name, d.name as dept_name
FROM officers o
JOIN users u ON o.user_id = u.id
JOIN departments d ON o.department_id = d.id;

-- Check complaints
SELECT c.ticket_id, c.title, d.name as dept_name, c.status
FROM complaints c
JOIN departments d ON c.department_id = d.id
ORDER BY c.created_at DESC
LIMIT 10;
```

## Troubleshooting

If officer still can't see complaints:
1. Check console logs for "Loading complaints for department"
2. Verify officer's department_id matches complaint's department_id
3. Check RLS policies are applied: `SELECT * FROM pg_policies WHERE tablename = 'complaints';`
4. Try signing out and in again
