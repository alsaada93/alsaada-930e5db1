import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** إعدادات بانر "نشتري معداتكم" القابلة للتعديل من لوحة التحكم. */
export interface WeBuyBanner {
  enabled: boolean;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  ctaAr: string;
  ctaEn: string;
  ctaPhotosAr: string;
  ctaPhotosEn: string;
  phone: string;
  whatsappMsg: string;
}

export const DEFAULT_WEBUY_BANNER: WeBuyBanner = {
  enabled: true,
  titleAr: "نشتري مباشرة",
  titleEn: "We Buy Directly",
  descAr: "نشتري معدات المطاعم والأثاث والإلكترونيات المستعملة — تثمين مجاني وسعر مناسب.",
  descEn: "We buy used restaurant equipment, furniture and electronics — free valuation and a fair price.",
  ctaAr: "اتصل بنا",
  ctaEn: "Call us",
  ctaPhotosAr: "أرسل صور معداتك الآن للتثمين",
  ctaPhotosEn: "Send your equipment photos now for valuation",
  phone: "36818153",
  whatsappMsg: "مرحباً، أريد تثمين معداتي. إليكم الصور:",
};

export const WEBUY_BANNER_KEY = "weBuyBanner";

export function mergeWeBuyBanner(v: Partial<WeBuyBanner> | null | undefined): WeBuyBanner {
  return { ...DEFAULT_WEBUY_BANNER, ...(v ?? {}) };
}

export function useWeBuyBanner() {
  const [banner, setBanner] = useState<WeBuyBanner>(DEFAULT_WEBUY_BANNER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", WEBUY_BANNER_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setBanner(mergeWeBuyBanner(data?.value as Partial<WeBuyBanner> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { banner, loading };
}

export async function saveWeBuyBanner(next: WeBuyBanner) {
  const { error } = await supabase
    .from("site_settings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ key: WEBUY_BANNER_KEY, value: next as any }, { onConflict: "key" });
  if (error) throw error;
}
