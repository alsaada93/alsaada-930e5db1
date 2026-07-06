import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { useHeroConfig, resolveHeroImage } from "@/hooks/useHeroConfig";

export function Hero() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { config } = useHeroConfig();
  const heroImage = resolveHeroImage(config);

  const goSearch = () => navigate({ to: "/search", search: { q: query.trim() || undefined } });

  const title = lang === "ar" ? config.titleAr : config.titleEn;
  const subtitle = lang === "ar" ? config.subtitleAr : config.subtitleEn;
  const badge = lang === "ar" ? config.badgeAr : config.badgeEn;

  return (
    <section className="relative overflow-hidden bg-navy text-navy-foreground">
      {/* Static hero image */}
      {heroImage && (
        <img
          src={heroImage}
          alt="Haraj Al Saada marketplace"
          width={1536}
          height={1024}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: config.imageOpacity / 100 }}
        />
      )}
      {/* Color overlay / contrast tint */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: config.overlayColor, opacity: config.overlayOpacity / 100 }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="max-w-2xl" style={{ color: config.textColor }}>
          {config.showName && (
            <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-5xl">
              <span className="sr-only">حراج السعادة — سوق بيع وشراء معدات المطاعم والأثاث في البحرين. </span>
              {title}
              <span className="block opacity-90">{subtitle}</span>
            </h1>
          )}

          {config.showBadge && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold ring-1 ring-white/30">
              <Sparkles className="h-3.5 w-3.5" /> {badge}
            </span>
          )}

          {config.showSearch && (
            <div className="mt-7 rounded-2xl bg-white p-2 shadow-card">
              <div className="flex items-center gap-2">
                <Search className="ms-2 h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goSearch()}
                  placeholder={t("hero.searchPlaceholder")}
                  className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={goSearch}
                  className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  {t("hero.search")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
