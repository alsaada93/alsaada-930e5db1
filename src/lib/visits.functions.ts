import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Parse a coarse browser name from a User-Agent string. */
function parseBrowser(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("samsungbrowser")) return "Samsung Internet";
  if (s.includes("chrome") && !s.includes("chromium")) return "Chrome";
  if (s.includes("firefox")) return "Firefox";
  if (s.includes("safari") && !s.includes("chrome")) return "Safari";
  if (!ua) return "غير معروف";
  return "أخرى";
}

/** Records a single page visit (country from edge header, browser from UA). */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ path: z.string().max(512).optional().default("/") }).parse(input),
  )
  .handler(async ({ data }) => {
    const country =
      getRequestHeader("cf-ipcountry") ??
      getRequestHeader("x-vercel-ip-country") ??
      null;
    const ua = getRequestHeader("user-agent") ?? "";
    const browser = parseBrowser(ua);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_visits").insert({
      country: country && country !== "XX" ? country : null,
      browser,
      path: data.path,
    });
    return { ok: true };
  });

export interface VisitorStats {
  totalVisits: number;
  countries: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
}

/** Returns aggregated visitor analytics for the admin dashboard. */
export const getVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VisitorStats> => {
    const { supabase, userId } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_visits")
      .select("country,browser")
      .limit(50000);

    const rows = data ?? [];
    const countryMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    for (const r of rows) {
      const c = (r.country as string | null) ?? "غير معروف";
      const b = (r.browser as string | null) ?? "غير معروف";
      countryMap[c] = (countryMap[c] ?? 0) + 1;
      browserMap[b] = (browserMap[b] ?? 0) + 1;
    }

    const toSorted = (m: Record<string, number>) =>
      Object.entries(m)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      totalVisits: rows.length,
      countries: toSorted(countryMap),
      browsers: toSorted(browserMap),
    };
  });
