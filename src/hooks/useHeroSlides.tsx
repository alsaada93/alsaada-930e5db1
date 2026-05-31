import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sort_order: number;
  active: boolean;
}

const DEFAULT_INTERVAL = 4000;

/** Fetches active hero slides and the rotation interval (admin-configurable). */
export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: slideRows }, { data: setting }] = await Promise.all([
        supabase.from("hero_slides").select("*").eq("active", true).order("sort_order"),
        supabase.from("site_settings").select("value").eq("key", "hero").maybeSingle(),
      ]);
      if (cancelled) return;
      setSlides((slideRows as HeroSlide[]) ?? []);
      const v = setting?.value as { intervalMs?: number } | undefined;
      if (v?.intervalMs) setIntervalMs(v.intervalMs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { slides, intervalMs, loading };
}
