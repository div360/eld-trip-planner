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


class TripOutput(BaseModel):
    route_polyline: str = Field(default="", description="Google-encoded polyline for the full route")
    stops: list[dict[str, Any]] = Field(default_factory=list)
    daily_logs: list[DailyLog] = Field(default_factory=list)
    total_distance_miles: float = 0.0
    total_trip_days: int = 0
