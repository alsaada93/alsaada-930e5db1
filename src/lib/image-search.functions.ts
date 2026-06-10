import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI visual search (AliExpress / Alibaba style): the client sends a photo as a
 * data URL, an AI vision model identifies the item and returns a short search
 * keyword we then use to find similar listings.
 *
 * Restricted to authenticated users to prevent anonymous abuse of the paid
 * AI vision API (cost abuse via repeated large image uploads).
 */
export const searchByImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      imageDataUrl: z
        .string()
        .min(1)
        .max(8_000_000)
        .regex(/^data:image\/[a-zA-Z+]+;base64,/, "invalid image data"),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

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
              "أنت محرك بحث بالصور لسوق معدات المطاعم والأثاث والإلكترونيات. حلّل الصورة وأعطِ كلمات بحث قصيرة جداً (من 2 إلى 4 كلمات) بالعربية تصف المنتج الرئيسي فقط، بدون أي شرح أو علامات ترقيم. مثال: 'فرن بيتزا ستانلس'.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "ما هو هذا المنتج؟ أعطني كلمات البحث فقط." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const query = raw.replace(/["'\n.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    return { query };
  });
