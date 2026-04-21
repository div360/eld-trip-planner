# AGENTS.md — ELD Trip Planner

This file orients AI coding agents and human contributors working in this repository.

## What this project is

A **truck driver ELD (Electronic Logging Device) trip planner**: users enter four fields (current location, pickup, dropoff, current cycle hours used). The app returns **route geometry and stop/rest metadata** for a map, plus **daily log sheet data** suitable for drawing multiple ELD grids for multi-day trips.

- **Backend:** Django + Django REST Framework (DRF), Pydantic for request/response schemas, business logic in a service layer. Phase 1 is **stateless** (no PostgreSQL required).
- **Frontend:** React + TypeScript (Vite), Leaflet for the map, HTML Canvas for log sheets.

## Assessment deliverables (must not be forgotten)

1. **Hosted app** — typically React on **Vercel**; Django API on **Railway** (or similar) with production CORS and env vars.
2. **3–5 minute Loom** — walk through the running app and key code (HOS, route, ELD rendering).
3. **Public GitHub** — this repo shared with evaluators.

Scoring emphasis (from brief):

- **Accuracy** of HOS and outputs is primary for the reward tier.
- **UI/UX** should be strong; good design can compensate somewhat for minor inaccuracies—still prioritize correct HOS math.

## Repository layout

```
backend/     # Django project (see IMPLEMENTATION.md)
frontend/    # Vite + React + TypeScript SPA
```

Do not mix Django templates for the main UI; the frontend is a separate SPA calling `/api/`.

## Driver and HOS assumptions (non-negotiable unless product owner changes them)

- **Property-carrying** driver.
- **70-hour / 8-day** cycle, no adverse driving conditions.
- Enforce standard FMCSA-style limits in code (align with `hos_service` implementation and tests):
  - 11 hours max driving per day (within the 14-hour window).
  - 14-hour on-duty window from start of shift (driving + on-duty not driving).
  - 30-minute break after 8 hours driving (before more driving).
  - 10 consecutive hours off before starting a new duty day / shift reset as modeled.
  - **70-hour rolling** window from `current_cycle_used_hrs` input.
- **Pickup and dropoff:** 1 hour each, **on-duty not driving** (not driving time).
- **Fuel:** at least one fuel stop every **1,000 miles** of trip distance; model as **30 minutes on-duty not driving** per stop unless spec changes.

## Implementation phases

Follow **`IMPLEMENTATION.md`** as the source of truth for file trees, endpoints, and checklists. Prefer completing **backend HOS + tests** before polishing the map and canvas UI.

## Conventions for agents

1. **Thin views, fat services** — HTTP in DRF views; validation via Pydantic; all HOS/route/ELD assembly in `trips/services/`.
2. **Free map routing** — OpenRouteService (ORS) for geocoding + directions + geometry; API key in environment variables, never committed.
3. **CORS** — `django-cors-headers`; `CorsMiddleware` must be **first** in `MIDDLEWARE`. Include local Vite (`http://localhost:5173`) and production frontend origin.
4. **Phase 1 backend** — no DB persistence required; optional Phase 2: PostgreSQL + `GET /api/trips/{id}/`.
5. **Testing** — unit tests for `hos_service` (mandatory); route service tests with mocked HTTP where possible.
6. **Schema consistency** — `current_cycle_used_hrs` must be validated consistently (e.g. `0 <= hours < 70`, not conflicting `le=70` with a `>= 70` error).

## Commands (when projects exist)

Backend (from `backend/`):

```bash
python manage.py runserver
```

Frontend (from `frontend/`):

```bash
npm install
npm run dev
```

Exact scripts depend on scaffolding; update this section when `package.json` exists.

## What not to do

- Do not embed paid map keys or secrets in the repo.
- Do not skip HOS tests in favor of UI-only work when the milestone is “backend correct.”
- Do not persist PII; this app has no auth—keep it stateless unless Phase 2 is explicitly implemented.
