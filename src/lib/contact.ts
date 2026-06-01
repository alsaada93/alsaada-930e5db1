import { supabase } from "@/integrations/supabase/client";

/** رقم التواصل الافتراضي بصيغة دولية كاملة (973 + الرقم المحلي). */
export const DEFAULT_CONTACT_PHONE = "97333982383";
/** مفتاح خط البحرين الدولي للاتصال. */
export const BH_DIAL_PREFIX = "00973";

/**
 * يحوّل أي رقم إلى صيغة دولية موحّدة بدون رموز (مثل 97333982383)
 * مناسبة لروابط واتساب (wa.me).
 */
export function normalizePhone(raw?: string | null): string {
  const digits = (raw ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (!digits) return DEFAULT_CONTACT_PHONE;
  if (digits.startsWith("973")) return digits;
  // رقم محلي بحريني (8 خانات) — نضيف مفتاح الدولة
  if (digits.length === 8) return `973${digits}`;
  return digits;
}

/** رابط اتصال هاتفي مع مفتاح الخط 00973. */
export function telLink(raw?: string | null): string {
  const intl = normalizePhone(raw); // 97333982383
  const local = intl.startsWith("973") ? intl.slice(3) : intl;
  return `tel:00973${local}`;
}

/** رابط واتساب يتضمن رسالة الاهتمام ورابط الإعلان. */
export function whatsappLink(opts: {
  phone?: string | null;
  listingTitle: string;
  listingId: string;
}): string {
  const intl = normalizePhone(opts.phone);
  const url = `https://alsaada.lovable.app/listing/${opts.listingId}`;
  const text = `مرحباً، أنا مهتم بإعلان "${opts.listingTitle}" المعروض على حراج السعادة.\n${url}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

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
