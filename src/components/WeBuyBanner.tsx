import { Phone, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

/** Commercial banner: we buy used equipment directly with free valuation. */
export function WeBuyBanner() {
  const { t } = useLanguage();
  return (
    <section className="bg-gradient-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-3">
          <BadgeCheck className="hidden h-8 w-8 shrink-0 sm:block" />
          <div>
            <h2 className="text-lg font-extrabold leading-tight md:text-xl">{t("buy.title")}</h2>
            <p className="text-sm text-primary-foreground/90">{t("buy.desc")}</p>
          </div>
        </div>
        <a
          href="tel:36818153"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-card transition-transform hover:scale-[1.03]"
        >
          <Phone className="h-4 w-4" />
          {t("buy.cta")}
        </a>
      </div>
    </section>
  );
}
