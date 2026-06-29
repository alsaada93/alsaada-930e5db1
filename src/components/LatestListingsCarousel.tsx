import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

const ROWS = 3;
const PER_PULL = 10; // عدد الإعلانات في كل سحبة
const COLS_PER_PULL = Math.ceil(PER_PULL / ROWS); // عدد الأعمدة لكل سحبة

/**
 * Horizontal swipe carousel for the latest listings.
 * - 3 stacked rows (column-flow grid).
 * - Each arrow click / swipe advances ~10 listings (3 rows × columns).
 * - Native touch swipe on mobile, snap scrolling.
 */
export function LatestListingsCarousel({
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

  const scrollByPull = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // عرض عمود واحد (أول بطاقة) × عدد الأعمدة في السحبة
    const firstCol = el.firstElementChild as HTMLElement | null;
    const colWidth = firstCol ? firstCol.getBoundingClientRect().width : el.clientWidth / 2;
    const gap = 12;
    const amount = (colWidth + gap) * COLS_PER_PULL * dir * (rtl ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {items.length > ROWS && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByPull(-1)}
              aria-label={rtl ? "السابق" : "Previous"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              {rtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => scrollByPull(1)}
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
          className="grid grid-flow-col grid-rows-3 gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ gridAutoColumns: "minmax(46%, 1fr)", scrollSnapType: "x mandatory" }}
        >
          {items.map((item) => (
            <div key={item.id} className="min-w-0 [scroll-snap-align:start] sm:[grid-auto-columns:unset]">
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
