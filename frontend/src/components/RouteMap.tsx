import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TripStopDTO } from "../types/trip";
import { decodePolyline } from "../utils/decodePolyline";

/** Spotter DNA: turquoise + coral — keep consistent with tailwind preset */
const TURQUOISE = "#40e0d0";
const CORAL = "rgb(248, 73, 96)";

function colorForStopType(t: string): string {
  if (t === "current") return TURQUOISE;
  if (t === "pickup" || t === "dropoff") return CORAL;
  if (t === "fuel") return "#2dd4bf";
  if (t === "rest") return "#818cf8";
  if (t === "restart") return "#c084fc";
  return "#94a3b8";
}

function markerIcon(kind: string, color: string) {
  let html: string;
  if (kind === "fuel") {
    html = `<div style="width:12px;height:12px;background:${color};border:2px solid #13242c;border-radius:3px;box-shadow:0 1px 8px rgba(64,224,208,0.45)"></div>`;
  } else if (kind === "rest") {
    html = `<div style="width:14px;height:14px;background:${color};border:2px dashed #13242c;border-radius:9999px;box-shadow:0 1px 8px rgba(129,140,248,0.4)"></div>`;
  } else if (kind === "restart") {
    html = `<div style="width:12px;height:12px;background:${color};border:2px solid #13242c;transform:rotate(45deg);box-shadow:0 1px 8px rgba(192,132,252,0.45)"></div>`;
  } else {
    html = `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #13242c;box-shadow:0 1px 10px rgba(248,73,96,0.35)"></div>`;
  }
  return L.divIcon({
    className: "eld-map-marker",
    html,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const LEGEND: { type: string; label: string }[] = [
  { type: "current", label: "Current" },
  { type: "pickup", label: "Pickup / Dropoff" },
  { type: "fuel", label: "Fuel" },
  { type: "rest", label: "Rest / break" },
  { type: "restart", label: "34h restart" },
];

export function RouteMap(props: { routePolyline: string; stops: TripStopDTO[] }) {
  const positions = useMemo(() => decodePolyline(props.routePolyline), [props.routePolyline]);
  const center = useMemo((): [number, number] => {
    if (positions.length > 0) return positions[Math.floor(positions.length / 2)]!;
    return [39.5, -98.35];
  }, [positions]);

  const markers = props.stops.filter((s) => s.lat != null && s.lng != null);

  if (positions.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-spotter-deep/60 text-sm text-spotter-cream/55">
        No route geometry yet — plan a trip with valid locations.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-map ring-1 ring-spotter-turquoise/20">
      <MapContainer center={center} zoom={6} className="h-[420px] w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: TURQUOISE, weight: 5, opacity: 0.92 }} />
        {markers.map((s, i) => (
          <Marker
            key={`${s.type}-${i}-${s.eta_hours_from_start}`}
            position={[s.lat!, s.lng!]}
            icon={markerIcon(s.type, colorForStopType(s.type))}
          >
            <Popup>
              <div className="max-w-xs text-sm">
                <div className="font-semibold capitalize" style={{ color: colorForStopType(s.type) }}>
                  {s.type.replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 text-slate-800">{s.location}</div>
                <div className="mt-1 font-mono text-xs text-slate-600">
                  ~{s.eta_hours_from_start.toFixed(2)} h from trip start
                </div>
                {s.detail ? <div className="mt-1 text-xs text-slate-600">{s.detail}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-white/15 bg-spotter-bg/92 px-3 py-2 text-[10px] text-spotter-cream/90 shadow-lg backdrop-blur-md">
        <p className="mb-1.5 font-semibold text-white">Legend</p>
        <ul className="space-y-1 text-spotter-cream/85">
          {LEGEND.map((row) => (
            <li key={row.type} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-spotter-deep"
                style={{ background: colorForStopType(row.type) }}
              />
              {row.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
