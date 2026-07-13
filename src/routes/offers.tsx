import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ListingCard } from "@/components/ListingCard";
import { ListingGridSkeleton } from "@/components/ListingCardSkeleton";
import { HomeListingsRow } from "@/components/HomeListingsRow";
import { useOffers } from "@/hooks/useOffers";
import { useLanguage } from "@/hooks/useLanguage";
import { useListingTranslations } from "@/hooks/useListingTranslations";
import { useOffersConfig } from "@/hooks/useOffersConfig";
import { OffersSlideshow } from "@/components/OffersSlideshow";

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
  const { config, loading: configLoading } = useOffersConfig();
  const { map } = useListingTranslations(
    offers.map((o) => ({ id: o.id, title: o.title, description: o.description })),
  );

  const shown = config.rows > 0 && config.displayMode === "grid"
    ? offers.slice(0, config.rows * config.gridColsDesktop)
    : offers;

  const banner = config.bannerImage?.trim();
  const title = lang === "en" ? config.titleEn : config.titleAr;

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
      {config.showBanner && !configLoading && (
        <section className="relative isolate overflow-hidden">
          {banner && (
            <img
              src={banner}
              alt={title}
              width={1920}
              height={640}
              className="h-48 w-full object-cover sm:h-64 md:h-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            {config.badgeShow && config.badgePosition === "top" && (
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-4 py-1 text-xs font-bold text-white shadow-lg sm:text-sm">
                {lang === "en" ? config.badgeTextEn : config.badgeTextAr}
              </span>
            )}
            <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 bg-clip-text text-3xl font-black text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl">
              {title}
            </h1>
            {config.badgeShow && config.badgePosition === "bottom" && (
              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-4 py-1 text-xs font-bold text-white shadow-lg sm:text-sm">
                {lang === "en" ? config.badgeTextEn : config.badgeTextAr}
              </span>
            )}
            {config.countShow && config.countPosition === "bottom" && (
              <p className="mt-3 rounded-full bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                {loading
                  ? lang === "en"
                    ? "Loading offers…"
                    : "جارٍ تحميل العروض…"
                  : lang === "en"
                    ? `${offers.length.toLocaleString("en")} offers available`
                    : `${offers.length.toLocaleString("ar")} عرض متاح`}
              </p>
            )}
          </div>
        </section>
      )}
      {(!config.showBanner || config.countPosition === "top") && config.countShow && (
        <div className="mx-auto max-w-6xl px-4 pt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            {!config.showBanner && `${title} — `}
            {loading
              ? lang === "en" ? "Loading offers…" : "جارٍ تحميل العروض…"
              : lang === "en"
                ? `${offers.length.toLocaleString("en")} offers available`
                : `${offers.length.toLocaleString("ar")} عرض متاح`}
          </span>
        </div>
      )}

      {config.slideEnabled && config.slidePosition === "top" && (
        <OffersSlideshow images={config.slideImages} intervalMs={config.slideIntervalMs} />
      )}

      <main className="mx-auto max-w-6xl px-4 py-10">
        {config.slideEnabled && config.slidePosition === "bottom" && (
          <div className="mb-6">
            <OffersSlideshow images={config.slideImages} intervalMs={config.slideIntervalMs} />
          </div>
        )}

        {/* سياسة الشحن */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="text-lg">🚚</span>
          <span>
            {lang === "en"
              ? "Free shipping within Bahrain on offer purchases over 50 BHD."
              : "شحن مجاني داخل البحرين لمشتريات قسم العروض التي تزيد عن 50 ديناراً."}
          </span>
        </div>

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
              className={`grid gap-3 ${gridClass[config.gridColsMobile] ?? "grid-cols-2"} sm:grid-cols-3 ${lgClass[config.gridColsDesktop] ?? "lg:grid-cols-4"}`}
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
