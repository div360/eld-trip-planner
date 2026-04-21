import { toPng } from "html-to-image";

/** Capture rendered DOM (daily log sheets) as one tall PNG and trigger download. */
export async function downloadDailyLogsAsPng(
  container: HTMLElement,
  filenameBase: string,
): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const dataUrl = await toPng(container, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#13242c",
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filenameBase}.png`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
