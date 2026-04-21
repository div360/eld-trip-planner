import { TruckIcon } from "./DecorIcons";

/**
 * Shown while POST /plan is in flight: moving truck on a “road” under the form.
 */
export function TripPlanningLoader() {
  return (
    <div
      className="motion-safe:animate-fade-in mt-10 w-full max-w-xl rounded-2xl border border-spotter-turquoise/25 bg-spotter-deep/50 px-5 py-6 shadow-[0_0_40px_-12px_rgba(64,224,208,0.15)] backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-spotter-cream/95">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-spotter-turquoise shadow-[0_0_8px_rgba(64,224,208,0.8)]" />
        Generating your trip…
      </div>
      <p className="mt-1 text-center text-xs text-spotter-cream/45">
        Geocoding route, running HOS rules, and building daily log sheets
      </p>

      <div className="relative mx-auto mt-5 h-[5.5rem] w-full max-w-md overflow-hidden rounded-xl bg-spotter-bg/50">
        <p className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-[0.25em] text-spotter-turquoise/35">
          En route
        </p>
        <div className="absolute bottom-[2.35rem] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-8 left-3 right-3 border-t-2 border-dashed border-spotter-turquoise/35" />
        {/* Truck moves along road; reduced motion: centered, no loop */}
        <div
          className="absolute bottom-1.5 h-14 w-14 text-spotter-turquoise drop-shadow-[0_0_16px_rgba(64,224,208,0.45)] motion-reduce:left-1/2 motion-reduce:-translate-x-1/2 motion-reduce:animate-none motion-safe:animate-truck-along"
          aria-hidden
        >
          <TruckIcon className="h-14 w-[4.25rem]" />
        </div>
      </div>
    </div>
  );
}
