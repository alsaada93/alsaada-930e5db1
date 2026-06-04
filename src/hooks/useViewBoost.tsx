import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ViewBoost {
  /** عدد المشاهدات الوهمي الذي يُضاف فوق المشاهدات الحقيقية */
  base: number;
  /** هل يُعرض الرقم الوهمي أم لا */
  enabled: boolean;
}

export const DEFAULT_VIEW_BOOST: ViewBoost = { base: 356, enabled: true };

const SETTINGS_KEY = "viewBoost";

/** يحسب عدد المشاهدات المعروض = الحقيقي + الوهمي (عند التفعيل) */
export function boostViews(real: number, boost: ViewBoost): number {
  if (!boost.enabled) return real;
  return real + boost.base;
}

export function useViewBoost() {
  const [boost, setBoost] = useState<ViewBoost>(DEFAULT_VIEW_BOOST);
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
        const v = (data?.value as Partial<ViewBoost> | null | undefined) ?? undefined;
        setBoost({ ...DEFAULT_VIEW_BOOST, ...(v ?? {}) });
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (next: ViewBoost) => {
    setBoost(next);
    await supabase.from("site_settings").upsert({ key: SETTINGS_KEY, value: next });
  };

  return { boost, loading, save };
}
