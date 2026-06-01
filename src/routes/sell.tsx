import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/sell")({
  loader: () => fetchSeoMeta("sell"),
  head: ({ loaderData }) => buildSeoHead("sell", loaderData),
  component: SellPage,
});

const steps = [
  { ar: "أنشئ حسابك أو سجّل الدخول.", en: "Create an account or sign in." },
  { ar: "اضغط على زر «أضف إعلان» واختر التصنيف المناسب.", en: "Tap “Add listing” and choose the right category." },
  { ar: "أضف صوراً واضحة ووصفاً دقيقاً وسعراً مناسباً.", en: "Add clear photos, an accurate description and a fair price." },
  { ar: "تُضاف هاشتاقات تلقائية لإعلانك لزيادة الظهور.", en: "Smart hashtags are added automatically to boost reach." },
  { ar: "انشر إعلانك وتواصل مع المشترين عبر واتساب أو الاتصال.", en: "Publish and connect with buyers via WhatsApp or call." },
];

function SellPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout
      title={{ ar: "كيف تبيع", en: "How to sell" }}
      subtitle={{ ar: "خطوات بسيطة لعرض منتجاتك", en: "Simple steps to list your products" }}
    >
      <InfoSection>
        <ol className="list-decimal space-y-3 pe-5">
          {steps.map((s) => (
            <li key={s.en}>{lang === "ar" ? s.ar : s.en}</li>
          ))}
        </ol>
      </InfoSection>
      <Link
        to="/add-listing"
        className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
      >
        {lang === "ar" ? "أضف إعلانك الآن" : "Add your listing now"}
      </Link>
    </InfoLayout>
  );
}
