import { useEffect, useState } from "react";
import { categories as staticCategories, type Category } from "@/data/marketplace";
import { supabase } from "@/integrations/supabase/client";

const SETTINGS_KEY = "categories";

/**
 * Categories with admin overrides.
 * Admins edit the nested structure (categories → groups → items) in the
 * dashboard; the full tree is persisted in site_settings and merged here.
 * Falls back to the static defaults when no override exists.
 */
export function useCategories() {
  const [cats, setCats] = useState<Category[]>(staticCategories);
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
        const value = data?.value as Category[] | null | undefined;
        if (Array.isArray(value) && value.length > 0) setCats(value);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories: cats, loading };
}

export async function saveCategories(next: Category[]) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: SETTINGS_KEY, value: next as unknown as Record<string, unknown> }, { onConflict: "key" });
  if (error) throw error;
}
