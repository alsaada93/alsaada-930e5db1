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

  if (offers.length === 0) return null;

  const title = lang === "ar" ? "🔥 العروض الخاصة" : "🔥 Special Offers";

  return (
    <HomeListingsRow
      title={title}
      items={offers}
      cardWidthPct={cardWidthPct}
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
