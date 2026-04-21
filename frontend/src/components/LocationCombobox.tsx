import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { fetchPlaceSuggestions } from "../api/placesAutocomplete";
import type { PlaceSuggestion } from "../api/placesAutocomplete";

type Props = {
  id?: string;
  label: ReactNode;
  required?: boolean;
  /** Canonical label from the API — only set when the user picks a suggestion. */
  value: string;
  onChange: (label: string) => void;
  placeholder?: string;
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-spotter-turquoise"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Address field backed by ORS search: typing queries the API; the submitted value is only
 * set when a row is chosen from the dropdown (arbitrary text is not kept as a location).
 */
export function LocationCombobox(props: Props) {
  const { label, required, value, onChange, placeholder = "Search address or city" } = props;
  const autoId = useId();
  const inputId = props.id ?? `loc-${autoId}`;
  const listId = `${inputId}-list`;

  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const busy = debouncing || loading;

  useEffect(() => {
    if (value) {
      setText(value);
    }
  }, [value]);

  const runSearch = useCallback(async (q: string) => {
    setDebouncing(false);
    const my = ++requestId.current;
    setLoading(true);
    setSearchError(null);
    try {
      const { results: rows, search_error } = await fetchPlaceSuggestions(q);
      if (requestId.current !== my) {
        return;
      }
      setResults(rows);
      if (search_error) {
        setSearchError(search_error);
      }
      setHighlight(0);
      setOpen(true);
    } catch {
      if (requestId.current !== my) {
        return;
      }
      setResults([]);
      setSearchError("Location search failed.");
      setOpen(true);
    } finally {
      if (requestId.current === my) {
        setLoading(false);
      }
    }
  }, []);

  const onInputChange = (raw: string) => {
    setText(raw);
    if (value && raw !== value) {
      onChange("");
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const q = raw.trim();
    if (q.length < 2) {
      setDebouncing(false);
      setLoading(false);
      setResults([]);
      setOpen(false);
      setSearchError(null);
      return;
    }
    setDebouncing(true);
    setOpen(true);
    debounceRef.current = setTimeout(() => {
      void runSearch(raw.trim());
    }, 320);
  };

  const pick = useCallback(
    (row: PlaceSuggestion) => {
      onChange(row.label);
      setText(row.label);
      setOpen(false);
      setDebouncing(false);
      setResults([]);
      setSearchError(null);
    },
    [onChange],
  );

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && open && busy) {
      e.preventDefault();
      return;
    }
    if (!open || results.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="block">
        <span className="ui-label-dark">
          {label} {required ? <span className="text-eld-accent">*</span> : null}
        </span>
        <div className="relative mt-1">
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-busy={busy}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            className="ui-input-dark pr-10"
            value={text}
            placeholder={placeholder}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => {
              if (text.trim().length >= 2 && (results.length > 0 || busy)) {
                setOpen(true);
              }
            }}
            onKeyDown={onKeyDown}
          />
          {busy ? (
            <span
              className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-[11px] text-spotter-cream/50"
              aria-live="polite"
            >
              <Spinner />
              <span className="hidden sm:inline">{debouncing ? "Waiting…" : "Loading…"}</span>
            </span>
          ) : null}
        </div>
      </label>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/15 bg-spotter-deep/95 py-1 text-sm shadow-lg backdrop-blur-md ring-1 ring-white/10"
        >
          {debouncing ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-spotter-cream/70">
              <Spinner />
              <span>Waiting for search…</span>
            </li>
          ) : loading ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-spotter-cream/70">
              <Spinner />
              <span>Loading suggestions…</span>
            </li>
          ) : searchError ? (
            <li className="px-3 py-2 text-amber-200/90">{searchError}</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-spotter-cream/50">No matches — keep typing</li>
          ) : (
            results.map((r, i) => (
              <li key={`${i}-${r.lat}-${r.lng}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  className={`flex w-full cursor-pointer px-3 py-2 text-left text-spotter-cream/90 hover:bg-white/10 ${
                    i === highlight ? "bg-white/10" : ""
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(r);
                  }}
                >
                  {r.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
