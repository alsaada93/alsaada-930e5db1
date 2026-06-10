import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({
  lang: z.enum(["ar", "en"]),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        title: z.string().max(400).optional().default(""),
        description: z.string().max(8000).optional().default(""),
      }),
    )
    .min(1)
    .max(40),
});

type TranslationMap = Record<string, { title: string; description: string }>;

/**
 * Translates listing title/description into the target language.
 * Results are cached in `listing_translations` so each listing is only
 * translated once per language.
 */
export const translateListings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<TranslationMap> => {
    const { lang, items } = data;
    const ids = items.map((i) => i.id);

    // 1) read cache
    const { data: cached } = await supabaseAdmin
      .from("listing_translations")
      .select("listing_id,title,description")
      .eq("lang", lang)
      .in("listing_id", ids);

    const result: TranslationMap = {};
    const cachedIds = new Set<string>();
    for (const row of cached ?? []) {
      cachedIds.add(row.listing_id as string);
      result[row.listing_id as string] = {
        title: (row.title as string) ?? "",
        description: (row.description as string) ?? "",
      };
    }

    const missingInput = items.filter((i) => !cachedIds.has(i.id));
    if (missingInput.length === 0) return result;

    // Never trust client-supplied title/description: fetch the authentic
    // source text from the listings table so attackers cannot poison the
    // publicly-readable translation cache with fabricated content.
    const missingIds = missingInput.map((i) => i.id);
    const { data: sourceRows } = await supabaseAdmin
      .from("listings")
      .select("id,title,description")
      .in("id", missingIds);

    const sourceMap = new Map<string, { title: string; description: string }>();
    for (const row of sourceRows ?? []) {
      sourceMap.set(row.id as string, {
        title: (row.title as string) ?? "",
        description: (row.description as string) ?? "",
      });
    }

    // Only translate listings that actually exist in the database.
    const missing = missingInput
      .filter((i) => sourceMap.has(i.id))
      .map((i) => ({
        id: i.id,
        title: sourceMap.get(i.id)!.title,
        description: sourceMap.get(i.id)!.description,
      }));
    if (missing.length === 0) return result;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      // No AI available — return originals untouched.
      for (const m of missing) result[m.id] = { title: m.title, description: m.description };
      return result;
    }

    const targetName = lang === "ar" ? "Arabic" : "English";
    const payload = missing.map((m) => ({ id: m.id, title: m.title, description: m.description }));

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                `You are a professional marketplace translator. Translate the "title" and "description" fields of each item into ${targetName}. ` +
                `If a field is already in ${targetName}, return it unchanged. Keep numbers, prices and proper nouns intact. ` +
                `Return ONLY valid JSON with the shape {"items":[{"id":"...","title":"...","description":"..."}]} and nothing else.`,
            },
            { role: "user", content: JSON.stringify({ items: payload }) },
          ],
        }),
      });

      if (!res.ok) {
        for (const m of missing) result[m.id] = { title: m.title, description: m.description };
        return result;
      }

      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        items: { id: string; title?: string; description?: string }[];
      };

      const toCache: { listing_id: string; lang: string; title: string; description: string }[] = [];
      for (const m of missing) {
        const found = parsed.items?.find((x) => x.id === m.id);
        const title = found?.title ?? m.title;
        const description = found?.description ?? m.description;
        result[m.id] = { title, description };
        toCache.push({ listing_id: m.id, lang, title, description });
      }

      if (toCache.length) {
        await supabaseAdmin.from("listing_translations").upsert(toCache, {
          onConflict: "listing_id,lang",
        });
      }
    } catch {
      for (const m of missing) result[m.id] = { title: m.title, description: m.description };
    }

    return result;
  });
