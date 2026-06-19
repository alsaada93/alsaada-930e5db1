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

// Legacy Zapier/automation payload (kept for backwards compatibility).
const LegacyPayloadSchema = z.object({
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

// New external-bot payload — writes straight into the main listings table.
const BotPayloadSchema = z.object({
  source: z.string().max(100).nullish(),
  title: z.string().max(500).nullish(),
  content: z.string().max(20000).nullish(),
  author_name: z.string().max(200).nullish(),
  contact_phone: z.string().max(50).nullish(),
  price: z.union([z.string().max(50), z.number()]).nullish(),
  image_base64: z.string().max(15_000_000).nullish(),
  images: z.array(z.string().url().max(2000)).max(20).nullish(),
  category: z.string().max(100).nullish(),
  published_at: z.string().max(60).nullish(),
});

export const Route = createFileRoute("/api/public/facebook-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      // Health / secret verification & Meta Official Webhook Verification
      GET: async ({ request }) => {
        const url = new URL(request.url);

        // --- 1. تحقق الويب هوك الرسمي من فيسبوك (Meta Webhook Challenge) ---
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        // الكلمة السرية التي ستضعها في لوحة فيسبوك
        const VERIFY_TOKEN = "alsaada2026";

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
          // يجب أن نرد برقم الـ challenge كنص عادي لكي يقبل فيسبوك الربط
          return new Response(challenge, { status: 200 });
        }

        // --- 2. التحقق القديم الخاص بالبوتات والأتمتة ---
        const secret = request.headers.get("x-sync-secret");
        const { verifySecret } = await import("@/lib/facebook-sync.server");
        const ok = await verifySecret(secret);
        return json({ ok, service: "facebook-sync", status: ok ? "ready" : "unauthorized" }, ok ? 200 : 401);
      },

      POST: async ({ request }) => {
        const secret = request.headers.get("x-sync-secret");

        const { verifySecret, ingestPost, deletePostAd, ingestBotPost } = await import("@/lib/facebook-sync.server");

        // Security: reject any request without a matching secret before processing.
        if (!(await verifySecret(secret))) {
          return json({ status: "error", message: "Unauthorized" }, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ status: "error", message: "Invalid JSON" }, 400);
        }

        // Route by payload shape: the new bot format has title/content and no post_id.
        const isLegacy = typeof body === "object" && body !== null && "post_id" in (body as Record<string, unknown>);

        if (!isLegacy) {
          const parsed = BotPayloadSchema.safeParse(body);
          if (!parsed.success) {
            return json({ status: "error", message: "Invalid payload", details: parsed.error.flatten() }, 400);
          }
          const result = await ingestBotPost(parsed.data);
          const code = result.status === "error" ? 500 : 200;
          return json(result, code);
        }

        // ── Legacy path (existing Zapier automation) ──
        const parsed = LegacyPayloadSchema.safeParse(body);
        if (!parsed.success) {
          return json({ status: "error", message: "Invalid payload", details: parsed.error.flatten() }, 422);
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
