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
      className="rounded-3xl border border-white/10 bg-spotter-surface/45 p-6 shadow-glass backdrop-blur-xl sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="ui-pill">Inputs</span>
        <span className="ui-pill">70h / 8-day</span>
        <span className="ui-pill">FMCSA</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">Trip &amp; vehicle</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-spotter-cream/65">
        Required fields match the daily log basics. Carrier, trailers, mileage overrides, and shipping details are
        optional. Planning uses a US property-carrying 70 h / 8-day model (no adverse conditions), fuel about every
        1,000 trip miles, and 1 h on-duty at pickup plus 1 h at dropoff — details repeat on your result summary.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="ui-label-dark">
            Current location <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            className="ui-input-dark"
            value={values.current_location}
            onChange={(e) => setValues({ ...values, current_location: e.target.value })}
            placeholder="City or address"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="ui-label-dark">
            Pickup location <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            className="ui-input-dark"
            value={values.pickup_location}
            onChange={(e) => setValues({ ...values, pickup_location: e.target.value })}
            placeholder="Pickup city or address"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="ui-label-dark">
            Dropoff location <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            className="ui-input-dark"
            value={values.dropoff_location}
            onChange={(e) => setValues({ ...values, dropoff_location: e.target.value })}
            placeholder="Dropoff city or address"
            autoComplete="off"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="ui-label-dark">
            Current cycle used (hours) <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            type="number"
            min={0}
            max={69.99}
            step={0.1}
            className="ui-input-dark max-w-xs"
            value={Number.isNaN(values.current_cycle_used_hrs) ? "" : values.current_cycle_used_hrs}
            onChange={(e) =>
              setValues({ ...values, current_cycle_used_hrs: Number.parseFloat(e.target.value) || 0 })
            }
          />
          <span className="ml-2 text-xs text-spotter-cream/45">0 – &lt;70 (FMCSA 70-hour window)</span>
        </label>

        <label className="block sm:col-span-2">
          <span className="ui-label-dark">
            Truck / tractor number <span className="text-eld-accent">*</span>
          </span>
          <input
            required
            className="ui-input-dark max-w-md font-mono"
            value={values.truck_number}
            onChange={(e) => setValues({ ...values, truck_number: e.target.value })}
            placeholder="e.g. 6788"
            autoComplete="off"
          />
        </label>
      </div>

      <details className="mt-6 rounded-2xl border border-white/10 bg-spotter-deep/50 p-4 backdrop-blur-sm">
        <summary className="cursor-pointer text-sm font-semibold text-spotter-turquoise">
          Advanced — carrier, trailers, mileage, shipping
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="ui-label-dark">Name of carrier or carriers</span>
            <input
              className="ui-input-dark"
              value={values.carrier_name ?? ""}
              onChange={(e) => setValues({ ...values, carrier_name: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="ui-label-dark">Main office address</span>
            <input
              className="ui-input-dark"
              value={values.carrier_main_office ?? ""}
              onChange={(e) => setValues({ ...values, carrier_main_office: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="ui-label-dark">Home terminal address</span>
            <input
              className="ui-input-dark"
              value={values.carrier_home_terminal ?? ""}
              onChange={(e) => setValues({ ...values, carrier_home_terminal: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="ui-label-dark">Trailer number (1)</span>
            <input
              className="ui-input-dark font-mono"
              value={values.trailer_number ?? ""}
              onChange={(e) => setValues({ ...values, trailer_number: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="ui-label-dark">Trailer number (2)</span>
            <input
              className="ui-input-dark font-mono"
              value={values.trailer_number_2 ?? ""}
              onChange={(e) => setValues({ ...values, trailer_number_2: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="ui-label-dark">Total miles driving today (override)</span>
            <input
              type="number"
              min={0}
              step={1}
              className="ui-input-dark"
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
            <span className="ui-label-dark">Total mileage today</span>
            <input
              type="number"
              min={0}
              step={1}
              className="ui-input-dark"
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

          <div className="sm:col-span-2 rounded-xl border border-dashed border-spotter-turquoise/35 bg-spotter-deep/40 p-4 text-[11px] leading-relaxed text-spotter-cream/80">
            <p className="font-semibold text-spotter-turquoise">How these miles differ</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-spotter-turquoise/80">
              <li>
                <strong className="text-spotter-cream/95">Total miles driving today</strong> — miles <em>you</em> drove
                this shift (solo). Often the number you put by the truck/trailer line on the log.
              </li>
              <li>
                <strong className="text-spotter-cream/95">Total mileage today</strong> — distance the <em>truck</em>{" "}
                moved in the 24h period. <strong>Solo:</strong> usually same as driving miles. <strong>Team:</strong>{" "}
                includes both drivers&apos; miles combined.
              </li>
            </ul>
            <div className="mt-3 rounded-lg border border-white/10 bg-spotter-bg/80 px-3 py-2 font-mono text-[10px] text-spotter-cream/90">
              <div className="text-center text-spotter-cream/45">On paper (odometer)</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                <span>ending odometer</span>
                <span aria-hidden="true">−</span>
                <span>starting odometer</span>
                <span>=</span>
                <span className="font-semibold text-spotter-turquoise">total mileage</span>
              </div>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="ui-label-dark">DVL or manifest number</span>
            <input
              className="ui-input-dark"
              value={values.shipping_manifest ?? ""}
              onChange={(e) => setValues({ ...values, shipping_manifest: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="ui-label-dark">Shipper &amp; commodity</span>
            <input
              className="ui-input-dark"
              value={values.shipper_commodity ?? ""}
              onChange={(e) => setValues({ ...values, shipper_commodity: e.target.value })}
            />
          </label>
        </div>
      </details>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={props.loading}
          className="rounded-xl bg-eld-accent px-8 py-3 text-sm font-semibold text-white shadow-coral transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {props.loading ? "Planning…" : "Plan trip"}
        </button>
        <span className="text-xs text-spotter-cream/40">Turquoise route · coral CTAs</span>
      </div>
    </form>
  );
}
