import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_FAB_DISCOUNTS,
  DEFAULT_FAB_QUOTE,
  DEFAULT_GRADES,
  DEFAULT_THICKNESSES,
  normalizeImages,
  type FabCategory,
  type FabDiscounts,
  type FabProduct,
  type FabQuote,
  type SteelGrades,
  type Thicknesses,
} from "@/lib/fabrication";

const db = supabase as any;

export interface FabricationData {
  categories: FabCategory[];
  products: FabProduct[];
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discounts: FabDiscounts;
  quote: FabQuote;
  loading: boolean;
  reload: () => Promise<void>;
}

/** يحمّل كل بيانات حاسبة التفصيل (للموقع وللوحة التحكم) */
export function useFabricationData(activeOnly = false): FabricationData {
  const [categories, setCategories] = useState<FabCategory[]>([]);
  const [products, setProducts] = useState<FabProduct[]>([]);
  const [grades, setGrades] = useState<SteelGrades>(DEFAULT_GRADES);
  const [thicknesses, setThicknesses] = useState<Thicknesses>(DEFAULT_THICKNESSES);
  const [discounts, setDiscounts] = useState<FabDiscounts>(DEFAULT_FAB_DISCOUNTS);
  const [quote, setQuote] = useState<FabQuote>(DEFAULT_FAB_QUOTE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let catQ = db.from("fabrication_categories").select("*").order("sort_order", { ascending: true });
    let prodQ = db.from("fabrication_products").select("*").order("sort_order", { ascending: true });
    if (activeOnly) {
      catQ = catQ.eq("active", true);
      prodQ = prodQ.eq("active", true);
    }
    const [{ data: cats }, { data: prods }, { data: settings }] = await Promise.all([
      catQ,
      prodQ,
      db.from("fabrication_settings").select("key,value"),
    ]);

    setCategories((cats ?? []) as FabCategory[]);
    setProducts(
      (prods ?? []).map((p: any) => ({
        ...p,
        base_price: Number(p.base_price ?? 0),
        price_per_m2: Number(p.price_per_m2 ?? 0),
        images: normalizeImages(p.images),
        specs: p.specs ?? {},
        fields: p.fields ?? {},
        pricing: p.pricing ?? {},
      })) as FabProduct[],
    );

    for (const row of settings ?? []) {
      if (row.key === "steel_grades" && row.value) setGrades(row.value as SteelGrades);
      if (row.key === "thicknesses" && row.value)
        setThicknesses({ ...DEFAULT_THICKNESSES, ...(row.value as Partial<Thicknesses>) });
      if (row.key === "discounts" && row.value)
        setDiscounts({ ...DEFAULT_FAB_DISCOUNTS, ...(row.value as Partial<FabDiscounts>) });
      if (row.key === "quote" && row.value)
        setQuote({ ...DEFAULT_FAB_QUOTE, ...(row.value as Partial<FabQuote>) });
    }
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, products, grades, thicknesses, discounts, quote, loading, reload: load };
}
