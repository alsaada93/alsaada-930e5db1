import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ListingCard } from "@/components/ListingCard";
import { HomeListingsRow } from "@/components/HomeListingsRow";
import { useOffers } from "@/hooks/useOffers";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";
import { useOffersConfig } from "@/hooks/useOffersConfig";
import offersBanner from "@/assets/offers-banner.jpg";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض الخاصة | حراج السعادة" },
      {
        name: "description",
        content:
          "أفضل العروض والخصومات الحصرية في حراج السعادة، يتم نشرها مباشرة من إدارة الموقع.",
      },
      { property: "og:title", content: "العروض الخاصة | حراج السعادة" },
      {
        property: "og:description",
        content: "أفضل العروض والخصومات الحصرية في حراج السعادة، تُنشر مباشرة من إدارة الموقع.",
      },
      { property: "og:url", content: "https://www.alsaada.sale/offers" },
      { property: "og:image", content: "https://www.alsaada.sale/site-logo.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/offers" }],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { lang } = useLanguage();
  const { offers, loading } = useOffers();
  const { config } = useOffersConfig();
  const { map } = useListingTranslations(
    offers.map((o) => ({ id: o.id, title: o.title, description: o.description })),
  );

  const shown = config.rows > 0 && config.displayMode === "grid"
    ? offers.slice(0, config.rows * config.gridColsDesktop)
    : offers;

  const banner = config.bannerImage?.trim() || offersBanner;
  const title = lang === "en" ? config.titleEn : config.titleAr;
  const icon = config.icon || "🔥";

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  } as Record<number, string>;
  const lgClass = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  } as Record<number, string>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* بانر العروض الخاصة */}
      <section className="relative isolate overflow-hidden">
        <img
          src={banner}
          alt={title}
          width={1920}
          height={640}
          className="h-48 w-full object-cover sm:h-64 md:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-4 py-1 text-xs font-bold text-white shadow-lg sm:text-sm">
            <Flame className="h-4 w-4" />
            {lang === "en" ? "Exclusive deals" : "خصومات حصرية"}
          </span>
          <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 bg-clip-text text-3xl font-black text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl">
            {icon} {title}
          </h1>
          <p className="mt-3 rounded-full bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            {loading
              ? lang === "en"
                ? "Loading offers…"
                : "جارٍ تحميل العروض…"
              : lang === "en"
                ? `${offers.length.toLocaleString("en")} offers available`
                : `${offers.length.toLocaleString("ar")} عرض متاح`}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {offers.length > 0 ? (
          config.displayMode === "carousel" ? (
            <div dir={config.swipeDirection}>
              <HomeListingsRow
                title=""
                items={shown}
                cardWidthPct={config.cardWidthPct}
              />
            </div>
          ) : (
            <div
              className={`grid gap-3 ${gridClass[config.gridColsMobile as 2 | 3 | 4] ?? "grid-cols-2"} sm:grid-cols-3 ${lgClass[config.gridColsDesktop] ?? "lg:grid-cols-4"}`}
            >
              {shown.map((item) => (
                <ListingCard key={item.id} item={item} displayTitle={map[item.id]?.title} />
              ))}
            </div>
          )
        ) : !loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {lang === "en" ? "No offers yet." : "لا توجد عروض حالياً."}
          </div>
        ) : null}
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
