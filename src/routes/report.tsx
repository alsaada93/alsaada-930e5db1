import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/report")({
  loader: () => fetchSeoMeta("report"),
  head: ({ loaderData }) => buildSeoHead("report", loaderData),
  component: ReportPage,
});

function ReportPage() {
  const { lang } = useLanguage();
  const wa = `https://wa.me/97333982383?text=${encodeURIComponent(
    lang === "ar" ? "أرغب بالإبلاغ عن إعلان: " : "I want to report a listing: ",
  )}`;
  return (
    <InfoLayout
      title={{ ar: "الإبلاغ عن إعلان", en: "Report an ad" }}
      subtitle={{ ar: "ساعدنا في الحفاظ على بيئة آمنة وموثوقة", en: "Help us keep a safe, trusted marketplace" }}
    >
      <InfoSection heading={{ ar: "متى تُبلّغ؟", en: "When to report" }}>
        <ul className="list-disc space-y-2 pe-5">
          <li>{lang === "ar" ? "محتوى مخالف أو مضلل." : "Misleading or violating content."}</li>
          <li>{lang === "ar" ? "أسعار أو معلومات غير صحيحة." : "Incorrect prices or information."}</li>
          <li>{lang === "ar" ? "محاولات احتيال أو إزعاج." : "Scam or spam attempts."}</li>
        </ul>
      </InfoSection>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
        {lang === "ar" ? "أبلغ عبر واتساب" : "Report via WhatsApp"}
      </a>
    </InfoLayout>
  );
}
