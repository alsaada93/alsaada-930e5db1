/**
 * Server-only ingest pipeline for Facebook Group ads.
 * Handles parsing, image storage, upsert (create/update), soft-delete and logging.
 * Imported only by server functions and server routes.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parsePost, detectCategory, categoryLabel, type FbCategorySlug } from "./facebook-parse";

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

