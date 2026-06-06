import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export interface AdminListingRow {
  id: string;
  title: string;
  price: number;
  old_price: number | null;
  category_id: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  image: string | null;
  status: string;
  listing_type: string;
  featured: boolean;
  created_at: string;
}

/** Returns all listings (any status) for the admin management table. */
export const adminListListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminListingRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("listings")
      .select(
        "id,title,price,old_price,category_id,city,contact_name,contact_phone,images,status,listing_type,featured,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    return (data ?? []).map((d: any) => ({
      id: String(d.id),
      title: String(d.title ?? ""),
      price: Number(d.price ?? 0),
      old_price: d.old_price != null ? Number(d.old_price) : null,
      category_id: d.category_id ?? null,
      city: d.city ?? null,
      contact_name: d.contact_name ?? null,
      contact_phone: d.contact_phone ?? null,
      image: (d.images as string[] | null)?.[0] ?? null,
      status: String(d.status ?? "pending"),
      listing_type: String(d.listing_type ?? "normal"),
      featured: Boolean(d.featured),
      created_at: String(d.created_at ?? ""),
    }));
  });

/** Sets a listing status: approved | rejected | suspended | pending. */
export const adminSetListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "suspended", "pending"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Updates editable fields of a listing (title, price, old_price, featured). */
export const adminUpdateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        price: z.number().min(0).max(100000000).optional(),
        old_price: z.number().min(0).max(100000000).nullable().optional(),
        featured: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("listings").update(patch as never).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

/** Permanently deletes a listing. */
export const adminDeleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("listings").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
