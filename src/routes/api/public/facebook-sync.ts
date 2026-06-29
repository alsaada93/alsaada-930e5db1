import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-sync-secret, x-hub-signature-256",
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
  images: z.array(z.string().url().max(2000)).max(30).nullish(),
  created_time: z.string().max(60).nullish(),
});

// New external-bot payload
const BotPayloadSchema = z.object({
  post_id: z.string().max(500).nullish(),
  fb_post_id: z.string().max(500).nullish(),
  external_id: z.string().max(500).nullish(),
  source: z.string().max(100).nullish(),
  title: z.string().max(500).nullish(),
  content: z.string().max(20000).nullish(),
  author_name: z.string().max(200).nullish(),
  contact_phone: z.string().max(50).nullish(),
  price: z.union([z.string().max(50), z.number()]).nullish(),
  image_base64: z.string().max(15_000_000).nullish(),
  images: z.array(z.string().url().max(2000)).max(30).nullish(),
  category: z.string().max(100).nullish(),
  published_at: z.string().max(60).nullish(),
});

function firstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function collectImageUrls(...values: unknown[]): string[] {
  const out: string[] = [];
  const visit = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") {
      v
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s))
        .forEach((s) => out.push(s));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      visit(o.url ?? o.src ?? o.href ?? o.image_url ?? o.photo_url);
    }
  };
  values.forEach(visit);
  return Array.from(new Set(out)).slice(0, 30);
}

function normalizeBotPayload(body: Record<string, unknown>): Record<string, unknown> {
  const images = collectImageUrls(
    body.images,
    body.image_urls,
    body.imageUrls,
    body.image_url,
    body.imageUrl,
    body.photo_url,
    body.photoUrl,
    body.photos,
    body.media,
    body.attachments,
  );

  return {
    post_id: firstString(body.post_id, body.fb_post_id, body.facebook_post_id, body.external_id, body.id, body.permalink_url, body.url, body.link),
    fb_post_id: firstString(body.fb_post_id, body.facebook_post_id),
    external_id: firstString(body.external_id, body.id),
    source: firstString(body.source) ?? "facebook_bot",
    title: firstString(body.title, body.name, body.ad_title, body.adTitle, body.product_name, body.productName),
    content: firstString(body.content, body.text, body.message, body.description, body.caption, body.body, body.details),
    author_name: firstString(body.author_name, body.author, body.seller_name, body.sellerName, body.user_name, body.userName, body.from_name),
    contact_phone: firstString(body.contact_phone, body.phone, body.mobile, body.whatsapp, body.whatsApp, body.contact),
    price: firstString(body.price, body.amount, body.value) ?? (typeof body.price === "number" ? body.price : undefined),
    image_base64: firstString(body.image_base64, body.imageBase64, body.base64, body.image_data, body.imageData),
    images: images.length ? images : undefined,
    category: firstString(body.category, body.category_name, body.categoryName, body.section),
    published_at: firstString(body.published_at, body.created_time, body.createdAt, body.created_at, body.date, body.timestamp),
  };
}

function readSyncSecret(request: Request): string | null {
  const direct = request.headers.get("x-sync-secret");
  if (direct) return direct;
  const auth = request.headers.get("authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function extractBotItems(body: unknown): Record<string, unknown>[] {
  const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  if (Array.isArray(body)) return body.filter(isRecord);
  if (!isRecord(body)) return [];
  for (const key of ["posts", "items", "data", "records", "listings", "ads"]) {
    const v = body[key];
    if (Array.isArray(v)) return v.filter(isRecord);
  }
  return [body];
}

function parsePublishedAt(value: unknown): string {
  if (typeof value === "number") return new Date(value > 10_000_000_000 ? value : value * 1000).toISOString();
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    const d = Number.isFinite(numeric)
      ? new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000)
      : new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

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

        const secret = readSyncSecret(request);
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

        const { verifySecret, deletePostAd, ingestBotPost } = await import("@/lib/facebook-sync.server");

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
                  published_at: parsePublishedAt(post.created_time),
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
        const secret = readSyncSecret(request);

        if (!(await verifySecret(secret))) {
          return json({ status: "error", message: "Unauthorized" }, 401);
        }

        const objectBody = typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
        if (objectBody && objectBody.action === "delete" && typeof objectBody.post_id === "string") {
          const result = await deletePostAd(objectBody.post_id);
          return json(result, result.ok ? 200 : 500);
        }

        const botItems = extractBotItems(body);
        if (botItems.length > 1) {
          const results = [];
          for (const item of botItems) {
            const parsed = BotPayloadSchema.safeParse(normalizeBotPayload(item));
            if (!parsed.success) {
              results.push({ status: "error", message: "Invalid payload", details: parsed.error.flatten() });
              continue;
            }
            results.push(await ingestBotPost(parsed.data));
          }
          const imported = results.filter((r: any) => r.status === "ok").length;
          const duplicates = results.filter((r: any) => r.status === "duplicate").length;
          const errors = results.filter((r: any) => r.status === "error").length;
          return json({ status: errors ? "partial" : "ok", imported, duplicates, errors, results }, errors === results.length ? 400 : 200);
        }

        // كل منشور جديد/محدّث من البوت الخارجي يذهب إلى نظام الإعلانات الرئيسي مباشرة.
        // نقوم بتطبيع أسماء الحقول الشائعة حتى لا يتوقف الاستقبال إذا أرسل البوت
        // message/text/description أو image_url/image_urls بدلاً من content/images.
        if (objectBody) {
          const parsed = BotPayloadSchema.safeParse(normalizeBotPayload(objectBody));
          if (!parsed.success) {
            return json({ status: "error", message: "Invalid payload", details: parsed.error.flatten() }, 400);
          }
          const result = await ingestBotPost(parsed.data);
          const code = result.status === "error" ? 500 : 200;
          return json(result, code);
        }

        return json({ status: "error", message: "Invalid payload" }, 400);
      },
    },
  },
});
