import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

export function ListingsSection({
  title,
  subtitle,
  items,
  emptyText,
  hideContact,
}: {
  title: string;
  subtitle?: string;
  items: Listing[];
  emptyText?: string;
  hideContact?: boolean;
}) {
  const { lang } = useLanguage();
  const { map } = useListingTranslations(items.map((i) => ({ id: i.id, title: i.title, description: i.description })));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ListingCard key={item.id} item={item} displayTitle={map[item.id]?.title} hideContact={hideContact} />
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
