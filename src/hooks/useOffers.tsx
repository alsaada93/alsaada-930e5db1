import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories, type Listing } from "@/data/marketplace";

type Row = Record<string, unknown>;

const SELECT_COLS =
  "id,title,price,negotiable,condition,city,category_id,group_name,item_name,images,featured,views,contact_phone,user_id,description,contact_name,listing_type,is_offer,sold,created_at";

function categoryName(categoryId: string | null): string {
  if (!categoryId) return "";
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
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
    categoryId: (d.category_id as string | null) ?? undefined,
    image: images[0] ?? "/placeholder.svg",
    featured: Boolean(d.featured),
    views: Number(d.views ?? 0),
    phone: (d.contact_phone as string | null) ?? undefined,
    userId: (d.user_id as string | null) ?? undefined,
    description: (d.description as string | null) ?? undefined,
    seller: (d.contact_name as string | null) ?? undefined,
    listingType: (d.listing_type as Listing["listingType"]) ?? "normal",
    isOffer: Boolean(d.is_offer),
    sold: Boolean(d.sold),
  };
}

/** يجلب العروض الخاصة المنشورة (is_offer = true) — المميّز والمتوفّر أولاً. */
export function useOffers() {
  const [offers, setOffers] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from("listings")
        .select(SELECT_COLS)
        .eq("is_offer", true)
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("sold", { ascending: true })
        .order("created_at", { ascending: false });
      if (!active) return;
      setOffers((data ?? []).map(mapRow));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { offers, loading };
}
