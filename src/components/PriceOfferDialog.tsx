import { useState } from "react";
import { X, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

export function PriceOfferDialog({
  listingId,
  recipientId,
  listingTitle,
  currentPrice,
  onClose,
}: {
  listingId: string;
  recipientId?: string | null;
  listingTitle: string;
  currentPrice: number;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error(ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
      return;
    }
    if (!recipientId) {
      toast.error(ar ? "لا يمكن إرسال عرض لهذا الإعلان" : "Cannot send an offer for this listing");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const senderId = auth.user?.id ?? null;
      const db = supabase as any;
      const { error } = await db.from("price_offers").insert({
        listing_id: listingId,
        recipient_id: recipientId,
        sender_id: senderId,
        amount: value,
        message: message.trim() || null,
        sender_name: name.trim() || auth.user?.email || null,
        sender_phone: phone.trim() || null,
      });
      if (error) throw error;
      await db.from("notifications").insert({
        recipient_id: recipientId,
        listing_id: listingId,
        type: "offer",
        message: `عرض سعر جديد بقيمة ${value.toLocaleString("ar")} د.ب على إعلان "${listingTitle}".${
          message.trim() ? ` ملاحظة: ${message.trim()}` : ""
        }`,
        sender_name: name.trim() || auth.user?.email || null,
        sender_phone: phone.trim() || null,
      });
      toast.success(ar ? "تم إرسال عرض السعر للمعلن" : "Your offer was sent to the seller");
      onClose();
    } catch {
      toast.error(ar ? "تعذّر إرسال العرض" : "Couldn't send the offer");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Tag className="h-5 w-5 text-primary" />
            {ar ? "إرسال عرض سعر" : "Send a price offer"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          {ar ? "السعر المطلوب:" : "Asking price:"}{" "}
          <span className="font-bold text-primary">{currentPrice.toLocaleString("ar")} د.ب</span>
        </p>

        <div className="space-y-3">
          <input
            className={field}
            inputMode="numeric"
            placeholder={ar ? "مبلغ العرض (د.ب)" : "Offer amount (BHD)"}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
          <input
            className={field}
            placeholder={ar ? "اسمك" : "Your name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
          <input
            className={field}
            placeholder={ar ? "رقم هاتفك (اختياري)" : "Your phone (optional)"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
          />
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={ar ? "رسالة للمعلن (اختياري)" : "Message to the seller (optional)"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
          {ar ? "إرسال العرض" : "Send offer"}
        </button>
      </div>
    </div>
  );
}
