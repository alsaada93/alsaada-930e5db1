import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomeBanner {
  id: string;
  imageUrl: string;
  link: string;
}

export type BannerPosition = "top" | "bottom" | "left" | "right";

export interface HomeBanners {
  top: HomeBanner[];
  bottom: HomeBanner[];
  left: HomeBanner[];
  right: HomeBanner[];
}

export const DEFAULT_BANNERS: HomeBanners = {
  top: [],
  bottom: [],
  left: [],
  right: [],
};

export const BANNER_POSITIONS: { key: BannerPosition; ar: string }[] = [
  { key: "top", ar: "أعلى الصفحة" },
  { key: "bottom", ar: "أسفل الصفحة" },
  { key: "left", ar: "يسار الصفحة" },
  { key: "right", ar: "يمين الصفحة" },
];

const SETTINGS_KEY = "homeBanners";

function normalize(v: Partial<HomeBanners> | null | undefined): HomeBanners {
  return {
    top: v?.top ?? [],
    bottom: v?.bottom ?? [],
    left: v?.left ?? [],
    right: v?.right ?? [],
  };
}

interface BannersContextValue {
  banners: HomeBanners;
  loading: boolean;
  save: (next: HomeBanners) => Promise<void>;
}

const BannersContext = createContext<BannersContextValue | null>(null);

export function HomeBannersProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<HomeBanners>(DEFAULT_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setBanners(normalize(data?.value as Partial<HomeBanners> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (next: HomeBanners) => {
    setBanners(next);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: SETTINGS_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
  };

  return (
    <BannersContext.Provider value={{ banners, loading, save }}>
      {children}
    </BannersContext.Provider>
  );
}

export function useHomeBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error("useHomeBanners must be used within HomeBannersProvider");
  return ctx;
}
