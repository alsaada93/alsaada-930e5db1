import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.jpg";

export interface HeroConfig {
  /** Static hero background image. Empty falls back to the bundled image. */
  imageUrl: string;
  /** Image opacity / contrast against the background (0-100). */
  imageOpacity: number;
  /** Overlay tint color (hex) drawn above the image. */
  overlayColor: string;
  /** Overlay tint opacity (0-100). */
  overlayOpacity: number;
  /** Heading text color (hex). */
  textColor: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  showName: boolean;
  showSearch: boolean;
  showBadge: boolean;
  badgeAr: string;
  badgeEn: string;
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  imageUrl: "",
  imageOpacity: 30,
  overlayColor: "#0b2545",
  overlayOpacity: 80,
  textColor: "#ffffff",
  titleAr: "بيع وشراء معدات المطاعم والأثاث",
  titleEn: "Buy & sell restaurant equipment & furniture",
  subtitleAr: "أكبر سوق للمعدات المستعملة والجديدة في البحرين",
  subtitleEn: "Bahrain's largest marketplace for used & new equipment",
  showName: true,
  showSearch: true,
  showBadge: true,
  badgeAr: "مدعوم بالذكاء الاصطناعي",
  badgeEn: "Powered by AI",
};

export const HERO_CONFIG_KEY = "heroConfig";

export function mergeHeroConfig(v: Partial<HeroConfig> | null | undefined): HeroConfig {
  return { ...DEFAULT_HERO_CONFIG, ...(v ?? {}) };
}

/** The resolved hero image (DB value or bundled fallback). */
export function resolveHeroImage(config: HeroConfig): string {
  return config.imageUrl || heroImg;
}

/** Reads the static hero section configuration from site_settings. */
export function useHeroConfig() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", HERO_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setConfig(mergeHeroConfig(data?.value as Partial<HeroConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { config, loading };
}
