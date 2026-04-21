from unittest.mock import MagicMock

import pytest
from rest_framework.test import APIRequestFactory

from trips.views import PlacesAutocompleteView


@pytest.fixture
def request_factory() -> APIRequestFactory:
    return APIRequestFactory()


def test_autocomplete_short_query_returns_empty(monkeypatch, request_factory: APIRequestFactory):
    view = PlacesAutocompleteView.as_view()
    req = request_factory.get("/api/places/autocomplete/", {"q": "a"})
    resp = view(req)
    assert resp.status_code == 200
    assert resp.data["results"] == []


def test_autocomplete_returns_results(monkeypatch, request_factory: APIRequestFactory):
    from trips.utils.map_client import GeocodeResult

    mock_client = MagicMock()
    mock_client.geocode_search.return_value = [
        GeocodeResult(label="Dallas, TX, USA", lat=32.7, lng=-96.8),
    ]
    monkeypatch.setattr("trips.views.OpenRouteServiceClient", lambda *a, **k: mock_client)
    view = PlacesAutocompleteView.as_view()
    req = request_factory.get("/api/places/autocomplete/", {"q": "Dallas"})
    resp = view(req)
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 1
    assert resp.data["results"][0]["label"] == "Dallas, TX, USA"
    assert resp.data["results"][0]["lat"] == 32.7


def test_autocomplete_graceful_vendor_error(monkeypatch, request_factory: APIRequestFactory):
    from trips.utils.map_client import MapClientError

    def fake_ors_client(*_a, **_kw):
        raise MapClientError("ORS_API_KEY is not configured")

    monkeypatch.setattr("trips.views.OpenRouteServiceClient", fake_ors_client)
    view = PlacesAutocompleteView.as_view()
    req = request_factory.get("/api/places/autocomplete/", {"q": "Seattle"})
    resp = view(req)
    assert resp.status_code == 200
    assert resp.data["results"] == []
    assert "search_error" in resp.data
