# 🚨 RUN THIS SQL IN SUPABASE NOW 🚨

## Quick Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new

2. **Copy the SQL below and paste it into the editor**

3. **Click the "Run" button**

4. **You should see "Success. No rows returned"**

---

## SQL to Run:

```sql
-- Fix RLS Policies for Officers Table
-- This allows officers to create and manage their profiles

-- Enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Officers can create own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;
DROP POLICY IF EXISTS "Users can create own officer profile" ON officers;

-- Allow anyone to view officers (needed for complaint assignment)
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

-- Grant permissions to authenticated users
GRANT ALL ON officers TO authenticated;
```

---

## What This Does:

✅ Enables Row Level Security on the officers table
✅ Allows anyone to VIEW officer profiles (needed for assignment)
✅ Allows users to CREATE their own officer profile
✅ Allows officers to UPDATE their own profile
✅ Grants necessary permissions to authenticated users

## After Running:

1. Close the SQL editor
2. Go back to your app
3. Clear browser cache (Ctrl+Shift+Delete)
4. Sign in as an officer
5. You should now see the "Officer Profile Setup" modal
6. Complete the setup
7. Dashboard should load successfully!

## If It Still Doesn't Work:

1. Open `test_supabase_406.html` in your browser
2. Run all the diagnostic tests
3. Check which tests fail
4. Look at the error messages
5. Follow the troubleshooting guide in `FIX_406_ERRORS.md`

## Need Help?

Check these files:
- `IMMEDIATE_FIX.md` - Quick troubleshooting
- `FIX_406_ERRORS.md` - Detailed error guide
- `CURRENT_STATUS.md` - Overall project status
