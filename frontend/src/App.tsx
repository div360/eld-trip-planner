import { useCallback, useState } from "react";
import { planTrip } from "./api/planTrip";
import { DriversDailyLogSheet } from "./components/DriversDailyLogSheet";
import { RouteMap } from "./components/RouteMap";
import { StopsAndRestsList } from "./components/StopsAndRestsList";
import { TripForm } from "./components/TripForm";
import type { TripPlanRequest, TripPlanResponse } from "./types/trip";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);

  const onPlan = useCallback(async (body: TripPlanRequest) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await planTrip(body);
      setPlan(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <header className="mb-12 text-center">
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <span className="ui-pill">Logistics</span>
          <span className="ui-pill">Route</span>
          <span className="ui-pill">HOS</span>
          <span className="ui-pill border-eld-accent/50 text-eld-accent/80">Compliance</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-spotter-turquoise/90">
          ELD Trip Planner
        </p>
        <h1 className="mt-3 bg-gradient-to-br from-spotter-turquoise via-white to-eld-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Route &amp; hours of service
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-spotter-cream/55">
          Property-carrying driver, 70 h / 8-day cycle, no adverse conditions. Modeled fuel at least about every 1,000
          trip miles; 1 h on-duty not driving at pickup and 1 h at dropoff.
        </p>
      </header>

      <TripForm loading={loading} onSubmit={onPlan} />

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200 backdrop-blur-sm"
        >
          {error}
        </div>
      ) : null}

      {plan ? (
        <section className="mt-14 space-y-10">
          <div className="rounded-3xl border border-white/10 bg-spotter-surface/35 p-6 shadow-glass backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Trip summary</h2>
                <p className="mt-1 text-sm text-spotter-cream/55">
                  About {plan.total_distance_miles.toFixed(0)} mi total · {plan.total_trip_days} day
                  {plan.total_trip_days === 1 ? "" : "s"} of logs
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spotter-turquoise/80">
                HOS model (this plan)
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-spotter-cream/60">
                <li>{plan.hos_assumptions.driver_category}</li>
                <li>
                  {plan.hos_assumptions.rolling_cycle}
                  {plan.hos_assumptions.adverse_driving_conditions ? "" : " · adverse conditions not applied"}
                </li>
                <li>
                  Fuel: {plan.hos_assumptions.fuel_on_duty_not_driving_hrs_per_event} h on-duty per fuel event; at least
                  about every {plan.hos_assumptions.fuel_interval_trip_miles} mi of trip driving distance
                </li>
                <li>
                  Pickup / dropoff: {plan.hos_assumptions.pickup_on_duty_not_driving_hrs} h and{" "}
                  {plan.hos_assumptions.dropoff_on_duty_not_driving_hrs} h on-duty not driving (respectively)
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-spotter-surface/35 p-6 shadow-glass backdrop-blur-xl sm:p-8">
            <h3 className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide text-white">
              Route, stops &amp; rests
              <span className="ui-pill !text-[9px]">OpenStreetMap</span>
            </h3>
            <RouteMap routePolyline={plan.route_polyline} stops={plan.stops} />
            <div className="mt-5">
              <StopsAndRestsList stops={plan.stops} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-spotter-cream/80">Driver&apos;s daily logs</h3>
            <div className="space-y-8">
              {plan.daily_logs.map((log) => (
                <div key={log.date}>
                  <DriversDailyLogSheet
                    log={log}
                    sheet={plan.sheet_inputs}
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
