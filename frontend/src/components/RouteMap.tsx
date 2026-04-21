import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TripStopDTO } from "../types/trip";
import { decodePolyline } from "../utils/decodePolyline";

function colorForStopType(t: string): string {
  if (t === "current") return "rgb(0, 128, 128)";
  if (t === "pickup" || t === "dropoff") return "rgb(248, 73, 96)";
  if (t === "fuel") return "#0f766e";
  return "#64748b";
}

function markerIcon(color: string) {
  return L.divIcon({
    className: "eld-map-marker",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 6px rgba(15,23,42,0.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function RouteMap(props: { routePolyline: string; stops: TripStopDTO[] }) {
  const positions = useMemo(() => decodePolyline(props.routePolyline), [props.routePolyline]);
  const center = useMemo((): [number, number] => {
    if (positions.length > 0) return positions[Math.floor(positions.length / 2)]!;
    return [39.5, -98.35];
  }, [positions]);

  const markers = props.stops.filter((s) => s.lat != null && s.lng != null);

  if (positions.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-eld-mist bg-white/70 text-sm text-slate-600">
        No route geometry yet — plan a trip with valid locations.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-eld-teal/20 shadow-eld">
      <MapContainer center={center} zoom={6} className="h-[420px] w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          pathOptions={{ color: "rgb(0, 128, 128)", weight: 5, opacity: 0.9 }}
        />
        {markers.map((s, i) => (
          <Marker
            key={`${s.type}-${i}-${s.eta_hours_from_start}`}
            position={[s.lat!, s.lng!]}
            icon={markerIcon(colorForStopType(s.type))}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold" style={{ color: colorForStopType(s.type) }}>
                  {s.type}
                </div>
                <div>{s.location}</div>
                {s.detail ? <div className="text-xs text-slate-600">{s.detail}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
