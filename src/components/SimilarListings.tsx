import { ListingCard } from "./ListingCard";
import { ListingGridSkeleton } from "./ListingCardSkeleton";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

export function SimilarListings({
  categoryId,
  currentId,
  limit = 8,
}: {
  categoryId?: string;
  currentId: string;
  limit?: number;
}) {
  const { lang } = useLanguage();
  const { listings, loading } = useListings({
    pageSize: limit + 4,
    onlyNormal: true,
    categoryId,
  });
  const items = listings.filter((l) => l.id !== currentId).slice(0, limit);
  const { map } = useListingTranslations(
    items.map((i) => ({ id: i.id, title: i.title, description: i.description })),
  );

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-extrabold">
        {lang === "ar" ? "إعلانات مشابهة" : "Similar listings"}
      </h2>
      {loading ? (
        <ListingGridSkeleton
          count={4}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              displayTitle={map[item.id]?.title}
              hideContact
              hideMeta
            />
          ))}
        </div>
      )}
    </section>
  );
}
