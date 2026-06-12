import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PRICING,
  DEFAULT_QUOTE,
  DEFAULT_SIZES,
  type CalcAccessory,
  type CalcProduct,
  type PricingSettings,
  type QuoteSettings,
  type SizeLimits,
} from "@/lib/restaurant-calc";

const db = supabase as any;

export interface CalcData {
  products: CalcProduct[];
  accessories: CalcAccessory[];
  pricing: PricingSettings;
  sizes: SizeLimits;
  quote: QuoteSettings;
}

/** يحمّل كل بيانات الحاسبة (للموقع وللوحة التحكم) */
export function useCalculatorData(activeOnly = false) {
  const [data, setData] = useState<CalcData>({
    products: [],
    accessories: [],
    pricing: DEFAULT_PRICING,
    sizes: DEFAULT_SIZES,
    quote: DEFAULT_QUOTE,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let prodQ = db
      .from("restaurant_products")
      .select("*")
      .order("sort_order", { ascending: true });
    let accQ = db
      .from("restaurant_accessories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (activeOnly) {
      prodQ = prodQ.eq("active", true);
      accQ = accQ.eq("active", true);
    }
    const [{ data: products }, { data: accessories }, { data: settings }] = await Promise.all([
      prodQ,
      accQ,
      db.from("restaurant_calc_settings").select("key,value"),
    ]);

    let pricing = DEFAULT_PRICING;
    let sizes = DEFAULT_SIZES;
    let quote = DEFAULT_QUOTE;
    for (const row of settings ?? []) {
      if (row.key === "pricing" && row.value)
        pricing = { ...DEFAULT_PRICING, ...(row.value as Partial<PricingSettings>) };
      if (row.key === "sizes" && row.value)
        sizes = { ...DEFAULT_SIZES, ...(row.value as Partial<SizeLimits>) };
      if (row.key === "quote" && row.value)
        quote = { ...DEFAULT_QUOTE, ...(row.value as Partial<QuoteSettings>) };
    }

    setData({
      products: (products ?? []).map((p: any) => ({
        ...p,
        base_price: Number(p.base_price ?? 0),
        options: p.options ?? {},
      })) as CalcProduct[],
      accessories: (accessories ?? []).map((a: any) => ({
        ...a,
        price: Number(a.price ?? 0),
      })) as CalcAccessory[],
      pricing,
      sizes,
      quote,
    });
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, reload: load };
}

/** يسجّل حدث استخدام الحاسبة لأغراض الإحصائيات */
export async function logCalcEvent(productSlug: string, productName: string, totalPrice: number) {
  try {
    await db.from("restaurant_calc_events").insert({
      product_slug: productSlug,
      product_name: productName,
      total_price: totalPrice,
    });
  } catch {
    /* تجاهل أخطاء الإحصائيات */
  }
}
