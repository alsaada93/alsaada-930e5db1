import { Search, Camera, Sparkles, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useHeroConfig, resolveHeroImage } from "@/hooks/useHeroConfig";
import { searchByImage } from "@/lib/image-search.functions";

export function Hero() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSearching, setImageSearching] = useState(false);
  const [query, setQuery] = useState("");

  const { config } = useHeroConfig();
  const heroImage = resolveHeroImage(config);

  const goSearch = () => navigate({ to: "/search", search: { q: query.trim() || undefined } });

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 6_000_000) {
      toast.error(t("hero.imageTooBig"));
      return;
    }
    setImageName(file.name);
    setImageSearching(true);
    toast.info(t("hero.uploaded"), { description: t("hero.searching") });
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { query: found } = await searchByImage({ data: { imageDataUrl: dataUrl } });
      if (found) {
        setQuery(found);
        navigate({ to: "/search", search: { q: found } });
      } else {
        toast.error(t("hero.imageFailed"));
      }
    } catch {
      toast.error(t("hero.imageFailed"));
    } finally {
      setImageSearching(false);
    }
  };

  const title = lang === "ar" ? config.titleAr : config.titleEn;
  const subtitle = lang === "ar" ? config.subtitleAr : config.subtitleEn;
  const badge = lang === "ar" ? config.badgeAr : config.badgeEn;

  return (
    <section className="relative overflow-hidden bg-navy text-navy-foreground">
      {/* Static hero image */}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageSearching}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-60"
                  aria-label={t("hero.imageSearch")}
                >
                  {imageSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={goSearch}
                  className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  {t("hero.search")}
                </button>
              </div>
              {imageName && (
                <p className="px-2 pt-1 text-xs text-muted-foreground">
                  {t("hero.imageSearchLabel")} {imageName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
