import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled sync job — called every 5 minutes by pg_cron.
 * Retries recently-failed imports and refreshes the sync heartbeat.
 */
export const Route = createFileRoute("/api/public/facebook-sync-cron")({
  server: {
    handlers: {
      POST: async () => {
        const { retryFailedAndHeartbeat } = await import("@/lib/facebook-sync.server");
        const result = await retryFailedAndHeartbeat();
        return new Response(JSON.stringify({ ok: true, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => {
        const { retryFailedAndHeartbeat } = await import("@/lib/facebook-sync.server");
        const result = await retryFailedAndHeartbeat();
        return new Response(JSON.stringify({ ok: true, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
