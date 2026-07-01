import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header";
import { WeBuyBanner } from "@/components/WeBuyBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { PromoCarousel } from "@/components/PromoCarousel";
import { HomeBanners } from "@/components/HomeBanners";
import { ListingsSection } from "@/components/ListingsSection";
import { HomeDynamicRow } from "@/components/HomeDynamicRow";
import { BusinessSection } from "@/components/BusinessSection";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { useListings } from "@/hooks/useListings";
import { useHomeLayout } from "@/hooks/useHomeLayout";
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
  const { layout } = useHomeLayout();
  // إعلانات مميزة (نجلب دفعة صغيرة ونفلتر المميّز منها)
  const { listings: latest } = useListings({ pageSize: 24, onlyNormal: true });
  const featured = latest.filter((l) => l.featured);
  const rows = (layout.rows ?? []).filter((r) => r.visible);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[110rem] gap-6 px-0 xl:px-6">
        <HomeBanners position="left" />
        <main className="min-w-0 flex-1">
          <HomeBanners position="top" />
          <Hero />
          {layout.showPromo && <PromoCarousel />}
          {layout.showCategories && <CategoryGrid />}
          {layout.showWeBuy && <WeBuyBanner />}

          {rows.map((row) => (
            <HomeDynamicRow key={row.id} row={row} />
          ))}

          {layout.showFeatured && featured.length > 0 && (
            <ListingsSection title={t("sec.featured")} subtitle={t("sec.featuredSub")} items={featured} hideContact />
          )}

          {layout.showTestimonials && <Testimonials />}
          {layout.showBusiness && <BusinessSection />}
          <HomeBanners position="bottom" />
        </main>
        <HomeBanners position="right" />
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
