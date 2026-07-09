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
  /** صفوف إعلانات الصفحة الرئيسية (قابلة للإضافة والإخفاء والترتيب) */
  rows: HomeRow[];
  /** عدد أعمدة شبكة التصنيفات على الجوال (2 أو 3) */
  categoryColsMobile: number;
  /** عدد أعمدة شبكة التصنيفات على الشاشات الكبيرة */
  categoryColsDesktop: number;
  /** عدد الصفوف الظاهرة من التصنيفات (0 = عرض الكل) */
  categoryRows: number;
  /** صورة البنر الرئيسي أعلى الصفحة */
  mainBannerImage: string;
  /** إظهار البنر الرئيسي */
  showMainBanner: boolean;
  /** بطاقة (أنشطة للبيع) في شبكة التصنيفات */
  businessesCard: { show: boolean; image: string };
  /** بطاقة (المزادات) في شبكة التصنيفات */
  auctionsCard: { show: boolean; image: string };
}


export const DEFAULT_HOME_ROWS: HomeRow[] = [
  {
    id: "restaurant",
    titleAr: "مطاعم وكافيهات",
    titleEn: "Restaurants & Cafes",
    source: "category",
    categoryId: "restaurant",
    count: 10,
    cardWidthPct: 62,
    visible: true,
  },
  {
    id: "latest",
    titleAr: "أحدث الإعلانات",
    titleEn: "Latest listings",
    source: "latest",
    count: 10,
    cardWidthPct: 62,
    visible: true,
  },
];

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
  rows: DEFAULT_HOME_ROWS,
  categoryColsMobile: 3,
  categoryColsDesktop: 4,
  categoryRows: 0,
  mainBannerImage: "/__l5e/assets-v1/dd15f401-46f8-4420-ae48-fb6ea67f58df/home-main-banner.jpg",
  showMainBanner: true,
  businessesCard: { show: true, image: "/__l5e/assets-v1/fb407cd7-162a-4db4-91e7-0be93da8d308/cat-businesses.jpg" },
  auctionsCard: { show: true, image: "/__l5e/assets-v1/68f11720-000e-465b-a7c0-faf85264eb18/cat-auctions.jpg" },
};


export const HOME_LAYOUT_KEY = "homeLayout";

export function mergeHomeLayout(v: Partial<HomeLayout> | null | undefined): HomeLayout {
  const merged = { ...DEFAULT_HOME_LAYOUT, ...(v ?? {}) };
  if (!Array.isArray(merged.rows) || merged.rows.length === 0) {
    merged.rows = DEFAULT_HOME_ROWS;
  }
  return merged;
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
