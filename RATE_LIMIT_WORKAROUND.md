# 🚦 Supabase Rate Limit - Workaround Guide

## What Happened?

You've hit Supabase's email rate limit (HTTP 429 error). This is a security feature that prevents:
- Spam signups
- Email bombing
- Abuse of the authentication system

**Typical limit:** 3-5 signup attempts per hour per IP address

## ✅ Solutions (Choose One)

### Solution 1: Wait 1 Hour ⏰
**Best for:** Production-like testing  
**Time:** 60 minutes

The rate limit will automatically reset after about 1 hour. Use this time to:
1. ✅ Run the database setup SQL (see below)
2. ✅ Create storage buckets
3. ✅ Review the app features
4. ✅ Read the documentation

### Solution 2: Use Different Email 📧
**Best for:** Quick testing  
**Time:** Immediate

Try signing up with a different email address:
- Use a different email provider
- Use email aliases (e.g., yourname+test@gmail.com)
- Use a temporary email service

### Solution 3: Adjust Rate Limits (Development Only) ⚙️
**Best for:** Heavy development/testing  
**Time:** 5 minutes

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Rate Limits**
3. Find "Email Signups" rate limit
4. Increase the limit or disable temporarily
5. **Remember to re-enable for production!**

### Solution 4: Use Supabase Dashboard to Create User 👤
**Best for:** Bypassing rate limits  
**Time:** 2 minutes

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Users**
3. Click **"Add User"** or **"Invite User"**
4. Enter email and password manually
5. User is created without triggering rate limit

## 🎯 What To Do Right Now

While waiting for the rate limit to reset, **set up your database**:

### Step 1: Run Database Setup SQL

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy this entire SQL script:**

```sql
-- Copy the contents of supabase_clean_setup.sql
-- (The file is in your project root)
```

4. **Paste and click "Run"**

This creates:
- ✅ All database tables
- ✅ 8 default departments
- ✅ Proper relationships
- ✅ Leaderboard system
- ✅ Notification system

### Step 2: Create Storage Buckets

**Option A: Use the Status Widget**
- Click "Create Buckets" button in the app

**Option B: Manual Creation**
1. Go to **Supabase Dashboard → Storage**
2. Create these 3 buckets:
   - `complaint-images` (make it **public**)
   - `profile-pictures` (make it **public**)
   - `attachments` (make it **private**)

### Step 3: Verify Setup

After running the SQL:
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - users
   - departments (with 8 rows)
   - officers
   - complaints
   - complaint_updates
   - leaderboard
   - notifications

## 🔍 Checking Rate Limit Status

To see when you can try again:
1. Wait 60 minutes from your last signup attempt
2. Try signing up with a test email
3. If you still get 429, wait another 30 minutes

## 💡 Pro Tips

### For Development:
- Use email aliases: `yourname+test1@gmail.com`, `yourname+test2@gmail.com`
- Each alias counts as a different email but goes to the same inbox
- Gmail, Outlook, and most providers support this

### For Production:
- Keep rate limits enabled
- They protect your app from abuse
- Users rarely hit these limits in normal use

## 📊 Current Status

✅ App is working  
✅ Supabase connection active  
✅ Authentication system functional  
⚠️ Rate limit hit (temporary)  
⏰ Can retry in: ~60 minutes  

## 🚀 After Rate Limit Resets

Once you can sign up again:
1. ✅ Create your account
2. ✅ Sign in
3. ✅ File a test complaint
4. ✅ Upload a photo
5. ✅ Check the leaderboard
6. ✅ Test all features

---

**Don't worry!** This is a normal part of development. Use this time to set up the database, and you'll be ready to go when the rate limit resets! 🎉
