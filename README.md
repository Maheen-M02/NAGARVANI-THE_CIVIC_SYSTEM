# NagarVani — The Civic System 🇮🇳

**NagarVani** (नगरवाणी, *"Voice of the City"*) is an AI-powered civic complaint management platform built for India. It connects citizens, municipal officers, and administrators on a single platform — enabling complaints to be filed, triaged, assigned, and resolved with full transparency.

---

## ✨ Features

### For Citizens
- **File complaints** with title, description, location, photos, and ward
- **Voice complaints** powered by Vapi AI — speak your issue in your language
- **AI image classification** — upload a photo and let the system detect the issue type automatically
- **Real-time tracking** of complaint status via ticket ID
- **Leaderboard** recognising top civic contributors
- **Live map** showing complaint locations across the city

### For Municipal Officers
- **Dashboard** with assigned complaints sorted by priority and SLA
- **AI suggestions** for each complaint to guide resolution steps
- **Status updates** (Pending → In Progress → Resolved) with notes
- **Audit trail** for every action taken on a complaint
- **Interactive map** to view complaints geographically

### For Administrators
- **Full overview** of all complaints, officers, and volunteers
- **Analytics** — bar charts, line charts, and donut charts for complaint trends
- **Department load balancing** and complaint assignment
- **User management** for officers and volunteers
- **Live data refresh** every 30 seconds

### Platform-wide
- 🌐 **9 Indian languages** — English, Hindi, Tamil, Telugu, Kannada, Gujarati, Marathi, Bengali, Urdu
- 📱 **Responsive design** — full mobile and desktop experiences
- 🔒 **Authentication** via Supabase (sign in / sign up)
- 🗺️ **Interactive maps** using Leaflet

---

## 🏗️ Architecture

```
NAGARVANI-THE_CIVIC_SYSTEM/
├── src/                    # React web application
│   ├── pages/              # Landing, CitizenPortal, OfficerDashboard, AdminDashboard, Leaderboard
│   ├── components/         # Reusable UI (AuthModal, LiveMap, VoiceAssistant, Charts, …)
│   ├── services/           # Supabase, CLIP, Vapi, Leaderboard, Location services
│   ├── context/            # AppContext (global state)
│   ├── i18n/locales/       # Translation files (en, hi, ta, te, kn, gu, mr, bn, ur)
│   ├── hooks/              # Custom React hooks
│   └── styles/             # CSS stylesheets
├── NagarvaniExpo/          # React Native / Expo mobile app
├── clip_server.py          # FastAPI image-classification microservice
├── api/
│   └── voice-complaint.js  # Voice complaint API endpoint
├── public/                 # Static assets
└── build/                  # Production build output
```

### Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React 18, React Router 7, Three.js (3D effects) |
| Mobile App | React Native, Expo SDK 55 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| AI Image Detection | FastAPI + OpenAI CLIP (`clip-vit-base-patch32`) |
| Voice AI | Vapi AI (`@vapi-ai/web`) |
| Maps | Leaflet / React-Leaflet |
| Internationalisation | i18next, react-i18next |
| Deployment | Vercel (frontend), Railway (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/Maheen-M02/NAGARVANI-THE_CIVIC_SYSTEM.git
cd NAGARVANI-THE_CIVIC_SYSTEM
```

### 2. Configure environment variables

Create a `.env` file in the root:

```env
REACT_APP_SUPABASE_URL=https://<your-project>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
REACT_APP_CLIP_API_URL=http://localhost:8000
REACT_APP_VAPI_API_KEY=<your-vapi-key>        # optional — enables voice complaints
```

### 3. Install and run the web app

```bash
npm install
npm start          # starts at http://localhost:3000
```

### 4. Run the image-detection API (optional)

```bash
pip install -r requirements.txt
python clip_server.py
# API available at http://localhost:8000
```

> **Memory note:** CLIP requires ~2 GB of RAM. On constrained servers the service falls back to a lightweight smart classifier that uses filename and image colour analysis. Set `ENABLE_CLIP=true` to load the full model.

### 5. Run the mobile app (optional)

```bash
cd NagarvaniExpo
npm install
npx expo start     # scan the QR code with Expo Go
```

---

## 🗣️ User Roles

| Role | Access |
|---|---|
| **Citizen** | File complaints, track status, view map & leaderboard |
| **Officer** | Manage assigned complaints, update status, view AI suggestions |
| **Admin** | Full system oversight, analytics, user management |

Select your role from the landing page after signing in.

---

## 🤖 AI Image Detection API

The `clip_server.py` FastAPI service exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service info and current mode |
| `GET` | `/health` | Health check |
| `GET` | `/model-info` | Supported labels and model mode |
| `POST` | `/detect-issue` | Upload an image → returns issue type, department & confidence |

**Supported issue categories:**
- Pothole on Road → *Public Works Department*
- Garbage Pile → *Waste Management*
- Water Leakage → *Water Board*
- Broken Streetlight → *Electricity Department*

---

## 🌐 Internationalisation

NagarVani supports **9 languages** out of the box:

`English` · `हिंदी` · `தமிழ்` · `తెలుగు` · `ಕನ್ನಡ` · `ગુજરાતી` · `मराठी` · `বাংলা` · `اردو`

The language selector is available on every page. Translation files live in `src/i18n/locales/`.

---

## 🚢 Deployment

### Vercel (Frontend)
The project is pre-configured for Vercel. Push to your main branch and Vercel will build automatically using `vercel.json`.

### Railway (Image Detection API)
The `Procfile` and `railway.json` configure the FastAPI service for Railway deployment.
Set the `PORT` environment variable (Railway provides this automatically).
Set `ENABLE_CLIP=true` only if your plan has ≥ 2 GB RAM.

---

## 📄 License

This project is open source. See the repository for licence details.

---

> *Built for India. Every complaint heard. Every issue resolved.*
