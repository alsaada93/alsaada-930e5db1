import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * شعار الماركة: يبحث أولاً في جدول brands عن logo_url ووصف مخزّن،
 * ثم يحاول اشتقاق شعار من خدمات favicon عامة اعتماداً على اسم الماركة،
 * ثم يعرض أول حرفين من اسم الماركة كنصّ احتياطي بلا وميض.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function fallbackLogoUrl(name: string): string | null {
  const slug = slugify(name);
  if (!slug) return null;
  // Clearbit's free logo service returns a proper brand mark when available
  return `https://logo.clearbit.com/${slug}.com`;
}

function secondaryLogoUrl(name: string): string | null {
  const slug = slugify(name);
  if (!slug) return null;
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`;
}

// ذاكرة مؤقتة داخل الصفحة لتفادي استعلامات متكررة لنفس الاسم
const cache = new Map<string, string | null>();

export function BrandLogoImg({ name, className }: { name: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(() => cache.get(name.toLowerCase()) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const key = name.toLowerCase();
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from("brands")
        .select("logo_url")
        .ilike("name", name)
        .limit(1)
        .maybeSingle();
      if (!active) return;
      const dbUrl = (data?.logo_url as string | null) ?? null;
      const finalUrl = dbUrl || fallbackLogoUrl(name);
      cache.set(key, finalUrl);
      setUrl(finalUrl);
    })();
    return () => {
      active = false;
    };
  }, [name]);

  if (!url || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-primary/10 text-[10px] font-extrabold text-primary ${className ?? ""}`}
        aria-hidden
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
