import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { useHeroConfig, resolveHeroImage } from "@/hooks/useHeroConfig";
import { useListings } from "@/hooks/useListings";


export function Hero({ bannerImage }: { bannerImage?: string } = {}) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { listings } = useListings();

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || term.length < 2) return [];
    return listings
      .filter((l) => {
        const hay = `${l.title} ${l.itemName ?? ""} ${l.category ?? ""} ${l.city ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 8);
  }, [query, listings]);


  const { config } = useHeroConfig();
  const heroImage = bannerImage || resolveHeroImage(config);

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
            <div className="relative mt-7">
              <div className="rounded-2xl bg-white p-2 shadow-card">
                <div className="flex items-center gap-2">
                  <Search className="ms-2 h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
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

              {focused && suggestions.length > 0 && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-white text-foreground shadow-xl">
                  <ul className="divide-y divide-border">
                    {suggestions.map((l) => (
                      <li key={l.id}>
                        <Link
                          to="/listing/$id"
                          params={{ id: l.id }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <img
                            src={l.image}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{l.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {l.category} {l.city ? `• ${l.city}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {l.price ? `${l.price} د.ب` : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={goSearch}
                    className="block w-full border-t border-border px-3 py-2 text-center text-sm font-bold text-primary hover:bg-muted"
                  >
                    {lang === "ar" ? "عرض جميع النتائج" : "View all results"}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
