import pytest

from trips.schemas.trip_output import DutyStatus
from trips.services.hos_service import plan_hos_segments


def _total_hours(segs, status: DutyStatus) -> float:
    return sum(s.end_h - s.start_h for s in segs if s.status == status)


def test_eight_hours_driving_inserts_thirty_minute_break_before_more_driving():
    segs = plan_hos_segments(
        drive_to_pickup_hours=9.0,
        drive_pickup_to_dropoff_hours=0.0,
        distance_to_pickup_miles=450.0,
        distance_pickup_to_dropoff_miles=0.0,
        current_cycle_used_hrs=0.0,
    )
    driving = [s for s in segs if s.status == DutyStatus.DRIVING]
    assert driving[0].end_h - driving[0].start_h == pytest.approx(8.0, rel=1e-3)
    breaks = [s for s in segs if s.status == DutyStatus.OFF_DUTY and "30-minute" in s.location]
    assert breaks, "expected a 30-minute break after 8 hours driving"


def test_eleven_hour_driving_requires_ten_hour_reset_before_more_driving():
    segs = plan_hos_segments(
        drive_to_pickup_hours=12.0,
        drive_pickup_to_dropoff_hours=0.0,
        distance_to_pickup_miles=600.0,
        distance_pickup_to_dropoff_miles=0.0,
        current_cycle_used_hrs=0.0,
    )
    drive_h = _total_hours(segs, DutyStatus.DRIVING)
    assert drive_h >= 11.0
    resets = [s for s in segs if s.status == DutyStatus.OFF_DUTY and "10-hour" in s.location]
    assert resets, "expected 10-hour reset after hitting 11-hour drive limit"


def test_pickup_and_dropoff_add_on_duty_hours():
    segs = plan_hos_segments(
        drive_to_pickup_hours=1.0,
        drive_pickup_to_dropoff_hours=1.0,
        distance_to_pickup_miles=50.0,
        distance_pickup_to_dropoff_miles=50.0,
        current_cycle_used_hrs=0.0,
    )
    on = _total_hours(segs, DutyStatus.ON_DUTY_NOT_DRIVING)
    assert on >= 2.0


def test_fuel_stop_modeled_after_one_thousand_miles():
    segs = plan_hos_segments(
        drive_to_pickup_hours=0.0,
        drive_pickup_to_dropoff_hours=20.0,
        distance_to_pickup_miles=0.0,
        distance_pickup_to_dropoff_miles=1200.0,
        current_cycle_used_hrs=0.0,
    )
    fuel = [s for s in segs if "fuel" in s.location.lower()]
    assert fuel, "expected at least one modeled fuel stop for >1000 miles"


def test_high_cycle_used_triggers_thirty_four_hour_restart_before_long_drive():
    segs = plan_hos_segments(
        drive_to_pickup_hours=0.0,
        drive_pickup_to_dropoff_hours=8.0,
        distance_to_pickup_miles=0.0,
        distance_pickup_to_dropoff_miles=400.0,
        current_cycle_used_hrs=69.0,
    )
    restarts = [s for s in segs if "34-hour" in s.location]
    assert restarts, "expected a 34-hour restart when starting near the 70-hour limit"
