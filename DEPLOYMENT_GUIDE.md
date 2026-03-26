# NagarVani - Complete Deployment Guide

This guide takes you from zero to a fully deployed NagarVani app with:
- React frontend on **Vercel**
- CLIP AI server on **Railway**
- Database on **Supabase** (already set up)

---

## Prerequisites

Before starting, install these on your machine:
- [Git](https://git-scm.com/downloads)
- [Node.js 18+](https://nodejs.org)
- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com) (free)
- [Railway account](https://railway.app) (free)

---

## PHASE 1: Push to GitHub

### Step 1.1 — Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `nagarvani`
3. Set to **Private** (recommended — your .env has credentials)
4. Do NOT initialize with README (your project already has files)
5. Click **Create repository**

### Step 1.2 — Initialize Git and Push

Open a terminal in your NagarVani project folder and run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit - NagarVani civic complaint platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nagarvani.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

> If git asks for credentials, use your GitHub username and a Personal Access Token (not your password).
> Create a token at: https://github.com/settings/tokens → Generate new token → check `repo` scope

### Step 1.3 — Verify

Go to `https://github.com/YOUR_USERNAME/nagarvani` and confirm all files are there.

---

## PHASE 2: Deploy CLIP AI Server (Free Options)

Railway trial ended? No problem. Use one of these free alternatives:

---

### OPTION A: Hugging Face Spaces (RECOMMENDED - 100% Free Forever)

Hugging Face is purpose-built for ML models like CLIP. Free, no credit card, no time limits.

#### Step 2A.1 — Create Hugging Face Account
1. Go to https://huggingface.co/join
2. Sign up with email or GitHub

#### Step 2A.2 — Create a New Space
1. Go to https://huggingface.co/new-space
2. Fill in:
   - **Space name:** `nagarvani-clip`
   - **License:** MIT
   - **SDK:** Docker
   - **Visibility:** Public
3. Click **Create Space**

#### Step 2A.3 — Upload the CLIP Server Files

You need to upload 3 files from the `hf_space/` folder in your project:

**File 1: README.md**
```
---
title: NagarVani CLIP API
emoji: 🏙️
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---
```

**File 2: requirements.txt**
```
fastapi
uvicorn
transformers
torch
torchvision
Pillow
python-multipart
```

**File 3: Dockerfile**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

**File 4: app.py** — copy the contents of `hf_space/app.py` from your project

To upload:
1. In your Space, click **Files** tab
2. Click **Add file** → **Upload files**
3. Upload all 4 files
4. Click **Commit changes**

#### Step 2A.4 — Wait for Build
1. Click the **App** tab
2. Watch the build logs (5-10 minutes first time)
3. When done, you'll see: `{"status": "running", "model_loaded": true}`

#### Step 2A.5 — Get Your API URL

Your CLIP API URL will be:
```
https://YOUR-USERNAME-nagarvani-clip.hf.space
```

Test it:
```
https://YOUR-USERNAME-nagarvani-clip.hf.space/health
```

---

### OPTION B: Render (Free Tier)

#### Step 2B.1 — Sign Up
1. Go to https://render.com
2. Sign up with GitHub

#### Step 2B.2 — Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repo `nagarvani`
3. Configure:
   - **Name:** nagarvani-clip
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn clip_server:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Click **Create Web Service**

#### Step 2B.3 — Get Your URL
After deploy, your URL will be:
```
https://nagarvani-clip.onrender.com
```

> Note: Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

### OPTION C: Google Colab (Temporary - for demos only)

If you just need it running for a demo:

1. Open https://colab.research.google.com
2. Create new notebook
3. Run this cell:
```python
!pip install fastapi uvicorn transformers torch pillow python-multipart pyngrok -q

# Upload your clip_server.py file, then:
from pyngrok import ngrok
import subprocess, threading

def run():
    subprocess.run(["uvicorn", "clip_server:app", "--host", "0.0.0.0", "--port", "8000"])

threading.Thread(target=run, daemon=True).start()

import time; time.sleep(3)
tunnel = ngrok.connect(8000)
print("CLIP API URL:", tunnel.public_url)
```
4. Copy the ngrok URL and use it as `REACT_APP_CLIP_API_URL`

> This only works while the Colab tab is open.

---

### Which Option to Choose?

| Option | Cost | Uptime | Speed | Best For |
|---|---|---|---|---|
| Hugging Face Spaces | Free forever | 24/7 | Fast | Production |
| Render | Free (sleeps) | Sleeps | Slow cold start | Testing |
| Google Colab | Free | Session only | Fast | Demo only |

**Recommendation: Use Hugging Face Spaces (Option A)**

---

## PHASE 3: Deploy React App to Vercel

---

## PHASE 3: Deploy React App to Vercel

### Step 3.1 — Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel

### Step 3.2 — Import Your Project

1. Click **Add New...** → **Project**
2. Find `nagarvani` in the list
3. Click **Import**

### Step 3.3 — Configure Build Settings

Vercel should auto-detect Create React App. Verify these settings:

| Setting | Value |
|---|---|
| Framework Preset | Create React App |
| Root Directory | `.` (leave as is) |
| Build Command | `CI=false npm run build` |
| Output Directory | `build` |
| Install Command | `npm install` |

### Step 3.4 — Add Environment Variables

This is the most important step. Click **Environment Variables** and add:

| Name | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | `https://xbukealfzhidcypohdwp.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidWtlYWxmemhpZGN5cG9oZHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDk4NDgsImV4cCI6MjA4OTgyNTg0OH0.Dp4CtfokPATur1PJmQmOz0Ix7a1EOqoE1LSzrp6M6qQ` |
| `REACT_APP_CLIP_API_URL` | `https://YOUR-USERNAME-nagarvani-clip.hf.space` (from Phase 2) |

> Replace `YOUR-RAILWAY-URL` with the actual Railway URL from Step 2.5

### Step 3.5 — Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for the build
3. You'll get a URL like: `https://nagarvani.vercel.app`

### Step 3.6 — Test the Deployment

Visit your Vercel URL and verify:
- [ ] Landing page loads
- [ ] Sign up / Sign in works
- [ ] Citizen portal accessible
- [ ] Officer portal accessible

---

## PHASE 4: Update Supabase Auth Settings

After deploying, Supabase needs to know your production URL for auth redirects.

### Step 4.1 — Update Site URL

1. Go to https://supabase.com/dashboard/project/xbukealfzhidcypohdwp
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to your Vercel URL:
   ```
   https://nagarvani.vercel.app
   ```

### Step 4.2 — Add Redirect URLs

In the same page, under **Redirect URLs**, add:
```
https://nagarvani.vercel.app/**
https://nagarvani.vercel.app
```

4. Click **Save**

---

## PHASE 5: Run Database SQL Scripts

If you haven't already run these in Supabase, do it now.

Go to: https://supabase.com/dashboard/project/xbukealfzhidcypohdwp/sql/new

Run each file in this order:

### Script 1 — Main Database Setup
Copy and run: `supabase_clean_setup.sql`

### Script 2 — Fix All RLS Policies
Copy and run: `NUCLEAR_FIX.sql`

### Script 3 — Storage Buckets
Copy and run: `fix_storage.sql`

### Script 4 — Blockchain Audit Trail
Copy and run: `audit_blocks_setup.sql`

### Script 5 — Volunteer System (if using)
Copy and run: `volunteer_system_setup.sql`

---

## PHASE 6: Verify Everything Works

### Checklist

**Supabase:**
- [ ] Tables exist: users, complaints, departments, officers, leaderboard, audit_blocks
- [ ] Storage buckets exist: complaint-images, profile-pictures
- [ ] RLS policies applied

**Railway (CLIP Server):**
- [ ] `/health` returns `{"status": "healthy"}`
- [ ] `/detect-issue` accepts image uploads

**Vercel (React App):**
- [ ] App loads at your Vercel URL
- [ ] Sign up creates account
- [ ] Sign in redirects to correct portal
- [ ] Filing a complaint works
- [ ] GPS auto-tags location
- [ ] Photo upload works
- [ ] AI detects issue type
- [ ] Officer sees complaint in dashboard
- [ ] Blockchain audit trail shows

---

## Troubleshooting

### Build fails on Vercel
- Make sure `CI=false` is in the build command
- Check Node version is 18.x in package.json engines
- Check all environment variables are set

### CLIP server not responding
- Check Railway deployment logs for errors
- Visit `/health` endpoint to check status
- If model fails to load, it runs in fallback mode (still works)
- Make sure `REACT_APP_CLIP_API_URL` has no trailing slash

### Auth not working after deploy
- Make sure Supabase Site URL is updated (Phase 4)
- Clear browser cache and try again
- Check browser console for CORS errors

### Complaints not saving
- Run `NUCLEAR_FIX.sql` in Supabase SQL Editor
- Check browser console for 403/406 errors
- Verify RLS policies are applied

### Images not uploading
- Run `fix_storage.sql` in Supabase SQL Editor
- Check storage buckets exist in Supabase Dashboard → Storage

---

## Architecture Overview

```
User Browser
    │
    ▼
Vercel (React App)
    │
    ├──► Supabase (Database + Auth + Storage)
    │       ├── users, complaints, departments
    │       ├── officers, leaderboard, audit_blocks
    │       └── complaint-images bucket
    │
    └──► Railway (CLIP AI Server)
            └── openai/clip-vit-base-patch32
```

---

## Updating the App

After making code changes:

```bash
git add .
git commit -m "Your change description"
git push origin main
```

Vercel auto-deploys on every push to `main`. Railway also auto-deploys.

---

## Cost Summary

| Service | Free Tier | Paid |
|---|---|---|
| Vercel | 100GB bandwidth/month | Pro $20/mo |
| Railway | 500 hours/month | Hobby $5/mo |
| Supabase | 500MB DB, 1GB storage | Pro $25/mo |

For a demo/hackathon project, everything runs free.
For production with real users, Railway Hobby ($5/mo) is recommended for the CLIP server.
