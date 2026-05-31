import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { type Listing } from "@/data/marketplace";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";

interface SearchParams {
  q?: string;
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "بحث | السعادة ماركت" },
      { name: "description", content: "ابحث عن معدات المطاعم والأثاث والإلكترونيات في السعادة ماركت." },
      { property: "og:title", content: "بحث | السعادة ماركت" },
      { property: "og:url", content: "https://soogo-hub.lovable.app/search" },
    ],
    links: [{ rel: "canonical", href: "https://soogo-hub.lovable.app/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [query, setQuery] = useState(q ?? "");

  const results = useMemo(() => {
    const term = (q ?? "").trim().toLowerCase();
    if (!term) return [] as Listing[];
    return listings.filter((l) => {
      const haystack = `${l.title} ${l.category} ${l.sub ?? ""} ${l.city}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: query.trim() || undefined } });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowRight className="h-4 w-4" /> {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Link>

        <form onSubmit={submit} className="mb-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
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

        {q ? (
          <>
            <h1 className="mb-4 text-lg font-extrabold">
              {lang === "ar" ? "نتائج البحث عن" : "Results for"} «{q}» ({results.length.toLocaleString(lang)})
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
