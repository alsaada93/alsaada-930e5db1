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
  logoUrl: "/site-logo.png?v=alsaada-2026-06",
  faviconUrl: "/site-logo.png?v=alsaada-2026-06",
  nameAr: "حراج السعادة",
  nameEn: "Haraj Al Saada",
  taglineAr: "شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين",
  taglineEn: "Buy & sell restaurant equipment, furniture & electronics in Bahrain",
  showLogo: true,
  showName: true,
  logoBoxWidth: 35,
  logoBoxHeight: 35,
  logoFontSize: 16,
  instagramUrl: "https://www.instagram.com/alsaada.bh1",
  contactPhone: "33982383",
  locationAr: "مملكة البحرين",
  locationEn: "Kingdom of Bahrain",
};

const SETTINGS_KEY = "identity";


function cleanIdentity(v: Partial<SiteIdentity> | null | undefined): SiteIdentity {
  const merged = { ...DEFAULT_IDENTITY, ...(v ?? {}) };
  const oldBrand = /araba|عربه|عربة|cart|lovable/i;
  if (oldBrand.test(merged.logoUrl || "") || oldBrand.test(merged.nameAr) || oldBrand.test(merged.nameEn)) {
    merged.logoUrl = DEFAULT_IDENTITY.logoUrl;
  }
  if (oldBrand.test(merged.faviconUrl || "")) {
    merged.faviconUrl = DEFAULT_IDENTITY.faviconUrl;
  }
  merged.nameAr = "حراج السعادة";
  merged.nameEn = "Haraj Al Saada";
  return merged;
}

function applyFavicon(url: string) {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!url) {
    link?.remove();
    return;
  }
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

const CACHE_KEY = "identityCache";

function readCache(): SiteIdentity {
  if (typeof window === "undefined") return DEFAULT_IDENTITY;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) return cleanIdentity(JSON.parse(raw) as Partial<SiteIdentity>);
  } catch {
    /* ignore */
  }
  return DEFAULT_IDENTITY;
}

function writeCache(v: SiteIdentity) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function SiteIdentityProvider({ children }: { children: ReactNode }) {
  // Paint the last-known identity immediately to avoid a logo/favicon flash.
  const [identity, setIdentity] = useState<SiteIdentity>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyFavicon(identity.faviconUrl);
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const v = (data?.value as Partial<SiteIdentity> | null | undefined) ?? undefined;
        const merged = cleanIdentity(v);
        setIdentity(merged);
        writeCache(merged);
        applyFavicon(merged.faviconUrl);
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (next: SiteIdentity) => {
    const clean = cleanIdentity(next);
    setIdentity(clean);
    writeCache(clean);
    applyFavicon(clean.faviconUrl);
    const { error } = await supabase
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: SETTINGS_KEY, value: clean as any }, { onConflict: "key" });
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
