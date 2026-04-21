"""
OpenRouteService (ORS) HTTP client — geocoding and driving directions.
Docs: https://openrouteservice.org/dev/#/api-docs
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings


class MapClientError(Exception):
    """Raised when ORS returns an error or an unexpected payload."""


@dataclass
class GeocodeResult:
    label: str
    lat: float
    lng: float


class OpenRouteServiceClient:
    def __init__(self, api_key: str | None = None, timeout: int = 30) -> None:
        self.api_key = (api_key if api_key is not None else getattr(settings, "ORS_API_KEY", "")) or ""
        self.timeout = timeout
        self.session = requests.Session()

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise MapClientError("ORS_API_KEY is not configured")
        return {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
        }

    def geocode_search(self, query: str, *, limit: int = 10) -> list[GeocodeResult]:
        """Return up to ``limit`` geocode candidates (ORS Pelias search)."""
        q = query.strip()
        if len(q) < 2:
            return []
        url = "https://api.openrouteservice.org/geocode/search"
        size = min(max(1, limit), 40)
        params = {"text": q, "size": size}
        resp = self.session.get(url, params=params, headers=self._headers(), timeout=self.timeout)
        if resp.status_code != 200:
            raise MapClientError(f"Geocode HTTP {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        feats = data.get("features") or []
        out: list[GeocodeResult] = []
        seen: set[tuple[str, int, int]] = set()
        for feat in feats:
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates") or []
            if len(coords) < 2:
                continue
            lng, lat = float(coords[0]), float(coords[1])
            props = feat.get("properties", {}) or {}
            label = str(props.get("label") or q)
            key = (label, round(lat * 1e6), round(lng * 1e6))
            if key in seen:
                continue
            seen.add(key)
            out.append(GeocodeResult(label=label, lat=lat, lng=lng))
            if len(out) >= limit:
                break
        return out

    def geocode(self, query: str) -> GeocodeResult:
        """Single best geocode result (used when planning the route)."""
        results = self.geocode_search(query, limit=1)
        if not results:
            raise MapClientError(f"No geocode results for: {query!r}")
        return results[0]

    def directions_driving(
        self,
        coordinates: list[tuple[float, float]],
        *,
        preference: str = "recommended",
    ) -> dict[str, Any]:
        """
        coordinates: list of (lng, lat) in order.
        Returns raw ORS JSON (routes[0] contains summary and geometry).
        """
        if len(coordinates) < 2:
            raise MapClientError("At least two coordinates are required for directions")
        url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
        body: dict[str, Any] = {
            "coordinates": [[lng, lat] for lng, lat in coordinates],
            "preference": preference,
            "units": "mi",
        }
        resp = self.session.post(url, json=body, headers=self._headers(), timeout=self.timeout)
        if resp.status_code != 200:
            raise MapClientError(f"Directions HTTP {resp.status_code}: {resp.text[:500]}")
        return resp.json()
