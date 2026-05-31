import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  useTheme,
  COLOR_FIELDS,
  FONT_OPTIONS,
  DEFAULT_THEME,
  type ThemeSettings,
} from "@/hooks/useTheme";

export const Route = createFileRoute("/admin/appearance")({
  component: AppearancePage,
});

function AppearancePage() {
  const { theme, preview, save } = useTheme();
  const [draft, setDraft] = useState<ThemeSettings>(theme);
  const [saving, setSaving] = useState(false);

  const setColor = (key: string, value: string) => {
    const next = { ...draft, colors: { ...draft.colors, [key]: value } };
    setDraft(next);
    preview(next);
  };

  const setFont = (font: string) => {
    const next = { ...draft, font };
    setDraft(next);
    preview(next);
  };

  const reset = () => {
    setDraft(DEFAULT_THEME);
    preview(DEFAULT_THEME);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ مظهر الموقع بنجاح");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader title="مظهر الموقع" subtitle="تحكّم كامل بألوان وخطوط الموقع" />
      <div className="space-y-6 p-6">
        {/* Colors */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">الألوان</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <input
                  type="color"
                  value={draft.colors[f.key] ?? "#000000"}
                  onChange={(e) => setColor(f.key, e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
                  aria-label={f.ar}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{f.ar}</div>
                  <div className="truncate text-xs text-muted-foreground">{draft.colors[f.key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">الخط</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => setFont(font)}
                style={{ fontFamily: `"${font}", sans-serif` }}
                className={`rounded-xl border p-4 text-center transition-colors ${
                  draft.font === font
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="block text-lg font-extrabold">أبجد هوز</span>
                <span className="mt-1 block text-xs text-muted-foreground">{font}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">معاينة مباشرة</h3>
          <div className="space-y-3">
            <div className="rounded-xl bg-navy p-4 text-navy-foreground">
              <span className="font-extrabold">السعادة ماركت</span> — ترويسة الموقع
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">
                زر أساسي
              </button>
              <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
                وسم ثانوي
              </span>
              <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                لون مميز
              </span>
            </div>
            <p className="text-sm text-foreground">نص توضيحي بلون النص الأساسي للموقع.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
}
