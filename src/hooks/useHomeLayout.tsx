import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

/** صف إعلانات قابل للإضافة/الإخفاء في الصفحة الرئيسية. */
export interface HomeRow {
  id: string;
  titleAr: string;
  titleEn: string;
  /** مصدر الإعلانات: أحدث الإعلانات، أو تصنيف محدد */
  source: "latest" | "category";
  /** معرّف التصنيف عندما يكون المصدر تصنيفاً */
  categoryId?: string;
  count: number;
  cardWidthPct: number;
  visible: boolean;
}

/** إعدادات تحكّم كامل بشكل الصفحة الرئيسية (يديرها الأدمن). */
export interface HomeLayout {
  /** عدد إعلانات صف المطاعم */
  restaurantCount: number;
  /** عدد إعلانات صف أحدث الإعلانات (وحجم التحميل عند الضغط على المزيد) */
  latestCount: number;
  /** عرض كل بطاقة في الصف (نسبة من الشاشة للجوال) */
  cardWidthPct: number;
  /** إظهار/إخفاء أقسام الصفحة */
  showPromo: boolean;
  showCategories: boolean;
  showWeBuy: boolean;
  showRestaurantRow: boolean;
  showLatestRow: boolean;
  showFeatured: boolean;
  showTestimonials: boolean;
  showBusiness: boolean;
}

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  restaurantCount: 6,
  latestCount: 6,
  cardWidthPct: 62,
  showPromo: true,
  showCategories: true,
  showWeBuy: true,
  showRestaurantRow: true,
  showLatestRow: true,
  showFeatured: true,
  showTestimonials: true,
  showBusiness: true,
};

export const HOME_LAYOUT_KEY = "homeLayout";

export function mergeHomeLayout(v: Partial<HomeLayout> | null | undefined): HomeLayout {
  return { ...DEFAULT_HOME_LAYOUT, ...(v ?? {}) };
}

interface HomeLayoutContextValue {
  layout: HomeLayout;
  loading: boolean;
  save: (next: HomeLayout) => Promise<void>;
}

const HomeLayoutContext = createContext<HomeLayoutContextValue | null>(null);

export function HomeLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<HomeLayout>(DEFAULT_HOME_LAYOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", HOME_LAYOUT_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setLayout(mergeHomeLayout(data?.value as Partial<HomeLayout> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (next: HomeLayout) => {
    setLayout(next);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: HOME_LAYOUT_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
  };

  return (
    <HomeLayoutContext.Provider value={{ layout, loading, save }}>
      {children}
    </HomeLayoutContext.Provider>
  );
}

export function useHomeLayout() {
  const ctx = useContext(HomeLayoutContext);
  if (!ctx) throw new Error("useHomeLayout must be used within HomeLayoutProvider");
  return ctx;
}
