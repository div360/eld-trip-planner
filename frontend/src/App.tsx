import { useCallback, useRef, useState } from "react";
import { planTrip } from "./api/planTrip";
import { DriversDailyLogSheet } from "./components/DriversDailyLogSheet";
import { RouteMap } from "./components/RouteMap";
import { StopsAndRestsList } from "./components/StopsAndRestsList";
import { TripForm } from "./components/TripForm";
import type { TripPlanRequest, TripPlanResponse } from "./types/trip";
import { downloadDailyLogsAsPng } from "./utils/downloadDailyLogsImage";
import { clearAllTripPersistence, loadPersistedPlan, savePersistedPlan } from "./utils/tripPersist";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlanResponse | null>(() => loadPersistedPlan());
  /** Bump to remount TripForm after clearing local storage. */
  const [formKey, setFormKey] = useState(0);
  const [exportingLogs, setExportingLogs] = useState(false);
  const dailyLogsCaptureRef = useRef<HTMLDivElement>(null);

  const onPlan = useCallback(async (body: TripPlanRequest) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    savePersistedPlan(null);
    try {
      const res = await planTrip(body);
      setPlan(res);
      savePersistedPlan(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const onClearSaved = useCallback(() => {
    clearAllTripPersistence();
    setPlan(null);
    setError(null);
    setFormKey((k) => k + 1);
  }, []);

  const onDownloadLogImages = useCallback(async () => {
    if (!plan || !dailyLogsCaptureRef.current) {
      return;
    }
    setExportingLogs(true);
    setError(null);
    try {
      const dates = plan.daily_logs.map((l) => l.date);
      const first = dates[0] ?? "log";
      const last = dates[dates.length - 1] ?? first;
      const slug = `eld-daily-logs_${first}_to_${last}`.replace(/[^\w.-]+/g, "_");
      await downloadDailyLogsAsPng(dailyLogsCaptureRef.current, slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create image of daily logs.");
    } finally {
      setExportingLogs(false);
    }
  }, [plan]);

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
        <p className="mx-auto mt-3 max-w-2xl text-xs text-spotter-turquoise/60">
          Your form inputs and last successful plan are saved in this browser. Refresh the page to restore them.
        </p>
      </header>

      <TripForm key={formKey} loading={loading} onSubmit={onPlan} />

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
              <button
                type="button"
                onClick={onClearSaved}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-spotter-cream/70 transition hover:border-white/35 hover:text-spotter-cream"
              >
                Clear saved trip
              </button>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold tracking-wide text-spotter-cream/80">Driver&apos;s daily logs</h3>
              <button
                type="button"
                disabled={exportingLogs || plan.daily_logs.length === 0}
                onClick={() => void onDownloadLogImages()}
                className="rounded-lg border border-spotter-turquoise/40 bg-spotter-turquoise/10 px-3 py-1.5 text-xs font-semibold text-spotter-turquoise transition hover:bg-spotter-turquoise/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportingLogs ? "Creating image…" : "Download daily logs (PNG)"}
              </button>
            </div>
            <p className="mb-4 text-[11px] text-spotter-cream/45">
              Saves one PNG with every log sheet stacked, matching what you see on screen (paper-style layout).
            </p>
            <div ref={dailyLogsCaptureRef} className="space-y-8">
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
