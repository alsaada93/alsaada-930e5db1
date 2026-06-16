import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-sync-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

const PayloadSchema = z.object({
  action: z.enum(["create", "update", "delete", "upsert"]).optional().default("upsert"),
  post_id: z.string().min(1).max(200),
  text: z.string().max(20000).nullish(),
  message: z.string().max(20000).nullish(),
  seller_name: z.string().max(200).nullish(),
  phone: z.string().max(50).nullish(),
  category: z.string().max(100).nullish(),
  images: z.array(z.string().url().max(2000)).max(20).nullish(),
  created_time: z.string().max(60).nullish(),
});

export const Route = createFileRoute("/api/public/facebook-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      // Health / secret verification (used by automation tools to "test" the hook)
      GET: async ({ request }) => {
        const secret = request.headers.get("x-sync-secret");
        const { verifySecret } = await import("@/lib/facebook-sync.server");
        const ok = await verifySecret(secret);
        return json({ ok, service: "facebook-sync", status: ok ? "ready" : "unauthorized" }, ok ? 200 : 401);
      },

      POST: async ({ request }) => {
        const secret = request.headers.get("x-sync-secret");

        const { verifySecret, ingestPost, deletePostAd } = await import(
          "@/lib/facebook-sync.server"
        );

        if (!(await verifySecret(secret))) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() }, 422);
        }

        const data = parsed.data;
        if (data.action === "delete") {
          const result = await deletePostAd(data.post_id);
          return json(result, result.ok ? 200 : 500);
        }

        const result = await ingestPost(data);
        return json(result, result.ok ? 200 : 500);
      },
    },
  },
});
