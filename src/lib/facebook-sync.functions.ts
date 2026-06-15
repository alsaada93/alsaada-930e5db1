import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Throws unless the caller is an admin. Returns nothing. */
async function assertAdmin(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      eq: (a: string, b: string) => {
        eq: (a: string, b: string) => { maybeSingle: () => Promise<{ data: unknown }> };
      };
    };
  };
}, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export interface FbDashboard {
  totalAds: number;
  activeAds: number;
  deletedAds: number;
  failedImports: number;
  lastSyncAt: string | null;
  apiStatus: string;
  webhookSecret: string;
  recentLogs: {
    id: string;
    event: string;
    fb_post_id: string | null;
    status: string;
    message: string | null;
    created_at: string;
  }[];
}

/** Loads everything the Facebook Sync dashboard needs. */
export const getFbDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FbDashboard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [total, active, deleted, failed, meta, logs] = await Promise.all([
      supabaseAdmin.from("facebook_ads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("facebook_ads").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("facebook_ads").select("id", { count: "exact", head: true }).eq("status", "deleted"),
      supabaseAdmin.from("facebook_sync_logs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabaseAdmin.from("facebook_sync_meta").select("last_sync_at, api_status, webhook_secret").eq("id", 1).maybeSingle(),
      supabaseAdmin
        .from("facebook_sync_logs")
        .select("id, event, fb_post_id, status, message, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      totalAds: total.count ?? 0,
      activeAds: active.count ?? 0,
      deletedAds: deleted.count ?? 0,
      failedImports: failed.count ?? 0,
      lastSyncAt: (meta.data?.last_sync_at as string | null) ?? null,
      apiStatus: (meta.data?.api_status as string | null) ?? "idle",
      webhookSecret: (meta.data?.webhook_secret as string | null) ?? "",
      recentLogs: (logs.data ?? []) as FbDashboard["recentLogs"],
    };
  });

/** Manually import a pasted Facebook post (instant publish). */
export const manualImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        post_id: z.string().max(200).optional(),
        text: z.string().min(1).max(20000),
        images: z.array(z.string().url().max(2000)).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { ingestPost } = await import("@/lib/facebook-sync.server");
    const postId = data.post_id?.trim() || `manual-${Date.now()}`;
    return ingestPost({
      post_id: postId,
      text: data.text,
      images: data.images ?? [],
      created_time: new Date().toISOString(),
    });
  });

/** Hide (delete) or restore an imported ad. */
export const setAdStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "deleted"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("facebook_ads")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Generates a fresh webhook secret. */
export const regenerateSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret =
      crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabaseAdmin
      .from("facebook_sync_meta")
      .update({ webhook_secret: secret })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { secret };
  });
