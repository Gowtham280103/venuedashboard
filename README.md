# Smart Venue Dashboard

A real-time crowd management dashboard for large venues like stadiums and auditoriums.

**Live Demo:** https://smart-stadium-dashboard-317275340485.us-central1.run.app

---

## Chosen Vertical

**Physical Event Experience**

Managing large crowds at live events is a real problem. Venue staff often don't have a clear picture of what's happening across the entire venue in real time — which gates are overloaded, where people are waiting too long, or where more staff is needed. This dashboard tries to solve that.

---

## Approach and Logic

The idea was to build a single-screen dashboard that gives venue managers a live overview of the entire venue without needing to check multiple systems.

- The backend generates simulated crowd data (density per zone, waiting times, staff counts, alerts) and pushes it to the frontend every 5 seconds using Server-Sent Events (SSE)
- The frontend renders a canvas-based stadium map with a color heatmap — green for low density, yellow for medium, orange for high, red for critical
- An AI suggestion box reads the current state and shows simple actionable recommendations like "redirect crowd from Gate A to Gate C"
- Everything updates automatically without page refresh

The architecture is intentionally simple — one Node.js server handles both the static frontend files and the SSE stream. No database, no external APIs. This keeps it lightweight and easy to deploy.

---

## How the Solution Works

1. User opens the dashboard in a browser
2. The frontend connects to `/api/events` (SSE endpoint)
3. Every 5 seconds, the server sends a new JSON payload with updated crowd data
4. The frontend updates the heatmap, waiting time cards, staff bars, alerts, and chart in real time
5. If the connection drops, it automatically reconnects after 3 seconds

**Key components:**
- `server.js` — Node.js HTTP server, serves frontend + SSE stream
- `src/map.js` — Canvas renderer for the stadium heatmap with smooth animations
- `src/chart.js` — Chart.js line graph for crowd trend
- `src/ui.js` — All card and panel updates
- `Dockerfile` — Multi-stage build (Vite build → Node.js runtime)

---

## Features

- Live stadium map with animated color heatmap
- Waiting time cards for gates, food stalls, and restrooms
- Staff allocation tracker (assigned vs required per zone)
- Priority alerts panel (high / medium / low)
- Crowd trend line chart (last 60 minutes)
- AI suggestion box with crowd management recommendations
- Auto-reconnecting SSE connection
- Mobile responsive layout

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Charts:** Chart.js
- **Backend:** Node.js (built-in `http` module, no Express)
- **Real-time:** Server-Sent Events (SSE)
- **Build tool:** Vite
- **Container:** Docker (multi-stage build)
- **Deployment:** Google Cloud Run

---

## Assumptions Made

- Crowd data is simulated (mock random values) — no real IoT sensors or camera feeds
- The stadium layout is hardcoded as a fixed grid of zones
- AI suggestions are rule-based text, not an actual ML model
- Single venue support only (no multi-venue switching)
- No authentication — the dashboard is publicly accessible

---

## How to Run Locally

```bash
git clone https://github.com/Gowtham280103/venuedashboard.git
cd venuedashboard
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Deployment

Deployed on Google Cloud Run using Docker.

```bash
gcloud run deploy smart-stadium-dashboard \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi
```

---

## Future Improvements

- Connect to real sensor or camera data
- Add login for venue staff
- Push alerts to mobile devices
- Historical reports and analytics
- Multi-venue support

---

## Author

**Gowtham** — GitHub: [Gowtham280103](https://github.com/Gowtham280103)
