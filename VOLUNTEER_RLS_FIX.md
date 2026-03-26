# Volunteer System RLS Fix

## Problem
Getting 403 error when creating volunteer tasks:
```
Failed to load resource: the server responded with a status of 403
Create volunteer task error
```

This happens because the RLS policies are too restrictive for task creation.

## Solution

Run the SQL script `fix_volunteer_rls.sql` in your Supabase SQL Editor.

### Quick Fix Steps:

1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste the contents of `fix_volunteer_rls.sql`
4. Click "Run"
5. You should see: "Volunteer RLS policies fixed!"

### What This Does:

1. **Removes restrictive policies** that prevent task creation
2. **Adds permissive INSERT policies** for volunteer_tasks and volunteer_notifications
3. **Grants proper permissions** to authenticated users
4. **Ensures volunteers table is readable** for matching algorithm

### Alternative: Disable RLS Temporarily (For Testing Only)

If you want to test quickly without running SQL:

```sql
-- TEMPORARY - FOR TESTING ONLY
ALTER TABLE volunteer_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_notifications DISABLE ROW LEVEL SECURITY;
```

**WARNING**: This disables security. Only use for local testing!

### Re-enable RLS After Testing:

```sql
ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_notifications ENABLE ROW LEVEL SECURITY;
```

Then run `fix_volunteer_rls.sql` to add proper policies.

## Testing After Fix:

1. File a new complaint with low or medium priority
2. Check browser console - should see "Created tasks for X volunteers"
3. Go to volunteer dashboard
4. Click refresh button
5. Task should appear in "Available Tasks"

## Verification:

Check if policies are working:

```sql
-- Check volunteer_tasks policies
SELECT * FROM pg_policies WHERE tablename = 'volunteer_tasks';

-- Check volunteer_notifications policies  
SELECT * FROM pg_policies WHERE tablename = 'volunteer_notifications';

-- Test task creation manually
INSERT INTO volunteer_tasks (complaint_id, volunteer_id, status, distance_km)
VALUES (
  (SELECT id FROM complaints LIMIT 1),
  (SELECT id FROM volunteers LIMIT 1),
  'offered',
  5.0
);
```

If the INSERT works, the fix is successful!
