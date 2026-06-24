import { useEffect, useRef, useState } from "react";
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

const SELECT_COLS =
  "id,title,price,start_price,negotiable,condition,city,category_id,group_name,images,featured,views,contact_phone,user_id,description,contact_name,listing_type,auction_ends_at,monthly_revenue,area_sqm,staff_count,created_at";

type UseListingsOpts = {
  /** حجم الصفحة لتفعيل التحميل التدريجي (مثلاً 12). إذا لم يُمرّر يُجلب حتى 300 إعلان دفعة واحدة. */
  pageSize?: number;
  /** اقتصار النتائج على الإعلانات العادية فقط */
  onlyNormal?: boolean;
};

/** يجلب الإعلانات الحقيقية المعتمدة من قاعدة البيانات (بدون الإعلانات التجريبية) */
export function useListings(opts: UseListingsOpts = {}) {
  const { pageSize, onlyNormal } = opts;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);

  const buildQuery = (from: number, to: number) => {
    let q = supabase
      .from("listings")
      .select(SELECT_COLS)
      .eq("status", "approved");
    if (onlyNormal) q = q.or("listing_type.eq.normal,listing_type.is.null");
    return q.order("created_at", { ascending: false }).range(from, to);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    pageRef.current = 0;
    const size = pageSize ?? 300;
    buildQuery(0, size - 1).then(({ data }) => {
      if (!active) return;
      const rows = (data ?? []).map(mapRow);
      setListings(rows);
      setHasMore(pageSize != null && rows.length === size);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, onlyNormal]);

  const loadMore = async () => {
    if (!pageSize || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const from = nextPage * pageSize;
    const to = from + pageSize - 1;
    const { data } = await buildQuery(from, to);
    const rows = (data ?? []).map(mapRow);
    pageRef.current = nextPage;
    setListings((prev) => [...prev, ...rows]);
    setHasMore(rows.length === pageSize);
    setLoadingMore(false);
  };

  return { listings, loading, loadMore, loadingMore, hasMore };
}

