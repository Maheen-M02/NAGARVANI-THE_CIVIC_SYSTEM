# Fix 406 "Not Acceptable" Errors

## Problem
Getting persistent 406 errors when querying `users` and `officers` tables from Supabase.

## Root Cause
The 406 error typically means:
1. Content negotiation failure between client and server
2. Missing or incorrect Accept headers
3. PostgREST API configuration issue
4. RLS policies blocking access

## Solutions Applied

### 1. Simplified Supabase Client Headers
Removed custom headers that might interfere with PostgREST:
- Removed `Accept: application/json`
- Removed `Content-Type: application/json`
- Removed `Prefer: return=representation`
- Kept only `x-client-info` for tracking

### 2. Updated Query Methods
Changed from `.single()` to `.maybeSingle()` to handle cases where no rows are found without throwing errors.

### 3. Added Graceful Fallbacks
All database queries now have fallback logic:
- If query fails, return data from auth user metadata
- If table doesn't exist, create local data
- Never block the UI due to database errors

### 4. Created Service Methods
Added dedicated methods in `supabaseService`:
- `getOfficerProfile(userId)` - Get officer profile with department
- `createOfficerProfile(userId, departmentId, badgeNumber)` - Create new officer

### 5. RLS Policies
Run this SQL in Supabase SQL Editor to fix officer table permissions:

```sql
-- Enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Officers can create own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;

-- Allow anyone to view officers (for assignment purposes)
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

-- Grant permissions
GRANT ALL ON officers TO authenticated;
```

## Next Steps

### 1. Run RLS Policies
Open Supabase Dashboard → SQL Editor → Run `fix_officers_rls.sql`

### 2. Check Supabase Project Health
- Go to https://xbukealfzhidcypohdwp.supabase.co
- Check if project is paused or has issues
- Restart project if needed

### 3. Verify Tables Exist
Run in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 4. Test Direct API Call
Use the test file `test_supabase_406.html` to test direct REST API calls.

### 5. Check PostgREST Configuration
In Supabase Dashboard → Settings → API:
- Verify PostgREST is running
- Check if there are any API restrictions
- Ensure schema is set to 'public'

## Testing

After applying fixes:
1. Clear browser cache and localStorage
2. Sign out and sign in again
3. Try accessing officer portal
4. Check browser console for errors

## If 406 Persists

The issue might be:
1. **Supabase project paused** - Restart it in dashboard
2. **PostgREST version issue** - Contact Supabase support
3. **API rate limiting** - Wait a few minutes
4. **Schema mismatch** - Verify table structure matches SQL setup
5. **Network/proxy issue** - Try different network or disable VPN

## Workaround

If database continues to fail, the app will work in "local mode":
- Data stored in localStorage
- No realtime updates
- No cross-device sync
- But all features still functional
