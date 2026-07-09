import { Phone, BadgeCheck, Camera, Calculator } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeBuyBanner } from "@/hooks/useWeBuyBanner";

/** Commercial banner: we buy used equipment directly with free valuation. */
export function WeBuyBanner() {
  const { lang } = useLanguage();
  const { banner } = useWeBuyBanner();
  if (!banner.enabled) return null;

  const title = lang === "ar" ? banner.titleAr : banner.titleEn;
  const desc = lang === "ar" ? banner.descAr : banner.descEn;
  const cta = lang === "ar" ? banner.ctaAr : banner.ctaEn;
  const ctaPhotos = lang === "ar" ? banner.ctaPhotosAr : banner.ctaPhotosEn;
  const phone = banner.phone.replace(/\D/g, "");
  const valuationMsg = encodeURIComponent(banner.whatsappMsg);

  return (
    <section className="bg-gradient-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-3">
          <BadgeCheck className="hidden h-8 w-8 shrink-0 sm:block" />
          <div>
            <h2 className="text-lg font-extrabold leading-tight md:text-xl">{title}</h2>
            <p className="text-sm text-primary-foreground/90">{desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={`https://wa.me/973${phone}?text=${valuationMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-card transition-transform hover:scale-[1.03]"
          >
            <Camera className="h-4 w-4" />
            {ctaPhotos}
          </a>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold text-primary-foreground ring-1 ring-white/40 transition-transform hover:scale-[1.03]"
          >
            <Phone className="h-4 w-4" />
            {cta} <span dir="ltr">{banner.phone}</span>
          </a>
          <Link
            to="/restaurant"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold text-primary-foreground ring-1 ring-white/40 transition-transform hover:scale-[1.03]"
          >
            <Calculator className="h-4 w-4" />
            {lang === "ar" ? "🏪 حاسبة المطاعم" : "🏪 Restaurant Cost Calculator"}
          </Link>
        </div>
      </div>
    </section>
  );
}
