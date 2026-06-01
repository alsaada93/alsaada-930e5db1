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
import { AuctionsSection } from "@/components/AuctionsSection";
import { BusinessSection } from "@/components/BusinessSection";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";

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
      { property: "og:url", content: "https://soogo-hub.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://soogo-hub.lovable.app/" }],

  }),

  component: Index,
});

function Index() {
  const { t } = useLanguage();
  const { listings } = useListings();
  const normal = listings.filter((l) => (l.listingType ?? "normal") === "normal");
  const featured = normal.filter((l) => l.featured);
  const latest = normal;

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
          <ListingsSection title={t("sec.featured")} subtitle={t("sec.featuredSub")} items={featured} />
          <AuctionsSection />
          <ListingsSection title={t("sec.latest")} subtitle={t("sec.latestSub")} items={latest} />
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
