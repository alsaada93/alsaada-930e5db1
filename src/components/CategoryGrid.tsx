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
  Calculator,
  type LucideIcon,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/hooks/useLanguage";
import { useOffersConfig } from "@/hooks/useOffersConfig";
import { useHomeLayout } from "@/hooks/useHomeLayout";

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
    </div>

  );
}

export function CategoryGrid() {
  const { t, lang } = useLanguage();
  const { categories } = useCategories();
  const { config: offersConfig } = useOffersConfig();
  const { layout } = useHomeLayout();

  const mobileCols: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };
  const desktopCols: Record<number, string> = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };
  const gridCls = `grid gap-3 ${mobileCols[layout.categoryColsMobile] ?? "grid-cols-3"} sm:grid-cols-3 ${desktopCols[layout.categoryColsDesktop] ?? "lg:grid-cols-4"}`;

  const visibleCats = categories.filter((c) => !c.hidden);
  const shownCats =
    layout.categoryRows > 0
      ? visibleCats.slice(0, layout.categoryRows * layout.categoryColsDesktop)
      : visibleCats;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">{t("cat.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cat.subtitle")}</p>
        </div>
      </div>
      <div className={gridCls}>
        {/* تصنيف: العروض الخاصة (إدارة فقط) */}
        <Link
          to="/offers"
          className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-card p-4 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          {offersConfig.iconImage || offersConfig.bannerImage ? (
            <div className="relative -mx-4 -mt-4 mb-1 w-[calc(100%+2rem)] overflow-hidden">
              <img
                src={offersConfig.iconImage || offersConfig.bannerImage}
                alt="العروض الخاصة"
                className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                width={1024}
                height={284}
              />
            </div>
          ) : offersConfig.icon ? (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-3xl text-white shadow-lg transition-transform group-hover:scale-110">
              {offersConfig.icon}
            </span>
          ) : null}
          <h3 className="font-bold text-card-foreground">
            {offersConfig.icon ? `${offersConfig.icon} ` : ""}
            {lang === "ar" ? offersConfig.titleAr : offersConfig.titleEn}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {lang === "ar"
              ? "أفضل العروض والخصومات الحصرية المنشورة من الإدارة"
              : "Exclusive deals and discounts published by the admin"}
          </p>
        </Link>


        {shownCats.map((c) => (
          <CategoryCard key={c.id} c={c} />
        ))}



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

