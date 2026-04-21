from pydantic import BaseModel, Field, field_validator


class TripInput(BaseModel):
    """API request body for trip planning."""

    current_location: str = Field(..., min_length=1, description="Driver's current city or address")
    pickup_location: str = Field(..., min_length=1)
    dropoff_location: str = Field(..., min_length=1)
    current_cycle_used_hrs: float = Field(..., ge=0, description="Hours already used in the 70-hour / 8-day window")
    truck_number: str = Field(..., min_length=1, description="Tractor / truck unit ID (required for daily log header)")

    trailer_number: str | None = Field(default=None, description="Trailer 1 — optional")
    trailer_number_2: str | None = Field(default=None, description="Trailer 2 — optional")
    carrier_name: str | None = Field(default=None)
    carrier_main_office: str | None = Field(default=None)
    carrier_home_terminal: str | None = Field(default=None)
    total_miles_driving_today: float | None = Field(default=None, ge=0, description="Optional override for log header")
    total_mileage_today: float | None = Field(default=None, ge=0, description="Optional odometer / total mileage")
    shipping_manifest: str | None = Field(default=None, description="DVL or manifest number")
    shipper_commodity: str | None = Field(default=None)

    @field_validator("current_cycle_used_hrs")
    @classmethod
    def cycle_must_be_under_70(cls, v: float) -> float:
        if v >= 70:
            raise ValueError("Cycle hours must be strictly less than 70 (reset required before driving)")
        return v
