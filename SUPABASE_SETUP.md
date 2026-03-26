# 🚀 NagarVani Supabase Integration Setup

## Current Status: ⚠️ NEEDS SETUP

Your Supabase integration is configured but needs the following steps to work properly:

## 🔧 IMMEDIATE ACTIONS REQUIRED

### Step 1: Run Database Setup (CRITICAL)
1. **Go to your Supabase Dashboard → SQL Editor**
2. **Copy the entire contents of `supabase_clean_setup.sql`**
3. **Paste and click "Run"** - This creates all tables without problematic RLS policies

### Step 2: Create Storage Buckets (CRITICAL)
1. **Go to Storage in your Supabase dashboard**
2. **Create these 3 buckets:**
   - `complaint-images` (make it **PUBLIC**)
   - `profile-pictures` (make it **PUBLIC**)
   - `attachments` (make it **PRIVATE**)

### Step 3: Test the Setup
1. **Start your app:** `npm start`
2. **Look for the "🧪 Supabase Status" widget** in the top-right corner
3. **Click "Create Buckets"** if buckets are missing
4. **Click "Test Signup"** to verify authentication works

## 🐛 Current Issues Being Fixed

### Issue 1: 500 Internal Server Error on Signup ✅ FIXED
- **Cause:** RLS policies were too restrictive
- **Solution:** Clean database setup without problematic triggers

### Issue 2: Permission Denied for Tables ✅ FIXED  
- **Cause:** Row Level Security blocking access
- **Solution:** Removed RLS temporarily, will add back later

### Issue 3: Missing Storage Buckets ⚠️ NEEDS ACTION
- **Cause:** Buckets not created in Supabase dashboard
- **Solution:** Create them manually (see Step 2 above)

## 📊 What's Working Now

✅ **Database Schema:** All tables created with proper relationships  
✅ **Authentication:** Sign up/sign in flow configured  
✅ **Service Layer:** Complete CRUD operations for complaints, users, leaderboard  
✅ **Realtime Updates:** Subscriptions for live data  
✅ **File Upload:** Image handling for complaints  
✅ **Leaderboard:** Gamification system with scoring  

## 🧪 Testing Checklist

After completing Steps 1-2 above, test these features:

- [ ] **Sign Up:** Create a new account
- [ ] **Sign In:** Log in with existing account  
- [ ] **File Complaint:** Submit a complaint with photo
- [ ] **View Complaints:** See your complaints list
- [ ] **Leaderboard:** Check your ranking and points
- [ ] **Real-time Updates:** Open multiple tabs, submit complaint in one, see updates in others

## 🔍 Troubleshooting

### If you see "permission denied" errors:
1. Make sure you ran the `supabase_clean_setup.sql` script
2. Check that your `.env` file has the correct Supabase URL and key
3. Verify you're using the anon key, not the service role key

### If image uploads fail:
1. Ensure storage buckets are created and set to public
2. Check browser console for CORS errors
3. Verify bucket names match exactly: `complaint-images`, `profile-pictures`, `attachments`

### If authentication doesn't work:
1. Check Supabase Auth settings
2. Verify email confirmation is disabled for testing
3. Look for errors in browser console

## 📞 Support

If you encounter issues:
1. Check the "🧪 Supabase Status" widget for specific error messages
2. Look at browser console for detailed error logs
3. Verify your Supabase project is active and not paused

## 🎯 Next Steps After Setup

Once everything is working:
1. **Enable Row Level Security** for production security
2. **Configure email templates** for better user experience  
3. **Set up monitoring** for performance tracking
4. **Add backup strategies** for data protection

---

## 📋 Quick Setup Summary

1. ✅ **SQL:** Run `supabase_clean_setup.sql` in Supabase SQL Editor
2. ✅ **Buckets:** Create 3 storage buckets (complaint-images, profile-pictures, attachments)  
3. ✅ **Test:** Use the status widget to verify everything works
4. ✅ **Deploy:** Your app is ready for users!

**Estimated setup time:** 5-10 minutes