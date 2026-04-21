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
    <div className="rounded-2xl border border-eld-teal/25 bg-white/95 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-eld-teal">Stops &amp; rests (in trip order)</h4>
      <p className="mt-1 text-xs text-slate-600">
        Fuel, breaks, and restarts use approximate positions along the planned route (by driving time). Waypoints use
        geocoded coordinates.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-eld-mist bg-eld-mist/40 text-[10px] uppercase tracking-wide text-slate-600">
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">When</th>
              <th className="py-2 pr-2">Location / note</th>
              <th className="py-2">Map</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={`${s.type}-${i}-${s.eta_hours_from_start}`} className="border-b border-slate-100">
                <td className="py-2 pr-2 font-medium text-slate-800">{KIND_LABEL[s.type] ?? s.type}</td>
                <td className="py-2 pr-2 font-mono tabular-nums text-slate-700">{formatEta(s.eta_hours_from_start)}</td>
                <td className="py-2 pr-2 text-slate-700">
                  <div>{s.location}</div>
                  {s.detail ? <div className="text-[10px] text-slate-500">{s.detail}</div> : null}
                </td>
                <td className="py-2 text-[10px] text-slate-500">
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
