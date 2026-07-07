import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Slider } from "@/components/ui/slider";
import {
  useCardConfig,
  DEFAULT_CARD_CONFIG,
  type CardConfig,
} from "@/hooks/useCardConfig";

export const Route = createFileRoute("/admin/card")({
  component: CardConfigPage,
});

const ASPECTS: { value: CardConfig["imageAspect"]; label: string }[] = [
  { value: "1/1", label: "مربع (1:1)" },
  { value: "4/3", label: "عرضي (4:3)" },
  { value: "3/4", label: "طولي (3:4)" },
  { value: "16/9", label: "عريض (16:9)" },
  { value: "custom", label: "قياس مخصص" },
];

const FITS: { value: CardConfig["imageFit"]; label: string }[] = [
  { value: "contain", label: "احتواء كامل (بدون قص)" },
  { value: "cover", label: "ملء المربع (مع قص)" },
];

const BGS: { value: CardConfig["imageBg"]; label: string }[] = [
  { value: "white", label: "أبيض" },
  { value: "background", label: "لون الخلفية" },
  { value: "muted", label: "رمادي فاتح" },
];

const SIZES: { value: CardConfig["buttonSize"]; label: string }[] = [
  { value: "sm", label: "صغير" },
  { value: "md", label: "متوسط" },
  { value: "lg", label: "كبير" },
];

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
            value === o.value
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-background hover:border-primary/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CardConfigPage() {
  const { config, save } = useCardConfig();
  const [draft, setDraft] = useState<CardConfig>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(config), [config]);

  const set = <K extends keyof CardConfig>(key: K, value: CardConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ شكل الإعلان بنجاح");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="شكل بطاقة الإعلان"
        subtitle="تحكّم كامل بقياس الصور والأزرار وما يظهر داخل بطاقة الإعلان في جميع الصفحات"
      />
      <div className="space-y-6 p-6">
        {/* الصورة */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">قياس وعرض الصورة</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="block text-sm font-semibold">قياس مربع الصورة</span>
              <Segmented value={draft.imageAspect} options={ASPECTS} onChange={(v) => set("imageAspect", v)} />
            </div>

            {draft.imageAspect === "custom" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>ارتفاع الصورة</span>
                  <span className="text-primary">{draft.imageHeightPx}px</span>
                </div>
                <Slider min={100} max={400} step={5} value={[draft.imageHeightPx]} onValueChange={(v) => set("imageHeightPx", v[0])} />
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-sm font-semibold">طريقة عرض الصورة</span>
              <Segmented value={draft.imageFit} options={FITS} onChange={(v) => set("imageFit", v)} />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-semibold">خلفية مربع الصورة</span>
              <Segmented value={draft.imageBg} options={BGS} onChange={(v) => set("imageBg", v)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>استدارة زوايا البطاقة</span>
                <span className="text-primary">{draft.cardRadius}px</span>
              </div>
              <Slider min={0} max={32} step={1} value={[draft.cardRadius]} onValueChange={(v) => set("cardRadius", v[0])} />
            </div>
          </div>
        </div>

        {/* العناصر الظاهرة */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">ماذا يظهر داخل البطاقة</h3>
          <div className="flex flex-wrap gap-2">
            <Toggle label="العنوان" checked={draft.showTitle} onChange={(v) => set("showTitle", v)} />
            <Toggle label="السعر" checked={draft.showPrice} onChange={(v) => set("showPrice", v)} />
            <Toggle label="التقييم" checked={draft.showRating} onChange={(v) => set("showRating", v)} />
            <Toggle label="الموقع" checked={draft.showLocation} onChange={(v) => set("showLocation", v)} />
            <Toggle label="المشاهدات" checked={draft.showViews} onChange={(v) => set("showViews", v)} />
            <Toggle label="شارة الحالة" checked={draft.showCondition} onChange={(v) => set("showCondition", v)} />
            <Toggle label="شعار الماركة" checked={draft.showBrandLogo} onChange={(v) => set("showBrandLogo", v)} />
            <Toggle label="علامة حراج السعادة" checked={draft.showWatermark} onChange={(v) => set("showWatermark", v)} />
          </div>
        </div>

        {/* الأزرار */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">أزرار التواصل</h3>
          <div className="space-y-4">
            <Toggle label="إظهار أزرار التواصل" checked={draft.showContact} onChange={(v) => set("showContact", v)} />
            <div className="flex flex-wrap gap-2">
              <Toggle label="واتساب" checked={draft.showWhatsapp} onChange={(v) => set("showWhatsapp", v)} />
              <Toggle label="اتصال" checked={draft.showCall} onChange={(v) => set("showCall", v)} />
              <Toggle label="دردشة" checked={draft.showChat} onChange={(v) => set("showChat", v)} />
            </div>
            <div className="space-y-2">
              <span className="block text-sm font-semibold">حجم الأزرار</span>
              <Segmented value={draft.buttonSize} options={SIZES} onChange={(v) => set("buttonSize", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>استدارة زوايا الأزرار</span>
                <span className="text-primary">{draft.buttonRadius}px</span>
              </div>
              <Slider min={0} max={24} step={1} value={[draft.buttonRadius]} onValueChange={(v) => set("buttonRadius", v[0])} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ شكل الإعلان
          </button>
          <button
            onClick={() => setDraft(DEFAULT_CARD_CONFIG)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
}
