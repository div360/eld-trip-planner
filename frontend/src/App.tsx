import { useCallback, useRef, useState } from "react";
import { planTrip } from "./api/planTrip";
import { MapPinClusterIcon, RouteBoltIcon, TruckIcon } from "./components/DecorIcons";
import { DriversDailyLogSheet } from "./components/DriversDailyLogSheet";
import { RouteMap } from "./components/RouteMap";
import { StopsAndRestsList } from "./components/StopsAndRestsList";
import { TripForm } from "./components/TripForm";
import { TripPlanningLoader } from "./components/TripPlanningLoader";
import type { TripPlanRequest, TripPlanResponse } from "./types/trip";
import { downloadDailyLogsAsPng } from "./utils/downloadDailyLogsImage";
import { clearAllTripPersistence, loadPersistedPlan, savePersistedPlan } from "./utils/tripPersist";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlanResponse | null>(() => loadPersistedPlan());
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

  /** Clear persisted form + plan and remount the form (used by “Start new trip” and “Clear saved trip”). */
  const clearTripAndForm = useCallback(() => {
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
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient orbs — depth without clutter */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="animate-float-glow absolute -right-20 top-0 h-[28rem] w-[28rem] rounded-full bg-spotter-turquoise/[0.12] blur-[100px]" />
        <div className="animate-float-glow-delayed absolute -left-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-eld-accent/[0.11] blur-[90px]" />
        <div
          className="animate-border-glow absolute left-1/2 top-[18%] h-72 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-eld-teal/15 via-spotter-turquoise/10 to-eld-accent/15 blur-[80px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(10,18,24,0.4)_45%,#13242c_100%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 motion-reduce:transition-none">
        <header className="motion-reduce:animate-none relative mb-14 text-center motion-safe:animate-fade-up">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-40 motion-safe:animate-border-glow">
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-spotter-turquoise/60 to-transparent" />
          </div>

          <div className="mb-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
            <div
              className="text-spotter-turquoise motion-reduce:animate-none motion-safe:animate-icon-bob motion-safe:opacity-90"
              aria-hidden
            >
              <TruckIcon className="h-16 w-20 sm:h-[4.5rem] sm:w-24" />
            </div>
            <div className="max-w-xl">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-spotter-turquoise/90">
                <RouteBoltIcon className="h-4 w-4 text-spotter-turquoise/80 motion-safe:animate-pulse" />
                ELD Trip Planner
                <RouteBoltIcon className="h-4 w-4 scale-x-[-1] text-eld-accent/70 motion-safe:animate-pulse" />
              </div>
              <h1 className="mt-4 bg-gradient-to-br from-spotter-turquoise via-white to-eld-accent bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent drop-shadow-sm sm:text-5xl sm:leading-tight">
                Route &amp; hours of service
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-spotter-cream/55">
                Property-carrying driver, 70 h / 8-day cycle, no adverse conditions. Modeled fuel at least about every
                1,000 trip miles; 1 h on-duty not driving at pickup and 1 h at dropoff.
              </p>
              <p className="mx-auto mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-spotter-turquoise/55">
                <MapPinClusterIcon className="h-4 w-4 shrink-0 text-spotter-turquoise/50" />
                Your form and last successful plan stay in this browser — refresh to restore.
              </p>
            </div>
            <div
              className="text-eld-accent/75 motion-reduce:animate-none motion-safe:animate-icon-bob-delay motion-safe:opacity-90"
              aria-hidden
            >
              <TruckIcon className="h-16 w-20 scale-x-[-1] sm:h-[4.5rem] sm:w-24" />
            </div>
          </div>
        </header>

        <div className="motion-reduce:animate-none motion-safe:animate-fade-up-slow">
          <TripForm
            key={formKey}
            loading={loading}
            onSubmit={onPlan}
            hasSavedPlan={plan !== null}
            onStartNewTrip={clearTripAndForm}
          />
          {loading ? <TripPlanningLoader /> : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="motion-safe:animate-fade-in mt-8 rounded-2xl border border-red-400/30 bg-red-950/50 px-4 py-3 text-sm text-red-100 shadow-[0_0_24px_-6px_rgba(248,73,96,0.35)] backdrop-blur-sm"
          >
            {error}
          </div>
        ) : null}

        {plan ? (
          <section className="mt-14 space-y-10 motion-reduce:animate-none motion-safe:animate-fade-up motion-safe:delay-100">
            <div className="ui-panel motion-safe:hover:translate-y-[-2px] p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-spotter-turquoise/25 bg-spotter-turquoise/10 text-spotter-turquoise">
                    <RouteBoltIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Trip summary</h2>
                    <p className="mt-1 text-sm text-spotter-cream/55">
                      About {plan.total_distance_miles.toFixed(0)} mi total · {plan.total_trip_days} day
                      {plan.total_trip_days === 1 ? "" : "s"} of logs
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearTripAndForm}
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-medium text-spotter-cream/75 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-spotter-cream"
                >
                  Clear saved trip
                </button>
              </div>
              <div className="mt-6 border-t border-white/[0.08] pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spotter-turquoise/85">
                  HOS model (this plan)
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-spotter-cream/60">
                  <li>{plan.hos_assumptions.driver_category}</li>
                  <li>
                    {plan.hos_assumptions.rolling_cycle}
                    {plan.hos_assumptions.adverse_driving_conditions ? "" : " · adverse conditions not applied"}
                  </li>
                  <li>
                    Fuel: {plan.hos_assumptions.fuel_on_duty_not_driving_hrs_per_event} h on-duty per fuel event; at
                    least about every {plan.hos_assumptions.fuel_interval_trip_miles} mi of trip driving distance
                  </li>
                  <li>
                    Pickup / dropoff: {plan.hos_assumptions.pickup_on_duty_not_driving_hrs} h and{" "}
                    {plan.hos_assumptions.dropoff_on_duty_not_driving_hrs} h on-duty not driving (respectively)
                  </li>
                </ul>
              </div>
            </div>

            <div className="ui-panel motion-safe:hover:translate-y-[-2px] p-6 sm:p-8">
              <h3 className="mb-4 flex flex-wrap items-center gap-3 text-sm font-semibold tracking-wide text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-spotter-turquoise">
                  <MapPinClusterIcon className="h-4 w-4" />
                </span>
                Route, stops &amp; rests
                <span className="ui-pill !text-[9px] border-spotter-turquoise/30 bg-spotter-turquoise/5 text-spotter-turquoise/90">
                  OpenStreetMap
                </span>
              </h3>
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.06] motion-safe:transition-shadow motion-safe:duration-500 motion-safe:hover:ring-spotter-turquoise/25">
                <RouteMap routePolyline={plan.route_polyline} stops={plan.stops} />
              </div>
              <div className="mt-5">
                <StopsAndRestsList stops={plan.stops} />
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-3 text-sm font-semibold tracking-wide text-spotter-cream/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-eld-accent/25 bg-eld-accent/10 text-eld-accent">
                    <TruckIcon className="h-5 w-5 text-eld-accent" />
                  </span>
                  Driver&apos;s daily logs
                </h3>
                <button
                  type="button"
                  disabled={exportingLogs || plan.daily_logs.length === 0}
                  onClick={() => void onDownloadLogImages()}
                  className="rounded-xl border border-spotter-turquoise/35 bg-spotter-turquoise/10 px-4 py-2 text-xs font-semibold text-spotter-turquoise shadow-[0_0_20px_-8px_rgba(64,224,208,0.4)] transition hover:border-spotter-turquoise/55 hover:bg-spotter-turquoise/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportingLogs ? "Creating image…" : "Download daily logs (PNG)"}
                </button>
              </div>
              <p className="mb-4 text-[11px] text-spotter-cream/45">
                One PNG with every log sheet stacked — matches the paper-style layout on screen.
              </p>
              <div ref={dailyLogsCaptureRef} className="space-y-8">
                {plan.daily_logs.map((log) => (
                  <div
                    key={log.date}
                    className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5"
                  >
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
    </div>
  );
}
