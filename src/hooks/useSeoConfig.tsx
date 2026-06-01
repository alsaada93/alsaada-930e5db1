import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SeoMeta {
  title: string;
  description: string;
}

/** The set of editable bottom-of-site pages. */
export const SEO_PAGES = [
  "about",
  "sell",
  "buy",
  "faq",
  "report",
  "privacy",
  "terms",
] as const;

export type SeoPageKey = (typeof SEO_PAGES)[number];

export type SeoConfig = Record<SeoPageKey, SeoMeta>;

export const SEO_PAGE_LABELS: Record<SeoPageKey, string> = {
  about: "من نحن",
  sell: "كيف تبيع",
  buy: "كيف تشتري",
  faq: "الأسئلة الشائعة",
  report: "الإبلاغ عن إعلان",
  privacy: "سياسة الخصوصية",
  terms: "الشروط والأحكام",
};

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  about: {
    title: "من نحن | حراج السعادة Haraj Al Saada",
    description:
      "ورشة متخصصة في الاستانلس ستيل وتجهيز معدات المطاعم والأثاث المنزلي في البحرين — بيع وشراء معدات وأثاث وإلكترونيات.",
  },
  sell: {
    title: "كيف تبيع | حراج السعادة Haraj Al Saada",
    description:
      "تعرّف على خطوات إضافة إعلان وبيع معداتك وأثاثك وإلكترونياتك على حراج السعادة بسهولة.",
  },
  buy: {
    title: "كيف تشتري | حراج السعادة Haraj Al Saada",
    description:
      "خطوات شراء المعدات والأثاث والإلكترونيات بأمان عبر حراج السعادة في البحرين.",
  },
  faq: {
    title: "الأسئلة الشائعة | حراج السعادة Haraj Al Saada",
    description:
      "إجابات على الأسئلة الأكثر شيوعاً حول البيع والشراء والإعلانات في حراج السعادة.",
  },
  report: {
    title: "الإبلاغ عن إعلان | حراج السعادة Haraj Al Saada",
    description:
      "أبلغ عن إعلان مخالف أو محتوى غير لائق في حراج السعادة لنحافظ على بيئة آمنة للجميع.",
  },
  privacy: {
    title: "سياسة الخصوصية | حراج السعادة Haraj Al Saada",
    description: "سياسة الخصوصية وحماية بيانات المستخدمين في حراج السعادة.",
  },
  terms: {
    title: "الشروط والأحكام | حراج السعادة Haraj Al Saada",
    description: "شروط وأحكام استخدام منصة حراج السعادة للبيع والشراء في البحرين.",
  },
};

export const SEO_CONFIG_KEY = "seoPages";
export const SITE_ORIGIN = "https://alsaada.lovable.app";

export function mergeSeoConfig(v: Partial<SeoConfig> | null | undefined): SeoConfig {
  const incoming = v ?? {};
  const out = {} as SeoConfig;
  for (const key of SEO_PAGES) {
    out[key] = { ...DEFAULT_SEO_CONFIG[key], ...(incoming[key] ?? {}) };
  }
  return out;
}

/** Fetches a single page's SEO meta. Safe to call from route loaders (SSR + client). */
export async function fetchSeoMeta(page: SeoPageKey): Promise<SeoMeta> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SEO_CONFIG_KEY)
      .maybeSingle();
    return mergeSeoConfig(data?.value as Partial<SeoConfig> | null)[page];
  } catch {
    return DEFAULT_SEO_CONFIG[page];
  }
}

/** Builds the head() meta + canonical for an info page. */
export function buildSeoHead(page: SeoPageKey, meta: SeoMeta | undefined) {
  const m = meta ?? DEFAULT_SEO_CONFIG[page];
  const url = `${SITE_ORIGIN}/${page}`;
  return {
    meta: [
      { title: m.title },
      { name: "description", content: m.description },
      { property: "og:title", content: m.title },
      { property: "og:description", content: m.description },
      { property: "og:url", content: url },
      { property: "og:image", content: `${SITE_ORIGIN}/site-logo.png` },
      { name: "twitter:image", content: `${SITE_ORIGIN}/site-logo.png` },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Reads the full SEO configuration from site_settings (admin use). */
export function useSeoConfig() {
  const [config, setConfig] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", SEO_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setConfig(mergeSeoConfig(data?.value as Partial<SeoConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { config, loading };
}
