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

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapPost(d: any): BlogPost {
  return {
    id: String(d.id),
    slug: String(d.slug ?? ""),
    title: String(d.title ?? ""),
    excerpt: d.excerpt ?? null,
    content: String(d.content ?? ""),
    cover_image: d.cover_image ?? null,
    category: d.category ?? null,
    meta_title: d.meta_title ?? null,
    meta_description: d.meta_description ?? null,
    keywords: d.keywords ?? null,
    published: Boolean(d.published),
    published_at: d.published_at ?? null,
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

/** Public: list all published blog posts (newest first). */
export const listPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPost[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(2000);
    return (data ?? []).map(mapPost);
  },
);

/** Public: fetch a single published post by slug. */
export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }): Promise<BlogPost | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return row ? mapPost(row) : null;
  });

/** Admin: list every post regardless of status. */
export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlogPost[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    return (data ?? []).map(mapPost);
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9\u0600-\u06FF-]+$/i, "رابط غير صالح"),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
  cover_image: z.string().max(2000).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  meta_title: z.string().max(300).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  keywords: z.string().max(500).optional().nullable(),
  published: z.boolean(),
});

/** Admin: create or update a post. */
export const adminUpsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      content: data.content ?? "",
      cover_image: data.cover_image ?? null,
      category: data.category ?? null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      keywords: data.keywords ?? null,
      published: data.published,
    };
    if (data.published) patch.published_at = new Date().toISOString();

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("blog_posts")
        .update(patch as never)
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("blog_posts")
      .insert(patch as never)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (inserted as any).id };
  });

/** Admin: delete a post. */
export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ───────────────────────── AI bulk article generator ─────────────────────────

/** Topics the marketplace blog covers (used to seed unique SEO articles). */
const BLOG_TOPICS = [
  "سيارات للبيع في البحرين",
  "سيارات مستعملة في البحرين",
  "عقارات وشقق للبيع والإيجار في البحرين",
  "أثاث مستعمل وأثاث مكتبي في البحرين",
  "الأجهزة المنزلية في البحرين",
  "إلكترونيات وأجهزة في البحرين",
  "هواتف ذكية وموبايلات في البحرين",
  "وظائف وفرص عمل في البحرين",
  "خدمات ومهنيون في البحرين",
  "البيع والشراء أونلاين في البحرين",
  "Cars for sale in Bahrain",
  "Used cars buying guide in Bahrain",
  "Real estate apartments for sale and rent in Bahrain",
  "Used and office furniture in Bahrain",
  "Home appliances in Bahrain",
  "Electronics and gadgets in Bahrain",
  "Mobile phones marketplace in Bahrain",
  "Jobs and careers in Bahrain",
  "Services and professionals in Bahrain",
  "Buying and selling online in Bahrain",
];

function slugifyBlog(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 110);
}

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  lang: "ar" | "en";
}

/** Calls Lovable AI to generate a batch of unique SEO articles. */
async function generateArticleBatch(count: number, seed: string): Promise<GeneratedArticle[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const topics = [...BLOG_TOPICS].sort(() => Math.random() - 0.5).slice(0, count);
  const prompt = `You are a world-class SEO writer for "Al-Saada", a marketplace in Bahrain (alsaada.sale).
Write ${count} COMPLETELY UNIQUE, human-like SEO blog articles. Batch id: ${seed}.
Each article uses ONE of these angles (one article per angle): ${topics.join(" | ")}.
Mix Arabic and English: write Arabic articles in Arabic and English articles in English (match the angle's language).
Each article must:
- have a unique, natural, keyword-rich title (no keyword stuffing)
- be 500-800 words of genuinely useful, non-duplicated markdown content with ## subheadings and a short FAQ section
- focus on buying/selling in Bahrain (cities like Manama, Muharraq, Riffa, Hamad Town)
- include practical tips, never fabricated facts
Return STRICT JSON: {"articles":[{"title","excerpt","content","category","meta_title","meta_description","keywords","lang"}]}.
- excerpt: 1 sentence. meta_title <= 60 chars. meta_description <= 155 chars. keywords: comma-separated. lang: "ar" or "en". category: one short label.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("credits_exhausted");
    throw new Error(`ai_error_${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { articles?: GeneratedArticle[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { articles: [] };
  }
  return Array.isArray(parsed.articles) ? parsed.articles : [];
}

/**
 * Admin: generate a batch of unique SEO blog articles with AI and save them as
 * published posts. Called repeatedly by the dashboard to reach 100 articles
 * without timing out. Skips any article whose slug already exists (no duplicates).
 */
export const adminGenerateArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ count: z.number().int().min(1).max(8), seed: z.string().max(40).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const articles = await generateArticleBatch(data.count, data.seed ?? String(Date.now()));
    let created = 0;
    let skipped = 0;

    for (const a of articles) {
      const title = (a.title ?? "").trim();
      if (!title || !(a.content ?? "").trim()) {
        skipped += 1;
        continue;
      }
      let slug = slugifyBlog(title) || `post-${Date.now()}`;
      // ensure uniqueness
      const { data: clash } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (clash?.id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

      const { error } = await supabaseAdmin.from("blog_posts").insert({
        slug,
        title,
        excerpt: (a.excerpt ?? "").slice(0, 480) || null,
        content: a.content ?? "",
        category: (a.category ?? "").slice(0, 110) || null,
        meta_title: (a.meta_title ?? title).slice(0, 290) || null,
        meta_description: (a.meta_description ?? "").slice(0, 480) || null,
        keywords: (a.keywords ?? "").slice(0, 480) || null,
        published: true,
        published_at: new Date().toISOString(),
      } as never);
      if (error) skipped += 1;
      else created += 1;
    }

    return { created, skipped, requested: data.count };
  });
