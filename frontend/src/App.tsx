import { useCallback, useState } from "react";
import { planTrip } from "./api/planTrip";
import { DriversDailyLogSheet } from "./components/DriversDailyLogSheet";
import { RouteMap } from "./components/RouteMap";
import { TripForm } from "./components/TripForm";
import type { TripPlanRequest, TripPlanResponse } from "./types/trip";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [lastTrip, setLastTrip] = useState<TripPlanRequest | null>(null);

  const onPlan = useCallback(async (body: TripPlanRequest) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await planTrip(body);
      setLastTrip(body);
      setPlan(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-eld-teal">ELD Trip Planner</p>
        <h1 className="mt-2 bg-gradient-to-r from-eld-teal to-eld-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Route &amp; hours of service
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
          Plan a load from current location through pickup to dropoff. The API returns an encoded route for the map
          and daily log grids for property 70-hour / 8-day rules.
        </p>
      </header>

      <TripForm loading={loading} onSubmit={onPlan} />

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {plan ? (
        <section className="mt-10 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-eld-teal">Trip summary</h2>
              <p className="text-sm text-slate-600">
                About {plan.total_distance_miles.toFixed(0)} mi total · {plan.total_trip_days} day
                {plan.total_trip_days === 1 ? "" : "s"} of logs
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Route &amp; stops</h3>
            <RouteMap routePolyline={plan.route_polyline} stops={plan.stops} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Driver&apos;s daily logs</h3>
            <div className="space-y-8">
              {plan.daily_logs.map((log) => (
                <div key={log.date}>
                  <DriversDailyLogSheet
                    log={log}
                    fromLabel={lastTrip?.current_location ?? "—"}
                    toLabel={lastTrip?.dropoff_location ?? "—"}
                    currentCycleUsedHrs={lastTrip?.current_cycle_used_hrs}
                    totalTripMiles={plan.total_distance_miles}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
