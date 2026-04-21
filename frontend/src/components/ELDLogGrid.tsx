import { useEffect, useRef } from "react";
import type { DailyLogDTO, DutyStatusCode } from "../types/trip";

const STATUS_LABEL: Record<DutyStatusCode, string> = {
  D: "Driving",
  ON: "On duty (N/D)",
  OFF: "Off duty",
  SB: "Sleeper",
};

function statusColor(s: DutyStatusCode): string {
  switch (s) {
    case "D":
      return "rgb(0, 128, 128)";
    case "ON":
      return "rgb(248, 73, 96)";
    case "SB":
      return "#1d4ed8";
    default:
      return "#94a3b8";
  }
}

export function ELDLogGrid(props: { log: DailyLogDTO }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const w = c.width;
    const h = c.height;
    const padL = 56;
    const padR = 16;
    const padT = 44;
    const padB = 28;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgb(188, 221, 222)";
    ctx.lineWidth = 1;
    for (let hr = 0; hr <= 24; hr += 1) {
      const x = padL + (hr / 24) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + chartH);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(hr === 24 ? "24" : String(hr), x, padT - 8);
    }

    const midY = padT + chartH / 2;
    ctx.beginPath();
    ctx.strokeStyle = "#cbd5e1";
    ctx.moveTo(padL, midY);
    ctx.lineTo(padL + chartW, midY);
    ctx.stroke();

    const lane = {
      OFF: padT + chartH * 0.15,
      SB: padT + chartH * 0.35,
      D: padT + chartH * 0.55,
      ON: padT + chartH * 0.75,
    } as const;

    ctx.fillStyle = "#0f172a";
    ctx.font = "11px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("OFF", 8, lane.OFF);
    ctx.fillText("SB", 12, lane.SB);
    ctx.fillText("D", 16, lane.D);
    ctx.fillText("ON", 12, lane.ON);

    for (const seg of props.log.segments) {
      const x0 = padL + (seg.start_hour / 24) * chartW;
      const x1 = padL + (seg.end_hour / 24) * chartW;
      const st = seg.status as DutyStatusCode;
      const y = lane[st in lane ? st : "OFF"];
      ctx.fillStyle = statusColor(st);
      ctx.globalAlpha = 0.92;
      ctx.fillRect(x0, y - 6, Math.max(1, x1 - x0), 12);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "600 12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Date: ${props.log.date}`, padL, 18);
    ctx.font = "11px system-ui";
    ctx.fillText(
      `Driving ${props.log.total_driving_hrs.toFixed(1)} h · On-duty (incl. driving) ${props.log.total_on_duty_hrs.toFixed(1)} h`,
      padL,
      34
    );

    const legendX = padL + chartW - 160;
    let ly = h - 16;
    (["D", "ON", "OFF", "SB"] as DutyStatusCode[]).forEach((code) => {
      ctx.fillStyle = statusColor(code);
      ctx.fillRect(legendX, ly - 8, 12, 8);
      ctx.fillStyle = "#475569";
      ctx.font = "10px system-ui";
      ctx.fillText(`${code} ${STATUS_LABEL[code]}`, legendX + 16, ly);
      ly -= 12;
    });
  }, [props.log]);

  return (
    <div className="rounded-2xl border border-eld-mist bg-white p-4 shadow-sm">
      <canvas ref={canvasRef} width={900} height={260} className="h-auto w-full max-w-full" />
    </div>
  );
}
