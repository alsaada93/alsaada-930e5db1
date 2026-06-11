import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { articles } from "@/data/articles";
import { listPublishedPosts, type BlogPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/tips/")({
  loader: async (): Promise<{ posts: BlogPost[] }> => {
    try {
      const posts = await listPublishedPosts();
      return { posts };
    } catch {
      return { posts: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "نصائح ومقالات معدات المطاعم — حراج السعادة" },
      {
        name: "description",
        content:
          "مقالات ونصائح عن تجهيز المطاعم، شراء وصيانة المعدات، والأسعار في البحرين من حراج السعادة.",
      },
      { property: "og:title", content: "نصائح ومقالات معدات المطاعم — حراج السعادة" },
      {
        property: "og:description",
        content:
          "مقالات ونصائح عن تجهيز المطاعم، شراء وصيانة المعدات، والأسعار في البحرين.",
      },
      { property: "og:url", content: "https://www.alsaada.sale/tips" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/tips" }],
  }),
  component: TipsPage,
});

function TipsPage() {
  const { posts } = Route.useLoaderData();
  const dbSlugs = new Set(posts.map((p) => p.slug));
  const staticArticles = articles.filter((a) => !dbSlugs.has(a.slug));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold">نصائح ومقالات</h1>
          <p className="mt-2 text-muted-foreground">
            مقالات متنوعة عن تجهيز المطاعم، شراء وصيانة المعدات، والأسعار في البحرين.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/tips/$slug"
              params={{ slug: p.slug }}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              {p.cover_image && (
                <img
                  src={p.cover_image}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <h2 className="mb-2 text-lg font-bold text-primary">{p.title}</h2>
              <p className="line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
            </Link>
          ))}
          {staticArticles.map((a) => (
            <Link
              key={a.slug}
              to="/tips/$slug"
              params={{ slug: a.slug }}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <h2 className="mb-2 text-lg font-bold text-primary">{a.title}</h2>
              <p className="line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
