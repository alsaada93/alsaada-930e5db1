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
      .limit(1000);
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
