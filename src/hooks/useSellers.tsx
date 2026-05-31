import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Seller } from "@/data/marketplace";

async function fetchSellers(): Promise<Seller[]> {
  const { data, error } = await supabase
    .from("sellers")
    .select("id, name, phone, verified, rating, reviews_count, deals_count, city, member_since");
  if (error) throw error;
  return (data ?? []) as Seller[];
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
    .select("id, name, phone, verified, rating, reviews_count, deals_count, city, member_since")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Seller) ?? null;
}

export function useSeller(id: string | undefined) {
  return useQuery({
    queryKey: ["seller", id],
    queryFn: () => fetchSeller(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
