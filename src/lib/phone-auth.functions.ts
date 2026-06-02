import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  normalizePhone,
  sendWhatsappOtp,
  verifyOtpAndSignIn,
} from "./phone-auth.server";

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ phone: z.string().min(6).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const phoneE164 = normalizePhone(data.phone);
    if (phoneE164.length < 8 || phoneE164.length > 15) {
      throw new Error("رقم الهاتف غير صحيح.");
    }
    await sendWhatsappOtp(phoneE164);
    return { ok: true };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().min(6).max(20),
        code: z.string().regex(/^\d{6}$/, "الرمز يجب أن يكون 6 أرقام"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const phoneE164 = normalizePhone(data.phone);
    const creds = await verifyOtpAndSignIn(phoneE164, data.code);
    return creds;
  });
