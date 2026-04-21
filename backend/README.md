# Backend — ELD Trip Planner API

Django 5 + DRF, Pydantic validation, OpenRouteService for routing, in-memory HOS simulation (Phase A — no trip persistence).

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add ORS_API_KEY from https://openrouteservice.org/
python manage.py migrate
python manage.py runserver
```

## Tests

```bash
pytest
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health/` | JSON health check |
| `POST` | `/api/trips/plan/` | Plan trip (JSON body per `TripInput`) |
| `GET` | `/api/trips/<uuid>/` | `501` — Phase 2 persistence not implemented |

Full architecture notes live in the repo root **`IMPLEMENTATION.md`**.
