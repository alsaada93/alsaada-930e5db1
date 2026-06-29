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
import { HomeListingsRow } from "@/components/HomeListingsRow";
import { Link } from "@tanstack/react-router";
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
  const { t, lang } = useLanguage();
  // احدث الاعلانات: نعرض 6 أولاً ثم نحمّل 6 إضافية مع كل ضغطة على "عرض المزيد"
  const { listings: latest, loadMore, loadingMore, hasMore } = useListings({ pageSize: 6, onlyNormal: true });
  // اخر 6 اعلانات من قسم المطاعم
  const { listings: restaurant } = useListings({ pageSize: 6, categoryId: "restaurant", onlyNormal: true });
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
          <HomeListingsRow
            title={lang === "ar" ? "مطاعم وكافيهات" : "Restaurants & Cafes"}
            subtitle={lang === "ar" ? "أحدث معدات المطاعم والكافيهات" : "Latest restaurant equipment"}
            items={restaurant}
            moreButton={
              <Link
                to="/category/$id"
                params={{ id: "restaurant" }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
              >
                {lang === "ar" ? "عرض المزيد من المطاعم" : "More restaurant ads"}
              </Link>
            }
          />
          <HomeListingsRow
            title={t("sec.latest")}
            subtitle={t("sec.latestSub")}
            items={latest}
            onLoadMore={() => loadMore()}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
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
