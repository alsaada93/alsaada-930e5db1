import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, SlidersHorizontal, BookmarkPlus, X, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { categories, bahrainRegions, type Listing, type Category } from "@/data/marketplace";
import { displayCity } from "@/data/bahrainCities";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface CategorySearch {
  sub?: string;
  region?: string;
  min?: number;
  max?: number;
  cond?: string;
  sort?: string;
}

export const Route = createFileRoute("/category/$id")({
  validateSearch: (search: Record<string, unknown>): CategorySearch => ({
    sub: typeof search.sub === "string" ? search.sub : undefined,
    region: typeof search.region === "string" ? search.region : undefined,
    min: search.min != null && !Number.isNaN(Number(search.min)) ? Number(search.min) : undefined,
    max: search.max != null && !Number.isNaN(Number(search.max)) ? Number(search.max) : undefined,
    cond: typeof search.cond === "string" ? search.cond : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
  }),
  loader: async ({ params }) => {
    // التصنيفات قد تكون مُعدّلة من لوحة الإدارة ومخزّنة في site_settings،
    // لذا نبحث في القائمة الديناميكية أولاً ثم نرجع للقائمة الثابتة.
    let pool: Category[] = categories;
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "categories")
        .maybeSingle();
      const value = data?.value as Category[] | null | undefined;
      if (Array.isArray(value) && value.length > 0) pool = value;
    } catch {
      /* fall back to static categories */
    }
    const category = pool.find((c) => c.id === params.id) ?? categories.find((c) => c.id === params.id);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.category.name ?? "التصنيفات";
    const url = `https://www.alsaada.sale/category/${params.id}`;
    return {
      meta: [
        { title: `${name} | حراج السعادة Haraj Al Saada` },
        { name: "description", content: loaderData?.category.description ?? "تصفّح التصنيفات في حراج السعادة" },
        { property: "og:title", content: `${name} | حراج السعادة Haraj Al Saada` },
        { property: "og:description", content: loaderData?.category.description ?? "" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${name} | حراج السعادة Haraj Al Saada`,
            description: loaderData?.category.description ?? "",
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">التصنيف غير موجود</h1>
        <p className="mt-2 text-muted-foreground">عذراً، لم نتمكن من العثور على هذا التصنيف.</p>
        <Link to="/" className="mt-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">
          العودة للرئيسية
        </Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">حدث خطأ</h1>
        <Link to="/" className="mt-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">
          العودة للرئيسية
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: CategoryPage,
});

interface SavedSearch {
  id: string;
  categoryId: string;
  categoryName: string;
  search: CategorySearch;
  createdAt: number;
}

const SAVED_KEY = "alsaada_saved_searches";

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { listings, loadMore, loadingMore, hasMore } = useListings({
    categoryId: category.id,
    subcategory: search.sub,
    pageSize: 24,
  });
  const [regionQuery, setRegionQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  const items = useMemo(
    () => listings,
    [listings, category.name, category.id],
  );

  // قائمة التصنيفات الفرعية (اختيارية كفلاتر): من الأقسام أو من الإعلانات نفسها
  const subOptions = useMemo(() => {
    const fromGroups = (category.groups ?? []).flatMap((g: { name: string; items?: string[] }) => [g.name, ...(g.items ?? [])]);
    const fromData = items.flatMap((l) => [l.sub, l.itemName]).filter((s): s is string => !!s);
    const base = category.sub && category.sub.length > 0 ? category.sub : fromGroups;
    return Array.from(new Set([...base, ...fromData]));
  }, [category, items]);

  const update = (patch: Partial<CategorySearch>) => {
    navigate({
      to: "/category/$id",
      params: { id: category.id },
      search: (prev: CategorySearch) => ({ ...prev, ...patch }),
    });
  };

  const filtered = useMemo(() => {
    let list: Listing[] = [...items];
    if (search.sub) list = list.filter((l) => l.sub === search.sub || l.itemName === search.sub);
    if (search.region) list = list.filter((l) => l.city === search.region);
    if (search.cond) list = list.filter((l) => l.condition === search.cond);
    if (search.min != null) list = list.filter((l) => l.price >= search.min!);
    if (search.max != null) list = list.filter((l) => l.price <= search.max!);
    if (search.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (search.sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (search.sort === "views") list.sort((a, b) => b.views - a.views);
    return list;
  }, [items, search]);

  const regionOptions = useMemo(() => {
    const present = new Set(items.map((l: Listing) => l.city));
    const list = bahrainRegions.filter((r) => present.has(r));
    if (!regionQuery.trim()) return list;
    return list.filter((r) => r.includes(regionQuery.trim()));
  }, [items, regionQuery]);

  const hasFilters = !!(search.sub || search.region || search.cond || search.min != null || search.max != null);

  const clearAll = () => {
    setRegionQuery("");
    navigate({ to: "/category/$id", params: { id: category.id }, search: {} });
  };

  const saveSearch = () => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const arr: SavedSearch[] = raw ? JSON.parse(raw) : [];
      arr.unshift({
        id: crypto.randomUUID(),
        categoryId: category.id,
        categoryName: category.name,
        search,
        createdAt: Date.now(),
      });
      localStorage.setItem(SAVED_KEY, JSON.stringify(arr.slice(0, 20)));
      toast.success(lang === "ar" ? "تم حفظ نتائج البحث" : "Search saved");
    } catch {
      toast.error(lang === "ar" ? "تعذّر الحفظ" : "Could not save");
    }
  };

  const fieldCls =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowRight className="h-4 w-4" /> {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-3xl">
              {category.icon}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">{lang === "ar" ? category.name : category.nameEn}</h1>
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? category.description : category.descriptionEn}
              </p>
            </div>
          </div>

          {/* Subcategory dropdown — optional filters, collapsed by default */}
          {subOptions.length > 0 && (
            <div className="mt-5">
              <button
                onClick={() => setShowSubs((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2 text-sm font-bold text-primary shadow-card transition-colors hover:bg-accent"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {lang === "ar" ? "التصنيفات الفرعية" : "Subcategories"}
                {search.sub ? `: ${search.sub}` : ""}
                <ChevronDown className={`h-4 w-4 transition-transform ${showSubs ? "rotate-180" : ""}`} />
              </button>
              {showSubs && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
                  <button
                    onClick={() => {
                      update({ sub: undefined });
                      setShowSubs(false);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      !search.sub
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-card-foreground hover:border-primary/40"
                    }`}
                  >
                    {lang === "ar" ? "الكل" : "All"}
                  </button>
                  {subOptions.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => {
                        update({ sub: s });
                        setShowSubs(false);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        search.sub === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-card-foreground hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Advanced filters (hidden until toggled) */}
        <section className="mx-auto max-w-7xl px-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2 text-sm font-bold text-primary shadow-card transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {lang === "ar" ? "بحث متقدم" : "Advanced filters"}
          </button>
          {showFilters && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {lang === "ar" ? "بحث متقدم" : "Advanced filters"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveSearch}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground hover:bg-accent/70"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  {lang === "ar" ? "حفظ البحث" : "Save search"}
                </button>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                    {lang === "ar" ? "مسح" : "Clear"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Region */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "المنطقة" : "Region"}
                </label>
                <select
                  value={search.region ?? ""}
                  onChange={(e) => update({ region: e.target.value || undefined })}
                  className={fieldCls}
                >
                  <option value="">{lang === "ar" ? "كل المناطق" : "All regions"}</option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>
                      {displayCity(r)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الحالة" : "Condition"}
                </label>
                <select
                  value={search.cond ?? ""}
                  onChange={(e) => update({ cond: e.target.value || undefined })}
                  className={fieldCls}
                >
                  <option value="">{lang === "ar" ? "الكل" : "Any"}</option>
                  <option value="جديد">{lang === "ar" ? "جديد" : "New"}</option>
                  <option value="مستعمل">{lang === "ar" ? "مستعمل" : "Used"}</option>
                </select>
              </div>

              {/* Min price */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "أقل سعر (د.ب)" : "Min price (BHD)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={search.min ?? ""}
                  onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className={fieldCls}
                />
              </div>

              {/* Max price */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "أعلى سعر (د.ب)" : "Max price (BHD)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={search.max ?? ""}
                  onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="∞"
                  className={fieldCls}
                />
              </div>

              {/* Sort */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "الترتيب" : "Sort"}
                </label>
                <select
                  value={search.sort ?? ""}
                  onChange={(e) => update({ sort: e.target.value || undefined })}
                  className={fieldCls}
                >
                  <option value="">{lang === "ar" ? "الأحدث" : "Newest"}</option>
                  <option value="price_asc">{lang === "ar" ? "السعر: الأقل أولاً" : "Price: low to high"}</option>
                  <option value="price_desc">{lang === "ar" ? "السعر: الأعلى أولاً" : "Price: high to low"}</option>
                  <option value="views">{lang === "ar" ? "الأكثر مشاهدة" : "Most viewed"}</option>
                </select>
              </div>
            </div>
          </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 pb-16">
          <h2 className="mb-4 text-lg font-extrabold">
            {lang === "ar" ? "الإعلانات" : "Listings"} ({filtered.length.toLocaleString(lang)})
          </h2>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item: Listing) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                {lang === "ar"
                  ? "لا توجد إعلانات مطابقة لمعايير البحث."
                  : "No listings match your filters."}
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
                >
                  {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
                </button>
              )}
            </div>
          )}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {lang === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </>
                ) : (
                  <>
                    {lang === "ar" ? "⬇️ عرض المزيد من الإعلانات" : "⬇️ Load more listings"}
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
