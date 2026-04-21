from __future__ import annotations

from datetime import date
from typing import Any

from django.utils import timezone
from pydantic import ValidationError as PydanticValidationError
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from trips.schemas.trip_input import TripInput
from trips.schemas.trip_output import TripOutput
from trips.services.eld_service import build_daily_logs
from trips.services.hos_service import HosSegment, plan_hos_segments
from trips.services.route_service import compute_route
from trips.utils.map_client import MapClientError, OpenRouteServiceClient
from trips.utils.route_geometry import lat_lng_for_drive_fraction


def _build_stops(route, hos_segments: list[HosSegment]) -> list[dict[str, Any]]:
    g = route.geocoded
    stops: list[dict[str, Any]] = []

    def append_stop(
        *,
        kind: str,
        label: str,
        lat: float | None,
        lng: float | None,
        eta_hours: float,
        detail: str = "",
    ) -> None:
        stops.append(
            {
                "type": kind,
                "location": label,
                "lat": lat,
                "lng": lng,
                "eta_hours_from_start": round(eta_hours, 3),
                "detail": detail,
            }
        )

    append_stop(
        kind="current",
        label=g["current"].label,
        lat=g["current"].lat,
        lng=g["current"].lng,
        eta_hours=0.0,
    )

    pickup_eta = 0.0
    dropoff_eta = 0.0
    for seg in hos_segments:
        loc = seg.location.lower()
        if "pickup" in loc and seg.status.value == "ON":
            pickup_eta = seg.start_h
        if "dropoff" in loc and seg.status.value == "ON":
            dropoff_eta = seg.start_h

    append_stop(
        kind="pickup",
        label=g["pickup"].label,
        lat=g["pickup"].lat,
        lng=g["pickup"].lng,
        eta_hours=pickup_eta,
    )
    append_stop(
        kind="dropoff",
        label=g["dropoff"].label,
        lat=g["dropoff"].lat,
        lng=g["dropoff"].lng,
        eta_hours=dropoff_eta,
    )

    encoded = route.encoded_polyline

    for seg in hos_segments:
        if "fuel" in seg.location.lower():
            pos = lat_lng_for_drive_fraction(encoded, hos_segments, seg.start_h)
            append_stop(
                kind="fuel",
                label=seg.location,
                lat=pos[0] if pos else None,
                lng=pos[1] if pos else None,
                eta_hours=seg.start_h,
                detail="On-duty fueling (30 minutes) — approximate map position along route",
            )
        elif seg.status.value == "OFF" and ("10-hour" in seg.location or "30-minute" in seg.location):
            pos = lat_lng_for_drive_fraction(encoded, hos_segments, seg.start_h)
            append_stop(
                kind="rest",
                label=seg.location,
                lat=pos[0] if pos else None,
                lng=pos[1] if pos else None,
                eta_hours=seg.start_h,
                detail="Off-duty rest / break — approximate map position along route",
            )
        elif seg.status.value == "OFF" and "34-hour" in seg.location:
            pos = lat_lng_for_drive_fraction(encoded, hos_segments, seg.start_h)
            append_stop(
                kind="restart",
                label=seg.location,
                lat=pos[0] if pos else None,
                lng=pos[1] if pos else None,
                eta_hours=seg.start_h,
                detail="34-hour restart — approximate map position along route",
            )

    stops.sort(key=lambda x: (x["eta_hours_from_start"], x["type"]))
    return stops


class HealthView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class PlanTripView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request: Request) -> Response:
        try:
            trip_in = TripInput.model_validate(request.data)
        except PydanticValidationError as exc:
            return Response({"detail": exc.errors()}, status=status.HTTP_400_BAD_REQUEST)

        client = OpenRouteServiceClient()
        try:
            route = compute_route(trip_in, client)
        except MapClientError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        hos_segments = plan_hos_segments(
            drive_to_pickup_hours=route.drive_to_pickup_hours,
            drive_pickup_to_dropoff_hours=route.drive_pickup_to_dropoff_hours,
            distance_to_pickup_miles=route.distance_to_pickup_miles,
            distance_pickup_to_dropoff_miles=route.distance_pickup_to_dropoff_miles,
            current_cycle_used_hrs=trip_in.current_cycle_used_hrs,
        )

        trip_start: date = timezone.now().date()
        daily_logs = build_daily_logs(hos_segments, trip_start)
        stops = _build_stops(route, hos_segments)

        total_days = len(daily_logs)
        if hos_segments:
            span_days = int(hos_segments[-1].end_h // 24) + 1
            total_days = max(total_days, span_days)

        out = TripOutput(
            route_polyline=route.encoded_polyline,
            stops=stops,
            daily_logs=daily_logs,
            total_distance_miles=round(route.total_distance_miles, 2),
            total_trip_days=total_days,
            sheet_inputs=trip_in.model_dump(mode="json"),
        )
        return Response(out.model_dump(mode="json"))


class TripDetailView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request: Request, trip_id) -> Response:
        return Response(
            {"detail": "Trip persistence is not enabled (Phase 2)."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
