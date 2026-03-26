# 👤 How to Create User Manually in Supabase

## Why Do This?

If you're getting "Invalid login credentials" even with correct credentials, it means:
- The user account was never created (due to rate limit)
- OR the user needs email confirmation

Creating the user manually in Supabase Dashboard bypasses these issues.

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your Supabase account
3. Select your NagarVani project

### Step 2: Navigate to Users
1. In the left sidebar, click **"Authentication"**
2. Click **"Users"** tab
3. You'll see a list of all users (probably empty right now)

### Step 3: Add New User
1. Click the **"Add User"** button (top right)
2. A form will appear with these fields:

   **Fill in:**
   - **Email:** Your email address
   - **Password:** Your password (minimum 6 characters)
   - **Auto Confirm User:** ✅ **CHECK THIS BOX** (very important!)
   - **User Metadata (optional):** You can add:
     ```json
     {
       "name": "Your Name",
       "phone": "Your Phone",
       "role": "citizen"
     }
     ```

3. Click **"Create User"**

### Step 4: Verify User Created
1. You should see your email in the users list
2. Status should show as "Confirmed" (green checkmark)
3. Note the User ID (UUID) - you'll need this

### Step 5: Create User Profile in Database

After creating the auth user, you need to create their profile in the database:

1. Go to **SQL Editor** in Supabase
2. Run this SQL (replace the values):

```sql
-- Replace these values with your actual data
INSERT INTO users (id, email, name, phone, role)
VALUES (
  'YOUR-USER-ID-FROM-STEP-4',  -- The UUID from the users list
  'your-email@example.com',     -- Your email
  'Your Name',                   -- Your name
  '1234567890',                  -- Your phone (optional)
  'citizen'                      -- Role: citizen, officer, or admin
);

-- Initialize leaderboard entry
INSERT INTO leaderboard (user_id)
VALUES ('YOUR-USER-ID-FROM-STEP-4');
```

### Step 6: Sign In to App
1. Go back to your NagarVani app
2. Click "Sign In"
3. Enter your email and password
4. You should now be signed in successfully! 🎉

## 🔍 Troubleshooting

### "User already exists" error
- The user was created but not confirmed
- Go to Authentication → Users
- Find your email and click "Confirm User"

### "Invalid login credentials" still appearing
- Double-check the email and password
- Make sure "Auto Confirm User" was checked
- Try resetting the password in Supabase Dashboard

### Can't find the user in the list
- The signup failed completely
- Create a new user with a different email
- OR wait for rate limit to reset

## 💡 Pro Tips

### For Testing Multiple Users:
Create several test users at once:
```sql
-- User 1: Citizen
INSERT INTO users (id, email, name, role) VALUES 
('uuid-1', 'citizen@test.com', 'Test Citizen', 'citizen');

-- User 2: Officer  
INSERT INTO users (id, email, name, role) VALUES 
('uuid-2', 'officer@test.com', 'Test Officer', 'officer');

-- User 3: Admin
INSERT INTO users (id, email, name, role) VALUES 
('uuid-3', 'admin@test.com', 'Test Admin', 'admin');
```

### Email Confirmation Settings:
To disable email confirmation entirely (development only):
1. Go to **Authentication → Settings**
2. Find "Enable email confirmations"
3. Toggle it OFF
4. Now signups work without email verification

## ✅ Success Checklist

After following these steps, you should have:
- ✅ User created in Authentication → Users
- ✅ User status shows "Confirmed"
- ✅ User profile created in `users` table
- ✅ Leaderboard entry initialized
- ✅ Able to sign in to the app

---

**You're all set!** Once you can sign in, you can start filing complaints, earning points, and using all the features of NagarVani! 🚀
