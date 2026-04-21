"""
Geocode addresses and fetch a single ORS driving route (current → pickup → dropoff).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import polyline

from trips.schemas.trip_input import TripInput
from trips.utils.map_client import GeocodeResult, OpenRouteServiceClient


@dataclass
class RouteComputation:
    total_distance_miles: float
    drive_to_pickup_hours: float
    drive_pickup_to_dropoff_hours: float
    distance_to_pickup_miles: float
    distance_pickup_to_dropoff_miles: float
    encoded_polyline: str
    geocoded: dict[str, GeocodeResult]
    raw_directions: dict[str, Any]


def _meters_to_miles(m: float) -> float:
    return float(m) * 0.000621371


def _parse_segment_durations_hours(feature: dict[str, Any]) -> tuple[float, float]:
    """
    ORS returns one feature with properties.segments for each leg between coordinates.
    Returns (hours_leg0_to_waypoint1, hours_rest) for exactly two driving legs.
    """
    props = feature.get("properties") or {}
    segments = props.get("segments") or []
    if len(segments) >= 2:
        d0 = float(segments[0].get("duration", 0)) / 3600.0
        d1 = float(segments[1].get("duration", 0)) / 3600.0
        return d0, d1
    summary = props.get("summary") or {}
    total_s = float(summary.get("duration", 0))
    if total_s <= 0:
        return 0.0, 0.0
    # Fallback: split by distance if only one segment
    if len(segments) == 1:
        dist = float(segments[0].get("distance", 0))
        # Assume two equal time halves if geometry has no breakdown (rare)
        if dist > 0:
            # Cannot split without second segment — use 40/60 heuristic toward dropoff
            return total_s / 3600.0 * 0.35, total_s / 3600.0 * 0.65
    return total_s / 3600.0 * 0.35, total_s / 3600.0 * 0.65


def _parse_leg_distances_miles(feature: dict[str, Any]) -> tuple[float, float]:
    props = feature.get("properties") or {}
    segments = props.get("segments") or []
    if len(segments) >= 2:
        d0 = _meters_to_miles(float(segments[0].get("distance", 0)))
        d1 = _meters_to_miles(float(segments[1].get("distance", 0)))
        return d0, d1
    summary = props.get("summary") or {}
    only = _meters_to_miles(float(summary.get("distance", 0)))
    return only * 0.35, only * 0.65


def _encode_polyline_from_feature(feature: dict[str, Any]) -> str:
    geom = feature.get("geometry") or {}
    coords = geom.get("coordinates") or []
    if not coords:
        return ""
    latlng = [(float(c[1]), float(c[0])) for c in coords]  # polyline expects lat,lng
    return polyline.encode(latlng)


def compute_route(trip: TripInput, client: OpenRouteServiceClient | None = None) -> RouteComputation:
    c = client or OpenRouteServiceClient()
    cur = c.geocode(trip.current_location)
    pik = c.geocode(trip.pickup_location)
    drp = c.geocode(trip.dropoff_location)
    geocoded = {"current": cur, "pickup": pik, "dropoff": drp}

    coordinate_pairs = [(cur.lng, cur.lat), (pik.lng, pik.lat), (drp.lng, drp.lat)]
    raw = c.directions_driving(coordinate_pairs)
    feats = raw.get("features") or []
    if not feats:
        raise ValueError("Directions response missing features")
    feature = feats[0]

    summary = (feature.get("properties") or {}).get("summary") or {}
    total_miles = _meters_to_miles(float(summary.get("distance", 0)))

    h0, h1 = _parse_segment_durations_hours(feature)
    leg0_miles, leg1_miles = _parse_leg_distances_miles(feature)
    encoded = _encode_polyline_from_feature(feature)

    return RouteComputation(
        total_distance_miles=total_miles,
        drive_to_pickup_hours=h0,
        drive_pickup_to_dropoff_hours=h1,
        distance_to_pickup_miles=leg0_miles,
        distance_pickup_to_dropoff_miles=leg1_miles,
        encoded_polyline=encoded,
        geocoded=geocoded,
        raw_directions=raw,
    )
