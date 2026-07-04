import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { categories } from "@/data/marketplace";

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
  description: string | null;
  price: number;
  old_price: number | null;
  category_id: string | null;
  group_name: string | null;
  item_name: string | null;
  brand: string | null;
  condition: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  image: string | null;
  images: string[];
  negotiable_flag: boolean;
  delivery_available: boolean;
  status: string;
  listing_type: string;
  featured: boolean;
  created_at: string;
}

export interface AdminDashboardStatsData {
  stats: {
    totalViews: number;
    pending: number;
    users: number;
    listings: number;
    auctions: number;
    businesses: number;
    favorites: number;
    requests: number;
  };
  weekTrend: { day: string; listings: number; views: number }[];
  monthTrend: { month: string; listings: number; views: number }[];
  categoryActivity: { name: string; value: number }[];
}

const WEEK_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function categoryName(id: string | null): string {
  if (!id) return "أخرى";
  return categories.find((c) => c.id === id)?.name ?? id;
}

async function fetchListingsForAdminStats(supabaseAdmin: any): Promise<Array<Record<string, unknown>>> {
  const PAGE = 1000;
  const rows: Array<Record<string, unknown>> = [];
  for (let page = 0; ; page++) {
    const from = page * PAGE;
    const to = from + PAGE - 1;
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("listing_type,status,views,category_id,created_at")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    const batch = (data ?? []) as Array<Record<string, unknown>>;
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

/** Exact admin dashboard aggregates; uses service-role + paged reads so totals never freeze at 1000. */
export const adminGetDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboardStatsData> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [rows, listingsCount, pendingCount, auctionsCount, businessesCount, usersCount, favoritesCount, requestsCount] =
      await Promise.all([
        fetchListingsForAdminStats(supabaseAdmin),
        supabaseAdmin.from("listings").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabaseAdmin.from("listings").select("id", { count: "exact", head: true }).eq("listing_type", "auction"),
        supabaseAdmin.from("listings").select("id", { count: "exact", head: true }).eq("listing_type", "business"),
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("favorites").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("equipment_requests").select("id", { count: "exact", head: true }),
      ]);

    const totalViews = rows.reduce((s, r) => s + (Number(r.views) || 0), 0);
    const now = new Date();

    const weekTrend = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      const dayRows = rows.filter((r) => {
        const c = new Date(String(r.created_at ?? ""));
        return c.toDateString() === d.toDateString();
      });
      return {
        day: WEEK_DAYS[d.getDay()],
        listings: dayRows.length,
        views: dayRows.reduce((s, r) => s + (Number(r.views) || 0), 0),
      };
    });

    const monthTrend = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const monthRows = rows.filter((r) => {
        const c = new Date(String(r.created_at ?? ""));
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      });
      return {
        month: MONTHS[d.getMonth()],
        listings: monthRows.length,
        views: monthRows.reduce((s, r) => s + (Number(r.views) || 0), 0),
      };
    });

    const catMap: Record<string, number> = {};
    rows.forEach((r) => {
      const name = categoryName((r.category_id as string | null) ?? null);
      catMap[name] = (catMap[name] ?? 0) + 1;
    });

    return {
      stats: {
        totalViews,
        pending: pendingCount.count ?? rows.filter((r) => r.status === "pending").length,
        users: usersCount.count ?? 0,
        listings: listingsCount.count ?? rows.length,
        auctions: auctionsCount.count ?? rows.filter((r) => r.listing_type === "auction").length,
        businesses: businessesCount.count ?? rows.filter((r) => r.listing_type === "business").length,
        favorites: favoritesCount.count ?? 0,
        requests: requestsCount.count ?? 0,
      },
      weekTrend,
      monthTrend,
      categoryActivity: Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  });

/** Returns all listings (any status) for the admin management table. */
export const adminListListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminListingRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const PAGE = 1000;
    const data: any[] = [];
    for (let page = 0; ; page++) {
      const from = page * PAGE;
      const to = from + PAGE - 1;
      const { data: batch, error } = await supabaseAdmin
        .from("listings")
        .select(
          "id,title,description,price,old_price,category_id,group_name,item_name,brand,condition,city,contact_name,contact_phone,images,negotiable_flag,delivery_available,status,listing_type,featured,created_at",
        )
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      data.push(...(batch ?? []));
      if ((batch ?? []).length < PAGE) break;
    }

    return (data ?? []).map((d: any) => ({
      id: String(d.id),
      title: String(d.title ?? ""),
      description: d.description ?? null,
      price: Number(d.price ?? 0),
      old_price: d.old_price != null ? Number(d.old_price) : null,
      category_id: d.category_id ?? null,
      group_name: d.group_name ?? null,
      item_name: d.item_name ?? null,
      brand: d.brand ?? null,
      condition: d.condition ?? null,
      city: d.city ?? null,
      contact_name: d.contact_name ?? null,
      contact_phone: d.contact_phone ?? null,
      image: (d.images as string[] | null)?.[0] ?? null,
      images: (d.images as string[] | null) ?? [],
      negotiable_flag: Boolean(d.negotiable_flag),
      delivery_available: Boolean(d.delivery_available),
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
    // عند تغيير العنوان أو الوصف، أبطل ذاكرة الترجمة المخزّنة حتى تظهر القيم الجديدة فوراً
    if ("title" in patch || "description" in patch) {
      await supabaseAdmin.from("listing_translations").delete().eq("listing_id", id);
    }
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

/** Re-runs the deterministic ingestion engine over existing ads (full migration). */
export const adminReprocessListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ onlyBot: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { reprocessAllListings } = await import("@/lib/facebook-sync.server");
    return reprocessAllListings({ onlyBot: data.onlyBot ?? false });
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
        .limit(5000),
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

/* =========================================================================
 * Special offers (العروض الخاصة) — admin-only listings with is_offer = true
 * ========================================================================= */

export interface AdminOfferRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city: string | null;
  image: string | null;
  images: string[];
  featured: boolean;
  sold: boolean;
  status: string;
  created_at: string;
  categoryId: string | null;
  groupName: string | null;
  itemName: string | null;
  brand: string | null;
  condition: string;
  negotiable: boolean;
  contactName: string | null;
  contactPhone: string | null;
}

function mapOfferRow(d: any): AdminOfferRow {
  return {
    id: String(d.id),
    title: String(d.title ?? ""),
    description: d.description ?? null,
    price: Number(d.price ?? 0),
    city: d.city ?? null,
    image: (d.images as string[] | null)?.[0] ?? null,
    images: (d.images as string[] | null) ?? [],
    featured: Boolean(d.featured),
    sold: Boolean(d.sold),
    status: String(d.status ?? "approved"),
    created_at: String(d.created_at ?? ""),
    categoryId: d.category_id ?? null,
    groupName: d.group_name ?? null,
    itemName: d.item_name ?? null,
    brand: d.brand ?? null,
    condition: String(d.condition ?? "مستعمل"),
    negotiable: Boolean(d.negotiable),
    contactName: d.contact_name ?? null,
    contactPhone: d.contact_phone ?? null,
  };
}

const OFFER_COLS =
  "id,title,description,price,city,images,featured,sold,status,created_at,category_id,group_name,item_name,brand,condition,negotiable,contact_name,contact_phone";

/** Lists all special-offer listings for the admin panel. */
export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOfferRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select(OFFER_COLS)
      .eq("is_offer", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapOfferRow);
  });

/** Creates a new special offer (admin only). */
export const adminCreateOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(300),
        description: z.string().max(8000).nullable().optional(),
        price: z.number().min(0).max(100000000).optional(),
        city: z.string().max(120).nullable().optional(),
        images: z.array(z.string().url()).max(30).optional(),
        featured: z.boolean().optional(),
        categoryId: z.string().max(120).nullable().optional(),
        groupName: z.string().max(200).nullable().optional(),
        itemName: z.string().max(200).nullable().optional(),
        brand: z.string().max(200).nullable().optional(),
        condition: z.string().max(60).optional(),
        negotiable: z.boolean().optional(),
        contactName: z.string().max(200).nullable().optional(),
        contactPhone: z.string().max(60).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .insert({
        title: data.title.trim(),
        description: data.description ?? null,
        price: data.price ?? 0,
        city: data.city ?? null,
        images: data.images ?? [],
        featured: data.featured ?? false,
        category_id: data.categoryId ?? null,
        group_name: data.groupName ?? null,
        item_name: data.itemName ?? null,
        brand: data.brand ?? null,
        condition: data.condition ?? "مستعمل",
        negotiable: data.negotiable ?? false,
        contact_name: data.contactName ?? null,
        contact_phone: data.contactPhone ?? null,
        is_offer: true,
        sold: false,
        listing_type: "normal",
        status: "approved",
        user_id: userId,
      } as never)
      .select("id")
      .single();
    if (error) throw error;
    return { id: String((row as any)?.id ?? "") };
  });

/** Updates a special offer: content, price, sold state, pin, visibility. */
export const adminUpdateOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(8000).nullable().optional(),
        price: z.number().min(0).max(100000000).optional(),
        city: z.string().max(120).nullable().optional(),
        images: z.array(z.string().url()).max(30).optional(),
        featured: z.boolean().optional(),
        sold: z.boolean().optional(),
        status: z.enum(["approved", "suspended"]).optional(),
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
    const { error } = await supabaseAdmin
      .from("listings")
      .update(patch as never)
      .eq("id", id)
      .eq("is_offer", true);
    if (error) throw error;
    if ("title" in patch || "description" in patch) {
      await supabaseAdmin.from("listing_translations").delete().eq("listing_id", id);
    }
    return { ok: true };
  });

/** Permanently deletes a special offer. */
export const adminDeleteOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("id", data.id)
      .eq("is_offer", true);
    if (error) throw error;
    return { ok: true };
  });
