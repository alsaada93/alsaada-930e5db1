import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** إعدادات صفحة العروض الخاصة — يتحكم بها الأدمن بالكامل. */
export interface OffersConfig {
  /** رابط صورة البانر الرئيسي لصفحة العروض */
  bannerImage: string;
  /** رمز/إيموجي القسم الظاهر في العنوان وبطاقة التصنيف */
  icon: string;
  /** عنوان القسم بالعربية والإنجليزية */
  titleAr: string;
  titleEn: string;
  /** طريقة عرض الإعلانات: شبكة ثابتة أو شريط سحب أفقي */
  displayMode: "grid" | "carousel";
  /** عدد الأعمدة على الجوال في وضع الشبكة (2 افتراضياً) */
  gridColsMobile: number;
  /** عدد الأعمدة على الشاشات الكبيرة في وضع الشبكة */
  gridColsDesktop: number;
  /** عدد الصفوف الظاهرة (0 = بلا حدّ) */
  rows: number;
  /** عرض بطاقة الشريط على الجوال كنسبة من الشاشة (وضع السحب) */
  cardWidthPct: number;
  /** اتجاه السحب في الشريط */
  swipeDirection: "rtl" | "ltr";
  /** إظهار قسم العروض في الصفحة الرئيسية */
  showOnHome: boolean;
}

export const DEFAULT_OFFERS_CONFIG: OffersConfig = {
  bannerImage: "",
  icon: "🔥",
  titleAr: "العروض الخاصة",
  titleEn: "Special Offers",
  displayMode: "grid",
  gridColsMobile: 2,
  gridColsDesktop: 4,
  rows: 0,
  cardWidthPct: 62,
  swipeDirection: "rtl",
  showOnHome: true,
};

export const OFFERS_CONFIG_KEY = "offersConfig";

export function mergeOffersConfig(v: Partial<OffersConfig> | null | undefined): OffersConfig {
  return { ...DEFAULT_OFFERS_CONFIG, ...(v ?? {}) };
}

export function useOffersConfig() {
  const [config, setConfig] = useState<OffersConfig>(DEFAULT_OFFERS_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", OFFERS_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setConfig(mergeOffersConfig(data?.value as Partial<OffersConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (next: OffersConfig) => {
    setConfig(next);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: OFFERS_CONFIG_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
  }, []);

  return { config, loading, save };
}
