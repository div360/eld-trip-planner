"""
FMCSA-style Hours of Service simulation for property-carrying drivers (US 70h/8d).

Model (deterministic, assessment-oriented):
- After ≥10 consecutive hours off-duty, an 11-hour driving allowance and a 14-hour **window**
  start. The window advances during off-duty periods shorter than 10 hours (including the
  30-minute driving break).
- 30 minutes off-duty after 8 hours driving before more driving.
- 10 consecutive hours off-duty resets the 11-hour / 14-hour clock.
- **70-hour / 8-day:** ``current_cycle_used_hrs`` plus all **driving** and **ON-duty not driving**
  time on this trip (since last 34-hour restart in the simulation) must stay ≤ 70. If a step
  would exceed 70, insert a **34-hour** off-duty restart (resets the simulated 70-hour tally).
- Pickup / dropoff: **1 hour** each on-duty not driving.
- Fuel: model **30 minutes** on-duty not driving for each **1,000 miles** of trip odometer
  accumulated since trip start (odometer does not reset at fuel events).
"""

from __future__ import annotations

from dataclasses import dataclass

from trips.schemas.trip_output import DutyStatus

EPS = 1e-6

MAX_DRIVE_AFTER_REST = 11.0
MAX_WINDOW_AFTER_REST = 14.0
MIN_OFF_RESET = 10.0
BREAK_OFF = 0.5
MAX_DRIVE_SINCE_BREAK = 8.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_ON_DUTY = 0.5
PICKUP_ON = 1.0
DROPOFF_ON = 1.0
RESTART_34 = 34.0


@dataclass
class HosSegment:
    start_h: float
    end_h: float
    status: DutyStatus
    location: str = ""


class _HosEngine:
    def __init__(self, current_cycle_used_hrs: float) -> None:
        self.t = 0.0
        self.segments: list[HosSegment] = []
        self.window_elapsed = 0.0
        self.drive_in_window = 0.0
        self.drive_since_break = 0.0
        self.cycle_used = float(current_cycle_used_hrs)
        self.trip_on_duty = 0.0
        self.odometer = 0.0
        self.fuel_stops_completed = 0

    def _rolling_70(self) -> float:
        return self.cycle_used + self.trip_on_duty

    def _append(self, dur: float, status: DutyStatus, location: str) -> None:
        if dur <= EPS:
            return
        start = self.t
        self.t += dur
        self.segments.append(HosSegment(start_h=start, end_h=self.t, status=status, location=location))
        if status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY_NOT_DRIVING):
            self.trip_on_duty += dur

    def _start_new_window(self) -> None:
        self.window_elapsed = 0.0
        self.drive_in_window = 0.0
        self.drive_since_break = 0.0

    def _apply_10h_reset(self, label: str) -> None:
        self._append(MIN_OFF_RESET, DutyStatus.OFF_DUTY, label)
        self._start_new_window()

    def _apply_30min_break(self) -> None:
        self._append(BREAK_OFF, DutyStatus.OFF_DUTY, "30-minute break (8-hour driving limit)")
        self.drive_since_break = 0.0
        self.window_elapsed += BREAK_OFF

    def _apply_34h_restart(self) -> None:
        self._append(RESTART_34, DutyStatus.OFF_DUTY, "34-hour restart (70-hour / 8-day limit)")
        self.cycle_used = 0.0
        self.trip_on_duty = 0.0
        self._start_new_window()

    def _max_drive_chunk(self) -> float:
        from_11 = max(0.0, MAX_DRIVE_AFTER_REST - self.drive_in_window)
        from_8 = max(0.0, MAX_DRIVE_SINCE_BREAK - self.drive_since_break)
        from_14 = max(0.0, MAX_WINDOW_AFTER_REST - self.window_elapsed)
        room_70 = max(0.0, 70.0 - self._rolling_70())
        return min(from_11, from_8, from_14, room_70)

    def _sync_fuel_stops(self) -> None:
        while self.fuel_stops_completed < int(self.odometer // FUEL_INTERVAL_MILES):
            self.fuel_stops_completed += 1
            self._consume_on_duty(FUEL_ON_DUTY, f"Fuel stop (~{self.fuel_stops_completed * int(FUEL_INTERVAL_MILES)} mi)")

    def _consume_on_duty(self, hours: float, location: str) -> None:
        remaining = hours
        while remaining > EPS:
            if self._rolling_70() >= 70.0 - EPS:
                self._apply_34h_restart()
                continue

            if self.window_elapsed >= MAX_WINDOW_AFTER_REST - EPS:
                self._apply_10h_reset("10-hour off-duty (14-hour window)")
                continue

            room_70 = max(0.0, 70.0 - self._rolling_70())
            room_win = max(0.0, MAX_WINDOW_AFTER_REST - self.window_elapsed)
            chunk = min(remaining, room_win, room_70)
            if chunk <= EPS:
                if self._rolling_70() >= 70.0 - EPS:
                    self._apply_34h_restart()
                else:
                    self._apply_10h_reset("10-hour off-duty (14-hour window)")
                continue

            self._append(chunk, DutyStatus.ON_DUTY_NOT_DRIVING, location)
            self.window_elapsed += chunk
            remaining -= chunk

    def _miles_rate(self, drive_hours: float, miles: float) -> float:
        if drive_hours <= EPS:
            return 0.0
        return miles / drive_hours

    def _consume_driving(self, drive_hours: float, miles: float, location: str) -> None:
        rate = self._miles_rate(drive_hours, miles)
        remaining = drive_hours

        while remaining > EPS:
            if self.window_elapsed >= MAX_WINDOW_AFTER_REST - EPS or self.drive_in_window >= MAX_DRIVE_AFTER_REST - EPS:
                self._apply_10h_reset("10-hour off-duty (11-hour / 14-hour limit)")
                continue

            if self.drive_since_break >= MAX_DRIVE_SINCE_BREAK - EPS:
                self._apply_30min_break()
                continue

            if self._rolling_70() >= 70.0 - EPS:
                self._apply_34h_restart()
                continue

            max_legal = self._max_drive_chunk()
            if max_legal <= EPS:
                if self.drive_since_break >= MAX_DRIVE_SINCE_BREAK - EPS:
                    self._apply_30min_break()
                elif self._rolling_70() >= 70.0 - EPS:
                    self._apply_34h_restart()
                else:
                    self._apply_10h_reset("10-hour off-duty (11-hour / 14-hour limit)")
                continue

            hrs_until_fuel = remaining
            if rate > EPS:
                next_milestone = (self.fuel_stops_completed + 1) * FUEL_INTERVAL_MILES
                miles_until = max(0.0, next_milestone - self.odometer)
                hrs_until_fuel = min(remaining, miles_until / rate)

            chunk = min(max_legal, remaining, hrs_until_fuel)
            if chunk <= EPS:
                if rate > EPS and hrs_until_fuel <= EPS:
                    self._sync_fuel_stops()
                elif self.drive_since_break >= MAX_DRIVE_SINCE_BREAK - EPS:
                    self._apply_30min_break()
                else:
                    self._apply_10h_reset("10-hour off-duty (11-hour / 14-hour limit)")
                continue

            self._append(chunk, DutyStatus.DRIVING, location)
            self.window_elapsed += chunk
            self.drive_in_window += chunk
            self.drive_since_break += chunk
            self.odometer += chunk * rate
            remaining -= chunk

            self._sync_fuel_stops()


def plan_hos_segments(
    *,
    drive_to_pickup_hours: float,
    drive_pickup_to_dropoff_hours: float,
    distance_to_pickup_miles: float,
    distance_pickup_to_dropoff_miles: float,
    current_cycle_used_hrs: float,
) -> list[HosSegment]:
    eng = _HosEngine(current_cycle_used_hrs)

    eng._consume_driving(
        max(0.0, drive_to_pickup_hours),
        max(0.0, distance_to_pickup_miles),
        "Driving to pickup",
    )
    eng._consume_on_duty(PICKUP_ON, "Pickup (on-duty not driving)")
    eng._consume_driving(
        max(0.0, drive_pickup_to_dropoff_hours),
        max(0.0, distance_pickup_to_dropoff_miles),
        "Driving to dropoff",
    )
    eng._consume_on_duty(DROPOFF_ON, "Dropoff (on-duty not driving)")

    return eng.segments
