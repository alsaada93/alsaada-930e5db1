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

/** رقم هاتف البائع — يُجلب عبر دالة آمنة تُرجع رقم بائع واحد فقط (لا يمكن سحب كل الأرقام). */
export function useSellerPhone(id: string | undefined) {
  return useQuery({
    queryKey: ["seller-phone", id],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await (supabase as any).rpc("get_seller_phone", {
        _seller_id: id as string,
      });
      if (error) return null;
      return (data as string | null) ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
