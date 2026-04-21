# ELD Trip Planner — Frontend (Phase B)

Vite + React + TypeScript SPA. Styling uses **Tailwind CSS** with a shared **`tailwind.preset.cjs`** (colors: `eld.accent`, `eld.teal`, `eld.mist` — see that file). HTTP calls use the **`fetch` API only** (no axios).

Map UI uses **Leaflet** + **react-leaflet** (standard for OSM maps; no Mapbox/Google keys). Encoded polylines are decoded with a small local utility (no polyline npm package).

---

## How to run (local)

### 1. Backend API

From the repo `backend/` folder (with `.env` and `ORS_API_KEY` set):

```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

API defaults to `http://127.0.0.1:8000`.

### 2. Frontend env

Copy or keep:

- **`.env.development`** (committed) sets `VITE_API_BASE_URL=http://127.0.0.1:8000`

To override, create **`.env.local`** (gitignored) with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Vite only reads env vars prefixed with `VITE_`.

### 3. Install & dev server

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The UI posts to `VITE_API_BASE_URL + /api/trips/plan/`.

**CORS:** the Django project must list `http://localhost:5173` in `CORS_ALLOWED_ORIGINS` (already in `backend` defaults / `.env.example`).

### 4. Production build

```bash
npm run build
npm run preview   # optional local preview of dist/
```

Set `VITE_API_BASE_URL` in your host’s environment to your deployed API URL before building for production.

---

## Tailwind preset

Theme tokens live in **`tailwind.preset.cjs`** and are merged in **`tailwind.config.cjs`** via `presets: [require("./tailwind.preset.cjs")]`.

Use classes such as:

- `bg-eld-accent` / `text-eld-accent` — `rgb(248, 73, 96)`
- `bg-eld-teal` / `border-eld-teal` — `rgb(0, 128, 128)`
- `bg-eld-mist` — `rgb(188, 221, 222)`

---

## Layout

| Path | Role |
|------|------|
| `src/api/planTrip.ts` | `fetch` POST to `/api/trips/plan/` |
| `src/components/TripForm.tsx` | Four inputs + submit |
| `src/components/RouteMap.tsx` | Leaflet map, polyline, stops |
| `src/components/ELDLogGrid.tsx` | Canvas 24h grid + duty stripes |
| `src/utils/decodePolyline.ts` | Encoded polyline → lat/lng pairs |

---

## Third-party note

If you want to add **axios**, **react-query**, or other HTTP/UI libraries, say so first; the current code intentionally uses **`fetch` only** for API calls.
