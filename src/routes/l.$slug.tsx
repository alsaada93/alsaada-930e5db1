import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getLanding, landings, type LandingPage } from "@/data/landings";
import { categories } from "@/data/marketplace";
import { articles } from "@/data/articles";

const BASE = "https://www.alsaada.sale";

export const Route = createFileRoute("/l/$slug")({
  loader: ({ params }) => {
    const page = getLanding(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData, params }) => {
    const page = loaderData?.page;
    const url = `${BASE}/l/${params.slug}`;
    if (!page) {
      return {
        meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.title,
      description: page.description,
      url,
      inLanguage: "ar",
      ...(page.faq && page.faq.length
        ? {
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: page.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          }
        : {}),
    };
    return {
      meta: [
        { title: page.title },
        { name: "description", content: page.description },
        { property: "og:title", content: page.title },
        { property: "og:description", content: page.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: LandingPageView,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
        <Link to="/l" className="mt-4 inline-block text-primary underline">
          تصفّح كل صفحات الهبوط
        </Link>
      </main>
      <Footer />
    </div>
  ),
});

function LandingPageView() {
  const { page } = Route.useLoaderData() as { page: LandingPage };
  const cat = page.categoryId ? categories.find((c) => c.id === page.categoryId) : undefined;
  const relatedArticles = (page.articleSlugs ?? [])
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean) as typeof articles;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            {page.h1 ?? page.title}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">{page.intro}</p>
        </header>

        {/* روابط سريعة */}
        <section className="mb-8 flex flex-wrap gap-2">
          {cat && (
            <Link
              to="/category/$id"
              params={{ id: cat.id }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              تصفح قسم {cat.name}
            </Link>
          )}
          {page.searchQueries.map((q) => (
            <Link
              key={q}
              to="/search"
              search={{ q }}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent/70"
            >
              {q}
            </Link>
          ))}
        </section>

        {page.sections?.map((s, i) => (
          <section key={i} className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-xl font-bold text-primary">{s.heading}</h2>
            <p className="leading-relaxed text-foreground/90">{s.body}</p>
            {s.bullets && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground/80">
                {s.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {page.faq && page.faq.length > 0 && (
          <section className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-xl font-bold text-primary">أسئلة شائعة</h2>
            <div className="space-y-3">
              {page.faq.map((f, i) => (
                <div key={i}>
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedArticles.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold">مقالات ذات صلة</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedArticles.map((a) => (
                <Link
                  key={a.slug}
                  to="/tips/$slug"
                  params={{ slug: a.slug }}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <h3 className="mb-1 font-bold text-primary">{a.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* صفحات هبوط أخرى */}
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-bold">استكشف المزيد</h2>
          <div className="flex flex-wrap gap-2">
            {landings
              .filter((l) => l.slug !== page.slug)
              .slice(0, 8)
              .map((l) => (
                <Link
                  key={l.slug}
                  to="/l/$slug"
                  params={{ slug: l.slug }}
                  className="rounded-full bg-accent/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent"
                >
                  {l.title.split("—")[0].trim()}
                </Link>
              ))}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
