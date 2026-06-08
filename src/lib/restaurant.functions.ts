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

/* ===================== Equipment CRUD ===================== */

const equipmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(300),
  manufacturer: z.string().max(200).nullable().optional(),
  country_of_origin: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().max(1000).nullable().optional(),
  category: z.string().max(200).nullable().optional(),
  price_new: z.number().min(0).max(100000000),
  price_used: z.number().min(0).max(100000000),
  project_type_slugs: z.array(z.string().min(1).max(60)).max(20),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(100000),
});

export const adminSaveEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => equipmentSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any)
        .from("restaurant_equipment")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any)
      .from("restaurant_equipment")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("restaurant_equipment")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ===================== Project types CRUD ===================== */

const typeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  icon: z.string().max(60).nullable().optional(),
  sort_order: z.number().int().min(0).max(100000),
  active: z.boolean(),
});

export const adminSaveProjectType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => typeSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any)
        .from("restaurant_project_types")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any)
      .from("restaurant_project_types")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteProjectType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("restaurant_project_types")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ===================== Calculator settings ===================== */

export const adminSaveCalcSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ key: z.enum(["steel_table", "sink"]), value: z.record(z.string(), z.any()) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("restaurant_calc_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });
