/**
 * Server-only ingest pipeline for Facebook Group ads.
 * Handles parsing, image storage, upsert (create/update), soft-delete and logging.
 * Imported only by server functions and server routes.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  parsePost,
  detectCategory,
  categoryLabel,
  extractPriceSmart,
  extractCarSpecs,
  extractRealEstateSpecs,
  refineCategory,
  type FbCategorySlug,
} from "./facebook-parse";

const BUCKET = "listings";
const PREFIX = "facebook";
const MAX_IMAGES = 12;
const SOURCE = "facebook";

/**
 * Maps a detected Facebook category slug to a real site category_id used by the
 * main listings feed. Site categories are admin-editable and stored in
 * site_settings, so we resolve by matching the Arabic category name.
 * Returns null when there is no matching site category (the ad still appears on
 * the homepage and in search — it just won't be filed under a category page).
 */
async function resolveSiteCategoryId(slug: FbCategorySlug): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "categories")
      .maybeSingle();
    const cats = (data?.value as { id: string; name: string }[] | null) ?? [];
    if (!Array.isArray(cats) || cats.length === 0) return null;

    const arabicName = categoryLabel(slug).name;
    // direct name match (سيارات، عقارات، إلكترونيات، أثاث ...)
    const direct = cats.find((c) => c.name === arabicName);
    if (direct) return direct.id;

    // equipment / restaurant-style ads → the restaurant ("مطاعم") category
    if (slug === "equipment") {
      const r = cats.find((c) => c.id === "restaurant" || c.name.includes("مطاع"));
      if (r) return r.id;
    }
    return null;
  } catch {
    return null;
  }
}

/** Mirrors an imported ad into the main listings feed (published instantly). */
async function mirrorToListings(args: {
  fb_post_id: string;
  title: string;
  description: string;
  seller_name: string | null;
  phone: string | null;
  category: FbCategorySlug;
  images: string[];
  fb_published_at: string | null;
}): Promise<void> {
  try {
    const categoryId = await resolveSiteCategoryId(args.category);
    const { data: existing } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("source", SOURCE)
      .eq("source_ref", args.fb_post_id)
      .maybeSingle();

    const row = {
      title: args.title || "إعلان",
      description: args.description || null,
      category_id: categoryId,
      images: args.images,
      contact_name: args.seller_name,
      contact_phone: args.phone,
      price: 0,
      status: "approved" as const,
      listing_type: "normal" as const,
      source: SOURCE,
      source_ref: args.fb_post_id,
      ...(args.fb_published_at ? { published_at: args.fb_published_at } : {}),
    };

    if (existing?.id) {
      await supabaseAdmin.from("listings").update(row).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("listings").insert(row);
    }
  } catch (e) {
    await logSync(
      "mirror",
      args.fb_post_id,
      "failed",
      `تعذّر نشر الإعلان في القائمة الرئيسية: ${e instanceof Error ? e.message : "خطأ"}`,
    );
  }
}

export interface IngestPayload {
  post_id: string;
  text?: string | null;
  message?: string | null;
  // optional explicit overrides
  seller_name?: string | null;
  phone?: string | null;
  category?: string | null;
  images?: string[] | null;
  created_time?: string | null; // ISO date of the FB post
}

export interface IngestResult {
  ok: boolean;
  action: "created" | "updated" | "deleted" | "error";
  fb_post_id: string;
  error?: string;
}

async function logSync(
  event: string,
  fb_post_id: string | null,
  status: "success" | "failed",
  message: string,
  payload?: unknown,
) {
  try {
    await supabaseAdmin.from("facebook_sync_logs").insert({
      event,
      fb_post_id,
      status,
      message: message.slice(0, 2000),
      payload: (payload ? JSON.parse(JSON.stringify(payload)) : null) as never,
    });
  } catch {
    /* logging must never throw */
  }
}

async function touchMeta(apiStatus: "ok" | "error") {
  await supabaseAdmin
    .from("facebook_sync_meta")
    .update({ last_sync_at: new Date().toISOString(), api_status: apiStatus })
    .eq("id", 1);
}

function guessExt(contentType: string | null, url: string): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  const m = url.split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i);
  if (m) return m[1].toLowerCase().replace("jpeg", "jpg");
  return "jpg";
}

/** Downloads each remote image and stores it in Supabase Storage. Returns public URLs. */
async function storeImages(postId: string, urls: string[]): Promise<string[]> {
  const stored: string[] = [];
  const safeId = postId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const list = urls.filter(Boolean).slice(0, MAX_IMAGES);

  for (let i = 0; i < list.length; i++) {
    const url = list[i];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type");
      const ext = guessExt(contentType, url);
      const buf = new Uint8Array(await res.arrayBuffer());
      const path = `${PREFIX}/${safeId}/${i}.${ext}`;
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buf, {
          contentType: contentType ?? "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });
      if (error) throw error;
      stored.push(supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      await logSync(
        "image",
        postId,
        "failed",
        `فشل تخزين صورة: ${e instanceof Error ? e.message : "خطأ"} (${url})`,
      );
    }
  }
  return stored;
}

/** Returns optimized thumbnail URLs (Supabase render transform when available). */
function buildThumbnails(images: string[]): string[] {
  return images.map((u) => {
    const transformed = u.replace("/object/public/", "/render/image/public/");
    return transformed === u ? u : `${transformed}?width=400&quality=70&resize=cover`;
  });
}

/** Create or update an ad from a Facebook post payload. */
export async function ingestPost(payload: IngestPayload): Promise<IngestResult> {
  const fb_post_id = String(payload.post_id || "").trim();
  if (!fb_post_id) {
    await logSync("create", null, "failed", "post_id مفقود", payload);
    return { ok: false, action: "error", fb_post_id: "", error: "missing post_id" };
  }

  try {
    const rawText = (payload.text ?? payload.message ?? "").toString();
    const parsed = parsePost(rawText);

    const seller_name = payload.seller_name?.trim() || parsed.seller_name;
    const phone = payload.phone?.trim() || parsed.phone;
    // Honor an explicit category field from the payload when present, otherwise
    // fall back to the category auto-detected from the post text.
    const category = payload.category?.trim()
      ? detectCategory(rawText, payload.category)
      : parsed.category;

    // existing record?
    const { data: existing } = await supabaseAdmin
      .from("facebook_ads")
      .select("id, images")
      .eq("fb_post_id", fb_post_id)
      .maybeSingle();

    const incomingImages = Array.isArray(payload.images) ? payload.images : [];
    let images: string[] = (existing?.images as string[] | undefined) ?? [];
    // only re-download when new images are provided
    if (incomingImages.length > 0) {
      images = await storeImages(fb_post_id, incomingImages);
    }
    const thumbnails = buildThumbnails(images);

    const row = {
      fb_post_id,
      title: parsed.title,
      description: parsed.description,
      seller_name,
      phone,
      category,
      images,
      thumbnails,
      raw_text: rawText,
      fb_published_at: payload.created_time
        ? new Date(payload.created_time).toISOString()
        : existing
          ? undefined
          : new Date().toISOString(),
      status: "active" as const,
    };

    const { error } = await supabaseAdmin
      .from("facebook_ads")
      .upsert(row, { onConflict: "fb_post_id" });
    if (error) throw error;

    // Mirror into the main listings feed so the ad shows on the homepage,
    // category pages and search — not only on the dedicated Facebook page.
    await mirrorToListings({
      fb_post_id,
      title: parsed.title,
      description: parsed.description,
      seller_name,
      phone,
      category,
      images,
      fb_published_at: (row.fb_published_at as string | undefined) ?? null,
    });

    const action = existing ? "updated" : "created";
    await logSync(action === "created" ? "create" : "update", fb_post_id, "success", `تم ${action === "created" ? "إنشاء" : "تحديث"} الإعلان`);
    await touchMeta("ok");
    return { ok: true, action: action === "created" ? "created" : "updated", fb_post_id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    await logSync("create", fb_post_id, "failed", msg, payload);
    await touchMeta("error");
    return { ok: false, action: "error", fb_post_id, error: msg };
  }
}

/** Soft-delete (hide) an ad when its Facebook post is removed. */
export async function deletePostAd(postId: string): Promise<IngestResult> {
  const fb_post_id = String(postId || "").trim();
  if (!fb_post_id) return { ok: false, action: "error", fb_post_id: "", error: "missing post_id" };
  try {
    const { error } = await supabaseAdmin
      .from("facebook_ads")
      .update({ status: "deleted" })
      .eq("fb_post_id", fb_post_id);
    if (error) throw error;
    // Hide the mirrored row in the main listings feed too.
    await supabaseAdmin
      .from("listings")
      .update({ status: "deleted" })
      .eq("source", SOURCE)
      .eq("source_ref", fb_post_id);
    await logSync("delete", fb_post_id, "success", "تم إخفاء الإعلان");
    await touchMeta("ok");
    return { ok: true, action: "deleted", fb_post_id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    await logSync("delete", fb_post_id, "failed", msg);
    await touchMeta("error");
    return { ok: false, action: "error", fb_post_id, error: msg };
  }
}

// ───────────────────────── External bot ingest (new payload) ─────────────────────────

export interface BotPayload {
  source?: string | null;
  title?: string | null;
  content?: string | null;
  author_name?: string | null;
  contact_phone?: string | null;
  price?: string | number | null;
  image_base64?: string | null;
  images?: string[] | null;
  category?: string | null;
  published_at?: string | null;
}

export interface BotIngestResult {
  status: "ok" | "duplicate" | "error";
  id?: string;
  ad_status?: "pending" | "approved";
  warning?: string;
  message?: string;
}

/** Builds a readable Arabic specs block appended to the description. */
function buildSpecsBlock(category: FbCategorySlug, text: string): string {
  const lines: string[] = [];
  if (category === "cars") {
    const s = extractCarSpecs(text);
    if (s.brand) lines.push(`الماركة: ${s.brand}`);
    if (s.year) lines.push(`سنة الصنع: ${s.year}`);
    if (s.mileage_km) lines.push(`الكيلومترات: ${s.mileage_km.toLocaleString("en-US")} كم`);
    if (s.transmission)
      lines.push(`ناقل الحركة: ${s.transmission === "automatic" ? "أوتوماتيك" : "مانيوال"}`);
    if (s.fuel) {
      const fuelAr: Record<string, string> = {
        petrol: "بنزين", diesel: "ديزل", hybrid: "هايبرد", electric: "كهرباء",
      };
      lines.push(`نوع الوقود: ${fuelAr[s.fuel] ?? s.fuel}`);
    }
    if (s.accident_free !== null)
      lines.push(`خلو من الحوادث: ${s.accident_free ? "نعم" : "لا"}`);
    if (s.previous_owners) lines.push(`عدد الملاك السابقين: ${s.previous_owners}`);
  } else if (category === "real_estate") {
    const s = extractRealEstateSpecs(text);
    const typeAr: Record<string, string> = {
      apartment: "شقة", villa: "فيلا", land: "أرض", office: "مكتب", shop: "محل", studio: "استوديو",
    };
    if (s.property_type) lines.push(`نوع العقار: ${typeAr[s.property_type] ?? s.property_type}`);
    lines.push(`نوع العرض: ${s.offer_type === "rent" ? "إيجار" : "بيع"}`);
    if (s.area_sqm) lines.push(`المساحة: ${s.area_sqm} م²`);
    if (s.bedrooms) lines.push(`غرف النوم: ${s.bedrooms}`);
    if (s.bathrooms) lines.push(`الحمامات: ${s.bathrooms}`);
    if (s.region) lines.push(`المنطقة: ${s.region}`);
  }
  return lines.length ? `\n\n— المواصفات —\n${lines.join("\n")}` : "";
}


/** Extracts a contact phone number (8+ digits) from text, or null. */
function extractPhone(text: string): string | null {
  if (!text) return null;
  const normalized = text.replace(/[\u0660-\u0669]/g, (d) =>
    String(d.charCodeAt(0) - 0x0660),
  );
  const m = normalized.match(/(\+?\d[\d\s-]{6,}\d)/g);
  if (!m) return null;
  for (const cand of m) {
    const digits = cand.replace(/[^\d]/g, "");
    if (digits.length >= 8 && digits.length <= 15) return digits;
  }
  return null;
}

/** Uploads a base64 (data URI or raw) image into the listings bucket. */
async function storeBase64Image(b64: string): Promise<string | null> {
  try {
    let data = b64.trim();
    let ext = "jpg";
    let contentType = "image/jpeg";
    const dataUri = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
    if (dataUri) {
      contentType = dataUri[1];
      data = dataUri[2];
      ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    }
    const buf = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    if (buf.length === 0) return null;
    const path = `${PREFIX}/bot/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType, cacheControl: "31536000", upsert: true });
    if (error) throw error;
    return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Ingests an ad sent by the external Facebook bot using the simple payload
 * { source, title, content, image_base64, published_at } and writes it
 * straight into the main `listings` table — the exact same table used for
 * manually-added ads — so it appears, edits and deletes from the normal admin
 * dashboard. New ads are saved as `pending` for admin review before going live.
 */
export async function ingestBotPost(payload: BotPayload): Promise<BotIngestResult> {
  try {
    const content = (payload.content ?? "").toString().trim();
    const title = (payload.title ?? "").toString().trim();

    if (!content && !title) {
      await logSync("bot", null, "failed", "title و content مفقودان", payload);
      return { status: "error", message: "title or content is required" };
    }

    // Deduplication: same content within the last 24h.
    if (content) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: dup } = await supabaseAdmin
        .from("listings")
        .select("id")
        .eq("source", "facebook_bot")
        .eq("description", content)
        .gte("created_at", since)
        .maybeSingle();
      if (dup?.id) {
        await logSync("bot", null, "success", "تم تجاهل إعلان مكرر (نفس النص خلال 24 ساعة)");
        return { status: "duplicate", id: dup.id, ad_status: "pending" };
      }
    }

    let warning: string | undefined;
    let imageUrl: string | null = null;
    if (payload.image_base64) {
      imageUrl = await storeBase64Image(payload.image_base64);
      if (!imageUrl) {
        warning = "تعذّر رفع الصورة؛ تم حفظ الإعلان بدون صورة.";
        await logSync("bot", null, "failed", warning);
      }
    }

    // Smart extraction
    const priceResult = extractPriceSmart(content);
    const phone = extractPhone(content);

    // Categorise: detect, then refine so strong car/real-estate signals never
    // stay in "general" by mistake. Resolve to the real site category_id.
    const detected = detectCategory(content);
    const category = refineCategory(content, detected);
    const categoryId = await resolveSiteCategoryId(category);

    // Field-specific specs → appended to the description + mapped to columns.
    const specsBlock = buildSpecsBlock(category, content);
    const carSpecs = category === "cars" ? extractCarSpecs(content) : null;
    const reSpecs = category === "real_estate" ? extractRealEstateSpecs(content) : null;
    const negotiable = /\bnego\b|\bobo\b|قابل للتفاوض|قابل للنقاش|قابل/i.test(content);

    if (!priceResult.detected) {
      warning = warning ? `${warning} | price_not_detected` : "price_not_detected";
    }

    let publishedAt: string | null = null;
    if (payload.published_at) {
      const d = new Date(payload.published_at);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    const row = {
      title: title || content.slice(0, 80) || "إعلان",
      description: (content || "") + specsBlock || null,
      category_id: categoryId,
      images: imageUrl ? [imageUrl] : [],
      // price column is NOT NULL — store 0 as a placeholder when undetected and
      // flag it with the `price_not_detected` warning for manual review.
      price: priceResult.price ?? 0,
      negotiable,
      contact_phone: phone,
      ...(reSpecs?.area_sqm ? { area_sqm: reSpecs.area_sqm } : {}),
      ...(carSpecs?.brand ? { brand: carSpecs.brand } : {}),
      ...(reSpecs?.region ? { city: reSpecs.region } : {}),
      status: "pending" as const,
      listing_type: "normal" as const,
      source: "facebook_bot",
      ...(publishedAt ? { published_at: publishedAt } : {}),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("listings")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;

    await logSync(
      "bot",
      inserted.id,
      "success",
      `تم استقبال إعلان من البوت (قيد المراجعة) — التصنيف: ${categoryLabel(category).name}، السعر: ${
        priceResult.detected ? priceResult.price : "غير محدد"
      }`,
    );
    await touchMeta("ok");
    return { status: "ok", id: inserted.id, ad_status: "pending", warning };

  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    await logSync("bot", null, "failed", msg, payload);
    await touchMeta("error");
    return { status: "error", message: msg };
  }
}

/** Validates the webhook secret against the stored value. */
export async function verifySecret(provided: string | null): Promise<boolean> {
  if (!provided) return false;
  const { data } = await supabaseAdmin
    .from("facebook_sync_meta")
    .select("webhook_secret")
    .eq("id", 1)
    .maybeSingle();
  const expected = data?.webhook_secret;
  if (!expected) return false;
  // constant-time-ish compare
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Retries recently-failed create/update imports whose payload was stored.
 * Called by the scheduled cron job and updates the heartbeat.
 */
export async function retryFailedAndHeartbeat(): Promise<{ retried: number; recovered: number }> {
  let retried = 0;
  let recovered = 0;
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: failed } = await supabaseAdmin
      .from("facebook_sync_logs")
      .select("fb_post_id, payload, event")
      .eq("status", "failed")
      .in("event", ["create", "update"])
      .not("payload", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50);

    const seen = new Set<string>();
    for (const row of failed ?? []) {
      const pid = row.fb_post_id as string | null;
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);

      // skip if an active ad already exists
      const { data: ad } = await supabaseAdmin
        .from("facebook_ads")
        .select("status")
        .eq("fb_post_id", pid)
        .maybeSingle();
      if (ad?.status === "active") continue;

      const payload = row.payload as unknown as IngestPayload | null;
      if (!payload || !payload.post_id) continue;
      retried += 1;
      const res = await ingestPost(payload);
      if (res.ok) recovered += 1;
    }
  } catch {
    /* never throw from cron */
  }
  await touchMeta("ok");
  return { retried, recovered };
}

