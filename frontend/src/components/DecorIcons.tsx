/** Lightweight inline SVGs — Spotter palette compatible (turquoise / coral / cream). */

export function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="currentColor"
        fillOpacity={0.15}
        d="M4 28h20l4-12h12v12h8l6-8V12H38l-6 16H4v12z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        d="M2 26h22l5-14h14v14h10l6-9V10H36l-7 16H2v16z"
      />
      <circle cx="14" cy="40" r="5" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.12} />
      <circle cx="48" cy="40" r="5" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.12} />
      <path stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" d="M32 26v8M44 18l-4 8" opacity={0.6} />
    </svg>
  );
}

export function RouteBoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 3L4 14h7l-1 7 10-12h-7l0-6z"
        opacity={0.9}
      />
    </svg>
  );
}

export function MapPinClusterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="10" cy="14" r="3" fill="currentColor" fillOpacity={0.35} />
      <circle cx="18" cy="10" r="3.5" stroke="currentColor" strokeWidth={1.2} fill="none" />
      <circle cx="22" cy="18" r="2.5" fill="currentColor" fillOpacity={0.5} />
      <path stroke="currentColor" strokeWidth={1} strokeLinecap="round" d="M8 22c4-4 8-4 16 0" opacity={0.5} />
    </svg>
  );
}
