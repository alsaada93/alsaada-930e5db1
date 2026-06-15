import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { listFbAds, type FbAd } from "@/lib/facebook-sync.functions";
import { FB_CATEGORIES, categoryLabel } from "@/lib/facebook-parse";

const SITE = "https://www.alsaada.sale";

export const Route = createFileRoute("/facebook-ads")({
  validateSearch: (s: Record<string, unknown>): { cat?: string } => ({
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  loaderDeps: ({ search }) => ({ cat: search.cat }),
  loader: async ({ deps }): Promise<{ ads: FbAd[] }> => {
    try {
      const ads = await listFbAds({ data: { category: deps.cat ?? "all" } });
      return { ads };
    } catch {
      return { ads: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "إعلانات مجموعة فيسبوك — حراج السعادة" },
      { name: "description", content: "أحدث إعلانات السيارات والعقارات والوظائف والمعدات المستوردة تلقائياً من مجموعة فيسبوك." },
      { property: "og:title", content: "إعلانات مجموعة فيسبوك — حراج السعادة" },
      { property: "og:description", content: "أحدث الإعلانات المستوردة من مجموعة فيسبوك." },
      { property: "og:url", content: `${SITE}/facebook-ads` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/facebook-ads` }],
  }),
  component: FacebookAdsPage,
});

function FacebookAdsPage() {
  const { ads } = Route.useLoaderData() as { ads: FbAd[] };
  const { cat } = Route.useSearch();
  const navigate = useNavigate();
  const active = cat ?? "all";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 border-b border-border pb-5">
          <h1 className="text-3xl font-extrabold">إعلانات مجموعة فيسبوك</h1>
          <p className="mt-2 text-muted-foreground">
            تُستورد هذه الإعلانات تلقائياً من مجموعة فيسبوك وتُنشر مباشرة على الموقع.
          </p>
        </header>

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip active={active === "all"} onClick={() => navigate({ to: "/facebook-ads", search: {} })}>
            الكل
          </Chip>
          {FB_CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              active={active === c.slug}
              onClick={() => navigate({ to: "/facebook-ads", search: { cat: c.slug } })}
            >
              {c.icon} {c.name}
            </Chip>
          ))}
        </div>

        {ads.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">لا توجد إعلانات في هذا التصنيف بعد.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ads.map((ad) => (
              <Link
                key={ad.id}
                to="/facebook-ads/$id"
                params={{ id: ad.id }}
                className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
              >
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  {ad.images[0] ? (
                    <img
                      src={ad.thumbnails[0] || ad.images[0]}
                      alt={ad.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      {categoryLabel(ad.category).icon}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <span className="text-[11px] text-muted-foreground">
                    {categoryLabel(ad.category).icon} {categoryLabel(ad.category).name}
                  </span>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold">{ad.title}</h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
