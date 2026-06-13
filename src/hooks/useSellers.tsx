import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Seller } from "@/data/marketplace";

const SELLER_COLUMNS = "id, name, verified, rating, reviews_count, deals_count, city, member_since";

async function fetchSellers(): Promise<Seller[]> {
  const { data, error } = await supabase.from("sellers").select(SELLER_COLUMNS);
  if (error) throw error;
  return (data ?? []) as unknown as Seller[];
}

/** Fetch all sellers and expose a lookup map by id. */
export function useSellers() {
  const query = useQuery({
    queryKey: ["sellers"],
    queryFn: fetchSellers,
    staleTime: 1000 * 60 * 5,
  });

  const byId = new Map<string, Seller>();
  for (const s of query.data ?? []) byId.set(s.id, s);

  return { ...query, sellers: query.data ?? [], byId };
}

async function fetchSeller(id: string): Promise<Seller | null> {
  const { data, error } = await supabase
    .from("sellers")
    .select(SELLER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Seller) ?? null;
}

export function useSeller(id: string | undefined) {
  return useQuery({
    queryKey: ["seller", id],
    queryFn: () => fetchSeller(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/** رقم هاتف البائع — متاح للمسجّلين الداخلين فقط (جدول محمي). */
export function useSellerPhone(id: string | undefined) {
  return useQuery({
    queryKey: ["seller-phone", id],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await (supabase as any)
        .from("seller_contacts")
        .select("phone")
        .eq("seller_id", id as string)
        .maybeSingle();
      if (error) return null;
      return data?.phone ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
