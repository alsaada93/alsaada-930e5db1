import { createHmac, randomInt, randomBytes, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 5;

function hashCode(phone: string, code: string): string {
  const secret = process.env.OTP_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("OTP hashing secret is not configured (OTP_HMAC_SECRET / SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Normalize any phone input to E.164 digits (no leading +). */
export function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  // strip international prefix 00
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

export async function sendWhatsappOtp(phoneE164: string): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  const twilioKey = process.env.TWILIO_API_KEY;
  if (!twilioKey) throw new Error("TWILIO_API_KEY is not configured");
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error("TWILIO_WHATSAPP_FROM is not configured");

  // Rate limit: count requests in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("phone_otps")
    .select("id", { count: "exact", head: true })
    .eq("phone", phoneE164)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    throw new Error("تم تجاوز عدد المحاولات المسموح بها. حاول لاحقاً.");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expires_at = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: insertErr } = await supabaseAdmin.from("phone_otps").insert({
    phone: phoneE164,
    code_hash: hashCode(phoneE164, code),
    expires_at,
  });
  if (insertErr) throw new Error(insertErr.message);

  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:+${normalizePhone(from)}`;
  const toAddr = `whatsapp:+${phoneE164}`;
  const body = `رمز التحقق الخاص بك في حراج السعادة هو: ${code}\nصالح لمدة 5 دقائق.`;

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: toAddr, From: fromAddr, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Twilio send error:", res.status, text);
    throw new Error("تعذّر إرسال رمز التحقق عبر واتساب. تأكد من الرقم وحاول مجدداً.");
  }
}

export async function verifyOtpAndSignIn(
  phoneE164: string,
  code: string,
): Promise<{ email: string; password: string }> {
  // Find the most recent unconsumed, unexpired OTP for this phone
  const { data: rows, error } = await supabaseAdmin
    .from("phone_otps")
    .select("*")
    .eq("phone", phoneE164)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const otp = rows?.[0];
  if (!otp) throw new Error("لا يوجد رمز تحقق فعّال. أعد إرسال الرمز.");

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    throw new Error("انتهت صلاحية الرمز. أعد إرسال رمز جديد.");
  }
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new Error("تم تجاوز عدد محاولات التحقق. أعد إرسال رمز جديد.");
  }

  const expected = hashCode(phoneE164, code);
  const ok = safeEqualHex(expected, otp.code_hash);

  if (!ok) {
    await supabaseAdmin
      .from("phone_otps")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    throw new Error("الرمز غير صحيح.");
  }

  await supabaseAdmin.from("phone_otps").update({ consumed: true }).eq("id", otp.id);

  // Shadow email account keyed by the phone number (provider-independent sign-in)
  const email = `wa${phoneE164}@phone.alsaada.sale`;
  const password = randomBytes(24).toString("base64url");

  // Look up an existing account via the service-role-only phone_accounts map.
  // SECURITY: never trust the user-editable profiles.phone field for auth routing,
  // otherwise an attacker could squat a victim's number and hijack their sign-in.
  const { data: mapping } = await supabaseAdmin
    .from("phone_accounts")
    .select("user_id")
    .eq("phone", phoneE164)
    .maybeSingle();

  let userId = mapping?.user_id as string | undefined;

  if (userId) {
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });
    if (updErr) throw new Error(updErr.message);
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone: phoneE164, full_name: `+${phoneE164}` },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message || "تعذّر إنشاء الحساب.");
    }
    userId = created.user.id;

    // Record the verified phone -> account mapping (service-role only).
    await supabaseAdmin
      .from("phone_accounts")
      .upsert({ phone: phoneE164, user_id: userId }, { onConflict: "phone" });
  }

  // Ensure profile holds the verified phone/whatsapp
  await supabaseAdmin
    .from("profiles")
    .update({ phone: phoneE164, whatsapp: phoneE164, verified: true })
    .eq("id", userId);

  return { email, password };
}
