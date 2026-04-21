from django.urls import path

from trips.views import HealthView, PlacesAutocompleteView, PlanTripView, TripDetailView

urlpatterns = [
    path("health/", HealthView.as_view(), name="api-health"),
    path("places/autocomplete/", PlacesAutocompleteView.as_view(), name="places-autocomplete"),
    path("trips/plan/", PlanTripView.as_view(), name="plan-trip"),
    path("trips/<uuid:trip_id>/", TripDetailView.as_view(), name="trip-detail"),
]
