from unittest.mock import MagicMock

import pytest

from trips.schemas.trip_input import TripInput
from trips.services.route_service import RouteComputation, compute_route
from trips.utils.map_client import GeocodeResult


@pytest.fixture
def sample_trip() -> TripInput:
    return TripInput(
        current_location="A",
        pickup_location="B",
        dropoff_location="C",
        current_cycle_used_hrs=0.0,
    )


def test_compute_route_parses_ors_segments(monkeypatch, sample_trip: TripInput):
    client = MagicMock()
    client.geocode.side_effect = [
        GeocodeResult(label="A", lat=1.0, lng=2.0),
        GeocodeResult(label="B", lat=3.0, lng=4.0),
        GeocodeResult(label="C", lat=5.0, lng=6.0),
    ]
    directions = {
        "features": [
            {
                "geometry": {"type": "LineString", "coordinates": [[2, 1], [4, 3], [6, 5]]},
                "properties": {
                    "summary": {"distance": 160934, "duration": 7200},
                    "segments": [
                        {"distance": 80467, "duration": 3600},
                        {"distance": 80467, "duration": 3600},
                    ],
                },
            }
        ]
    }
    client.directions_driving.return_value = directions

    route = compute_route(sample_trip, client=client)

    assert isinstance(route, RouteComputation)
    assert route.drive_to_pickup_hours == pytest.approx(1.0)
    assert route.drive_pickup_to_dropoff_hours == pytest.approx(1.0)
    assert route.total_distance_miles > 0
    assert route.encoded_polyline
