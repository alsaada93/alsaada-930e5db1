import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة | السعادة ماركت Al Saada Market" },
      {
        name: "description",
        content: "إجابات على الأسئلة الأكثر شيوعاً حول البيع والشراء والإعلانات في السعادة ماركت.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alsaada.lovable.app/faq" }],
  }),
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
