import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | السعادة ماركت Al Saada Market" },
      { name: "description", content: "سياسة الخصوصية وحماية بيانات المستخدمين في السعادة ماركت." },
    ],
    links: [{ rel: "canonical", href: "https://alsaada.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout title={{ ar: "سياسة الخصوصية", en: "Privacy policy" }}>
      <InfoSection>
        <p>
          {lang === "ar"
            ? "نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. نجمع فقط المعلومات اللازمة لتشغيل المنصة وتسهيل التواصل بين البائعين والمشترين، ولا نشاركها مع أي جهة خارجية لأغراض تسويقية."
            : "We respect your privacy and protect your personal data. We only collect information needed to run the platform and facilitate contact between buyers and sellers, and never share it with third parties for marketing."}
        </p>
      </InfoSection>
      <InfoSection heading={{ ar: "بياناتك", en: "Your data" }}>
        <p>
          {lang === "ar"
            ? "يمكنك تعديل أو حذف بياناتك وإعلاناتك في أي وقت من صفحة حسابك."
            : "You can edit or delete your data and listings anytime from your account page."}
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
