# Fix Officer Profile 409 Error

## Problem
When trying to create an officer profile, you get a 409 (Conflict) error. This is caused by Row Level Security (RLS) policies blocking the insert operation.

## Solution

### Step 1: Run the SQL Fix Script
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix_officer_rls_409.sql`
4. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify the Fix
After running the script, check the output at the bottom. It will show:
- Any existing officer profiles
- Confirmation that policies were created

### Step 3: Try Creating Officer Profile Again
1. Refresh your application (Ctrl+R or F5)
2. Try to set up the officer profile again
3. It should now work without the 409 error

## What the Fix Does

1. **Temporarily disables RLS** to clean up old policies
2. **Removes conflicting policies** that were blocking inserts
3. **Creates new permissive policies**:
   - Anyone authenticated can insert officer profile
   - Officers can view their own profile
   - Officers can update their own profile
   - Admins can do everything
4. **Re-enables RLS** with the new policies
5. **Adds unique constraint** on user_id to prevent duplicates
6. **Shows existing officers** so you can see if profile already exists

## Alternative: Disable RLS Temporarily (Quick Fix)

If you need a quick fix for testing, you can temporarily disable RLS:

```sql
ALTER TABLE officers DISABLE ROW LEVEL SECURITY;
```

**Warning**: This removes security. Only use for testing. Re-enable with:

```sql
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
```

## Check If Officer Profile Already Exists

Run this query to see if your officer profile already exists:

```sql
SELECT * FROM officers WHERE user_id = auth.uid();
```

If it returns a row, your profile already exists and you don't need to create it again.

## Common Causes

1. **RLS policies too restrictive** - Fixed by the script
2. **Profile already exists** - The app now handles this gracefully
3. **Missing user_profiles entry** - The app creates this automatically
4. **Database permissions** - The script grants necessary permissions

## After Fix

The application will:
- Check if officer profile exists before creating
- Return existing profile if found
- Show helpful error messages if RLS blocks the operation
- Automatically create user_profile if missing

## Need More Help?

If the error persists after running the fix:
1. Check browser console for detailed error messages
2. Verify you're logged in as an authenticated user
3. Check if the officers table exists in your database
4. Ensure the departments table has data (officers need a department)
