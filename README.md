# NagarVani — Smart Public Service CRM 🇮🇳

> AI-powered grievance management for India's 1.4 billion citizens.
> National Hackathon 2025 Demo Project.

---

## 🚀 Quick Start

```bash
npm install
npm start
```

Opens at **http://localhost:3000**

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Leaflet |
| Maps | Leaflet.js + CartoDB Dark tiles |
| Charts | Pure SVG (no external chart library) |
| Styling | CSS-in-JS + Global CSS |
| State | React Context API |
| AI Triage | Client-side keyword classifier |

---

## 🗂️ Project Structure

```
src/
├── App.js                    # Root router
├── index.js                  # Entry point
├── styles/
│   └── global.css            # Global CSS, animations, Leaflet overrides
├── context/
│   └── AppContext.js         # Global state (complaints, role, notifications)
├── data/
│   ├── constants.js          # Departments, Officers, Categories, Chart data
│   ├── seed.js               # 12 seed complaints with real India geo-coords
│   └── aiTriage.js           # AI keyword classifier engine
├── hooks/
│   └── useApp.js             # Convenience re-export of useApp hook
├── components/
│   ├── UI.js                 # Shared: TopNav, StatCard, StatusBadge, PrioBadge, etc.
│   ├── Charts.js             # SVG: BarChartSVG, LineChartSVG, DonutChart
│   ├── LiveMap.js            # Leaflet real-time map (dept/status filters, popups)
│   └── Toast.js              # Notification toasts
└── pages/
    ├── Landing.js            # Role selection landing page
    ├── CitizenPortal.js      # File & track complaints (4-step wizard)
    ├── OfficerDashboard.js   # Task queue + dept-scoped live map
    └── AdminDashboard.js     # Analytics + national live map + officers
```

---

## 🎯 Three Roles

### 🧑‍💼 Citizen Portal
- 4-step complaint filing wizard
- AI auto-triage (category, priority, officer, SLA)
- Live status tracking by ticket ID (try NV-001 → NV-012)

### 👮 Officer Dashboard
- Priority-sorted task queue with SLA timers
- **Live Map tab** — department-scoped map showing only PWD Roads complaints
- Status update with notes → real-time activity log

### 📊 Admin Command Center
- KPI cards, weekly trend, status donut
- **Overview tab** — mini live map + "View Full Map" button
- **Map tab** — full-screen national map with dept + status filters
- Analytics: dept bar chart, priority split, AI predictions
- Complaints: sortable table of all complaints
- Officers: performance scorecards

---

## 🗺️ Live Map Features

- **Dark CartoDB tiles** for command-center aesthetic
- Custom emoji + color markers per department
- **Pulsing animation** on Critical/Escalated complaints
- Red dot badge on Critical pins
- Click any pin → rich popup with SLA progress bar
- Department filter buttons (admin only)
- Status filter: All / Open / In Progress / Escalated / Resolved
- Live clock ticking in toolbar
- Auto-fit bounds on filter change
- Selected complaint detail strip at the bottom

---

## 🤖 AI Triage Engine

Client-side keyword matcher that:
1. Scores the complaint text against 6 category keyword lists
2. Assigns department, priority, and SLA
3. Picks the lowest-load available officer
4. Returns confidence score (70–95%)

Categories: Road Damage, Water Supply, Power Outage, Garbage & Sanitation, Health & Hospitals, Public Safety

---

## 📍 Seed Complaints

12 pre-loaded complaints spanning real Indian cities:
- Bengaluru, Gurugram, Chennai, Mumbai, Kolkata, Hyderabad, Delhi, Patna, Jaipur, Pune, Ahmedabad

---

## 🏆 Hackathon Demo Script

1. Open app → Landing page shows live stats
2. **Citizen** → Load sample → AI Analyze → Submit
3. **Officer** → Task Queue → Select complaint → Update status
4. **Officer** → Live Map tab → See your dept's pins on India map
5. **Admin** → Overview → Mini map → "View Full Map"
6. **Admin** → Map tab → Filter by dept/status → Click pins
7. Key pitch: *"AI routes in 1.8 seconds, real-time maps across all 6 departments, SLA auto-escalation"*

---

## 📄 Standalone Demo

The file `NagarVani_Prototype.html` in the output folder is a **zero-dependency single-file demo** that works offline in any browser — no `npm install` needed. Perfect for quick judging demos.
