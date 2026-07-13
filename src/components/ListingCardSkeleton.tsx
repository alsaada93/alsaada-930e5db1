import { useCardConfig } from "@/hooks/useCardConfig";

/**
 * هيكل تحميل (Skeleton) يحاكي شكل بطاقة الإعلان لتفادي وميض المحتوى الفارغ.
 */
export function ListingCardSkeleton() {
  const { config } = useCardConfig();
  const imageStyle =
    config.imageAspect === "custom"
      ? { height: `${config.imageHeightPx}px` }
      : { aspectRatio: config.imageAspect.replace("/", " / ") };

  return (
    <div
      className="animate-pulse overflow-hidden border border-border bg-card shadow-card"
      style={{ borderRadius: `${config.cardRadius}px` }}
    >
      <div className="w-full bg-muted" style={imageStyle} />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

/**
 * صف أفقي من هياكل التحميل يحاكي كاروسيل الصفحة الرئيسية.
 */
export function ListingRowSkeleton({ cardWidthPct }: { cardWidthPct?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden pb-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-[var(--cw)] min-w-0 shrink-0 sm:w-[38%] lg:w-[23%]"
          style={{ ["--cw" as string]: `${cardWidthPct ?? 62}%` }}
        >
          <ListingCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/**
 * شبكة من هياكل التحميل تحاكي صفحات القوائم (grid).
 */
export function ListingGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
