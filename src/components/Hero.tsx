import { Search, Camera, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/hero.jpg";
import { useLanguage } from "@/hooks/useLanguage";

export function Hero() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    toast.success(t("hero.uploaded"), {
      description: `${t("hero.searching")} "${file.name}"...`,
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-navy-foreground">
      <img
        src={heroImg}
        alt="SOOGO marketplace"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-80" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-navy-foreground ring-1 ring-white/30">
            <Sparkles className="h-3.5 w-3.5" /> {t("hero.badge")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            {t("hero.title1")}
            <span className="block text-navy-foreground/90">{t("hero.title2")}</span>
          </h1>
          <p className="mt-4 text-base text-navy-foreground/75 md:text-lg">{t("hero.subtitle")}</p>

          <div className="mt-7 rounded-2xl bg-white p-2 shadow-card">
            <div className="flex items-center gap-2">
              <Search className="ms-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
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
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                aria-label={t("hero.imageSearch")}
              >
                <Camera className="h-5 w-5" />
              </button>
              <button className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                {t("hero.search")}
              </button>
            </div>
            {imageName && (
              <p className="px-2 pt-1 text-xs text-muted-foreground">
                {t("hero.imageSearchLabel")} {imageName}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
