import { Link } from "@tanstack/react-router";
import { HomeListingsRow } from "./HomeListingsRow";
import { useOffers } from "@/hooks/useOffers";
import { useLanguage } from "@/hooks/useLanguage";
import { useOffersConfig } from "@/hooks/useOffersConfig";

/**
 * صف "العروض الخاصة" في الصفحة الرئيسية.
 * يعرض أحدث العروض التي تنشرها الإدارة مع زر لعرض كامل صفحة العروض.
 * تُتحكم بشكله وظهوره من لوحة التحكم (useOffersConfig).
 */
export function HomeOffersRow({ cardWidthPct }: { cardWidthPct?: number }) {
  const { lang } = useLanguage();
  const { offers, loading } = useOffers();
  const { config } = useOffersConfig();

  if (!config.showOnHome) return null;

  const baseTitle = lang === "en" ? config.titleEn : config.titleAr;
  const title = baseTitle;
  const shown = config.rows > 0 ? offers.slice(0, config.rows * 4) : offers;

  return (
    <div dir={config.swipeDirection}>
      <HomeListingsRow
        title={title}
        subtitle={
          lang === "ar"
            ? "أحدث العروض والخصومات الحصرية من إدارة الموقع"
            : "The latest exclusive deals from the site admin"
        }
        items={shown}
        cardWidthPct={cardWidthPct ?? config.cardWidthPct}
        emptyText={lang === "ar" ? "لا توجد عروض حالياً — تابعنا قريباً." : "No offers yet — stay tuned."}
        moreButton={
          <Link
            to="/offers"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            {lang === "ar" ? "عرض كل العروض" : "See all offers"}
          </Link>
        }
      />
    </div>
  );
}
