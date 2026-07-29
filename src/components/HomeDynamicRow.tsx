import { Link } from "@tanstack/react-router";
import { HomeListingsRow } from "./HomeListingsRow";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";
import type { HomeRow } from "@/hooks/useHomeLayout";

/**
 * صف إعلانات ديناميكي واحد للصفحة الرئيسية.
 * لكل صف Hook مستقل يجلب إعلاناته حسب مصدره (أحدث الإعلانات أو تصنيف).
 */
export function HomeDynamicRow({ row }: { row: HomeRow }) {
  const { lang } = useLanguage();
  const isCategory = row.source === "category" && !!row.categoryId;
  const { listings, loading, loadMore, loadingMore, hasMore } = useListings({
    pageSize: row.count,
    onlyNormal: true,
    categoryId: isCategory ? row.categoryId : undefined,
  });

  const title = lang === "ar" ? row.titleAr : row.titleEn;

  return (
    <HomeListingsRow
      title={title}
      items={listings}
      loading={loading}
      hideContact
      hideMeta
      cardWidthPct={row.cardWidthPct}
      firstRowCount={row.count}
      chunkSize={6}
      moreButton={
        isCategory ? (
          <Link
            to="/category/$id"
            params={{ id: row.categoryId! }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            {lang === "ar" ? "عرض المزيد" : "See more"}
          </Link>
        ) : undefined
      }
      onLoadMore={isCategory ? undefined : () => loadMore(6)}
      loadingMore={loadingMore}
      hasMore={isCategory ? undefined : hasMore}
    />
  );
}
