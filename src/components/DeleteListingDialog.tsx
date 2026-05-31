import { useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DELETE_REASONS: { key: string; label: string }[] = [
  { key: "sold_here", label: "تم البيع عبر موقعنا (السعادة)" },
  { key: "sold_elsewhere", label: "تم البيع في موقع آخر" },
  { key: "not_sold", label: "لم يتم البيع" },
  { key: "offers_not_serious", label: "العروض غير جادة" },
  { key: "harassed", label: "تعرضت للإزعاج" },
];

interface Props {
  listingId: string;
  listingTitle: string;
  userId: string;
  onClose: () => void;
  onDeleted: (listingId: string) => void;
}

export function DeleteListingDialog({ listingId, listingTitle, userId, onClose, onDeleted }: Props) {
  const [reason, setReason] = useState<string>("");
  const [otherSite, setOtherSite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) {
      toast.error("اختر سبب الحذف");
      return;
    }
    setSubmitting(true);
    // record the reason for site statistics (best-effort)
    await supabase.from("listing_deletions").insert({
      listing_id: listingId,
      user_id: userId,
      reason,
      other_site: reason === "sold_elsewhere" && otherSite.trim() ? otherSite.trim() : null,
      listing_title: listingTitle,
    });

    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    setSubmitting(false);
    if (error) {
      toast.error("تعذّر حذف الإعلان");
      return;
    }
    toast.success("تم حذف الإعلان");
    onDeleted(listingId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-destructive">
            <Trash2 className="h-5 w-5" /> حذف الإعلان
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">لماذا تريد حذف هذا الإعلان؟</p>

        <div className="mt-4 space-y-2">
          {DELETE_REASONS.map((r) => (
            <label
              key={r.key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${
                reason === r.key ? "border-primary bg-accent/40" : "border-border hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="delete-reason"
                value={r.key}
                checked={reason === r.key}
                onChange={() => setReason(r.key)}
                className="h-4 w-4 accent-primary"
              />
              {r.label}
            </label>
          ))}
        </div>

        {reason === "sold_elsewhere" && (
          <div className="mt-3 space-y-1">
            <label className="block text-sm font-semibold">اسم الموقع الآخر (اختياري)</label>
            <input
              value={otherSite}
              onChange={(e) => setOtherSite(e.target.value)}
              placeholder="مثال: أوليكس، انستقرام..."
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border bg-background py-2.5 font-bold hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-destructive py-2.5 font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  );
}
