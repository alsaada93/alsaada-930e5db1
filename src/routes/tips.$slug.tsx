import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getArticle } from "@/data/articles";

export const Route = createFileRoute("/tips/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ params, loaderData }) => {
    const a = loaderData;
    if (!a) return {};
    return {
      meta: [
        { title: `${a.title} — حراج السعادة` },
        { name: "description", content: a.excerpt },
        { name: "keywords", content: a.hashtags.map((h) => h.replace(/^#/, "")).join(", ") },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://alsaada.lovable.app/tips/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://alsaada.lovable.app/tips/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            inLanguage: "ar",
            publisher: {
              "@type": "Organization",
              name: "حراج السعادة",
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">المقال غير موجود</h1>
        <Link to="/tips" className="mt-4 inline-block font-semibold text-primary hover:underline">
          العودة إلى النصائح
        </Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">حدث خطأ</h1>
        <Link to="/tips" className="mt-4 inline-block font-semibold text-primary hover:underline">
          العودة إلى النصائح
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const a = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/tips" className="hover:text-primary">
            نصائح
          </Link>{" "}
          / <span>{a.title}</span>
        </nav>
        <article className="space-y-6 leading-relaxed text-foreground/90">
          <header className="border-b border-border pb-6">
            <h1 className="text-3xl font-extrabold">{a.title}</h1>
            <p className="mt-3 text-muted-foreground">{a.excerpt}</p>
          </header>
          {a.sections.map((s, i) => (
            <section key={i} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-xl font-bold text-primary">{s.heading}</h2>
              <p>{s.body}</p>
              {s.list_items && s.list_items.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pr-5">
                  {s.list_items.map((li, j) => (
                    <li key={j}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          {a.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {a.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
