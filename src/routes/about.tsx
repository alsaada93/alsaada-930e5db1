import { createFileRoute } from "@tanstack/react-router";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchSeoMeta, buildSeoHead } from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/about")({
  loader: () => fetchSeoMeta("about"),
  head: ({ loaderData }) => buildSeoHead("about", loaderData),
  component: AboutPage,
});

function AboutPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout
      title={{ ar: "من نحن", en: "About us" }}
      subtitle={{
        ar: "حراج السعادة ومعدات المطاعم — متخصصون في الاستانلس ستيل وتجهيز المطاعم",
        en: "Haraj Al Saada — specialists in stainless steel & restaurant equipment",
      }}
    >
      <InfoSection heading={{ ar: "ورشتنا المتخصصة", en: "Our workshop" }}>
        <p>
          {lang === "ar"
            ? "ورشة متخصصة في الاستانلس ستيل وصناعة وتجهيز: طاولات، مغاسل، كبتات، ترولي، أفران، ومكائن شاورما، بالإضافة إلى معدات المطاعم الكاملة والأثاث المنزلي."
            : "A workshop specialized in stainless steel manufacturing & fit-out: tables, sinks, cabinets, trolleys, ovens, and shawarma machines, plus full restaurant equipment and home furniture."}
        </p>
      </InfoSection>

      <InfoSection heading={{ ar: "الأثاث المنزلي", en: "Home furniture" }}>
        <p>
          {lang === "ar"
            ? "نصنّع ونوفّر طاولات الوسط، طاولات التلفزيون، طاولات المدخل، وطاولات القهوة بتصاميم عصرية وجودة عالية."
            : "We craft and supply center tables, TV tables, entrance tables, and coffee tables with modern designs and high quality."}
        </p>
      </InfoSection>

      <InfoSection heading={{ ar: "بيع وشراء", en: "Buy & sell" }}>
        <p>
          {lang === "ar"
            ? "نبيع ونشتري جميع الأشياء من معدات وأثاث وأغراض مخزّنة — معدات مطاعم، أثاث، ألعاب، إنارة، إلكترونيات ومخازن. أضف إعلانك وبيع ما لديك بسهولة."
            : "We buy and sell all kinds of equipment, furniture and stored items — restaurant equipment, furniture, toys, lighting, electronics and storage. Post your ad and sell easily."}
        </p>
      </InfoSection>

      <InfoSection heading={{ ar: "تواصل معنا", en: "Contact us" }}>
        <p>
          {lang === "ar" ? "هاتف / واتساب: " : "Phone / WhatsApp: "}
          <a href="tel:+97336818153" dir="ltr" className="font-semibold text-primary">
            +973 36818153
          </a>
        </p>
        <p>
          {lang === "ar" ? "انستقرام: " : "Instagram: "}
          <a
            href="https://www.instagram.com/alsaada.bh1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary"
          >
            @alsaada.bh1
          </a>
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
