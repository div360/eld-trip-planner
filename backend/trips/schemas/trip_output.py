from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DutyStatus(str, Enum):
    OFF_DUTY = "OFF"
    SLEEPER_BERTH = "SB"
    DRIVING = "D"
    ON_DUTY_NOT_DRIVING = "ON"


class ELDSegment(BaseModel):
    """One continuous duty status on a daily log (hours are 0–24 on that calendar day)."""

    start_hour: float = Field(..., ge=0, le=24)
    end_hour: float = Field(..., ge=0, le=24)
    status: DutyStatus
    location: str = Field(default="")


class DailyLog(BaseModel):
    date: str
    segments: list[ELDSegment]
    total_driving_hrs: float = 0.0
    total_on_duty_hrs: float = 0.0


class HosAssumptions(BaseModel):
    """Rules applied by ``trips.services.hos_service`` when building duty segments."""

    driver_category: str = Field(
        ...,
        description="US property-carrying driver — 11 h drive / 14 h window after 10 h off",
    )
    rolling_cycle: str = Field(..., description="FMCSA 70-hour / 8-day (simulated with 34 h restarts)")
    adverse_driving_conditions: bool = Field(
        default=False,
        description="False: no adverse-conditions extension to drive/window limits",
    )
    pickup_on_duty_not_driving_hrs: float
    dropoff_on_duty_not_driving_hrs: float
    fuel_interval_trip_miles: float = Field(
        ...,
        description="Trip odometer advances on driving; each 1,000 mi band triggers a fuel event",
    )
    fuel_on_duty_not_driving_hrs_per_event: float


class TripOutput(BaseModel):
    route_polyline: str = Field(default="", description="Google-encoded polyline for the full route")
    stops: list[dict[str, Any]] = Field(default_factory=list)
    daily_logs: list[DailyLog] = Field(default_factory=list)
    total_distance_miles: float = 0.0
    total_trip_days: int = 0
    hos_assumptions: HosAssumptions = Field(
        ...,
        description="HOS model metadata (matches calculation — not user inputs)",
    )
    sheet_inputs: dict[str, Any] = Field(
        default_factory=dict,
        description="Echo of submitted trip/log header fields for rendering the daily log sheet",
    )
