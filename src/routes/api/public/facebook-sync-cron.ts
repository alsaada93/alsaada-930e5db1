import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled sync job — called every 5 minutes by pg_cron.
 * Retries recently-failed imports and refreshes the sync heartbeat.
 *
 * Authentication: the caller must present a dedicated random secret
 * (`CRON_SECRET`) in the `Authorization: Bearer <secret>` header (or the
 * `x-cron-secret` header). This secret is server-side only and never shipped
 * to the browser, unlike the publishable anon key.
 */
function safeEqual(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function isAuthorized(request: Request): boolean {
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    null;
  if (!provided) return false;
  // Accept either the dedicated Facebook cron secret (used by pg_cron) or the
  // legacy generic cron secret, whichever is configured.
  const candidates = [process.env.FB_CRON_SECRET, process.env.CRON_SECRET].filter(
    (v): v is string => Boolean(v),
  );
  return candidates.some((expected) => safeEqual(provided, expected));
}

async function run(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { retryFailedAndHeartbeat } = await import("@/lib/facebook-sync.server");
  const result = await retryFailedAndHeartbeat();
  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/facebook-sync-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});
