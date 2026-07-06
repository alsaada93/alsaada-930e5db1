import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  imageOpacity: 75,
  overlayColor: "#0b2545",
  overlayOpacity: 0,
  textColor: "#ffffff",
  titleAr: "بيع وشراء معدات المطاعم والأثاث",
  titleEn: "Buy & sell restaurant equipment & furniture",
  subtitleAr: "",
  subtitleEn: "",
  showName: true,
  showSearch: true,
  showBadge: true,
  badgeAr: "",
  badgeEn: "",
};

export const HERO_CONFIG_KEY = "heroConfig";

export function mergeHeroConfig(v: Partial<HeroConfig> | null | undefined): HeroConfig {
  return { ...DEFAULT_HERO_CONFIG, ...(v ?? {}) };
}

/** The resolved hero image (DB value or bundled fallback). */
export function resolveHeroImage(config: HeroConfig): string {
  return config.imageUrl || "";
}


function cleanHeroConfig(v: Partial<HeroConfig> | null | undefined): HeroConfig {
  const merged = mergeHeroConfig(v);
  const oldBrand = /araba|عربه|عربة|cart|lovable/i;
  if (oldBrand.test(merged.imageUrl || "")) merged.imageUrl = DEFAULT_HERO_CONFIG.imageUrl;
  if (oldBrand.test(merged.titleAr || "") || oldBrand.test(merged.titleEn || "")) {
    merged.titleAr = DEFAULT_HERO_CONFIG.titleAr;
    merged.titleEn = DEFAULT_HERO_CONFIG.titleEn;
  }
  if (oldBrand.test(merged.subtitleAr || "") || oldBrand.test(merged.subtitleEn || "")) {
    merged.subtitleAr = DEFAULT_HERO_CONFIG.subtitleAr;
    merged.subtitleEn = DEFAULT_HERO_CONFIG.subtitleEn;
  }
  return merged;
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
        setConfig(cleanHeroConfig(data?.value as Partial<HeroConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { config, loading };
}
