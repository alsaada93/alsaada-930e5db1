import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

/** إعدادات شكل بطاقة الإعلان — يتحكم بها الأدمن وتطبّق في جميع الصفحات. */
export interface CardConfig {
  /** طريقة عرض الصورة: احتواء كامل (contain) أو ملء المربع مع قص (cover) */
  imageFit: "contain" | "cover";
  /** نسبة/قياس مربع الصورة */
  imageAspect: "1/1" | "4/3" | "3/4" | "16/9" | "custom";
  /** ارتفاع الصورة بالبكسل عند اختيار "قياس مخصص" */
  imageHeightPx: number;
  /** استدارة زوايا البطاقة (px) */
  cardRadius: number;
  /** خلفية مربع الصورة */
  imageBg: "background" | "white" | "muted";

  /** تبديل صور الإعلان تلقائياً داخل البطاقة عند وجود أكثر من صورة */
  imageAutoRotate: boolean;
  /** الفاصل الزمني للتبديل التلقائي بالمللي ثانية */
  imageRotateMs: number;

  /** عناصر تظهر داخل البطاقة */
  showWatermark: boolean;
  showBrandLogo: boolean;
  showCondition: boolean;
  showTitle: boolean;
  showPrice: boolean;
  showRating: boolean;
  showLocation: boolean;
  showViews: boolean;

  /** أزرار التواصل */
  showContact: boolean;
  showWhatsapp: boolean;
  showCall: boolean;
  showChat: boolean;

  /** حجم الأزرار وشكلها */
  buttonSize: "sm" | "md" | "lg";
  buttonRadius: number;
}

export const DEFAULT_CARD_CONFIG: CardConfig = {
  imageFit: "contain",
  imageAspect: "4/3",
  imageHeightPx: 200,
  cardRadius: 16,
  imageBg: "white",

  imageAutoRotate: true,
  imageRotateMs: 2000,

  showWatermark: true,
  showBrandLogo: true,
  showCondition: true,
  showTitle: true,
  showPrice: true,
  showRating: true,
  showLocation: true,
  showViews: true,

  showContact: true,
  showWhatsapp: true,
  showCall: true,
  showChat: true,

  buttonSize: "sm",
  buttonRadius: 8,
};

export const CARD_CONFIG_KEY = "cardConfig";

export function mergeCardConfig(v: Partial<CardConfig> | null | undefined): CardConfig {
  return { ...DEFAULT_CARD_CONFIG, ...(v ?? {}) };
}

interface CardConfigContextValue {
  config: CardConfig;
  loading: boolean;
  save: (next: CardConfig) => Promise<void>;
}

const CardConfigContext = createContext<CardConfigContextValue | null>(null);

export function CardConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CardConfig>(DEFAULT_CARD_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", CARD_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setConfig(mergeCardConfig(data?.value as Partial<CardConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (next: CardConfig) => {
    setConfig(next);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: CARD_CONFIG_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({ config, loading, save }), [config, loading, save]);

  return <CardConfigContext.Provider value={value}>{children}</CardConfigContext.Provider>;
}

export function useCardConfig(): CardConfigContextValue {
  const ctx = useContext(CardConfigContext);
  if (ctx) return ctx;
  // احتياط في حال استُخدم خارج المزوّد (نادر): إعدادات افتراضية بدون حفظ.
  return {
    config: DEFAULT_CARD_CONFIG,
    loading: false,
    save: async () => {},
  };
}
