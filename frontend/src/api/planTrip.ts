import type { TripPlanRequest, TripPlanResponse } from "../types/trip";
import { getApiBaseUrl } from "./apiBaseUrl";

export async function planTrip(body: TripPlanRequest): Promise<TripPlanResponse> {
  const url = `${getApiBaseUrl()}/api/trips/plan/`;
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
