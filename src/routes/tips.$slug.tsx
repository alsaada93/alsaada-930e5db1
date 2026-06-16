import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getArticle } from "@/data/articles";
import { getPublishedPost } from "@/lib/blog.functions";

interface ArticleView {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  keywords: string[];
  isArabic: boolean;
}

const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

/** Extract a FAQ list from markdown for FAQPage JSON-LD. */
function extractFaq(md: string): { q: string; a: string }[] {
  const lines = md.split("\n");
  const out: { q: string; a: string }[] = [];
  let inFaq = false;
  let q: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (q && buf.length) out.push({ q, a: buf.join(" ").trim() });
    q = null;
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const h2 = line.match(/^##\s+(.*)/);
    if (h2 && !line.startsWith("###")) {
      flush();
      inFaq = /faq|الأسئلة|أسئلة شائعة|الاسئلة/i.test(h2[1]);
      continue;
    }
    if (!inFaq) continue;
    const h3 = line.match(/^###\s+(.*)/);
    if (h3) {
      flush();
      q = h3[1].replace(/[*#]/g, "").trim();
    } else if (q && line) {
      buf.push(line.replace(/[*#>]/g, "").trim());
    }
  }
  flush();
  return out.slice(0, 12);
}

export const Route = createFileRoute("/tips/$slug")({
  loader: async ({ params }): Promise<ArticleView> => {
    try {
      const post = await getPublishedPost({ data: { slug: params.slug } });
      if (post) {
        return {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          content: post.content ?? "",
          keywords: (post.keywords ?? "")
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          isArabic: hasArabic(post.title + " " + (post.content ?? "")),
        };
      }
    } catch {
      // fall back to static articles
    }
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    const content = article.sections
      .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
      .join("\n\n");
    return {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content,
      keywords: article.hashtags,
      isArabic: hasArabic(article.title),
    };
  },
  head: ({ params, loaderData }) => {
    const a = loaderData;
    if (!a) return {};
    const url = `https://www.alsaada.sale/tips/${params.slug}`;
    const faq = extractFaq(a.content);
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          inLanguage: a.isArabic ? "ar" : "en",
          mainEntityOfPage: url,
          publisher: { "@type": "Organization", name: "alsaada.sale" },
        }),
      },
    ];
    if (faq.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }
    return {
      meta: [
        { title: a.title },
        { name: "description", content: a.excerpt },
        { name: "keywords", content: a.keywords.map((h) => h.replace(/^#/, "")).join(", ") },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">المقال غير موجود</h1>
        <Link to="/tips" className="mt-4 inline-block font-semibold text-primary hover:underline">
          العودة إلى المقالات
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
          العودة إلى المقالات
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: ArticlePage,
});

function PublishCta({ isArabic }: { isArabic: boolean }) {
  return (
    <div className="my-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <h2 className="text-xl font-bold text-foreground">
        {isArabic ? "هل لديك ما تبيعه؟" : "Got something to sell?"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {isArabic
          ? "انشر إعلانك مجانًا على حراج السعادة ووصل إلى آلاف المشترين في البحرين."
          : "Post your ad for free on alsaada.sale and reach thousands of buyers across Bahrain."}
      </p>
      <Link
        to="/add-listing"
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
      >
        {isArabic ? "نشر إعلان" : "Publish an ad"}
      </Link>
    </div>
  );
}

function ArticlePage() {
  const a = Route.useLoaderData() as ArticleView;
  const dir = a.isArabic ? "rtl" : "ltr";
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10" dir={dir}>
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/tips" className="hover:text-primary">
            {a.isArabic ? "المقالات" : "Articles"}
          </Link>{" "}
          / <span>{a.title}</span>
        </nav>
        <article className="space-y-4 leading-relaxed text-foreground/90">
          <header className="border-b border-border pb-6">
            <h1 className="text-3xl font-extrabold">{a.title}</h1>
            {a.excerpt && <p className="mt-3 text-muted-foreground">{a.excerpt}</p>}
          </header>

          <PublishCta isArabic={a.isArabic} />

          <div className="prose-article space-y-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="mt-8 text-2xl font-bold text-foreground">{children}</h2>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-8 text-2xl font-bold text-foreground">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-6 text-xl font-semibold text-primary">{children}</h3>
                ),
                p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc space-y-1 ps-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal space-y-1 ps-6">{children}</ol>
                ),
                a: ({ href, children }) => {
                  const internal = href?.startsWith("/");
                  return (
                    <a
                      href={href}
                      className="font-medium text-primary hover:underline"
                      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {children}
                    </a>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-3 py-2 text-start font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">{children}</td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-s-4 border-primary/40 ps-4 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {a.content}
            </ReactMarkdown>
          </div>

          <PublishCta isArabic={a.isArabic} />

          {a.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {a.keywords.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {h.startsWith("#") ? h : `#${h}`}
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
