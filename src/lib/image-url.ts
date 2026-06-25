// Helper to serve smaller, responsive versions of listing images.
// Supabase Storage exposes an on-the-fly image transformation endpoint at
// /storage/v1/render/image/public/... which also negotiates WebP/AVIF based on
// the browser's Accept header. We rewrite public object URLs to that endpoint
// without changing any data, routes, or field names.

const OBJECT_MARKER = "/storage/v1/object/public/";
const RENDER_MARKER = "/storage/v1/render/image/public/";

/** Returns true for Supabase Storage public object URLs we can transform. */
function isTransformable(url: string): boolean {
  return typeof url === "string" && url.includes(OBJECT_MARKER);
}

/**
 * Build a resized image URL. For non-Supabase URLs (CDN assets, placeholders,
 * data URLs) the original is returned untouched so nothing breaks.
 */
export function optimizedImage(
  url: string | undefined | null,
  width: number,
  quality = 65,
): string {
  if (!url) return "/placeholder.svg";
  if (!isTransformable(url)) return url;
  const base = url.replace(OBJECT_MARKER, RENDER_MARKER);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&quality=${quality}&resize=cover`;
}

/**
 * Build a srcset string for responsive display. Falls back to a single entry
 * for non-transformable URLs.
 */
export function optimizedSrcSet(
  url: string | undefined | null,
  widths: number[],
  quality = 65,
): string | undefined {
  if (!url || !isTransformable(url)) return undefined;
  return widths.map((w) => `${optimizedImage(url, w, quality)} ${w}w`).join(", ");
}
