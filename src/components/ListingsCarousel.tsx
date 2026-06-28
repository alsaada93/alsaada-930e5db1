import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

/**
 * Horizontal, snap-scrolling carousel for listings.
 * Shows ~3 cards per view on desktop and supports native touch swipe on mobile.
 * Lazy loading is preserved (ListingCard images are lazy-loaded individually).
 */
export function ListingsCarousel({
  title,
  subtitle,
  items,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  items: Listing[];
  emptyText?: string;
}) {
  const { lang } = useLanguage();
  const rtl = lang === "ar";
  const { map } = useListingTranslations(
    items.map((i) => ({ id: i.id, title: i.title, description: i.description })),
  );
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // RTL: visual "next" is negative scrollLeft, so flip the sign.
    const amount = el.clientWidth * 0.9 * dir * (rtl ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {items.length > 1 && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label={rtl ? "السابق" : "Previous"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              {rtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label={rtl ? "التالي" : "Next"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              {rtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <div
          ref={trackRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/3)]"
            >
              <ListingCard item={item} displayTitle={map[item.id]?.title} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {emptyText ?? (lang === "ar" ? "لا توجد إعلانات بعد." : "No listings yet.")}
        </div>
      )}
    </section>
  );
}
