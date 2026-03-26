# Immediate Fix for 406 Errors - Action Required

## What We Fixed

### 1. ✅ Simplified Supabase Client Configuration
**File:** `src/config/supabase.js`
- Removed problematic headers that were causing content negotiation issues
- Now using minimal headers for better compatibility

### 2. ✅ Updated Database Service Methods
**File:** `src/services/supabaseService.js`
- Changed `.single()` to `.maybeSingle()` to handle empty results gracefully
- Added `getOfficerProfile(userId)` method
- Added `createOfficerProfile(userId, departmentId, badgeNumber)` method
- All queries now have fallback logic to prevent UI blocking

### 3. ✅ Updated Officer Dashboard
**File:** `src/pages/OfficerDashboard.js`
- Now uses `supabaseService.getOfficerProfile()` instead of direct Supabase calls
- Better error handling and loading states

### 4. ✅ Updated Officer Setup Component
**File:** `src/components/OfficerSetup.js`
- Now uses `supabaseService.createOfficerProfile()` instead of direct Supabase calls
- Cleaner error handling

## What You Need to Do NOW

### Step 1: Run RLS Policies (CRITICAL)
Open your Supabase Dashboard and run this SQL:

1. Go to: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new
2. Copy and paste the contents of `fix_officers_rls.sql`
3. Click "Run" button

This will fix the permissions on the officers table.

### Step 2: Test the Diagnostic Tool
1. Open `test_supabase_406.html` in your browser
2. Run all 6 tests in order
3. Take note of which tests pass and which fail
4. This will tell us exactly what's wrong

### Step 3: Check Supabase Project Status
1. Go to: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp
2. Check if the project shows any warnings or is paused
3. If paused, click "Resume Project"

### Step 4: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Ctrl+Shift+Delete to clear all cache

### Step 5: Test the Application
1. Sign out completely
2. Sign in as an officer
3. Try to complete the officer setup
4. Check browser console for any remaining errors

## Expected Behavior After Fix

### Officer First Login:
1. Officer signs in for the first time
2. Sees "Officer Profile Setup" modal
3. Selects department and enters badge number
4. Clicks "Complete Setup"
5. Profile is created successfully
6. Dashboard loads showing only complaints from their department

### Officer Subsequent Logins:
1. Officer signs in
2. System checks for existing officer profile
3. Finds profile and loads dashboard directly
4. Shows complaints filtered by their department

## If 406 Errors Persist

The issue is likely one of these:

### A. Supabase Project Paused
- **Solution:** Resume project in dashboard
- **How to check:** Dashboard shows "Paused" status

### B. PostgREST Configuration Issue
- **Solution:** Contact Supabase support
- **How to check:** All API calls return 406

### C. RLS Policies Not Applied
- **Solution:** Re-run the SQL from `fix_officers_rls.sql`
- **How to check:** Test 4 in diagnostic tool fails with 403

### D. Table Structure Mismatch
- **Solution:** Re-run `supabase_clean_setup.sql`
- **How to check:** Test 2 in diagnostic tool shows missing tables

### E. Network/Proxy Issue
- **Solution:** Try different network or disable VPN
- **How to check:** Test 1 in diagnostic tool fails

## Fallback Mode

If database continues to fail, the app will automatically work in "local mode":
- ✅ All features still work
- ✅ Data stored in browser localStorage
- ❌ No realtime updates
- ❌ No cross-device sync
- ❌ Data lost if cache cleared

## Files Changed

1. `src/config/supabase.js` - Simplified headers
2. `src/services/supabaseService.js` - Added officer methods, better error handling
3. `src/pages/OfficerDashboard.js` - Uses service methods
4. `src/components/OfficerSetup.js` - Uses service methods
5. `fix_officers_rls.sql` - RLS policies (needs to be run)
6. `test_supabase_406.html` - Diagnostic tool (open in browser)
7. `FIX_406_ERRORS.md` - Detailed troubleshooting guide

## Next Steps

1. ✅ Code changes are complete
2. ⏳ Run RLS policies SQL (you need to do this)
3. ⏳ Test with diagnostic tool
4. ⏳ Test officer signup flow
5. ⏳ Verify complaints routing works

## Contact Points

If you're still stuck after trying everything:
1. Check Supabase status page: https://status.supabase.com/
2. Check Supabase Discord: https://discord.supabase.com/
3. Review Supabase logs in dashboard under "Logs" section
