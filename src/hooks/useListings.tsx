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
  const type = (d.listing_type as Listing["listingType"]) ?? "normal";
  return {
    id: String(d.id),
    title: String(d.title ?? ""),
    price: Number(d.price ?? d.start_price ?? 0),
    negotiable: Boolean(d.negotiable),
    condition: (d.condition as Listing["condition"]) ?? "مستعمل",
    city: (d.city as string | null) ?? "",
    category: categoryName((d.category_id as string | null) ?? null),
    sub: (d.group_name as string | null) ?? undefined,
    image: images[0] ?? "/placeholder.svg",
    featured: Boolean(d.featured),
    views: Number(d.views ?? 0),
    phone: (d.contact_phone as string | null) ?? undefined,
    userId: (d.user_id as string | null) ?? undefined,
    description: (d.description as string | null) ?? undefined,
    seller: (d.contact_name as string | null) ?? undefined,
    listingType: type,
    startPrice: d.start_price != null ? Number(d.start_price) : undefined,
    auctionEndsAt: (d.auction_ends_at as string | null) ?? undefined,
    monthlyRevenue: d.monthly_revenue != null ? Number(d.monthly_revenue) : undefined,
    area: d.area_sqm != null ? Number(d.area_sqm) : undefined,
    staff: d.staff_count != null ? Number(d.staff_count) : undefined,
  };
}

/** يجلب الإعلانات الحقيقية المعتمدة من قاعدة البيانات (بدون الإعلانات التجريبية) */
export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("listings")
      .select(
        "id,title,price,start_price,negotiable,condition,city,category_id,group_name,images,featured,views,contact_phone,user_id,description,contact_name,listing_type,auction_ends_at,monthly_revenue,area_sqm,staff_count,created_at",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(300)
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
