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
        reason: z.string().max(500).optional(),
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

    // Notify the listing owner about approval/rejection (with reason)
    if (data.status === "approved" || data.status === "rejected") {
      const { data: listing } = await supabaseAdmin
        .from("listings")
        .select("user_id, title")
        .eq("id", data.id)
        .maybeSingle();
      const ownerId = (listing?.user_id as string | null) ?? null;
      if (ownerId) {
        const title = (listing?.title as string | null) ?? "إعلانك";
        const message =
          data.status === "approved"
            ? `تمت الموافقة على إعلانك "${title}" وأصبح منشوراً.`
            : `تم رفض إعلانك "${title}".${data.reason ? ` السبب: ${data.reason}` : ""}`;
        await supabaseAdmin.from("notifications").insert({
          recipient_id: ownerId,
          listing_id: data.id,
          type: data.status === "approved" ? "approved" : "rejected",
          message,
          sender_name: "إدارة حراج السعادة",
        });
      }
    }
    return { ok: true };
  });

/** Updates editable fields of a listing (full edit, incl. moving categories). */
export const adminUpdateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(8000).nullable().optional(),
        price: z.number().min(0).max(100000000).optional(),
        old_price: z.number().min(0).max(100000000).nullable().optional(),
        featured: z.boolean().optional(),
        condition: z.string().max(40).nullable().optional(),
        city: z.string().max(120).nullable().optional(),
        category_id: z.string().max(120).nullable().optional(),
        group_name: z.string().max(160).nullable().optional(),
        item_name: z.string().max(160).nullable().optional(),
        brand: z.string().max(160).nullable().optional(),
        status: z.enum(["approved", "rejected", "suspended", "pending"]).optional(),
        negotiable_flag: z.boolean().optional(),
        delivery_available: z.boolean().optional(),
        images: z.array(z.string().url()).max(30).optional(),
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

/** Auto re-classifies existing listings into the correct site category. */
export const adminReclassifyListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ onlyUncategorized: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { reclassifyExistingListings } = await import("@/lib/facebook-sync.server");
    return reclassifyExistingListings(Boolean(data.onlyUncategorized));
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

/* =========================================================================
 * Members & permissions management
 * ========================================================================= */

export type AppRole = "admin" | "moderator" | "user";

export interface AdminMemberRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean;
  created_at: string;
  roles: AppRole[];
}

/** Lists every member with their profile data and assigned roles. */
export const adminListMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminMemberRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, authList] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,full_name,phone,verified,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseAdmin.from("user_roles").select("user_id,role").limit(5000),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const roleMap = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id as string) ?? [];
      arr.push(r.role as AppRole);
      roleMap.set(r.user_id as string, arr);
    }
    const emailMap = new Map<string, string>();
    for (const u of authList?.data?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email);
    }

    return (profiles ?? []).map((p: any) => ({
      id: String(p.id),
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      email: emailMap.get(String(p.id)) ?? null,
      verified: Boolean(p.verified),
      created_at: String(p.created_at ?? ""),
      roles: roleMap.get(String(p.id)) ?? [],
    }));
  });

/** Grants or revokes a role for a member. */
export const adminSetMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    // Prevent an admin from removing their own admin role (avoid lock-out).
    if (data.role === "admin" && !data.grant && data.userId === userId) {
      throw new Error("لا يمكنك إزالة صلاحية الأدمن عن نفسك");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw error;
    }
    return { ok: true };
  });

/* =========================================================================
 * Registration / sign-in method toggles (stored in site_settings)
 * ========================================================================= */

const AUTH_METHODS_KEY = "authMethods";

/** Saves which sign-in methods are enabled (email / google / apple / whatsapp). */
export const adminSetAuthMethods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.boolean(),
        google: z.boolean(),
        apple: z.boolean(),
        whatsapp: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: AUTH_METHODS_KEY, value: data as never }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });
