import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteIdentity {
  logoUrl: string;
  faviconUrl: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  showLogo: boolean;
  showName: boolean;
  /** Header logo box size in px */
  logoBoxWidth: number;
  logoBoxHeight: number;
  /** Header brand name font size in px */
  logoFontSize: number;
  /** Contact / social */
  instagramUrl: string;
  contactPhone: string;
  locationAr: string;
  locationEn: string;
}

export const DEFAULT_IDENTITY: SiteIdentity = {
  logoUrl: "",
  faviconUrl: "/site-logo.png",
  nameAr: "السعادة ماركت",
  nameEn: "Al Saada Market",
  taglineAr: "شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين",
  taglineEn: "Buy & sell restaurant equipment, furniture & electronics in Bahrain",
  showLogo: true,
  showName: true,
  logoBoxWidth: 40,
  logoBoxHeight: 40,
  logoFontSize: 16,
  instagramUrl: "",
  contactPhone: "",
  locationAr: "مملكة البحرين",
  locationEn: "Kingdom of Bahrain",
};

const SETTINGS_KEY = "identity";

function applyFavicon(url: string) {
  if (typeof document === "undefined" || !url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

interface IdentityContextValue {
  identity: SiteIdentity;
  loading: boolean;
  save: (next: SiteIdentity) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function SiteIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<SiteIdentity>(DEFAULT_IDENTITY);
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
        const v = (data?.value as Partial<SiteIdentity> | null | undefined) ?? undefined;
        const merged = { ...DEFAULT_IDENTITY, ...(v ?? {}) };
        setIdentity(merged);
        applyFavicon(merged.faviconUrl);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (next: SiteIdentity) => {
    setIdentity(next);
    applyFavicon(next.faviconUrl);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: SETTINGS_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
  };

  return (
    <IdentityContext.Provider value={{ identity, loading, save }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useSiteIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useSiteIdentity must be used within SiteIdentityProvider");
  return ctx;
}
