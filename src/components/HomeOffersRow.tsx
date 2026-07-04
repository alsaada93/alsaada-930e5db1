import { Link } from "@tanstack/react-router";
import { HomeListingsRow } from "./HomeListingsRow";
import { useOffers } from "@/hooks/useOffers";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * صف "العروض الخاصة" في الصفحة الرئيسية.
 * يعرض أحدث العروض التي تنشرها الإدارة مع زر لعرض كامل صفحة العروض.
 */
export function HomeOffersRow({ cardWidthPct }: { cardWidthPct?: number }) {
  const { lang } = useLanguage();
  const { offers } = useOffers();

  const title = lang === "ar" ? "🔥 العروض الخاصة" : "🔥 Special Offers";

  return (
    <HomeListingsRow
      title={title}
      subtitle={
        lang === "ar"
          ? "أحدث العروض والخصومات الحصرية من إدارة الموقع"
          : "The latest exclusive deals from the site admin"
      }
      items={offers}
      cardWidthPct={cardWidthPct}
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
  );
}
