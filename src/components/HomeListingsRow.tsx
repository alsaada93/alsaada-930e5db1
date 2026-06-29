import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

/**
 * Single-row horizontal swipe carousel for home sections.
 * - One row, native touch swipe + arrow buttons.
 * - Optional "more" button below: either a link (Link) or a load-more action.
 */
export function HomeListingsRow({
  title,
  subtitle,
  items,
  emptyText,
  moreButton,
  moreLabel,
  onLoadMore,
  loadingMore,
  hasMore,
}: {
  title: string;
  subtitle?: string;
  items: Listing[];
  emptyText?: string;
  /** عند تمريره: زر المزيد يكون رابطًا لهذا المسار */
  moreTo?: string;
  moreLabel?: string;
  /** عند تمريره: زر المزيد يحمّل المزيد من الإعلانات داخل نفس الصف */
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}) {
  const { lang } = useLanguage();
  const rtl = lang === "ar";
  const { map } = useListingTranslations(
    items.map((i) => ({ id: i.id, title: i.title, description: i.description })),
  );
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByOne = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCol = el.firstElementChild as HTMLElement | null;
    const colWidth = firstCol ? firstCol.getBoundingClientRect().width : el.clientWidth / 2;
    const gap = 12;
    const amount = (colWidth + gap) * 2 * dir * (rtl ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {items.length > 1 && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByOne(-1)}
              aria-label={rtl ? "السابق" : "Previous"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              {rtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => scrollByOne(1)}
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
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[62%] min-w-0 shrink-0 snap-start sm:w-[38%] lg:w-[23%]"
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

      {/* زر المزيد أسفل القسم */}
      {moreTo && (
        <div className="mt-4 text-center">
          <Link
            to={moreTo}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            {moreLabel ?? (lang === "ar" ? "عرض المزيد" : "View more")}
          </Link>
        </div>
      )}
      {onLoadMore && hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {moreLabel ?? (lang === "ar" ? "عرض المزيد من الإعلانات" : "Load more listings")}
          </button>
        </div>
      )}
    </section>
  );
}
