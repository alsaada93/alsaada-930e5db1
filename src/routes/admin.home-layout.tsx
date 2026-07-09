import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_LAYOUT_KEY,
  mergeHomeLayout,
  type HomeLayout,
  type HomeRow,
} from "@/hooks/useHomeLayout";
import {
  DEFAULT_WEBUY_BANNER,
  WEBUY_BANNER_KEY,
  mergeWeBuyBanner,
  type WeBuyBanner,
} from "@/hooks/useWeBuyBanner";

export const Route = createFileRoute("/admin/home-layout")({
  component: HomeLayoutAdminPage,
});

const SECTION_TOGGLES: { key: keyof HomeLayout; label: string }[] = [
  { key: "showPromo", label: "شريط العروض المتحرك" },
  { key: "showCategories", label: "شبكة التصنيفات" },
  { key: "showWeBuy", label: "بانر (نشتري معداتكم)" },
  { key: "showFeatured", label: "الإعلانات المميزة" },
  { key: "showTestimonials", label: "آراء العملاء" },
  { key: "showBusiness", label: "قسم الأعمال" },
];

function newRow(): HomeRow {
  return {
    id: `row-${Date.now()}`,
    titleAr: "صف جديد",
    titleEn: "New row",
    source: "latest",
    count: 10,
    cardWidthPct: 62,
    visible: true,
  };
}

function HomeLayoutAdminPage() {
  const { categories } = useCategories();
  const [draft, setDraft] = useState<HomeLayout>(DEFAULT_HOME_LAYOUT);
  const [webuy, setWebuy] = useState<WeBuyBanner>(DEFAULT_WEBUY_BANNER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", HOME_LAYOUT_KEY).maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", WEBUY_BANNER_KEY).maybeSingle(),
    ]).then(([layoutRes, webuyRes]) => {
      if (!active) return;
      setDraft(mergeHomeLayout(layoutRes.data?.value as Partial<HomeLayout> | null));
      setWebuy(mergeWeBuyBanner(webuyRes.data?.value as Partial<WeBuyBanner> | null));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof HomeLayout>(key: K, value: HomeLayout[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setRows = (rows: HomeRow[]) => setDraft((d) => ({ ...d, rows }));
  const updateRow = (id: string, patch: Partial<HomeRow>) =>
    setRows(draft.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const moveRow = (index: number, dir: -1 | 1) => {
    const rows = [...draft.rows];
    const to = index + dir;
    if (to < 0 || to >= rows.length) return;
    [rows[index], rows[to]] = [rows[to], rows[index]];
    setRows(rows);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error: e1 } = await supabase
        .from("site_settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ key: HOME_LAYOUT_KEY, value: draft as any }, { onConflict: "key" });
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("site_settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ key: WEBUY_BANNER_KEY, value: webuy as any }, { onConflict: "key" });
      if (e2) throw e2;
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
      <AdminHeader title="تخطيط الصفحة الرئيسية" subtitle="تحكّم كامل بصفوف الإعلانات والأقسام وبانر (نشتري معداتكم)" />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* صفوف الإعلانات الديناميكية */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">صفوف الإعلانات في الصفحة الرئيسية</h2>
            <button
              type="button"
              onClick={() => setRows([...draft.rows, newRow()])}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> إضافة صف
            </button>
          </div>
          <div className="space-y-4">
            {draft.rows.map((row, i) => (
              <div key={row.id} className="rounded-xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-primary">صف #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveRow(i, -1)} className="rounded-lg border border-border p-1.5 hover:bg-accent" aria-label="أعلى">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveRow(i, 1)} className="rounded-lg border border-border p-1.5 hover:bg-accent" aria-label="أسفل">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setRows(draft.rows.filter((r) => r.id !== row.id))} className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="العنوان (عربي)" value={row.titleAr} onChange={(v) => updateRow(row.id, { titleAr: v })} />
                  <TextField label="العنوان (إنجليزي)" value={row.titleEn} onChange={(v) => updateRow(row.id, { titleEn: v })} />
                  <div>
                    <label className="mb-1 block text-sm font-medium">المصدر</label>
                    <select
                      value={row.source}
                      onChange={(e) => updateRow(row.id, { source: e.target.value as HomeRow["source"] })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <option value="latest">أحدث الإعلانات</option>
                      <option value="category">تصنيف محدد</option>
                    </select>
                  </div>
                  {row.source === "category" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium">التصنيف</label>
                      <select
                        value={row.categoryId ?? ""}
                        onChange={(e) => updateRow(row.id, { categoryId: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="">— اختر —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <NumberField label="عدد الإعلانات" value={row.count} min={3} max={30} onChange={(v) => updateRow(row.id, { count: v })} />
                  <NumberField label="عرض البطاقة على الجوال %" value={row.cardWidthPct} min={40} max={100} step={2} onChange={(v) => updateRow(row.id, { cardWidthPct: v })} />
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-sm font-medium">إظهار هذا الصف</span>
                  <input type="checkbox" checked={row.visible} onChange={(e) => updateRow(row.id, { visible: e.target.checked })} className="h-5 w-5 accent-primary" />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* بانر نشتري معداتكم */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">بانر (نشتري معداتكم)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="العنوان (عربي)" value={webuy.titleAr} onChange={(v) => setWebuy({ ...webuy, titleAr: v })} />
            <TextField label="العنوان (إنجليزي)" value={webuy.titleEn} onChange={(v) => setWebuy({ ...webuy, titleEn: v })} />
            <TextArea label="الوصف (عربي)" value={webuy.descAr} onChange={(v) => setWebuy({ ...webuy, descAr: v })} />
            <TextArea label="الوصف (إنجليزي)" value={webuy.descEn} onChange={(v) => setWebuy({ ...webuy, descEn: v })} />
            <TextField label="زر الصور (عربي)" value={webuy.ctaPhotosAr} onChange={(v) => setWebuy({ ...webuy, ctaPhotosAr: v })} />
            <TextField label="زر الصور (إنجليزي)" value={webuy.ctaPhotosEn} onChange={(v) => setWebuy({ ...webuy, ctaPhotosEn: v })} />
            <TextField label="زر الاتصال (عربي)" value={webuy.ctaAr} onChange={(v) => setWebuy({ ...webuy, ctaAr: v })} />
            <TextField label="زر الاتصال (إنجليزي)" value={webuy.ctaEn} onChange={(v) => setWebuy({ ...webuy, ctaEn: v })} />
            <TextField label="رقم الهاتف" value={webuy.phone} onChange={(v) => setWebuy({ ...webuy, phone: v })} />
            <TextField label="رسالة واتساب" value={webuy.whatsappMsg} onChange={(v) => setWebuy({ ...webuy, whatsappMsg: v })} />
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-sm font-medium">إظهار البانر</span>
            <input type="checkbox" checked={webuy.enabled} onChange={(e) => setWebuy({ ...webuy, enabled: e.target.checked })} className="h-5 w-5 accent-primary" />
          </label>
        </section>

        {/* البنر الرئيسي أعلى الصفحة */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">البنر الرئيسي أعلى الصفحة</h2>
          <ImageField
            label="صورة البنر الرئيسي"
            value={draft.mainBannerImage}
            onChange={(v) => set("mainBannerImage", v)}
          />
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-sm font-medium">إظهار البنر الرئيسي</span>
            <input type="checkbox" checked={draft.showMainBanner} onChange={(e) => set("showMainBanner", e.target.checked)} className="h-5 w-5 accent-primary" />
          </label>
        </section>

        {/* عرض شبكة التصنيفات */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">عرض شبكة التصنيفات</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="أعمدة على الجوال" value={draft.categoryColsMobile} min={1} max={3} onChange={(v) => set("categoryColsMobile", v)} />
            <NumberField label="أعمدة على الكمبيوتر" value={draft.categoryColsDesktop} min={3} max={6} onChange={(v) => set("categoryColsDesktop", v)} />
            <NumberField label="عدد الصفوف (0 = الكل)" value={draft.categoryRows} min={0} max={10} onChange={(v) => set("categoryRows", v)} />
          </div>
        </section>

        {/* بطاقات أنشطة للبيع والمزادات */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">بطاقات (أنشطة للبيع) و(المزادات)</h2>
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">أنشطة للبيع</span>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  إظهار
                  <input type="checkbox" checked={draft.businessesCard.show} onChange={(e) => set("businessesCard", { ...draft.businessesCard, show: e.target.checked })} className="h-5 w-5 accent-primary" />
                </label>
              </div>
              <ImageField label="صورة البطاقة" value={draft.businessesCard.image} onChange={(v) => set("businessesCard", { ...draft.businessesCard, image: v })} />
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">المزادات</span>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  إظهار
                  <input type="checkbox" checked={draft.auctionsCard.show} onChange={(e) => set("auctionsCard", { ...draft.auctionsCard, show: e.target.checked })} className="h-5 w-5 accent-primary" />
                </label>
              </div>
              <ImageField label="صورة البطاقة" value={draft.auctionsCard.image} onChange={(v) => set("auctionsCard", { ...draft.auctionsCard, image: v })} />
            </div>
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
            onClick={() => {
              setDraft(DEFAULT_HOME_LAYOUT);
              setWebuy(DEFAULT_WEBUY_BANNER);
            }}
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

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
    </div>
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

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `home/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      onChange(supabase.storage.from("listings").getPublicUrl(path).data.publicUrl);
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt={label} className="h-16 w-24 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            لا توجد صورة
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            رفع صورة
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              إزالة الصورة
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

