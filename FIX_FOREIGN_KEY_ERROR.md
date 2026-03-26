# Fix Foreign Key Constraint Error

## Problem
Getting error: `insert or update on table "officers" violates foreign key constraint "officers_user_id_fkey"`

This means the user doesn't exist in the `users` table when trying to create an officer profile.

## Root Cause
When users sign up/sign in, their profile isn't being created in the `users` table. The auth user exists in `auth.users` but not in `public.users`.

## Solution

### STEP 1: Create Missing User Profiles (CRITICAL)

Run this SQL in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new
2. Copy and paste this SQL:

```sql
-- Create user profiles for all auth users that don't have one
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
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Initialize leaderboard entries
INSERT INTO public.leaderboard (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;
```

3. Click "Run"
4. Should see "Success" with a count of users

### STEP 2: Run Officer RLS Policies

If you haven't already, run this SQL:

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

### STEP 3: Clear Cache and Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Sign out completely
3. Sign in again
4. Try officer setup again
5. Should work now!

## What We Fixed in Code

### 1. Updated signIn() Method
Now creates user profile automatically on sign-in:

```javascript
async signIn(email, password) {
  // ... sign in logic ...
  
  // Ensure user profile exists
  await this.createUserProfile(data.user.id, {
    email: data.user.email,
    name: data.user.user_metadata?.name,
    phone: data.user.user_metadata?.phone,
    role: data.user.user_metadata?.role
  });
  
  return { success: true, user: data.user };
}
```

### 2. Improved createUserProfile() Method
Now checks if profile exists before inserting:

```javascript
async createUserProfile(userId, userData) {
  // Check if exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    return existing; // Already exists
  }

  // Create new profile
  const { data, error } = await supabase
    .from('users')
    .insert([{ id: userId, ...userData }])
    .select()
    .single();

  return data;
}
```

## Why This Happened

The issue occurred because:
1. Users were created in `auth.users` (Supabase Auth)
2. But profiles weren't created in `public.users` (our app table)
3. Officers table has foreign key to `public.users`
4. Foreign key constraint prevented officer creation

## Prevention

Going forward, this won't happen because:
1. ✅ signIn() now creates user profile automatically
2. ✅ createUserProfile() checks for existing profiles
3. ✅ Error handling prevents duplicate key errors
4. ✅ Fallback logic ensures app continues working

## Testing

After running the SQL:

### Test 1: Check User Profiles Exist
```sql
SELECT COUNT(*) FROM public.users;
-- Should match number of auth users
```

### Test 2: Try Officer Setup
1. Sign in as officer
2. Should see setup modal
3. Select department
4. Enter badge number
5. Click "Complete Setup"
6. Should succeed without foreign key error

### Test 3: Verify Officer Created
```sql
SELECT o.*, u.name, d.name as dept_name
FROM officers o
JOIN users u ON o.user_id = u.id
JOIN departments d ON o.department_id = d.id;
```

## If Error Persists

### Check 1: Verify User Exists
```sql
SELECT * FROM public.users WHERE id = 'YOUR_USER_ID';
```

If no rows returned, the user profile is missing. Run Step 1 SQL again.

### Check 2: Check Auth User
```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'YOUR_EMAIL';
```

Should show the auth user exists.

### Check 3: Manual Profile Creation
If automated script doesn't work, create manually:

```sql
INSERT INTO public.users (id, email, name, role)
VALUES (
  'YOUR_USER_ID',
  'YOUR_EMAIL',
  'YOUR_NAME',
  'officer'
);
```

## Files Changed

1. `src/services/supabaseService.js` - Updated signIn() and createUserProfile()
2. `fix_missing_user_profiles.sql` - SQL to create missing profiles
3. `FIX_FOREIGN_KEY_ERROR.md` - This guide

## Summary

The foreign key error is fixed by:
1. ✅ Running SQL to create missing user profiles
2. ✅ Code now creates profiles automatically on sign-in
3. ✅ Better error handling prevents future issues

Run the SQL from Step 1, clear cache, and try again!
