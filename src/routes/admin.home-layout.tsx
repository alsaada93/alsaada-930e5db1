import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_LAYOUT_KEY,
  mergeHomeLayout,
  type HomeLayout,
} from "@/hooks/useHomeLayout";

export const Route = createFileRoute("/admin/home-layout")({
  component: HomeLayoutAdminPage,
});

const SECTION_TOGGLES: { key: keyof HomeLayout; label: string }[] = [
  { key: "showPromo", label: "شريط العروض المتحرك" },
  { key: "showCategories", label: "شبكة التصنيفات" },
  { key: "showWeBuy", label: "بانر (نشتري معداتكم)" },
  { key: "showRestaurantRow", label: "صف مطاعم وكافيهات" },
  { key: "showLatestRow", label: "صف أحدث الإعلانات" },
  { key: "showFeatured", label: "الإعلانات المميزة" },
  { key: "showTestimonials", label: "آراء العملاء" },
  { key: "showBusiness", label: "قسم الأعمال" },
];

function HomeLayoutAdminPage() {
  const [draft, setDraft] = useState<HomeLayout>(DEFAULT_HOME_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", HOME_LAYOUT_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setDraft(mergeHomeLayout(data?.value as Partial<HomeLayout> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof HomeLayout>(key: K, value: HomeLayout[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ key: HOME_LAYOUT_KEY, value: draft as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("تم حفظ إعدادات الصفحة الرئيسية");
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="تخطيط الصفحة الرئيسية" />
        <div className="flex flex-1 items-center justify-center p-10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="تخطيط الصفحة الرئيسية" subtitle="تحكّم كامل بأقسام الصفحة الرئيسية وأعداد الإعلانات وأحجامها" />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* أعداد الإعلانات */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">أعداد الإعلانات في الصفوف</h2>
          <div className="space-y-5">
            <NumberField
              label="عدد إعلانات صف المطاعم"
              value={draft.restaurantCount}
              min={3}
              max={30}
              onChange={(v) => set("restaurantCount", v)}
            />
            <NumberField
              label="عدد إعلانات أحدث الإعلانات (وكل ضغطة على المزيد)"
              value={draft.latestCount}
              min={3}
              max={30}
              onChange={(v) => set("latestCount", v)}
            />
            <NumberField
              label="عرض البطاقة على الجوال (% من عرض الشاشة)"
              value={draft.cardWidthPct}
              min={40}
              max={100}
              step={2}
              onChange={(v) => set("cardWidthPct", v)}
            />
          </div>
        </section>

        {/* إظهار/إخفاء الأقسام */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">إظهار/إخفاء أقسام الصفحة</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTION_TOGGLES.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(draft[key])}
                  onChange={(e) => set(key, e.target.checked as HomeLayout[typeof key])}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </section>

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </button>
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_HOME_LAYOUT)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            استعادة الافتراضي
          </button>
        </div>
      </div>
    </>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
