import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-sync-secret, x-hub-signature-256",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

// Legacy Zapier/automation payload
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

// New external-bot payload
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

      // ─── GET: التحقق الأولي ───
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN;

        if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }

        const secret = request.headers.get("x-sync-secret");
        const { verifySecret } = await import("@/lib/facebook-sync.server");
        const ok = await verifySecret(secret);
        return json({ ok, service: "facebook-sync", status: ok ? "ready" : "unauthorized" }, ok ? 200 : 401);
      },

      // ─── POST: استقبال المنشورات الجديدة ───
      POST: async ({ request }) => {
        const rawBody = await request.text();
        let body: any;

        try {
          body = JSON.parse(rawBody);
        } catch {
          return json({ status: "error", message: "Invalid JSON format" }, 400);
        }

        // أضفنا هذا السطر لنرى في السجلات (Logs) ما الذي يرسله فيسبوك بالضبط
        console.log("🚨 [Facebook Webhook] تم استلام طلب جديد:", JSON.stringify(body, null, 2));

        const { verifySecret, ingestPost, deletePostAd, ingestBotPost } = await import("@/lib/facebook-sync.server");

        // ====================================================================
        // الجزء الأول: التعامل مع تنسيق فيسبوك الرسمي (Meta Webhook)
        // ====================================================================
        if (body.object === "group" || body.object === "page") {
          // التحقق من توقيع فيسبوك (X-Hub-Signature-256) قبل معالجة أي بيانات
          const appSecret = process.env.FB_APP_SECRET;
          if (!appSecret) {
            console.error("[Facebook Webhook] FB_APP_SECRET غير مهيأ — تم رفض الطلب");
            return json({ status: "error", message: "Webhook not configured" }, 503);
          }
          const sigHeader = request.headers.get("x-hub-signature-256");
          if (!sigHeader) {
            return json({ status: "error", message: "Missing signature" }, 401);
          }
          const { createHmac, timingSafeEqual } = await import("node:crypto");
          const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
          const sigBuf = Buffer.from(sigHeader);
          const expBuf = Buffer.from(expected);
          if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
            return json({ status: "error", message: "Invalid signature" }, 403);
          }

          for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
              if (change.field === "feed" && change.value && change.value.verb === "add") {
                const post = change.value;

                // التعديل الأهم: بدلاً من تجاهل المنشور إذا كان بدون نص، نضع نصاً افتراضياً
                const contentText = post.message || post.story || "منشور مرفق بصورة بدون نص";

                // استخراج الصور العميق
                let extractedImages: string[] = [];
                if (post.attachments && post.attachments.data) {
                  for (const attachment of post.attachments.data) {
                    if (attachment.media?.image?.src) {
                      extractedImages.push(attachment.media.image.src);
                    }
                    if (attachment.subattachments && attachment.subattachments.data) {
                      for (const sub of attachment.subattachments.data) {
                        if (sub.media?.image?.src) {
                          extractedImages.push(sub.media.image.src);
                        }
                      }
                    }
                  }
                }

                // جلب رابط الصورة المباشرة كبديل إضافي
                if (post.item === "photo" && post.link && extractedImages.length === 0) {
                  extractedImages.push(post.link);
                }

                // تنظيف الصور المكررة
                const uniqueImages = [...new Set(extractedImages)];

                const mappedPayload = {
                  source: "facebook_official",
                  title: "منشور من فيسبوك",
                  content: contentText,
                  author_name: post.from?.name || "عضو في الصفحة",
                  published_at: post.created_time
                    ? new Date(post.created_time * 1000).toISOString()
                    : new Date().toISOString(),
                  images: uniqueImages.length > 0 ? uniqueImages : null,
                };

                // طباعة البيانات قبل الحفظ للتأكد من سلامتها
                console.log("✅ [Facebook Webhook] سيتم حفظ هذه البيانات:", mappedPayload);

                await ingestBotPost(mappedPayload);
              }
            }
          }

          return new Response("EVENT_RECEIVED", { status: 200 });
        }

        // ====================================================================
        // الجزء الثاني: التعامل مع البوتات وأدوات الأتمتة
        // ====================================================================
        const secret = request.headers.get("x-sync-secret");

        if (!(await verifySecret(secret))) {
          return json({ status: "error", message: "Unauthorized" }, 401);
        }

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
