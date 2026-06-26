import { ShieldCheck, X } from "lucide-react";
import { useEffect } from "react";

type Lang = "ar" | "en";

const TIPS: Record<Lang, { title: string; items: string[] }> = {
  ar: {
    title: "سلامتك تهمنا!",
    items: [
      "التقِ فقط في الأماكن العامة / المزدحمة.",
      "لا تذهب بمفردك أبداً لمقابلة المشتري أو البائع، واصطحب معك شخصاً دائماً.",
      "افحص المنتج وتأكد من سلامته جيداً قبل الشراء.",
      "لا تدفع أي مبلغ مقدماً أو تحوّل أموالاً قبل معاينة المنتج وتفحصه.",
    ],
  },
  en: {
    title: "Your Safety Matters To Us!",
    items: [
      "Only meet in public / crowded places.",
      "Never go alone to meet a buyer / seller, always take someone with you.",
      "Check and inspect the product properly before purchasing it.",
      "Never pay anything in advance or transfer money before inspecting the product.",
    ],
  },
};

export function SafetyModal({
  open,
  onClose,
  onContinue,
  continueLabel,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-navy text-navy-foreground shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold">{TIPS.ar.title}</p>
              <p className="text-xs font-semibold text-white/60">{TIPS.en.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* محتوى الإرشادات */}
        <div className="max-h-[55vh] space-y-5 overflow-y-auto px-5 py-4">
          <ul className="space-y-2.5 text-right" dir="rtl">
            {TIPS.ar.items.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-2.5 border-t border-white/10 pt-4 text-left" dir="ltr">
            {TIPS.en.items.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm leading-relaxed text-white/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* أزرار المتابعة */}
        <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {continueLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
          >
            إلغاء / Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
