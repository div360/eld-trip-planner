"""Interpolate positions along an encoded route for map stops without a fixed address."""

from __future__ import annotations

import math

import polyline

from trips.schemas.trip_output import DutyStatus
from trips.services.hos_service import HosSegment


def total_drive_hours(segments: list[HosSegment]) -> float:
    return sum(seg.end_h - seg.start_h for seg in segments if seg.status == DutyStatus.DRIVING)


def cumulative_drive_hours_before(segments: list[HosSegment], t: float) -> float:
    """Sum driving hours strictly before simulated time ``t`` (hours from trip start)."""
    total = 0.0
    for seg in segments:
        if seg.status != DutyStatus.DRIVING:
            continue
        if seg.end_h <= t:
            total += seg.end_h - seg.start_h
        elif seg.start_h < t:
            total += t - seg.start_h
    return total


def interpolate_polyline_latlng(encoded: str, fraction: float) -> tuple[float, float] | None:
    """
    ``fraction`` in [0, 1] along cumulative chord length of decoded polyline.
    Returns (lat, lng) for Leaflet.
    """
    if not encoded:
        return None
    pts = polyline.decode(encoded)
    if not pts:
        return None
    f = max(0.0, min(1.0, fraction))
    if len(pts) == 1:
        return (float(pts[0][0]), float(pts[0][1]))

    lengths: list[float] = []
    for i in range(len(pts) - 1):
        lengths.append(
            math.hypot(float(pts[i][0]) - float(pts[i + 1][0]), float(pts[i][1]) - float(pts[i + 1][1]))
        )
    total_len = sum(lengths)
    if total_len < 1e-12:
        return (float(pts[0][0]), float(pts[0][1]))

    target = f * total_len
    acc = 0.0
    for i, ln in enumerate(lengths):
        if acc + ln >= target - 1e-9:
            tseg = (target - acc) / ln if ln > 0 else 0.0
            lat = float(pts[i][0]) + tseg * (float(pts[i + 1][0]) - float(pts[i][0]))
            lng = float(pts[i][1]) + tseg * (float(pts[i + 1][1]) - float(pts[i][1]))
            return (lat, lng)
        acc += ln
    return (float(pts[-1][0]), float(pts[-1][1]))


def lat_lng_for_drive_fraction(encoded: str, segments: list[HosSegment], eta_hours: float) -> tuple[float, float] | None:
    """
    Map simulated time to a point on the route using fraction of **total driving** time
    (rest/fuel do not advance along the road in this model).
    """
    td = total_drive_hours(segments)
    if td <= 1e-9:
        return interpolate_polyline_latlng(encoded, 0.0)
    cd = cumulative_drive_hours_before(segments, eta_hours)
    frac = max(0.0, min(1.0, cd / td))
    return interpolate_polyline_latlng(encoded, frac)
