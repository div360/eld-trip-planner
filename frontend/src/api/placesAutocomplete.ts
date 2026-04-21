export type PlaceSuggestion = { label: string; lat: number; lng: number };

function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  return (typeof v === "string" && v.length > 0 ? v : "http://127.0.0.1:8000").replace(/\/$/, "");
}

export type AutocompleteResponse = {
  results: PlaceSuggestion[];
  search_error?: string;
};

export async function fetchPlaceSuggestions(query: string): Promise<AutocompleteResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { results: [] };
  }
  const url = `${apiBase()}/api/places/autocomplete/?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok || typeof data !== "object" || data === null) {
    return { results: [], search_error: "Location search failed. Try again." };
  }
  const d = data as AutocompleteResponse;
  if (!Array.isArray(d.results)) {
    return { results: [], search_error: "Invalid search response." };
  }
  return {
    results: d.results,
    search_error: d.search_error,
  };
}
