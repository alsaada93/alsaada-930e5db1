import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, MessageCircle, ArrowRight, Calendar, User } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { getFbAd, type FbAd } from "@/lib/facebook-sync.functions";
import { categoryLabel } from "@/lib/facebook-parse";

const SITE = "https://www.alsaada.sale";

export const Route = createFileRoute("/facebook-ads/$id")({
  loader: async ({ params }): Promise<{ ad: FbAd }> => {
    const ad = await getFbAd({ data: { id: params.id } });
    if (!ad) throw notFound();
    return { ad };
  },
  head: ({ loaderData }) => {
    const ad = loaderData?.ad;
    if (!ad) return { meta: [{ title: "إعلان غير موجود — حراج السعادة" }] };
    const img = ad.images[0];
    return {
      meta: [
        { title: `${ad.title} — حراج السعادة` },
        { name: "description", content: (ad.description ?? ad.title).slice(0, 155) },
        { property: "og:title", content: ad.title },
        { property: "og:description", content: (ad.description ?? ad.title).slice(0, 155) },
        { property: "og:url", content: `${SITE}/facebook-ads/${ad.id}` },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: `${SITE}/facebook-ads/${ad.id}` }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">الإعلان غير موجود</h1>
        <p className="mt-2 text-muted-foreground">ربما تم حذفه أو إخفاؤه.</p>
        <Button asChild className="mt-6">
          <Link to="/facebook-ads">العودة للإعلانات</Link>
        </Button>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">تعذّر تحميل الإعلان</h1>
        <Button asChild className="mt-6"><Link to="/facebook-ads">العودة للإعلانات</Link></Button>
      </main>
      <Footer />
    </div>
  ),
  component: AdDetailPage,
});

function AdDetailPage() {
  const { ad } = Route.useLoaderData() as { ad: FbAd };
  const [active, setActive] = useState(0);
  const cat = categoryLabel(ad.category);
  const phoneDigits = (ad.phone ?? "").replace(/[^\d]/g, "");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/facebook-ads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowRight className="h-4 w-4" />
          كل الإعلانات
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
              {ad.images[active] ? (
                <img src={ad.images[active]} alt={ad.title} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">{cat.icon}</div>
              )}
            </div>
            {ad.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {ad.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={ad.thumbnails[i] || img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {cat.icon} {cat.name}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold">{ad.title}</h1>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {ad.seller_name && (
                <span className="inline-flex items-center gap-1"><User className="h-4 w-4" />{ad.seller_name}</span>
              )}
              {ad.fb_published_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(ad.fb_published_at).toLocaleDateString("ar")}
                </span>
              )}
            </div>

            {ad.description && (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground">{ad.description}</p>
            )}

            {ad.phone && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <a href={`tel:${ad.phone}`}><Phone className="h-4 w-4" />اتصال {ad.phone}</a>
                </Button>
                {phoneDigits && (
                  <Button asChild variant="outline" className="gap-2">
                    <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />واتساب
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
