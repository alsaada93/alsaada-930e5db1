import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";

export function Footer() {
  const { t, lang } = useLanguage();
  const cols = [
    {
      title: lang === "ar" ? "السعادة ماركت" : "Al Saada Market",
      links: lang === "ar"
        ? ["من نحن", "كيف تبيع", "كيف تشتري", "الباقات والأسعار"]
        : ["About us", "How to sell", "How to buy", "Plans & pricing"],
    },
    {
      title: lang === "ar" ? "التصنيفات" : "Categories",
      links: lang === "ar"
        ? ["معدات المطاعم", "الكوفي شوب", "الأثاث", "الإلكترونيات"]
        : ["Restaurant equipment", "Coffee shops", "Furniture", "Electronics"],
    },
    {
      title: lang === "ar" ? "المساعدة" : "Help",
      links: lang === "ar"
        ? ["الأسئلة الشائعة", "تواصل معنا", "الإبلاغ عن إعلان", "مركز الدعم"]
        : ["FAQ", "Contact us", "Report an ad", "Support center"],
    },
    {
      title: lang === "ar" ? "قانوني" : "Legal",
      links: lang === "ar"
        ? ["سياسة الخصوصية", "الشروط والأحكام", "سياسة المزادات"]
        : ["Privacy policy", "Terms & conditions", "Auction policy"],
    },
  ];
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="text-xl font-extrabold">
            Al Saada Market <span className="text-navy-foreground/80">| السعادة ماركت</span>
          </div>
          <p className="mt-2 text-sm text-navy-foreground/60">{t("footer.tagline")}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 font-bold">{c.title}</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60">
              {c.links.map((l) => {
                const isPackages = l === "الباقات والأسعار" || l === "Plans & pricing";
                return (
                  <li key={l}>
                    {isPackages ? (
                      <Link to="/packages" className="transition-colors hover:text-navy-foreground">
                        {l}
                      </Link>
                    ) : (
                      <a href="#" className="transition-colors hover:text-navy-foreground">
                        {l}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center gap-1 border-t border-sidebar-border py-4 text-center text-xs text-navy-foreground/50 sm:flex-row sm:gap-3">
        <span>© {new Date().getFullYear()} السعادة ماركت Al Saada Market — {t("footer.rights")}</span>
        <Link to="/admin" className="font-semibold text-navy-foreground/80 hover:underline">
          {t("footer.admin")}
        </Link>
      </div>
    </footer>
  );
}
