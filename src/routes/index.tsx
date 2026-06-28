import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header";
import { WeBuyBanner } from "@/components/WeBuyBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { PromoCarousel } from "@/components/PromoCarousel";
import { HomeBanners } from "@/components/HomeBanners";
// FeatureStrip removed per request — no marketing feature text on home page
import { ListingsSection } from "@/components/ListingsSection";
import { ListingsCarousel } from "@/components/ListingsCarousel";
// AuctionsSection removed per request — auctions discontinued
import { BusinessSection } from "@/components/BusinessSection";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronDown, Loader2 } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حراج السعادة | بيع وشراء معدات المطاعم والأثاث" },
      {
        name: "description",
        content:
          "حراج السعادة — شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين. نشتري مباشرة مع تثمين مجاني وسعر مناسب. تواصل: 36818153.",
      },
      { property: "og:title", content: "حراج السعادة | بيع وشراء معدات المطاعم والأثاث في البحرين" },
      {
        property: "og:description",
        content: "شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين — نشتري مباشرة وتثمين مجاني.",
      },
      { property: "og:url", content: "https://www.alsaada.sale/" },
      { property: "og:image", content: "https://www.alsaada.sale/site-logo.png" },
      { name: "twitter:image", content: "https://www.alsaada.sale/site-logo.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/" }],

  }),

  component: Index,
});

function Index() {
  const { t } = useLanguage();
  // التحميل التدريجي: نجلب أول 12 إعلان فقط ثم نجلب الباقي عند الضغط على "عرض المزيد"
  const { listings: latest, loadMore, loadingMore, hasMore } = useListings({ pageSize: 12, onlyNormal: true });
  const featured = latest.filter((l) => l.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[110rem] gap-6 px-0 xl:px-6">
        <HomeBanners position="left" />
        <main className="min-w-0 flex-1">
          <HomeBanners position="top" />
          <Hero />
          <PromoCarousel />
          <CategoryGrid />
          <WeBuyBanner />
          <ListingsCarousel title={t("sec.latest")} subtitle={t("sec.latestSub")} items={latest} />
          {hasMore && (
            <div className="mx-auto max-w-7xl px-4 pb-4 text-center">
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("common.loading") || "جارٍ التحميل…"}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {t("sec.more") || "عرض المزيد"}
                  </>
                )}
              </button>
            </div>
          )}
          {featured.length > 0 && (
            <ListingsSection title={t("sec.featured")} subtitle={t("sec.featuredSub")} items={featured} />
          )}
          
          <Testimonials />
          <BusinessSection />
          <HomeBanners position="bottom" />
        </main>
        <HomeBanners position="right" />
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
