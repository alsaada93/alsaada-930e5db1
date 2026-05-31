import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { bahrainRegions, type Listing } from "@/data/marketplace";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";

interface SearchParams {
  q?: string;
  min?: number;
  max?: number;
  cond?: string;
  region?: string;
  sort?: string;
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    min: search.min != null && !Number.isNaN(Number(search.min)) ? Number(search.min) : undefined,
    max: search.max != null && !Number.isNaN(Number(search.max)) ? Number(search.max) : undefined,
    cond: typeof search.cond === "string" ? search.cond : undefined,
    region: typeof search.region === "string" ? search.region : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: "بحث | السعادة ماركت" },
      { name: "description", content: "ابحث عن معدات المطاعم والأثاث والإلكترونيات في السعادة ماركت." },
      { property: "og:title", content: "بحث | السعادة ماركت" },
      { property: "og:url", content: "https://alsaada-market.lovable.app/search" },
    ],
    links: [{ rel: "canonical", href: "https://alsaada-market.lovable.app/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const { q } = search;
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { listings } = useListings();
  const [query, setQuery] = useState(q ?? "");

  const update = (patch: Partial<SearchParams>) => {
    navigate({ to: "/search", search: (prev: SearchParams) => ({ ...prev, ...patch }) });
  };

  const results = useMemo(() => {
    const term = (q ?? "").trim().toLowerCase();
    let list: Listing[] = [...listings];
    if (term) {
      const words = term.split(/\s+/).filter(Boolean);
      list = list.filter((l) => {
        const haystack = `${l.title} ${l.category} ${l.sub ?? ""} ${l.city}`.toLowerCase();
        // Match if ANY single search word appears in the listing.
        return words.some((w) => haystack.includes(w));
      });
    }
    if (search.region) list = list.filter((l) => l.city === search.region);
    if (search.cond) list = list.filter((l) => l.condition === search.cond);
    if (search.min != null) list = list.filter((l) => l.price >= search.min!);
    if (search.max != null) list = list.filter((l) => l.price <= search.max!);
    if (search.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (search.sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (search.sort === "views") list.sort((a, b) => b.views - a.views);
    return term || hasFilters(search) ? list : [];
  }, [q, listings, search]);

  const regionOptions = useMemo(() => {
    const present = new Set(listings.map((l) => l.city));
    return bahrainRegions.filter((r) => present.has(r));
  }, [listings]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: query.trim() || undefined });
  };

  const filtersOn = hasFilters(search);
  const fieldCls =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowRight className="h-4 w-4" /> {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Link>

        <form onSubmit={submit} className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
          <SearchIcon className="ms-2 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "ar" ? "ابحث عن معدات، أثاث، إلكترونيات..." : "Search equipment, furniture, electronics..."}
            className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            {lang === "ar" ? "بحث" : "Search"}
          </button>
        </form>

        {/* Advanced filters */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              {lang === "ar" ? "بحث متقدم" : "Advanced filters"}
            </span>
            {filtersOn && (
              <button
                onClick={() => navigate({ to: "/search", search: { q: q || undefined } })}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
                {lang === "ar" ? "مسح" : "Clear"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "المنطقة" : "Region"}
              </label>
              <select value={search.region ?? ""} onChange={(e) => update({ region: e.target.value || undefined })} className={fieldCls}>
                <option value="">{lang === "ar" ? "كل المناطق" : "All regions"}</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "الحالة" : "Condition"}
              </label>
              <select value={search.cond ?? ""} onChange={(e) => update({ cond: e.target.value || undefined })} className={fieldCls}>
                <option value="">{lang === "ar" ? "الكل" : "Any"}</option>
                <option value="جديد">{lang === "ar" ? "جديد" : "New"}</option>
                <option value="مستعمل">{lang === "ar" ? "مستعمل" : "Used"}</option>
              </select>
            </div>
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
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "الترتيب" : "Sort"}
              </label>
              <select value={search.sort ?? ""} onChange={(e) => update({ sort: e.target.value || undefined })} className={fieldCls}>
                <option value="">{lang === "ar" ? "الأحدث" : "Newest"}</option>
                <option value="price_asc">{lang === "ar" ? "السعر: الأقل أولاً" : "Price: low to high"}</option>
                <option value="price_desc">{lang === "ar" ? "السعر: الأعلى أولاً" : "Price: high to low"}</option>
                <option value="views">{lang === "ar" ? "الأكثر مشاهدة" : "Most viewed"}</option>
              </select>
            </div>
          </div>
        </div>

        {q || filtersOn ? (
          <>
            <h1 className="mb-4 text-lg font-extrabold">
              {q
                ? `${lang === "ar" ? "نتائج البحث عن" : "Results for"} «${q}»`
                : lang === "ar"
                  ? "نتائج البحث"
                  : "Search results"}{" "}
              ({results.length.toLocaleString(lang)})
            </h1>
            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {results.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                {lang === "ar" ? "لا توجد نتائج مطابقة لبحثك." : "No results match your search."}
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            {lang === "ar" ? "اكتب كلمة للبحث في الإعلانات." : "Type a keyword to search listings."}
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}

function hasFilters(s: SearchParams) {
  return !!(s.region || s.cond || s.min != null || s.max != null || s.sort);
}
