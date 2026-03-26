# Authentication Troubleshooting Guide

## Quick Test Steps

### Step 1: Test Direct Connection
1. Open `test_auth_direct.html` in your browser
2. Check if it shows "✅ Connected"
3. Try the sign-up and sign-in buttons
4. Check the console for detailed error messages

### Step 2: Check Supabase Dashboard Settings

Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp

#### A. Check Authentication Settings
1. Go to **Authentication** → **Settings**
2. Check these settings:

**Email Auth:**
- ✅ Enable email provider: Should be ON
- ⚠️ Confirm email: Should be OFF for testing (or you need to confirm emails)
- ⚠️ Enable email confirmations: Should be OFF for testing

**Site URL:**
- Should be: `http://localhost:3000`

**Redirect URLs:**
- Should include: `http://localhost:3000/**`

#### B. Disable Email Confirmation (Recommended for Development)
1. Go to **Authentication** → **Settings** → **Email Auth**
2. Find "Confirm email" toggle
3. Turn it **OFF** for development
4. Click **Save**

This allows users to sign in immediately without email confirmation.

### Step 3: Create Test User Manually

If sign-up is not working, create a user manually:

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - Email: `test@example.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ YES (check this!)
4. Click **Create user**

Now try signing in with these credentials in your app.

### Step 4: Check for Rate Limiting

If you see "rate limit exceeded":

1. Go to **Authentication** → **Rate Limits**
2. Check if you've hit the limit
3. Either:
   - Wait 1 hour for reset
   - Increase the limit (paid plans)
   - Create users manually in dashboard

## Common Issues & Solutions

### Issue 1: "Invalid login credentials"

**Possible Causes:**
- User doesn't exist in database
- Wrong password
- Email not confirmed (if confirmation is enabled)

**Solutions:**
1. Check if user exists in Supabase Dashboard → Authentication → Users
2. If not, create user manually (see Step 3 above)
3. Make sure "Auto Confirm User" is checked when creating
4. Or disable email confirmation in settings

### Issue 2: "Email rate limit exceeded"

**Cause:** Too many sign-up attempts

**Solutions:**
1. Wait 1 hour for rate limit to reset
2. Create users manually in Supabase Dashboard
3. Disable email confirmation to reduce email sends

### Issue 3: Sign-up succeeds but sign-in fails

**Cause:** Email confirmation is enabled but email not confirmed

**Solutions:**
1. Check your email for confirmation link
2. Or disable email confirmation in Supabase settings
3. Or manually confirm user in dashboard

### Issue 4: "this.lock is not a function"

**Cause:** Browser cache or multiple Supabase instances

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear localStorage: Open DevTools → Application → Local Storage → Delete all
3. Restart dev server
4. Run `clear_cache.bat`

### Issue 5: Nothing happens when clicking sign-in

**Possible Causes:**
- JavaScript error in console
- Network request blocked
- Supabase credentials wrong

**Solutions:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify .env file has correct credentials

## Testing Checklist

Run through this checklist:

### Supabase Dashboard
- [ ] Email auth is enabled
- [ ] Email confirmation is DISABLED (for testing)
- [ ] Site URL is `http://localhost:3000`
- [ ] At least one test user exists
- [ ] Test user is confirmed (green checkmark)

### Local Environment
- [ ] `.env` file exists with correct credentials
- [ ] Dev server is running (`npm start`)
- [ ] No console errors in browser
- [ ] `test_auth_direct.html` shows "✅ Connected"

### Browser
- [ ] Clear cache and localStorage
- [ ] Try in incognito/private mode
- [ ] Check Network tab for 401/403 errors

## Debug Commands

### Check if Supabase is reachable
Open browser console and run:
```javascript
fetch('https://xbukealfzhidcypohdwp.supabase.co/auth/v1/health')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{}`

### Check current session
```javascript
const { createClient } = window.supabase;
const supabase = createClient(
  'https://xbukealfzhidcypohdwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidWtlYWxmemhpZGN5cG9oZHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDk4NDgsImV4cCI6MjA4OTgyNTg0OH0.Dp4CtfokPATur1PJmQmOz0Ix7a1EOqoE1LSzrp6M6qQ'
);
supabase.auth.getSession().then(console.log);
```

## What to Check in Browser Console

When you try to sign in, look for:

1. **Network Requests:**
   - POST to `/auth/v1/token?grant_type=password`
   - Status should be 200 (success) or 400 (bad credentials)

2. **Console Errors:**
   - Red error messages
   - "Invalid login credentials"
   - "Rate limit exceeded"
   - "Email not confirmed"

3. **Response Data:**
   - Check Network tab → Response
   - Look for error messages

## Next Steps

1. **First**: Open `test_auth_direct.html` and see what error you get
2. **Second**: Check Supabase Dashboard settings (especially email confirmation)
3. **Third**: Create a test user manually in dashboard
4. **Fourth**: Try signing in with the manual user

## Report Back

Please tell me:
1. What happens when you open `test_auth_direct.html`?
2. What error message do you see in the browser console?
3. Is email confirmation enabled in your Supabase project?
4. Do you have any users in Authentication → Users?

This will help me identify the exact issue!
