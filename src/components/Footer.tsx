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
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Columns — centered */}
        <div className="grid gap-8 text-center sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="mb-3 font-bold">{c.title}</h4>
              <ul className="space-y-2 text-sm text-navy-foreground/60">
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

        {/* Contact & social — centered */}
        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-navy-foreground/70">
          {(identity.locationAr || identity.locationEn) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{lang === "ar" ? identity.locationAr : identity.locationEn}</span>
            </div>
          )}
          {identity.contactPhone && (
            <a href={`tel:${identity.contactPhone}`} className="flex items-center gap-2 hover:text-navy-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span dir="ltr">{identity.contactPhone}</span>
            </a>
          )}
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 font-semibold transition-colors hover:bg-white/20"
          >
            <Instagram className="h-4 w-4 shrink-0" />
            <span>{lang === "ar" ? "تابعنا على انستقرام" : "Follow us on Instagram"}</span>
          </a>
        </div>

        {/* Site description — centered at the bottom */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <div className="text-lg font-extrabold">
            {lang === "ar" ? identity.nameEn : identity.nameAr}{" "}
            <span className="text-navy-foreground/80">| {lang === "ar" ? identity.nameAr : identity.nameEn}</span>
          </div>
          <p className="mt-2 text-sm text-navy-foreground/80">{t("footer.tagline")}</p>
          <p className="mt-2 text-xs leading-relaxed text-navy-foreground/75">
            {lang === "ar"
              ? "ورشة متخصصة في الاستانلس ستيل وتجهيز معدات المطاعم والأثاث المنزلي، وبيع وشراء جميع المعدات والأثاث والإلكترونيات في البحرين."
              : "Stainless steel workshop for restaurant equipment & home furniture, and buying/selling all equipment, furniture & electronics in Bahrain."}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1 border-t border-sidebar-border py-4 text-center text-xs text-navy-foreground/50 sm:flex-row sm:gap-3">
        <span>© {new Date().getFullYear()} حراج السعادة Haraj Al Saada — {t("footer.rights")}</span>
        <Link to="/admin" className="font-semibold text-navy-foreground/80 hover:underline">
          {t("footer.admin")}
        </Link>
      </div>
    </footer>
  );
}
