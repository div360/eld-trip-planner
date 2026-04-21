import type { FormEvent } from "react";
import { useState } from "react";
import type { TripPlanRequest } from "../types/trip";

function emptyForm(): TripPlanRequest {
  return {
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used_hrs: 0,
    truck_number: "",
    trailer_number: "",
    trailer_number_2: "",
    carrier_name: "",
    carrier_main_office: "",
    carrier_home_terminal: "",
    total_miles_driving_today: null,
    total_mileage_today: null,
    shipping_manifest: "",
    shipper_commodity: "",
  };
}

export function TripForm(props: {
  loading: boolean;
  onSubmit: (values: TripPlanRequest) => void;
}) {
  const [values, setValues] = useState<TripPlanRequest>(emptyForm);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    props.onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-eld-teal/25 bg-white/90 p-6 shadow-eld backdrop-blur"
    >
      <h2 className="text-lg font-semibold text-eld-teal">Trip &amp; vehicle</h2>
      <p className="mt-1 text-sm text-slate-600">
        Required fields match the daily log basics. Carrier, trailers, mileage overrides, and shipping details are optional.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Current location <span className="text-eld-accent">*</span>
          </span>
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
          <span className="text-sm font-medium text-slate-700">
            Pickup location <span className="text-eld-accent">*</span>
          </span>
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
          <span className="text-sm font-medium text-slate-700">
            Dropoff location <span className="text-eld-accent">*</span>
          </span>
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
          <span className="text-sm font-medium text-slate-700">
            Current cycle used (hours) <span className="text-eld-accent">*</span>
          </span>
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

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Truck / tractor number <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            className="mt-1 w-full max-w-md rounded-xl border border-eld-mist bg-white px-3 py-2 font-mono text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
            value={values.truck_number}
            onChange={(e) => setValues({ ...values, truck_number: e.target.value })}
            placeholder="e.g. 6788"
            autoComplete="off"
          />
        </label>
      </div>

      <details className="mt-6 rounded-xl border border-eld-mist bg-eld-mist/30 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-eld-teal">
          Advanced — carrier, trailers, mileage, shipping
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Name of carrier or carriers</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.carrier_name ?? ""}
              onChange={(e) => setValues({ ...values, carrier_name: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Main office address</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.carrier_main_office ?? ""}
              onChange={(e) => setValues({ ...values, carrier_main_office: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Home terminal address</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.carrier_home_terminal ?? ""}
              onChange={(e) => setValues({ ...values, carrier_home_terminal: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Trailer number (1)</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 font-mono text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.trailer_number ?? ""}
              onChange={(e) => setValues({ ...values, trailer_number: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Trailer number (2)</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 font-mono text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.trailer_number_2 ?? ""}
              onChange={(e) => setValues({ ...values, trailer_number_2: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Total miles driving today (override)</span>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.total_miles_driving_today ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setValues({
                  ...values,
                  total_miles_driving_today: v === "" ? null : Number.parseFloat(v),
                });
              }}
              placeholder="Leave blank to use trip total"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Total mileage today</span>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.total_mileage_today ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setValues({
                  ...values,
                  total_mileage_today: v === "" ? null : Number.parseFloat(v),
                });
              }}
            />
          </label>

          <div className="sm:col-span-2 rounded-xl border border-dashed border-eld-teal/50 bg-white/90 p-3 text-[11px] leading-relaxed text-slate-700">
            <p className="font-semibold text-eld-teal">How these miles differ</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-eld-teal">
              <li>
                <strong>Total miles driving today</strong> — miles <em>you</em> drove this shift (solo). Often the number
                you put by the truck/trailer line on the log.
              </li>
              <li>
                <strong>Total mileage today</strong> — distance the <em>truck</em> moved in the 24h period.{" "}
                <strong>Solo:</strong> usually same as driving miles. <strong>Team:</strong> includes both drivers&apos;
                miles combined.
              </li>
            </ul>
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-800">
              <div className="text-center text-slate-500">On paper (odometer)</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                <span>ending odometer</span>
                <span aria-hidden="true">−</span>
                <span>starting odometer</span>
                <span>=</span>
                <span className="font-semibold text-eld-teal">total mileage</span>
              </div>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">DVL or manifest number</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.shipping_manifest ?? ""}
              onChange={(e) => setValues({ ...values, shipping_manifest: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Shipper &amp; commodity</span>
            <input
              className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-slate-900 outline-none ring-eld-teal/30 focus:ring-2"
              value={values.shipper_commodity ?? ""}
              onChange={(e) => setValues({ ...values, shipper_commodity: e.target.value })}
            />
          </label>
        </div>
      </details>

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
