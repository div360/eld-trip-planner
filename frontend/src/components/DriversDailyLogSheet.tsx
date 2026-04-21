import { useMemo } from "react";
import type { DailyLogDTO, DutyStatusCode } from "../types/trip";
import { buildDutyLinePath, DUTY_ROW_ORDER, hoursByStatus } from "../utils/dutyGraphPath";

const LABELS: Record<DutyStatusCode, string> = {
  OFF: "Off Duty",
  SB: "Sleeper Berth",
  D: "Driving",
  ON: "On Duty (not driving)",
};

/** Hours 0–23 labels like the paper (midnight … noon … midnight) */
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
  /** Trip context for header “From / To” and recap context */
  fromLabel: string;
  toLabel: string;
  /** Shown in recap area as “cycle used” hint */
  currentCycleUsedHrs?: number;
  /** Whole-trip miles (we don’t have per-day miles from API yet) */
  totalTripMiles?: number;
};

/**
 * One printable daily sheet modeled on the blank “Driver’s Daily Log (24 hours)” form:
 * header → 24h grid with 15-minute ticks → total hours column → remarks → recap placeholders.
 * The duty graph uses a single continuous stroke (filled example style), not only bars.
 */
export function DriversDailyLogSheet(props: SheetProps) {
  const { log } = props;

  const byStatus = useMemo(() => hoursByStatus(log.segments), [log.segments]);
  const total24 = useMemo(
    () => DUTY_ROW_ORDER.reduce((s, k) => s + byStatus[k], 0),
    [byStatus]
  );

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

  return (
    <article className="overflow-x-auto rounded-2xl border-2 border-slate-800 bg-white text-slate-900 shadow-md print:shadow-none print:border-black">
      {/* —— Header (template block 1) —— */}
      <header className="border-b-2 border-slate-800 px-3 py-2 print:px-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
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
                <span className="min-w-0 flex-1 truncate">{props.fromLabel}</span>
              </div>
              <div className="flex gap-2 border-b border-slate-400">
                <span className="shrink-0 font-medium">To:</span>
                <span className="min-w-0 flex-1 truncate">{props.toLabel}</span>
              </div>
            </div>
          </div>
          <div className="min-w-[200px] max-w-sm flex-1 text-xs">
            <p className="border-b border-slate-400 py-0.5">
              <span className="font-medium">Carrier</span> <span className="text-slate-600">(optional)</span>
            </p>
            <p className="border-b border-slate-400 py-0.5">Main office address</p>
            <p className="border-b border-slate-400 py-0.5">Home terminal address</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-slate-800 px-2 py-1">
              Total miles driving today:{" "}
              <span className="font-mono tabular-nums">
                {props.totalTripMiles != null ? props.totalTripMiles.toFixed(0) : "—"}
              </span>
            </span>
            <span className="rounded border border-slate-800 px-2 py-1">
              Total mileage today: <span className="font-mono text-slate-500">—</span>
            </span>
          </div>
          <p className="text-[10px] leading-snug text-slate-600">
            Truck/tractor & trailer numbers or plates/state — use employer format when printing.
          </p>
        </div>
      </header>

      {/* —— Grid + continuous line (template block 2) —— */}
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
                {/* Hour lines */}
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
                {/* 15-minute ticks (lighter between hours) */}
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
                {/* Row guides */}
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
                {/* Duty line */}
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
              {/* Hour labels */}
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
          {/* Total hours column */}
          <div className="flex w-14 shrink-0 flex-col justify-around border-l border-slate-800 bg-slate-50 py-1 text-center">
            <div className="text-[9px] font-semibold leading-tight text-slate-600">Total hrs</div>
            {DUTY_ROW_ORDER.map((code) => (
              <div key={code} className="flex h-[55px] flex-col items-center justify-center border-t border-slate-300 text-xs">
                <span className="font-mono tabular-nums">{byStatus[code].toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 pt-1 text-[10px] font-semibold">
              Σ {total24.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* —— Remarks (template block 3) —— */}
      <section className="border-b-2 border-slate-800 px-3 py-2">
        <h3 className="text-sm font-bold">Remarks</h3>
        <p className="text-[10px] text-slate-600">
          Enter place reported, released from work, and when/where each duty change occurred (home terminal time), per{" "}
          <a
            className="text-eld-teal underline"
            href="https://www.wikihow.com/Fill-a-Log-Book"
            target="_blank"
            rel="noreferrer"
          >
            standard log practice
          </a>
          .
        </p>
        <ul className="mt-2 min-h-[72px] list-inside list-disc text-xs leading-relaxed">
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
        <div className="mt-2 grid gap-1 text-[10px] text-slate-600 sm:grid-cols-2">
          <span>Shipping / manifest / shipper &amp; commodity — optional</span>
        </div>
      </section>

      {/* —— Recap (template block 4) — simplified vs full paper */}
      <footer className="px-3 py-2 text-[10px] leading-snug">
        <p className="font-semibold">Recap — 70 hour / 8 day (property)</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          <p>
            <span className="font-medium">Cycle used (input):</span>{" "}
            {props.currentCycleUsedHrs != null ? (
              <span className="font-mono">{props.currentCycleUsedHrs.toFixed(1)} h</span>
            ) : (
              "—"
            )}
          </p>
          <p>
            <span className="font-medium">On-duty today (lines Driving + On duty):</span>{" "}
            <span className="font-mono">{(byStatus.D + byStatus.ON).toFixed(2)} h</span>
          </p>
          <p className="text-slate-600">
            Full paper recap (A/B/C boxes) needs multi-day history; this app shows today&apos;s graph + trip context.
          </p>
        </div>
      </footer>
    </article>
  );
}
