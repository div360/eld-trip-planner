import type { TripPlanRequest, TripPlanResponse } from "../types/trip";

function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  return (typeof v === "string" && v.length > 0 ? v : "http://127.0.0.1:8000").replace(/\/$/, "");
}

export async function planTrip(body: TripPlanRequest): Promise<TripPlanResponse> {
  const url = `${apiBase()}/api/trips/plan/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "detail" in data
        ? JSON.stringify((data as { detail: unknown }).detail)
        : res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return data as TripPlanResponse;
}
