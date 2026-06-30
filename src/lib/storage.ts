import { supabase } from "@/integrations/supabase/client";

const PUBLIC_MARKER = "/storage/v1/object/public/listings/";
const RENDER_MARKER = "/storage/v1/render/image/public/listings/";

/**
 * Extract the storage object path (inside the "listings" bucket) from a public
 * or render URL. Returns null for non-bucket URLs (CDN assets, placeholders).
 */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const marker = url.includes(PUBLIC_MARKER)
    ? PUBLIC_MARKER
    : url.includes(RENDER_MARKER)
      ? RENDER_MARKER
      : null;
  if (!marker) return null;
  const after = url.split(marker)[1];
  if (!after) return null;
  // strip any query string (transform params)
  return decodeURIComponent(after.split("?")[0]);
}

/**
 * Permanently delete an old image from the "listings" bucket so replaced
 * banners/logos do not pile up and conflict with newly uploaded ones.
 * Silently ignores URLs that are not stored in the bucket.
 */
export async function deleteStorageImage(url: string | null | undefined): Promise<void> {
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await supabase.storage.from("listings").remove([path]);
  } catch {
    // best-effort cleanup — never block the UI on a failed delete
  }
}
