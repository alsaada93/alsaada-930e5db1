import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories, type Listing } from "@/data/marketplace";

type Row = Record<string, unknown>;

function categoryName(categoryId: string | null): string {
  if (!categoryId) return "";
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.name ?? categoryId;
}

function mapRow(d: Row): Listing {
  const images = (d.images as string[] | null) ?? [];
  return {
    id: String(d.id),
    title: String(d.title ?? ""),
    price: Number(d.price ?? 0),
    negotiable: Boolean(d.negotiable),
    condition: (d.condition as Listing["condition"]) ?? "مستعمل",
    city: (d.city as string | null) ?? "",
    category: categoryName((d.category_id as string | null) ?? null),
    sub: (d.group_name as string | null) ?? undefined,
    image: images[0] ?? "/placeholder.svg",
    featured: Boolean(d.featured),
    views: Number(d.views ?? 0),
    phone: (d.contact_phone as string | null) ?? undefined,
    seller: (d.contact_name as string | null) ?? undefined,
  };
}

/** يجلب الإعلانات الحقيقية من قاعدة البيانات (بدون الإعلانات التجريبية) */
export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setListings((data ?? []).map(mapRow));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { listings, loading };
}
