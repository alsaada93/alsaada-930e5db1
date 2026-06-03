import { createFileRoute } from "@tanstack/react-router";
import { Phone, Instagram, MapPin, MessageCircle } from "lucide-react";
import { InfoLayout, InfoSection } from "@/components/InfoLayout";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | حراج السعادة Haraj Al Saada" },
      {
        name: "description",
        content: "تواصل مع حراج السعادة في البحرين عبر الهاتف أو واتساب أو انستقرام لتجهيز معدات المطاعم والأثاث.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { lang } = useLanguage();
  return (
    <InfoLayout
      title={{ ar: "تواصل معنا", en: "Contact us" }}
      subtitle={{ ar: "نسعد بخدمتك في أي وقت", en: "We're happy to help anytime" }}
    >
      <InfoSection>
        <div className="space-y-3">
          <a href="tel:+97336818153" className="flex items-center gap-3 text-foreground" dir="ltr">
            <Phone className="h-5 w-5 text-primary" /> +973 36818153
          </a>
          <a
            href="https://wa.me/97336818153"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            {lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
          </a>
          <a
            href="https://www.instagram.com/alsaada.bh1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground"
          >
            <Instagram className="h-5 w-5 text-primary" /> @alsaada.bh1
          </a>
          <div className="flex items-center gap-3 text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            {lang === "ar" ? "مملكة البحرين" : "Kingdom of Bahrain"}
          </div>
        </div>
      </InfoSection>
    </InfoLayout>
  );
}
