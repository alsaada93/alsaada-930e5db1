import { Link } from "@tanstack/react-router";
import { categories } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";
import catRestaurant from "@/assets/cat-restaurant.png";
import catHotels from "@/assets/cat-hotels.png";
import catOther from "@/assets/cat-other.png";

const logos: Record<string, string> = {
  restaurant: catRestaurant,
  hotels: catHotels,
  other: catOther,
};

export function CategoryGrid() {
  const { t, lang } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">{t("cat.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cat.subtitle")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/category/$id"
            params={{ id: c.id }}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent to-secondary p-2 ring-1 ring-primary/20 transition-transform group-hover:scale-110 group-hover:ring-primary/40">
              {logos[c.id] ? (
                <img src={logos[c.id]} alt={c.nameEn} width={64} height={64} loading="lazy" className="h-full w-full scale-110 object-contain" />
              ) : (
                <span className="text-3xl">{c.icon}</span>
              )}
            </span>
            <h3 className="font-bold text-card-foreground">{lang === "ar" ? c.name : c.nameEn}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{lang === "ar" ? c.description : c.descriptionEn}</p>
            <span className="mt-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {c.count.toLocaleString(lang)} {t("cat.adsSuffix")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
