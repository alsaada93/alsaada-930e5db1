import { supabase } from "@/integrations/supabase/client";

/**
 * Records that someone attempted to contact the listing owner (call/WhatsApp).
 * Silently no-ops for guest listings (no owner to notify).
 */
export async function logContactAttempt(opts: {
  recipientId?: string | null;
  listingId: string;
  method: "call" | "whatsapp";
  listingTitle?: string;
}) {
  if (!opts.recipientId) return;
  try {
    const { data } = await supabase.auth.getUser();
    const me = data.user;
    // Don't notify yourself.
    if (me && me.id === opts.recipientId) return;
    const methodAr = opts.method === "call" ? "الاتصال الهاتفي" : "واتساب";
    await (supabase as any).from("notifications").insert({
      recipient_id: opts.recipientId,
      listing_id: opts.listingId,
      type: "contact",
      message: `حاول أحد المهتمين التواصل معك عبر ${methodAr}${
        opts.listingTitle ? ` بخصوص إعلان "${opts.listingTitle}"` : ""
      }.`,
      sender_name: me?.email ?? null,
    });
  } catch {
    /* ignore */
  }
}
