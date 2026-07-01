import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteIdentity } from "@/hooks/useSiteIdentity";

type FooterTo =
  | "/about"
  | "/sell"
  | "/buy"
  | "/packages"
  | "/faq"
  | "/contact"
  | "/report"
  | "/privacy"
  | "/terms"
  | "/tips";
type FooterLink = { label: string; to: FooterTo };

export function Footer() {
  const { t, lang } = useLanguage();
  const { identity } = useSiteIdentity();
  const instagram = identity.instagramUrl || "https://www.instagram.com/alsaada.bh1";

  const cols: { title: string; links: FooterLink[] }[] = [
    {
      title: lang === "ar" ? "حراج السعادة" : "Haraj Al Saada",
      links: [
        { label: lang === "ar" ? "من نحن" : "About us", to: "/about" },
        { label: lang === "ar" ? "كيف تبيع" : "How to sell", to: "/sell" },
        { label: lang === "ar" ? "كيف تشتري" : "How to buy", to: "/buy" },
        { label: lang === "ar" ? "الباقات والأسعار" : "Plans & pricing", to: "/packages" },
      ],
    },
    {
      title: lang === "ar" ? "المساعدة" : "Help",
      links: [
        { label: lang === "ar" ? "نصائح ومقالات" : "Tips & articles", to: "/tips" },
        { label: lang === "ar" ? "الأسئلة الشائعة" : "FAQ", to: "/faq" },
        { label: lang === "ar" ? "تواصل معنا" : "Contact us", to: "/contact" },
        { label: lang === "ar" ? "الإبلاغ عن إعلان" : "Report an ad", to: "/report" },
      ],
    },
    {
      title: lang === "ar" ? "قانوني" : "Legal",
      links: [
        { label: lang === "ar" ? "سياسة الخصوصية" : "Privacy policy", to: "/privacy" },
        { label: lang === "ar" ? "الشروط والأحكام" : "Terms & conditions", to: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 text-center">
        {/* ثلاثة أقسام في الوسط */}
        <div className="grid grid-cols-3 gap-4">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col items-center">
              <h4 className="mb-2 text-sm font-bold sm:text-base">{c.title}</h4>
              <ul className="space-y-1.5 text-xs text-navy-foreground/60 sm:text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="transition-colors hover:text-navy-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* الاسم والموقع والتواصل في الوسط */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-8">
          <div className="text-lg font-extrabold">
            {lang === "ar" ? identity.nameAr : identity.nameEn}{" "}
            <span className="text-navy-foreground/70">
              | {lang === "ar" ? identity.nameEn : identity.nameAr}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-navy-foreground/80">
            <MapPin className="h-4 w-4 shrink-0" />
            {lang === "ar" ? "مملكة البحرين" : "Kingdom of Bahrain"}
          </div>
          {identity.contactPhone && (
            <a href={`tel:${identity.contactPhone}`} className="flex items-center gap-1.5 text-sm text-navy-foreground/80 hover:text-navy-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span dir="ltr">{identity.contactPhone}</span>
            </a>
          )}
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white/20"
          >
            <Instagram className="h-4 w-4 shrink-0" />
            <span>{lang === "ar" ? "انستقرام" : "Instagram"}</span>
          </a>
          <p className="mt-1 max-w-md text-xs text-navy-foreground/60">{t("footer.tagline")}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1 border-t border-sidebar-border py-3 text-center text-xs text-navy-foreground/50">
        <span>© {new Date().getFullYear()} حراج السعادة Haraj Al Saada — {t("footer.rights")}</span>
      </div>
    </footer>
  );
}
