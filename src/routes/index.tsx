import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
// FeatureStrip removed per request — no marketing feature text on home page
import { ListingsSection } from "@/components/ListingsSection";
import { AuctionsSection } from "@/components/AuctionsSection";
import { BusinessSection } from "@/components/BusinessSection";
import { Footer } from "@/components/Footer";
import { listings } from "@/data/marketplace";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سوقو SOOGO | سوق معدات المطاعم والأثاث والإلكترونيات في البحرين" },
      {
        name: "description",
        content:
          "سوقو منصة بيع وشراء ومزاد معدات المطاعم والأثاث والإلكترونيات في البحرين والخليج مع تسعير ذكي بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "سوقو SOOGO | سوق المعدات والأثاث والإلكترونيات" },
      {
        property: "og:description",
        content: "بيع وشراء ومزاد المعدات بثقة في البحرين والخليج — تسعير ذكي وحماية من الاحتيال.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLanguage();
  const featured = listings.filter((l) => l.featured);
  const latest = listings;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeatureStrip />
        <CategoryGrid />
        <ListingsSection title={t("sec.featured")} subtitle={t("sec.featuredSub")} items={featured} />
        <AuctionsSection />
        <ListingsSection title={t("sec.latest")} subtitle={t("sec.latestSub")} items={latest} />
        <BusinessSection />
      </main>
      <Footer />
    </div>
  );
}
