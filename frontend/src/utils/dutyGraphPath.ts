import type { DutyStatusCode, ELDSegmentDTO } from "../types/trip";

/** Paper form order: top → bottom */
export const DUTY_ROW_ORDER: DutyStatusCode[] = ["OFF", "SB", "D", "ON"];

export function rowIndexForStatus(s: DutyStatusCode): number {
  const i = DUTY_ROW_ORDER.indexOf(s);
  return i >= 0 ? i : 0;
}

/** Hours per status from segments (sums should equal span of day, ideally 24). */
export function hoursByStatus(segments: ELDSegmentDTO[]): Record<DutyStatusCode, number> {
  const acc: Record<DutyStatusCode, number> = { OFF: 0, SB: 0, D: 0, ON: 0 };
  for (const seg of segments) {
    const st = seg.status as DutyStatusCode;
    if (st in acc) acc[st] += Math.max(0, seg.end_hour - seg.start_hour);
  }
  return acc;
}

/**
 * FMCSA-style continuous line: horizontal along a duty row, vertical jumps at status/time changes.
 * Coordinates in the same space as the SVG viewBox (gridInnerWidth × gridInnerHeight).
 */
export function buildDutyLinePath(
  segments: ELDSegmentDTO[],
  opts: {
    gridInnerWidth: number;
    gridInnerHeight: number;
    /** Y center for each row index 0..3, top to bottom */
    rowCenters: [number, number, number, number];
  }
): string {
  const sorted = [...segments].sort((a, b) => a.start_hour - b.start_hour);
  if (sorted.length === 0) return "";

  const { gridInnerWidth, rowCenters } = opts;
  const x = (h: number) => (h / 24) * gridInnerWidth;

  let d = "";
  let lastX = x(sorted[0]!.start_hour);
  let lastY = rowCenters[rowIndexForStatus(sorted[0]!.status as DutyStatusCode)]!;

  d += `M ${lastX.toFixed(2)} ${lastY.toFixed(2)}`;

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i]!;
    const xs = x(seg.start_hour);
    const xe = x(seg.end_hour);
    const y = rowCenters[rowIndexForStatus(seg.status as DutyStatusCode)]!;

    if (i === 0) {
      d += ` L ${xe.toFixed(2)} ${y.toFixed(2)}`;
      lastX = xe;
      lastY = y;
      continue;
    }

    if (xs > lastX + 1e-4) {
      d += ` L ${xs.toFixed(2)} ${lastY.toFixed(2)}`;
    }
    if (Math.abs(y - lastY) > 1e-4) {
      d += ` L ${xs.toFixed(2)} ${y.toFixed(2)}`;
    }
    d += ` L ${xe.toFixed(2)} ${y.toFixed(2)}`;
    lastX = xe;
    lastY = y;
  }

  return d;
}
