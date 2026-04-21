"""
Convert absolute-time HOS segments (hours from trip start) into per-day ELD log models.
"""

from __future__ import annotations

from datetime import date, timedelta

from trips.schemas.trip_output import DailyLog, DutyStatus, ELDSegment
from trips.services.hos_service import HosSegment


def _merge_adjacent(segments: list[ELDSegment]) -> list[ELDSegment]:
    if not segments:
        return []
    out: list[ELDSegment] = [segments[0]]
    for seg in segments[1:]:
        last = out[-1]
        if (
            last.status == seg.status
            and last.location == seg.location
            and abs(last.end_hour - seg.start_hour) < 1e-6
        ):
            out[-1] = ELDSegment(
                start_hour=last.start_hour,
                end_hour=seg.end_hour,
                status=seg.status,
                location=seg.location,
            )
        else:
            out.append(seg)
    return out


def build_daily_logs(segments: list[HosSegment], trip_start_date: date) -> list[DailyLog]:
    """Split HosSegment timeline into calendar days (UTC) with 0–24h grid coordinates."""

    buckets: dict[int, list[ELDSegment]] = {}

    for seg in segments:
        s, e = seg.start_h, seg.end_h
        if e - s <= 1e-9:
            continue
        t = s
        while t < e - 1e-9:
            day_index = int(t // 24)
            day_floor = day_index * 24
            day_ceil = day_floor + 24
            end = min(e, day_ceil)
            local_start = t - day_floor
            local_end = end - day_floor
            buckets.setdefault(day_index, []).append(
                ELDSegment(
                    start_hour=round(local_start, 4),
                    end_hour=round(local_end, 4),
                    status=seg.status,
                    location=seg.location,
                )
            )
            t = end

    if not buckets:
        return []

    logs: list[DailyLog] = []
    for day_index in sorted(buckets.keys()):
        day_segments = _merge_adjacent(sorted(buckets[day_index], key=lambda x: x.start_hour))
        d = trip_start_date + timedelta(days=day_index)
        drive = sum(s.end_hour - s.start_hour for s in day_segments if s.status == DutyStatus.DRIVING)
        onduty = sum(
            s.end_hour - s.start_hour
            for s in day_segments
            if s.status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY_NOT_DRIVING)
        )
        logs.append(
            DailyLog(
                date=d.isoformat(),
                segments=day_segments,
                total_driving_hrs=round(drive, 3),
                total_on_duty_hrs=round(onduty, 3),
            )
        )
    return logs
