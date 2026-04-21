import type { TripPlanRequest, TripPlanResponse } from "../types/trip";

const KEY_FORM = "eld-trip-planner:v1:form";
const KEY_PLAN = "eld-trip-planner:v1:plan";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPersistedForm(): TripPlanRequest | null {
  if (typeof window === "undefined") {
    return null;
  }
  const data = safeParse<TripPlanRequest>(localStorage.getItem(KEY_FORM));
  if (!data || typeof data !== "object") {
    return null;
  }
  return data;
}

export function savePersistedForm(values: TripPlanRequest): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(KEY_FORM, JSON.stringify(values));
  } catch {
    // quota / private mode
  }
}

export function loadPersistedPlan(): TripPlanResponse | null {
  if (typeof window === "undefined") {
    return null;
  }
  const data = safeParse<TripPlanResponse>(localStorage.getItem(KEY_PLAN));
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as TripPlanResponse).daily_logs) ||
    !(data as TripPlanResponse).hos_assumptions
  ) {
    return null;
  }
  return data;
}

export function savePersistedPlan(plan: TripPlanResponse | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (plan === null) {
      localStorage.removeItem(KEY_PLAN);
    } else {
      localStorage.setItem(KEY_PLAN, JSON.stringify(plan));
    }
  } catch {
    // quota
  }
}

export function clearAllTripPersistence(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(KEY_FORM);
  localStorage.removeItem(KEY_PLAN);
}
