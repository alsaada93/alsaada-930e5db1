import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/terms")({
  loader: () => fetchSeoMeta("terms"),
  head: ({ loaderData }) => buildSeoHead("terms", loaderData),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout title={{ ar: "الشروط والأحكام", en: "Terms & conditions" }}>
      <InfoSection>
        <ul className="list-disc space-y-2 pe-5">
          <li>{lang === "ar" ? "يلتزم المستخدم بصحة المعلومات والصور في إعلاناته." : "Users must provide accurate information and photos."}</li>
          <li>{lang === "ar" ? "يُمنع نشر محتوى مخالف أو مضلل أو احتيالي." : "Misleading or fraudulent content is prohibited."}</li>
          <li>{lang === "ar" ? "المنصة وسيط للتواصل ولا تتحمل مسؤولية الصفقات بين الأطراف." : "The platform is a contact intermediary and is not liable for deals between parties."}</li>
          <li>{lang === "ar" ? "تحتفظ الإدارة بحق إزالة أي إعلان مخالف." : "Management reserves the right to remove any violating ad."}</li>
        </ul>
      </InfoSection>
    </InfoLayout>
  );
}
