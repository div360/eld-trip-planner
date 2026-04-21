# Implementation plan — ELD Trip Planner (Django + React)

This document maps the product spec, assessment instructions, and repo layout into an ordered implementation checklist. **Backend** and **frontend** live in separate top-level folders.

---

## 1. Goals and success criteria

### Inputs (form / API)

| Field | Notes |
|--------|--------|
| Current location | Free text → geocode |
| Pickup location | Free text → geocode |
| Dropoff location | Free text → geocode |
| Current cycle used (hours) | `0 <= h < 70` for property 70/8; drives rolling window |

### Outputs

1. **Map** — Route polyline/geometry; markers or labels for **stops** (pickup, dropoff, rest breaks, fuel, etc.) with useful metadata (ETA/order, type).
2. **Daily ELD log sheets** — One sheet per calendar day (or per 24-hour logging day per chosen rule); **multiple sheets** for long trips; data structured so the UI can **draw grids and duty-status lines** on Canvas (or equivalent).

### Assessment deliverables

- [ ] Hosted working app (e.g. **Vercel** + API host e.g. **Railway**).
- [ ] **3–5 min Loom** — demo + brief code tour (HOS, route integration, log rendering).
- [ ] **GitHub** repository public and linked.

### Quality bar

- **Accuracy:** HOS math and stop sequencing must match FMCSA-style assumptions listed below; evaluators will test the hosted build.
- **UI/UX:** Clean, readable layout; map + logs easy to understand; polish helps overall impression.

---

## 2. Assumptions (locked for v1)

- Property-carrying driver; **70 h / 8 days**; no adverse driving conditions.
- **11 h** driving max per day (within **14 h** on-duty window from shift start).
- **30 min** off-duty (or compliant break placement) after **8 h** driving before more driving.
- **10 h** consecutive off-duty between “days” / shift resets as implemented in `hos_service`.
- **1 h** on-duty not driving at **pickup**; **1 h** at **dropoff** (not counted as driving).
- **Fuel:** at least every **1,000 miles** — model **30 min** on-duty not driving per fuel event (adjust if product owner refines).
- Routing distances from **free** API: **OpenRouteService** (ORS) — directions + distance + encoded polyline where available.

---

## 3. Repository structure

```
eld trip planner/
├── AGENTS.md              # Agent / contributor conventions
├── IMPLEMENTATION.md      # This file
├── backend/               # Django + DRF (see §4)
└── frontend/              # Vite + React + TS (see §5)
```

---

## 4. Backend (`backend/`)

### 4.1 Stack

- Python 3.11+
- Django 5.x, DRF, `django-cors-headers`, Pydantic v2, `django-environ`, `requests` (ORS HTTP).

### 4.2 Target file tree

```
backend/
├── manage.py
├── requirements.txt
├── .env                    # gitignored — SECRET_KEY, DEBUG, ALLOWED_HOSTS, ORS_API_KEY, CORS origins
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── trips/
│   ├── __init__.py
│   ├── apps.py
│   ├── urls.py
│   ├── views.py
│   ├── serializers.py      # Optional thin DRF layer; Pydantic is source of truth for shapes
│   ├── models.py           # Empty or Phase 2 TripResult
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── trip_input.py
│   │   └── trip_output.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── route_service.py
│   │   ├── hos_service.py
│   │   └── eld_service.py
│   └── utils/
│       ├── __init__.py
│       └── map_client.py
└── tests/
    ├── __init__.py
    ├── test_hos_service.py
    └── test_route_service.py
```

### 4.3 API routes (under `/api/`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health/` | Deploy / uptime check |
| `POST` | `/api/trips/plan/` | Main planner — body matches `TripInput`; returns `TripOutput` |
| `GET` | `/api/trips/<uuid>/` | Phase 2 optional — saved trip by id |

Root `config/urls.py` includes trips URLs under `api/` as designed in the spec.

### 4.4 Pydantic schemas

- **`TripInput`** — four fields + validators (cycle hours **strictly &lt; 70** and ≥ 0).
- **`TripOutput`** — encoded polyline (string), stops list (type, label, lat/lng, times), `daily_logs` (date, segments with duty status enum, start/end hours, location text), totals (distance miles, trip days).

Duty status enum aligned with grid labels: OFF, SB, D, ON (or full names + abbreviations in API contract documented for frontend).

### 4.5 Services (implementation order)

1. **`map_client.py`** — ORS geocode + directions; timeouts; errors → structured exceptions or error payloads.
2. **`route_service.py`** — Orchestrate: geocode three strings → build ordered route (current → pickup → dropoff); return distance, duration estimate, polyline, ordered waypoints for stops.
3. **`hos_service.py`** — Input: drive legs duration/distance, cycle used, fixed pickup/dropoff/fuel rules. Output: timeline of segments (driving / off / on-duty) with **calendar day boundaries** for ELD split. This is the **highest-risk** module — **unit tests** with hand-calculated scenarios (short day, break at 8h, 11h cap, 14h window, 10h reset, 70h exhaustion, multi-day).
4. **`eld_service.py`** — Map HOS timeline → `DailyLog` list with `ELDSegment` rows for canvas (24h grid per day).

### 4.6 DRF views

- **`PlanTripView`** — POST: parse JSON → `TripInput.model_validate` → call services → return `TripOutput.model_dump()` with appropriate status codes (400 on validation).
- **Health** — simple 200 JSON.
- **`TripDetailView`** — 501 or stub until Phase 2 DB exists.

### 4.7 Settings highlights

- `INSTALLED_APPS`: `rest_framework`, `corsheaders`, `trips`.
- `MIDDLEWARE`: **`corsheaders.middleware.CorsMiddleware` first**, then `SecurityMiddleware`, etc.
- `CORS_ALLOWED_ORIGINS` — localhost:5173 + production Vercel URL.
- No `DATABASES` requirement for Phase 1 (SQLite default is fine for Django’s own tables if unused).

### 4.8 Testing and verification

- Pytest or Django test runner — **`test_hos_service.py`** required with multiple scenarios.
- **`test_route_service.py`** — mock ORS responses.
- Manual: **Postman** / curl against `/api/trips/plan/` with sample payloads.

---

## 5. Frontend (`frontend/`)

### 5.1 Stack

- Vite + React + TypeScript
- **Leaflet** + `react-leaflet` (or Leaflet imperative) — **no** Google Maps key
- **Canvas** (or one canvas per day) for ELD grid + duty lines
- **Tailwind CSS** for layout and polish (assessment rewards good design)

### 5.2 Target structure (indicative)

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── trips.ts          # fetch POST /api/trips/plan/
│   ├── components/
│   │   ├── TripForm.tsx
│   │   ├── RouteMap.tsx
│   │   └── ELDLogBook.tsx    # or per-day ELDLogDay.tsx + canvas
│   ├── types/
│   │   └── trip.ts           # mirrors TripOutput
│   └── styles/
│       └── index.css
└── .env.development            # VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 5.3 UI flow

1. Form with four fields + submit.
2. Loading / error states.
3. On success: split view or stacked — **map** with polyline decoded (e.g. `@mapbox/polyline` or small decoder) and markers from `stops`.
4. **Log book** — list of days; each day: title date + canvas drawing 24h grid, horizontal duty segments, legend (D / ON / OFF / SB).

### 5.4 Env and CORS

- Frontend uses `VITE_API_BASE_URL` pointing to Django in dev and Railway URL in prod.
- Backend CORS must allow the Vercel origin.

---

## 6. Deployment

| Piece | Suggested host | Notes |
|--------|----------------|--------|
| API | Railway | Env: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `ORS_API_KEY`, CORS origins |
| SPA | Vercel | Env: `VITE_API_BASE_URL` = public API URL |

- HTTPS only in production.
- Health check URL documented for ops.

---

## 7. Loom outline (3–5 minutes)

1. **0:00–0:45** — Problem + assumptions (70/8, fuel, pickup/dropoff).
2. **0:45–2:00** — Live hosted demo: fill form → map + logs.
3. **2:00–4:00** — Code: `hos_service` key function + one test; `PlanTripView` glue; canvas or segment model.
4. **4:00–5:00** — Deploy notes + GitHub link.

---

## 8. Implementation checklist (ordered)

### Phase A — Backend foundation

- [ ] Scaffold Django in `backend/`; install deps; `trips` app; settings + CORS + DRF.
- [ ] Pydantic `TripInput` / `TripOutput` (+ enums).
- [ ] ORS `map_client` + `route_service` (geocode + route).
- [ ] `hos_service` full rules + **tests**.
- [ ] `eld_service` building `daily_logs`.
- [ ] `POST /api/trips/plan/` + `GET /api/health/`.
- [ ] `requirements.txt`, `.env.example`, root `.gitignore`.

### Phase B — Frontend

- [ ] Vite React TS in `frontend/`; Tailwind.
- [ ] Form + API client + types.
- [ ] Leaflet map + polyline + stop markers.
- [ ] Canvas ELD renderer for multiple days.
- [ ] Responsive, accessible-ish UI (labels, focus, contrast).

### Phase C — Ship

- [ ] Deploy API + SPA; verify CORS and env.
- [ ] End-to-end smoke on **hosted** URLs (not only localhost).
- [ ] Record Loom; pin GitHub README with links (optional README if allowed by grader).

---

## 9. Optional Phase 2 (not required for MVP)

- PostgreSQL (Supabase/Railway) + `TripResult` model + `GET /api/trips/<id>/`.
- Shareable trip URLs.

---

## 10. Open decisions to resolve during coding

- **“Day” boundary** for ELD sheets: midnight local vs driver log start — pick one and document in API (`timezone` field optional later).
- **ORS** rate limits and error UX (retry vs show message).
- Whether **total trip days** is calendar count vs duty-day count — align `TripOutput.total_trip_days` with canvas day count.

Document chosen behavior in `AGENTS.md` or inline module docstrings once decided.
