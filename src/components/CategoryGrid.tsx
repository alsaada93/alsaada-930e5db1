import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Hotel, Smartphone, Sofa, type LucideIcon } from "lucide-react";
import { categories } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";

const icons: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  hotels: Hotel,
  electronics: Smartphone,
  furniture: Sofa,
};

const gradients: Record<string, string> = {
  restaurant: "from-orange-500 to-rose-500",
  hotels: "from-sky-500 to-cyan-500",
  electronics: "from-violet-500 to-indigo-500",
  furniture: "from-emerald-500 to-teal-500",
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
        {categories.map((c) => {
          const Icon = icons[c.id] ?? Smartphone;
          const grad = gradients[c.id] ?? "from-primary to-accent";
          return (
            <Link
              key={c.id}
              to="/category/$id"
              params={{ id: c.id }}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                <Icon className="h-8 w-8" strokeWidth={1.75} />
              </span>
              <h3 className="font-bold text-card-foreground">{lang === "ar" ? c.name : c.nameEn}</h3>
              <p className="line-clamp-2 text-xs text-muted-foreground">{lang === "ar" ? c.description : c.descriptionEn}</p>
              <span className="mt-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {c.count.toLocaleString(lang)} {t("cat.adsSuffix")}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
