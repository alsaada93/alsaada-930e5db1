import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";

export function ListingsSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Listing[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <button className="text-sm font-bold text-primary hover:underline">عرض الكل</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
