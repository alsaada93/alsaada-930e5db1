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

      // ─── GET: التحقق الأولي (بوابة الترحيب لفيسبوك ومزودي الخدمة) ───
      GET: async ({ request }) => {
        const url = new URL(request.url);

        // 1. التحقق الرسمي من مطوري فيسبوك (Meta Challenge)
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const VERIFY_TOKEN = "alsaada2026"; // الكلمة السرية التي ستضعها في لوحة فيسبوك

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }

        // 2. التحقق القديم (لأدوات الأتمتة)
        const secret = request.headers.get("x-sync-secret");
        const { verifySecret } = await import("@/lib/facebook-sync.server");
        const ok = await verifySecret(secret);
        return json({ ok, service: "facebook-sync", status: ok ? "ready" : "unauthorized" }, ok ? 200 : 401);
      },

      // ─── POST: استقبال المنشورات الجديدة ───
      POST: async ({ request }) => {
        // نقرأ محتوى الطلب مرة واحدة كنص
        const rawBody = await request.text();
        let body: any;

        try {
          body = JSON.parse(rawBody);
        } catch {
          return json({ status: "error", message: "Invalid JSON format" }, 400);
        }

        // استدعاء الدوال الأساسية من قاعدة بياناتك
        const { verifySecret, ingestPost, deletePostAd, ingestBotPost } = await import("@/lib/facebook-sync.server");

        // ====================================================================
        // الجزء الأول: التعامل مع تنسيق فيسبوك الرسمي (Meta Graph API Webhook)
        // ====================================================================
        if (body.object === "group" || body.object === "page") {
          // استخراج المصفوفات المتداخلة التي يرسلها فيسبوك
          for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
              // نهتم فقط بالمنشورات الجديدة (verb: add)
              if (change.field === "feed" && change.value && change.value.verb === "add") {
                const post = change.value;

                // تجاهل المنشورات الفارغة (التي لا تحتوي على نص)
                if (!post.message) continue;

                // محاولة استخراج الصور من المرفقات إذا أرسلها فيسبوك
                const extractedImages: string[] = [];
                if (post.attachments && post.attachments.data) {
                  for (const attachment of post.attachments.data) {
                    if (attachment.media?.image?.src) {
                      extractedImages.push(attachment.media.image.src);
                    }
                    // في حال كان المنشور عبارة عن ألبوم صور
                    if (attachment.subattachments && attachment.subattachments.data) {
                      for (const sub of attachment.subattachments.data) {
                        if (sub.media?.image?.src) {
                          extractedImages.push(sub.media.image.src);
                        }
                      }
                    }
                  }
                }

                // تحويل بيانات فيسبوك المعقدة إلى التنسيق البسيط الذي يفهمه موقعك (BotPayload)
                const mappedPayload = {
                  source: "facebook_official",
                  title: "منشور من مجموعة فيسبوك",
                  content: post.message,
                  author_name: post.from?.name || "عضو في المجموعة",
                  // تحويل الوقت من ثواني إلى صيغة ISO
                  published_at: post.created_time
                    ? new Date(post.created_time * 1000).toISOString()
                    : new Date().toISOString(),
                  images: extractedImages.length > 0 ? extractedImages : null,
                };

                // إرسال البيانات لدالة المعالجة الذكية في موقعك لتستخرج السعر ورقم الهاتف وتنشره
                await ingestBotPost(mappedPayload);
              }
            }
          }

          // يجب الرد على فيسبوك بـ 200 OK فوراً وإلا سيعتبر أن موقعك معطل ويوقف إرسال المنشورات
          return new Response("EVENT_RECEIVED", { status: 200 });
        }

        // ====================================================================
        // الجزء الثاني: التعامل مع البوتات وأدوات الأتمتة (Make/Zapier/Custom Bots)
        // ====================================================================
        const secret = request.headers.get("x-sync-secret");

        // التحقق من المفتاح السري للبوتات
        if (!(await verifySecret(secret))) {
          return json({ status: "error", message: "Unauthorized" }, 401);
        }

        const isLegacy = typeof body === "object" && body !== null && "post_id" in (body as Record<string, unknown>);

        // تنسيق البوت الجديد (BotPayloadSchema)
        if (!isLegacy) {
          const parsed = BotPayloadSchema.safeParse(body);
          if (!parsed.success) {
            return json({ status: "error", message: "Invalid payload", details: parsed.error.flatten() }, 400);
          }
          const result = await ingestBotPost(parsed.data);
          const code = result.status === "error" ? 500 : 200;
          return json(result, code);
        }

        // ── تنسيق البوت القديم (Legacy path) ──
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
