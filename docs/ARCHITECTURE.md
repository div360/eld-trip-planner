# ELD Trip Planner — architecture (Mermaid)

Use these diagrams in [Mermaid Live Editor](https://mermaid.live), Notion, GitHub/GitLab, or export to PNG/SVG for slides.

---

## 1. System context

External actors and integrations.

```mermaid
flowchart LR
  subgraph Client["Browser"]
    UI["Vite + React + TS"]
  end

  subgraph API["Backend host"]
    DJ["Django + DRF"]
  end

  subgraph ORS["OpenRouteService"]
    GEO["Geocode / search API"]
    DIR["Directions API"]
  end

  UI -->|"HTTPS JSON\nPOST /api/trips/plan/\nGET /api/places/autocomplete/"| DJ
  DJ -->|"Geocode + directions"| GEO
  DJ -->|"Driving route"| DIR
```

---

## 2. Backend layout (Django)

Logical layers inside `backend/`.

```mermaid
flowchart TB
  subgraph HTTP["HTTP layer"]
    URL["config/urls.py → trips/urls.py"]
    V_PLAN["PlanTripView"]
    V_AUTO["PlacesAutocompleteView"]
    V_HEALTH["HealthView"]
    V_TRIP["TripDetailView not implemented"]
  end

  subgraph Schema["Pydantic schemas"]
    IN["TripInput"]
    OUT["TripOutput + HosAssumptions + DailyLog"]
  end

  subgraph Services["trips/services/"]
    RS["route_service — geocode + directions"]
    HS["hos_service — FMCSA-style segments"]
    ES["eld_service — segments → daily logs"]
  end

  subgraph Util["trips/utils/"]
    MC["map_client — OpenRouteServiceClient"]
    RG["route_geometry — polyline + interpolation"]
  end

  URL --> V_PLAN
  V_PLAN --> IN
  V_PLAN --> RS
  RS --> MC
  V_PLAN --> HS
  HS --> ES
  V_PLAN --> OUT
  V_PLAN --> RG
  V_AUTO --> MC
```

---

## 3. Trip planning pipeline (single request)

What happens when the user plans a trip.

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant V as PlanTripView
  participant RS as route_service
  participant ORS as OpenRouteService
  participant HS as hos_service
  participant ES as eld_service
  participant RG as route_geometry

  FE->>V: POST /api/trips/plan/ TripInput JSON
  V->>RS: compute_route(trip_input, client)
  RS->>ORS: geocode x3 + directions_driving
  ORS-->>RS: coordinates, legs, polyline
  RS-->>V: RouteComputation
  V->>HS: plan_hos_segments(legs, miles, cycle)
  HS-->>V: HosSegment list
  V->>ES: build_daily_logs(segments, start_date)
  ES-->>V: DailyLog list
  V->>V: _build_stops(route, segments)
  V->>RG: lat_lng_for_drive_fraction (fuel/rest)
  V-->>FE: TripOutput JSON
```

---

## 4. Frontend module map

How `frontend/src/` is organized.

```mermaid
flowchart TB
  subgraph Entry["Entry"]
    MAIN["main.tsx"]
    APP["App.tsx — state, plan, persistence"]
  end

  subgraph API_L["API layer"]
    PT["api/planTrip.ts"]
    PA["api/placesAutocomplete.ts"]
  end

  subgraph Comp["components/"]
    TF["TripForm"]
    LC["LocationCombobox"]
    RM["RouteMap + Leaflet"]
    SL["StopsAndRestsList"]
    DL["DriversDailyLogSheet"]
    TPL["TripPlanningLoader"]
    DI["DecorIcons"]
  end

  subgraph Utils["utils/"]
    TP["tripPersist — localStorage"]
    DI_PNG["downloadDailyLogsImage"]
    DP["decodePolyline"]
    DG["dutyGraphPath"]
  end

  subgraph Types["types/trip.ts"]
    TPR["TripPlanRequest / Response DTOs"]
  end

  MAIN --> APP
  APP --> PT
  APP --> TF
  TF --> LC
  TF --> PA
  LC --> PA
  APP --> RM
  APP --> TP
  TF --> TPR
  PT --> TPR
```

---

## 5. Data contract (API boundary)

High-level shapes exchanged at `POST /api/trips/plan/`.

```mermaid
flowchart LR
  subgraph Request["TripInput"]
    A["locations"]
    B["cycle hours"]
    C["truck + optional log headers"]
  end

  subgraph Pipeline["Server"]
    V["Validation + services"]
  end

  subgraph Response["TripOutput"]
    P["route_polyline"]
    S["stops"]
    L["daily_logs"]
    H["hos_assumptions"]
    M["sheet_inputs echo"]
  end

  Request --> V --> Response
```

---

## 6. Environment & configuration

Not drawn as code — reference only.

| Piece        | Role |
|-------------|------|
| `ORS_API_KEY` | OpenRouteService auth |
| `VITE_API_BASE_URL` | Frontend → API base URL |
| `CORS_ALLOWED_ORIGINS` | Browser allowed origins for API |

---

### Tips for presenting

- Start with **diagram 1**, then **3** for the “happy path,” then **2** or **4** for depth.
- **Diagram 4** is useful for onboarding engineers on the React side.
- Export: paste each fenced block into [mermaid.live](https://mermaid.live) → Actions → PNG/SVG.
