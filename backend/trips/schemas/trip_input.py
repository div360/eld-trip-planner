from pydantic import BaseModel, Field, field_validator


class TripInput(BaseModel):
    """API request body for trip planning."""

    current_location: str = Field(..., min_length=1, description="Driver's current city or address")
    pickup_location: str = Field(..., min_length=1)
    dropoff_location: str = Field(..., min_length=1)
    current_cycle_used_hrs: float = Field(..., ge=0, description="Hours already used in the 70-hour / 8-day window")

    @field_validator("current_cycle_used_hrs")
    @classmethod
    def cycle_must_be_under_70(cls, v: float) -> float:
        if v >= 70:
            raise ValueError("Cycle hours must be strictly less than 70 (reset required before driving)")
        return v
