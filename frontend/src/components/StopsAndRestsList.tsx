import type { TripStopDTO } from "../types/trip";

const KIND_LABEL: Record<string, string> = {
  current: "Start (current location)",
  pickup: "Pickup",
  dropoff: "Dropoff",
  fuel: "Fuel stop",
  rest: "Rest / break",
  restart: "34-hour restart",
};

function formatEta(hours: number): string {
  if (hours < 24 - 1e-6) {
    return `${hours.toFixed(2)} h from trip start`;
  }
  const d = Math.floor(hours / 24);
  const r = hours - d * 24;
  return `Day ${d + 1} + ${r.toFixed(2)} h`;
}

/**
 * Tabular list of all route stops and HOS-driven rests (fuel, breaks, restarts) with ETA text.
 */
export function StopsAndRestsList(props: { stops: TripStopDTO[] }) {
  const sorted = [...props.stops].sort((a, b) => a.eta_hours_from_start - b.eta_hours_from_start);

  return (
    <div className="rounded-2xl border border-white/10 bg-spotter-deep/45 p-4 shadow-glass backdrop-blur-sm">
      <h4 className="text-sm font-semibold text-spotter-turquoise">Stops &amp; rests (in trip order)</h4>
      <p className="mt-1 text-xs leading-relaxed text-spotter-cream/50">
        Fuel, breaks, and restarts use approximate positions along the planned route (by driving time). Waypoints use
        geocoded coordinates.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-spotter-bg/50 text-[10px] uppercase tracking-wide text-spotter-cream/45">
              <th className="py-2.5 pr-2 font-semibold">Type</th>
              <th className="py-2.5 pr-2 font-semibold">When</th>
              <th className="py-2.5 pr-2 font-semibold">Location / note</th>
              <th className="py-2.5 font-semibold">Map</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={`${s.type}-${i}-${s.eta_hours_from_start}`} className="border-b border-white/5">
                <td className="py-2.5 pr-2 font-medium text-spotter-cream/95">{KIND_LABEL[s.type] ?? s.type}</td>
                <td className="py-2.5 pr-2 font-mono tabular-nums text-spotter-turquoise/90">
                  {formatEta(s.eta_hours_from_start)}
                </td>
                <td className="py-2.5 pr-2 text-spotter-cream/80">
                  <div>{s.location}</div>
                  {s.detail ? <div className="text-[10px] text-spotter-cream/45">{s.detail}</div> : null}
                </td>
                <td className="py-2.5 text-[10px] text-spotter-cream/45">
                  {s.lat != null && s.lng != null ? `${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
