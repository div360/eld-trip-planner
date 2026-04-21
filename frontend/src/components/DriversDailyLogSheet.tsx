import { useMemo } from "react";
import type { DailyLogDTO, DutyStatusCode, TripSheetInputsDTO } from "../types/trip";
import { buildDutyLinePath, DUTY_ROW_ORDER, hoursByStatus } from "../utils/dutyGraphPath";

const LABELS: Record<DutyStatusCode, string> = {
  OFF: "Off Duty",
  SB: "Sleeper Berth",
  D: "Driving",
  ON: "On Duty (not driving)",
};

const HOUR_LABELS = [
  "Mid\nnight",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "Noon",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "Mid\nnight",
];

type SheetProps = {
  log: DailyLogDTO;
  sheet: TripSheetInputsDTO;
  /** Planned route miles (used if sheet has no mileage override) */
  totalTripMiles: number;
};

function fmt(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : "—";
}

/**
 * Paper-style daily log: header (date, route, carrier, truck/trailer, miles), graph, remarks + shipping, recap.
 */
export function DriversDailyLogSheet(props: SheetProps) {
  const { log, sheet } = props;

  const byStatus = useMemo(() => hoursByStatus(log.segments), [log.segments]);
  const total24 = useMemo(
    () => DUTY_ROW_ORDER.reduce((s, k) => s + byStatus[k], 0),
    [byStatus]
  );
  const onDutyLines34 = byStatus.D + byStatus.ON;

  /** Illustrative only — not a legal FMCSA rolling total without prior days’ logs */
  const recapA = sheet.current_cycle_used_hrs + onDutyLines34;
  const recapB70 = Math.max(0, 70 - recapA);
  const recapB60 = Math.max(0, 60 - recapA);

  const remarks = useMemo(() => {
    const lines: { t: string; text: string }[] = [];
    const sorted = [...log.segments].sort((a, b) => a.start_hour - b.start_hour);
    for (const seg of sorted) {
      if (!seg.location?.trim()) continue;
      const h = Math.floor(seg.start_hour);
      const m = Math.round((seg.start_hour - h) * 60);
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = ((h + 11) % 12) + 1;
      lines.push({ t: `${h12}:${m.toString().padStart(2, "0")} ${ap}`, text: seg.location.trim() });
    }
    return lines;
  }, [log.segments]);

  const vbW = 920;
  const vbH = 220;
  const labelBand = 28;
  const svgTotalH = vbH + labelBand;
  const labelW = 108;
  const totalsW = 56;
  const gridLeft = labelW;
  const gridW = vbW - labelW - totalsW;
  const rowH = vbH / 4;
  const rowCenters: [number, number, number, number] = [
    rowH * 0.5,
    rowH * 1.5,
    rowH * 2.5,
    rowH * 3.5,
  ];

  const linePath = useMemo(
    () =>
      buildDutyLinePath(log.segments, {
        gridInnerWidth: gridW,
        gridInnerHeight: vbH,
        rowCenters,
      }),
    [log.segments, gridW, vbH, rowH]
  );

  const dateParts = log.date.split("-");
  const yyyy = dateParts[0] ?? "";
  const mm = dateParts[1] ?? "";
  const dd = dateParts[2] ?? "";

  const milesDriving =
    sheet.total_miles_driving_today != null && sheet.total_miles_driving_today > 0
      ? sheet.total_miles_driving_today
      : props.totalTripMiles;
  const milesTotal =
    sheet.total_mileage_today != null && sheet.total_mileage_today > 0 ? sheet.total_mileage_today : null;

  return (
    <article className="overflow-x-auto rounded-2xl border-2 border-slate-800 bg-white text-slate-900 shadow-md print:shadow-none print:border-black">
      {/* Header */}
      <header className="border-b-2 border-slate-800 px-3 py-2 print:px-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold leading-tight sm:text-base">Driver&apos;s Daily Log (24 hours)</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">Date</span>
              <span className="inline-flex border border-slate-800 px-1.5 py-0.5 font-mono tabular-nums">{mm}</span>
              <span>/</span>
              <span className="inline-flex border border-slate-800 px-1.5 py-0.5 font-mono tabular-nums">{dd}</span>
              <span>/</span>
              <span className="inline-flex border border-slate-800 px-1.5 py-0.5 font-mono tabular-nums">{yyyy}</span>
            </div>
            <div className="mt-2 grid max-w-md gap-1 text-xs">
              <div className="flex gap-2 border-b border-slate-400">
                <span className="shrink-0 font-medium">From:</span>
                <span className="min-w-0 flex-1 truncate">{fmt(sheet.current_location)}</span>
              </div>
              <div className="flex gap-2 border-b border-slate-400">
                <span className="shrink-0 font-medium">To:</span>
                <span className="min-w-0 flex-1 truncate">{fmt(sheet.dropoff_location)}</span>
              </div>
            </div>
          </div>
          <p className="max-w-[220px] text-[9px] leading-snug text-slate-600">
            Original — file at home terminal. Duplicate — driver retains in their possession for 8 days.
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-slate-800 px-2 py-1">
              Total miles driving today:{" "}
              <span className="font-mono tabular-nums">{milesDriving.toFixed(0)}</span>
            </span>
            <span className="rounded border border-slate-800 px-2 py-1">
              Total mileage today:{" "}
              <span className="font-mono tabular-nums">{milesTotal != null ? milesTotal.toFixed(0) : "—"}</span>
            </span>
          </div>
          <div className="rounded border border-slate-800 px-2 py-1 text-[10px] leading-snug">
            <span className="font-medium">Truck / tractor:</span>{" "}
            <span className="font-mono">{fmt(sheet.truck_number)}</span>
            {(sheet.trailer_number ?? "").trim() || (sheet.trailer_number_2 ?? "").trim() ? (
              <>
                {" "}
                <span className="text-slate-500">|</span> Trailer(s):{" "}
                <span className="font-mono">
                  {[sheet.trailer_number, sheet.trailer_number_2].filter((t) => (t ?? "").trim()).join(" / ") || "—"}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-3 text-xs">
          <p className="font-medium text-slate-800">Truck/tractor and trailer numbers or license plate(s)/state (each unit)</p>
          <p className="mt-1 min-h-[2rem] rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px]">
            {fmt(sheet.truck_number)}
            {(sheet.trailer_number ?? "").trim() ? ` · Trl ${sheet.trailer_number}` : ""}
            {(sheet.trailer_number_2 ?? "").trim() ? ` · Trl ${sheet.trailer_number_2}` : ""}
          </p>
        </div>

        <div className="mt-3 grid gap-1 text-xs">
          <p className="border-b border-slate-400 py-0.5">
            <span className="font-medium">Name of carrier or carriers:</span> {fmt(sheet.carrier_name)}
          </p>
          <p className="border-b border-slate-400 py-0.5">
            <span className="font-medium">Main office address:</span> {fmt(sheet.carrier_main_office)}
          </p>
          <p className="border-b border-slate-400 py-0.5">
            <span className="font-medium">Home terminal address:</span> {fmt(sheet.carrier_home_terminal)}
          </p>
        </div>
      </header>

      {/* Grid */}
      <div className="border-b-2 border-slate-800">
        <div className="bg-slate-900 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white">
          Graph: time (home terminal) · 15-minute marks within each hour
        </div>
        <div className="relative flex">
          <div className="flex w-[108px] shrink-0 flex-col justify-around border-r border-slate-800 py-1 text-[10px] font-medium leading-tight">
            {DUTY_ROW_ORDER.map((code) => (
              <div key={code} className="flex h-[55px] items-center px-1">
                {LABELS[code]}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <svg
              viewBox={`0 0 ${vbW} ${svgTotalH}`}
              className="h-auto w-full max-w-full"
              role="img"
              aria-label={`Duty status graph for ${log.date}`}
            >
              <g transform={`translate(${gridLeft},0)`}>
                {Array.from({ length: 25 }, (_, hr) => (
                  <line
                    key={hr}
                    x1={(hr / 24) * gridW}
                    y1={0}
                    x2={(hr / 24) * gridW}
                    y2={vbH}
                    stroke={hr % 6 === 0 ? "#64748b" : "#e2e8f0"}
                    strokeWidth={hr % 6 === 0 ? 1.2 : 0.6}
                  />
                ))}
                {Array.from({ length: 24 }, (_, hr) =>
                  [1, 2, 3].map((q) => (
                    <line
                      key={`${hr}-${q}`}
                      x1={((hr + q / 4) / 24) * gridW}
                      y1={0}
                      x2={((hr + q / 4) / 24) * gridW}
                      y2={vbH}
                      stroke="#f1f5f9"
                      strokeWidth={0.4}
                    />
                  ))
                )}
                {DUTY_ROW_ORDER.map((_, i) => (
                  <line
                    key={i}
                    x1={0}
                    y1={(i + 1) * rowH}
                    x2={gridW}
                    y2={(i + 1) * rowH}
                    stroke="#e2e8f0"
                    strokeWidth={0.8}
                  />
                ))}
                {linePath ? (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="rgb(0, 128, 128)"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                ) : null}
              </g>
              {HOUR_LABELS.map((lab, hr) => (
                <text
                  key={hr}
                  x={gridLeft + (hr / 24) * gridW}
                  y={vbH + 12}
                  textAnchor="middle"
                  className="fill-slate-600"
                  style={{ fontSize: 9 }}
                >
                  {lab.split("\n").map((line, i) => (
                    <tspan key={`${hr}-${i}`} x={gridLeft + (hr / 24) * gridW} dy={i === 0 ? 0 : 10}>
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}
            </svg>
          </div>
          <div className="flex w-14 shrink-0 flex-col justify-around border-l border-slate-800 bg-slate-50 py-1 text-center">
            <div className="text-[9px] font-semibold leading-tight text-slate-600">Total Hours</div>
            {DUTY_ROW_ORDER.map((code) => (
              <div
                key={code}
                className="flex h-[55px] flex-col items-center justify-center border-t border-slate-300 text-xs"
              >
                <span className="font-mono tabular-nums">{byStatus[code].toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 pt-1 text-[10px] font-semibold">
              Σ {total24.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks + shipping */}
      <section className="border-b-2 border-slate-800 px-3 py-2">
        <h3 className="text-sm font-bold">Remarks</h3>
        <p className="text-[10px] text-slate-600">
          Enter name of place you reported and where released from work and when and where each change of duty occurred.
          Use time standard of home terminal.
        </p>
        <ul className="mt-2 min-h-[56px] list-inside list-disc text-xs leading-relaxed">
          {remarks.length === 0 ? (
            <li className="text-slate-400">No location labels on segments for this day.</li>
          ) : (
            remarks.map((r, i) => (
              <li key={i}>
                <span className="font-mono text-slate-700">{r.t}</span> — {r.text}
              </li>
            ))
          )}
        </ul>
        <div className="mt-3 grid gap-2 border border-slate-300 bg-slate-50 p-2 text-xs sm:grid-cols-2">
          <div>
            <p className="font-semibold">Shipping documents</p>
            <p className="mt-1 text-[10px] text-slate-600">DVL or manifest no. or</p>
            <p className="mt-1 min-h-[1.5rem] border-b border-slate-400 font-mono">{fmt(sheet.shipping_manifest)}</p>
          </div>
          <div>
            <p className="font-semibold">Shipper &amp; commodity</p>
            <p className="mt-1 min-h-[2.5rem] border-b border-slate-400">{fmt(sheet.shipper_commodity)}</p>
          </div>
        </div>
      </section>

      {/* Recap — matches blank form structure */}
      <footer className="px-3 py-3 text-[10px] leading-snug">
        <p className="text-xs font-bold">Recap: Complete at end of day</p>
        <div className="mt-2 grid gap-2 border border-slate-800 sm:grid-cols-2">
          <div className="border-slate-800 p-2 sm:border-r">
            <p className="text-center font-bold">70 Hour / 8 Day Drivers</p>
            <p className="mt-2 border-b border-slate-300 py-1">
              On-duty hours today, total lines 3 &amp; 4 (Driving + On duty not driving):{" "}
              <span className="font-mono font-semibold">{onDutyLines34.toFixed(2)}</span> h
            </p>
            <p className="mt-2 border-b border-slate-200 py-1">
              <span className="font-medium">A.</span> Total hours on duty last 8 days including today (illustrative):{" "}
              <span className="font-mono">{recapA.toFixed(2)}</span> h
            </p>
            <p className="mt-1 border-b border-slate-200 py-1">
              <span className="font-medium">B.</span> Total hours available tomorrow (70 hr − A*):{" "}
              <span className="font-mono">{recapB70.toFixed(2)}</span> h
            </p>
            <p className="mt-1 py-1">
              <span className="font-medium">C.</span> Total on duty last 5 days including today:{" "}
              <span className="text-slate-500">— (needs prior daily logs)</span>
            </p>
          </div>
          <div className="p-2">
            <p className="text-center font-bold">60 Hour / 7 Day Drivers</p>
            <p className="mt-2 border-b border-slate-200 py-1">
              <span className="font-medium">A.</span> Total hours on duty last 3 days including today:{" "}
              <span className="text-slate-500">— (needs prior logs)</span>
            </p>
            <p className="mt-1 border-b border-slate-200 py-1">
              <span className="font-medium">B.</span> Total hours available tomorrow (60 hr − A*):{" "}
              <span className="font-mono">{recapB60.toFixed(2)}</span> h <span className="text-slate-500">(if A = illustrative above)</span>
            </p>
            <p className="mt-1 py-1">
              <span className="font-medium">C.</span> Total on duty last 7 days including today:{" "}
              <span className="text-slate-500">— (needs prior logs)</span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-right text-[9px] text-slate-600">
          *If you took 34 consecutive hours off duty you have 60/70 hours available.
        </p>
        <p className="mt-2 text-[9px] text-slate-500">
          *Illustrative A/B: uses cycle-at-trip-start + this day&apos;s lines 3–4; not a substitute for FMCSA rolling
          totals or carrier rules.
        </p>
      </footer>
    </article>
  );
}
