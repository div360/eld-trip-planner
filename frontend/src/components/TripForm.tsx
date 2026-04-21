import type { FormEvent } from "react";
import { useState } from "react";
import type { TripPlanRequest } from "../types/trip";

const empty: TripPlanRequest = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  current_cycle_used_hrs: 0,
};

export function TripForm(props: {
  loading: boolean;
  onSubmit: (values: TripPlanRequest) => void;
}) {
  const [values, setValues] = useState<TripPlanRequest>(empty);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    props.onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-eld-teal/25 bg-white/90 p-6 shadow-eld backdrop-blur"
    >
      <h2 className="text-lg font-semibold text-eld-teal">Trip inputs</h2>
      <p className="mt-1 text-sm text-slate-600">
        Property 70-hour / 8-day, pickup &amp; drop modeled as 1 h on-duty each.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Current location</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-eld-mist bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
            value={values.current_location}
            onChange={(e) => setValues({ ...values, current_location: e.target.value })}
            placeholder="City or address"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Pickup location</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-eld-mist bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
            value={values.pickup_location}
            onChange={(e) => setValues({ ...values, pickup_location: e.target.value })}
            placeholder="Pickup city or address"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Dropoff location</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-eld-mist bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
            value={values.dropoff_location}
            onChange={(e) => setValues({ ...values, dropoff_location: e.target.value })}
            placeholder="Dropoff city or address"
            autoComplete="off"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Current cycle used (hours)</span>
          <input
            required
            type="number"
            min={0}
            max={69.99}
            step={0.1}
            className="mt-1 w-full max-w-xs rounded-xl border border-eld-mist bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
            value={Number.isNaN(values.current_cycle_used_hrs) ? "" : values.current_cycle_used_hrs}
            onChange={(e) =>
              setValues({ ...values, current_cycle_used_hrs: Number.parseFloat(e.target.value) || 0 })
            }
          />
          <span className="ml-2 text-xs text-slate-500">0 – &lt;70 (FMCSA 70-hour window)</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={props.loading}
          className="rounded-xl bg-eld-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.loading ? "Planning…" : "Plan trip"}
        </button>
      </div>
    </form>
  );
}
