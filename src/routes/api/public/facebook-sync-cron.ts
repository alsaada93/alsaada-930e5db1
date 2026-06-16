import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled sync job — called every 5 minutes by pg_cron.
 * Retries recently-failed imports and refreshes the sync heartbeat.
 *
 * Authentication: the caller must present the project anon key in the
 * `apikey` header (the same value pg_cron is configured to send). This
 * prevents anonymous abuse of the database/storage work this route performs.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!expected) return false;
  const provided =
    request.headers.get("apikey") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;
  if (!provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
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
