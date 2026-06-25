import { useHomeBanners, type BannerPosition } from "@/hooks/useHomeBanners";
import { optimizedImage } from "@/lib/image-url";

/** Renders admin-managed image banners for a given home-page position. */
export function HomeBanners({ position }: { position: BannerPosition }) {
  const { banners } = useHomeBanners();
  const items = banners[position] ?? [];
  if (items.length === 0) return null;

  // Side rails: vertical stack, sticky, only on wide screens.
  if (position === "left" || position === "right") {
    return (
      <div className="hidden xl:flex sticky top-24 w-40 shrink-0 flex-col gap-4">
        {items.map((b) => (
          <a
            key={b.id}
            href={b.link || "#"}
            className="block overflow-hidden rounded-xl border border-border shadow-card"
          >
            <img src={optimizedImage(b.imageUrl, 320)} alt="إعلان" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </a>
        ))}
      </div>
    );
  }

  // Top / bottom: full-width band.
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((b) => (
          <a
            key={b.id}
            href={b.link || "#"}
            className="block overflow-hidden rounded-2xl border border-border shadow-card"
          >
            <img src={optimizedImage(b.imageUrl, 700)} alt="إعلان" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </a>
        ))}
      </div>
    </section>
  );
}
