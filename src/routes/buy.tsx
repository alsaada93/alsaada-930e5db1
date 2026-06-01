import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/buy")({
  loader: () => fetchSeoMeta("buy"),
  head: ({ loaderData }) => buildSeoHead("buy", loaderData),
  component: BuyPage,
});

const steps = [
  { ar: "تصفّح الأقسام أو استخدم البحث للعثور على ما تريد.", en: "Browse categories or use search to find what you need." },
  { ar: "اطّلع على تفاصيل الإعلان والصور وتقييم البائع.", en: "Review the listing details, photos and seller rating." },
  { ar: "تواصل مع البائع عبر واتساب أو الاتصال المباشر.", en: "Contact the seller via WhatsApp or a direct call." },
  { ar: "يمكنك تقديم عرض سعر إن كان الإعلان قابلاً للتفاوض.", en: "Send a price offer if the listing is negotiable." },
  { ar: "اتفق على التسليم وأتمّ الصفقة بأمان.", en: "Agree on delivery and complete the deal safely." },
];

function BuyPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout
      title={{ ar: "كيف تشتري", en: "How to buy" }}
      subtitle={{ ar: "تسوّق بثقة وأمان", en: "Shop with confidence" }}
    >
      <InfoSection>
        <ol className="list-decimal space-y-3 pe-5">
          {steps.map((s) => (
            <li key={s.en}>{lang === "ar" ? s.ar : s.en}</li>
          ))}
        </ol>
      </InfoSection>
      <Link to="/" className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
        {lang === "ar" ? "ابدأ التصفح" : "Start browsing"}
      </Link>
    </InfoLayout>
  );
}
