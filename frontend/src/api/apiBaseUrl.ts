/**
 * Production API base (Railway). Must be an absolute URL with scheme, e.g.
 * `https://your-service.up.railway.app`
 *
 * If `VITE_API_BASE_URL` is set without `https://`, browsers treat requests as paths on the
 * Vercel origin → 404 on the wrong host. We prepend `https://` when the scheme is missing.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return "http://127.0.0.1:8000";
  }
  let v = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  return v;
}
