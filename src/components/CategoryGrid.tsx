import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  UtensilsCrossed,
  Car,
  Building2,
  Wrench,
  Briefcase,
  Package,
  Smartphone,
  Sofa,
  Store,
  Gavel,
  Calculator,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/hooks/useLanguage";

const icons: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  electronics: Smartphone,
  furniture: Sofa,
  "ea7fe359-6b22-49e8-8249-2db1d1610913": Car,
  "b7e8cb10-8df5-489e-829d-3ca28e71487f": Building2,
  "5cbdb034-bd93-4aae-813c-5fb9987c4c1b": Wrench,
  "72eca8dc-d743-4f8f-ab67-77a5d91f94da": Briefcase,
  "0f9ea3d0-c9bd-4e9f-9e70-c082f4f3e2cd": Package,
};

const gradients: Record<string, string> = {
  restaurant: "from-orange-500 to-rose-500",
  electronics: "from-violet-500 to-indigo-500",
  furniture: "from-emerald-500 to-teal-500",
  "ea7fe359-6b22-49e8-8249-2db1d1610913": "from-sky-500 to-blue-600",
  "b7e8cb10-8df5-489e-829d-3ca28e71487f": "from-amber-500 to-orange-600",
  "5cbdb034-bd93-4aae-813c-5fb9987c4c1b": "from-cyan-500 to-teal-600",
  "72eca8dc-d743-4f8f-ab67-77a5d91f94da": "from-fuchsia-500 to-purple-600",
  "0f9ea3d0-c9bd-4e9f-9e70-c082f4f3e2cd": "from-slate-500 to-gray-600",
};

function CategoryCard({ c }: { c: ReturnType<typeof useCategories>["categories"][number] }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const Icon = icons[c.id] ?? Smartphone;
  const grad = gradients[c.id] ?? "from-primary to-accent";
  const hasImageIcon =
    !!c.icon && (c.icon.startsWith("http") || c.icon.startsWith("/") || c.icon.startsWith("data:"));

  return (
    <div className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40">
      {/* رأس البطاقة رابط للتصنيف الرئيسي */}
      <Link
        to="/category/$id"
        params={{ id: c.id }}
        className="flex w-full flex-col items-start gap-3"
        aria-label={lang === "ar" ? c.name : c.nameEn}
      >
        {c.image ? (
          <div className="relative -mx-4 -mt-4 mb-1 w-[calc(100%+2rem)] overflow-hidden">
            <img
              src={c.image}
              alt={lang === "ar" ? c.name : c.nameEn}
              className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              width={1024}
              height={284}
            />
            <span className="absolute bottom-2 start-3 text-2xl drop-shadow-lg">
              {!hasImageIcon && c.icon ? c.icon : ""}
            </span>
          </div>
        ) : (
          <span
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg transition-transform group-hover:scale-110`}
          >
            {hasImageIcon ? (
              <img
                src={c.icon}
                alt={lang === "ar" ? c.name : c.nameEn}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Icon className="h-8 w-8" strokeWidth={1.75} />
            )}
          </span>
        )}
        <h3 className="font-bold text-card-foreground">{lang === "ar" ? c.name : c.nameEn}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {lang === "ar" ? c.description : c.descriptionEn}
        </p>
        {c.count > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {c.count.toLocaleString(lang)} {t("cat.adsSuffix")}
          </span>
        )}
      </Link>

      {/* زر فتح التصنيفات الفرعية بقائمة منسدلة */}
      {c.groups.length > 0 && (
        <div className="mt-auto w-full">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
          >
            <span>{lang === "ar" ? "التصنيفات الفرعية" : "Subcategories"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-background p-2">
              <div className="flex flex-wrap gap-1.5">
                {c.groups.map((g) => (
                  <Link
                    key={g.name}
                    to="/category/$id"
                    params={{ id: c.id }}
                    search={{ sub: g.name }}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CategoryGrid() {
  const { t, lang } = useLanguage();
  const { categories } = useCategories();

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
          <CategoryCard key={c.id} c={c} />
        ))}

        {/* تصنيف: أنشطة ومطاعم للبيع */}
        <a
          href="#businesses"
          className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-lg transition-transform group-hover:scale-110">
            <Store className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h3 className="font-bold text-card-foreground">
            {lang === "ar" ? "أنشطة للبيع" : "Businesses for sale"}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {lang === "ar"
              ? "مطاعم وأنشطة تجارية كاملة جاهزة للتشغيل"
              : "Restaurants and full businesses ready to operate"}
          </p>
        </a>

        {/* تصنيف: المزادات */}
        <a
          href="#auctions"
          className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg transition-transform group-hover:scale-110">
            <Gavel className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h3 className="font-bold text-card-foreground">
            {lang === "ar" ? "المزادات" : "Auctions"}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {lang === "ar"
              ? "زايد على أفضل الصفقات واربح بأقل الأسعار"
              : "Bid on the best deals and win at lower prices"}
          </p>
        </a>

        {/* حاسبة المطاعم — بطاقة مميزة تمتد على عرض أكبر */}
        <Link
          to="/restaurant"
          className="group relative col-span-2 flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-start text-white shadow-glow transition-all hover:-translate-y-1 sm:col-span-3 lg:col-span-2"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
            <Calculator className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h3 className="text-lg font-extrabold">
            {lang === "ar" ? "🏪 حاسبة المطاعم" : "🏪 Restaurant Cost Calculator"}
          </h3>
          <p className="text-sm font-semibold text-white/90">
            {lang === "ar"
              ? "احسب تكلفة مشروعك خلال دقيقة واحدة"
              : "Estimate your project cost in one minute"}
          </p>
        </Link>
      </div>
    </section>
  );
}
