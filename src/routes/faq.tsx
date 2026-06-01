import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/faq")({
  loader: () => fetchSeoMeta("faq"),
  head: ({ loaderData }) => {
    const base = buildSeoHead("faq", loaderData);
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q.ar,
              acceptedAnswer: { "@type": "Answer", text: f.a.ar },
            })),
          }),
        },
      ],
    };
  },
  component: FaqPage,
});

const faqs = [
  {
    q: { ar: "هل إضافة الإعلان مجانية؟", en: "Is posting a listing free?" },
    a: { ar: "نعم، يمكنك إضافة إعلانك مجاناً، وتتوفر باقات مميزة لزيادة الظهور.", en: "Yes, posting is free, with premium plans for more visibility." },
  },
  {
    q: { ar: "كم تبقى مدة الإعلان؟", en: "How long does a listing stay active?" },
    a: { ar: "يبقى الإعلان فعّالاً لمدة ٦٠ يوماً ويمكن تجديده.", en: "A listing stays active for 60 days and can be renewed." },
  },
  {
    q: { ar: "كيف أتواصل مع البائع؟", en: "How do I contact the seller?" },
    a: { ar: "عبر أزرار واتساب أو الاتصال أو إرسال عرض سعر في كل إعلان.", en: "Via the WhatsApp, call, or price-offer buttons on each listing." },
  },
  {
    q: { ar: "هل تصنعون معدات حسب الطلب؟", en: "Do you make custom equipment?" },
    a: { ar: "نعم، ورشتنا متخصصة في تصنيع الاستانلس ستيل حسب الطلب.", en: "Yes, our workshop builds custom stainless steel equipment." },
  },
  {
    q: { ar: "كيف أبلّغ عن إعلان مخالف؟", en: "How do I report an ad?" },
    a: { ar: "من صفحة «الإبلاغ عن إعلان» أو عبر التواصل معنا مباشرة.", en: "Use the “Report an ad” page or contact us directly." },
  },
];

function FaqPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout title={{ ar: "الأسئلة الشائعة", en: "FAQ" }}>
      {faqs.map((f) => (
        <InfoSection key={f.q.en} heading={f.q}>
          <p>{lang === "ar" ? f.a.ar : f.a.en}</p>
        </InfoSection>
      ))}
    </InfoLayout>
  );
}
