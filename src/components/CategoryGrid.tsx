import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Hotel, Smartphone, Sofa, Store, type LucideIcon } from "lucide-react";
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
            <div
              key={c.id}
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              {/* البطاقة بالكامل رابط للتصنيف */}
              <Link
                to="/category/$id"
                params={{ id: c.id }}
                className="absolute inset-0 z-0"
                aria-label={lang === "ar" ? c.name : c.nameEn}
              />
              <span
                className={`pointer-events-none flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                <Icon className="h-8 w-8" strokeWidth={1.75} />
              </span>
              <h3 className="pointer-events-none font-bold text-card-foreground">{lang === "ar" ? c.name : c.nameEn}</h3>
              <p className="pointer-events-none line-clamp-2 text-xs text-muted-foreground">
                {lang === "ar" ? c.description : c.descriptionEn}
              </p>
              {c.count > 0 && (
                <span className="pointer-events-none mt-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {c.count.toLocaleString(lang)} {t("cat.adsSuffix")}
                </span>
              )}

              {/* لوحة الأنواع الفرعية تظهر عند التأشير بالماوس — كل نوع قابل للضغط */}
              {c.groups.length > 0 && (
                <div
                  className={`pointer-events-none absolute inset-0 z-10 flex flex-col bg-gradient-to-br ${grad} p-4 text-white opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100`}
                >
                  <span className="mb-2 text-sm font-extrabold">{lang === "ar" ? c.name : c.nameEn}</span>
                  <div className="flex flex-wrap gap-1.5 overflow-auto">
                    {c.groups.map((g) => (
                      <Link
                        key={g.name}
                        to="/category/$id"
                        params={{ id: c.id }}
                        search={{ group: g.name }}
                        className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm transition-colors hover:bg-white/40"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* تصنيف: أنشطة ومطاعم للبيع */}
        <a
          href="#businesses"
          className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-lg transition-transform group-hover:scale-110">
            <Store className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h3 className="font-bold text-card-foreground">{lang === "ar" ? "أنشطة للبيع" : "Businesses for sale"}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {lang === "ar"
              ? "مطاعم وأنشطة تجارية كاملة جاهزة للتشغيل"
              : "Restaurants and full businesses ready to operate"}
          </p>
        </a>
      </div>
    </section>
  );
}
