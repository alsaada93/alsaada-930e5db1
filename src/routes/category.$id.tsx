import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { categories, listings, type Listing } from "@/data/marketplace";

export const Route = createFileRoute("/category/$id")({
  validateSearch: (search: Record<string, unknown>): { sub?: string } => ({
    sub: typeof search.sub === "string" ? search.sub : undefined,
  }),
  loader: ({ params }) => {
    const category = categories.find((c) => c.id === params.id);
    if (!category) throw notFound();
    const items = listings.filter((l) => l.category === category.name);
    return { category, items };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "التصنيفات";
    return {
      meta: [
        { title: `${name} | سوقو SOOGO` },
        { name: "description", content: loaderData?.category.description ?? "تصفّح التصنيفات في سوقو" },
        { property: "og:title", content: `${name} | سوقو SOOGO` },
        { property: "og:description", content: loaderData?.category.description ?? "" },
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

function CategoryPage() {
  const { category, items } = Route.useLoaderData();
  const { sub } = Route.useSearch();
  const filtered = sub ? items.filter((l: Listing) => l.title.includes(sub)) : items;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowRight className="h-4 w-4" /> العودة للرئيسية
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-3xl">
              {category.icon}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">{category.name}</h1>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>

          {category.sub.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/category/$id"
                params={{ id: category.id }}
                search={{ sub: undefined }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  !sub
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:border-primary/40"
                }`}
              >
                الكل
              </Link>
              {category.sub.map((s: string) => (
                <Link
                  key={s}
                  to="/category/$id"
                  params={{ id: category.id }}
                  search={{ sub: s }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    sub === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-card-foreground hover:border-primary/40"
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="mb-4 text-lg font-extrabold">
            الإعلانات ({filtered.length.toLocaleString("ar")})
          </h2>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item: Listing) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">لا توجد إعلانات مطابقة في هذا التصنيف حالياً.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
