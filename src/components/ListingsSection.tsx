import { useState } from "react";
import { Grid2x2, LayoutGrid } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";

export function ListingsSection({
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
  const { map } = useListingTranslations(items.map((i) => ({ id: i.id, title: i.title, description: i.description })));
  // كثافة العرض على الهاتف: عمودان (افتراضي) أو أربعة أعمدة
  const [denseMobile, setDenseMobile] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {/* خيار عرض الإعلانات على الهاتف */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 sm:hidden">
          <button
            type="button"
            onClick={() => setDenseMobile(false)}
            aria-label={lang === "ar" ? "عرض عمودين" : "Two per row"}
            className={`rounded-full p-1.5 transition-colors ${
              !denseMobile ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDenseMobile(true)}
            aria-label={lang === "ar" ? "عرض أربعة" : "Four per row"}
            className={`rounded-full p-1.5 transition-colors ${
              denseMobile ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
      {items.length > 0 ? (
        <div
          className={`grid gap-3 sm:grid-cols-3 lg:grid-cols-4 ${
            denseMobile ? "grid-cols-4" : "grid-cols-2"
          }`}
        >
          {items.map((item) => (
            <ListingCard key={item.id} item={item} displayTitle={map[item.id]?.title} />
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
