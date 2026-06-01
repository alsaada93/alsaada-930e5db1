import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Upload, Sparkles, Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HERO_CONFIG,
  HERO_CONFIG_KEY,
  mergeHeroConfig,
  resolveHeroImage,
  type HeroConfig,
} from "@/hooks/useHeroConfig";

export const Route = createFileRoute("/admin/hero")({
  component: HeroAdminPage,
});

async function uploadHeroImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("listings").upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

function HeroAdminPage() {
  const [draft, setDraft] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", HERO_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setDraft(mergeHeroConfig(data?.value as Partial<HeroConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadHeroImage(file);
      set("imageUrl", url);
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ key: HERO_CONFIG_KEY, value: draft as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("تم حفظ إعدادات الواجهة");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const previewImg = resolveHeroImage(draft);

  if (loading) {
    return (
      <div>
        <AdminHeader title="واجهة الصفحة الرئيسية" subtitle="تحكّم كامل بالصورة الثابتة والنصوص والبحث والألوان" />
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="واجهة الصفحة الرئيسية" subtitle="تحكّم كامل بالصورة الثابتة والنصوص والبحث والألوان" />
      <div className="space-y-6 p-6">
        {/* Live preview */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-card">
          <div className="relative h-56 w-full bg-navy">
            <img
              src={previewImg}
              alt="preview"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: draft.imageOpacity / 100 }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: draft.overlayColor, opacity: draft.overlayOpacity / 100 }}
            />
            <div className="relative flex h-full flex-col justify-center gap-2 p-6" style={{ color: draft.textColor }}>
              {draft.showName && <h3 className="text-xl font-extrabold md:text-2xl">{draft.titleAr}</h3>}
              {draft.showName && <p className="text-sm opacity-90">{draft.subtitleAr}</p>}
              {draft.showBadge && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold ring-1 ring-white/30">
                  <Sparkles className="h-3 w-3" /> {draft.badgeAr}
                </span>
              )}
              {draft.showSearch && (
                <div className="mt-1 flex w-full max-w-sm items-center gap-2 rounded-xl bg-white p-1.5">
                  <Search className="ms-1 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-xs text-muted-foreground">{/* placeholder */}بحث...</span>
                  <span className="rounded-lg bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground">بحث</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 font-bold text-card-foreground">الصورة الثابتة</h3>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                onUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              رفع صورة
            </button>
            {draft.imageUrl && (
              <button
                onClick={() => set("imageUrl", "")}
                className="text-xs text-destructive hover:underline"
              >
                إزالة الصورة (استخدام الافتراضية)
              </button>
            )}
          </div>
        </div>

        {/* Texts */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">النصوص</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-semibold">العنوان (عربي)</label>
              <input className={field} value={draft.titleAr} onChange={(e) => set("titleAr", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">العنوان (إنجليزي)</label>
              <input className={field} value={draft.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">الوصف (عربي)</label>
              <input className={field} value={draft.subtitleAr} onChange={(e) => set("subtitleAr", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">الوصف (إنجليزي)</label>
              <input className={field} value={draft.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">نص «مدعوم» (عربي)</label>
              <input className={field} value={draft.badgeAr} onChange={(e) => set("badgeAr", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">نص «مدعوم» (إنجليزي)</label>
              <input className={field} value={draft.badgeEn} onChange={(e) => set("badgeEn", e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.showName} onChange={(e) => set("showName", e.target.checked)} />
              إظهار الاسم والوصف
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.showSearch} onChange={(e) => set("showSearch", e.target.checked)} />
              إظهار مربع البحث
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.showBadge} onChange={(e) => set("showBadge", e.target.checked)} />
              إظهار وسم «مدعوم»
            </label>
          </div>
        </div>

        {/* Colors & contrast */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">الألوان ونسبة التباين</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold">وضوح الصورة ({draft.imageOpacity}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.imageOpacity}
                onChange={(e) => set("imageOpacity", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">شدة الطبقة اللونية ({draft.overlayOpacity}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.overlayOpacity}
                onChange={(e) => set("overlayOpacity", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <input
                type="color"
                value={draft.overlayColor}
                onChange={(e) => set("overlayColor", e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <div>
                <div className="text-sm font-semibold">لون الطبقة فوق الصورة</div>
                <div className="text-xs text-muted-foreground">{draft.overlayColor}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <input
                type="color"
                value={draft.textColor}
                onChange={(e) => set("textColor", e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <div>
                <div className="text-sm font-semibold">لون النص</div>
                <div className="text-xs text-muted-foreground">{draft.textColor}</div>
              </div>
            </div>
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
            onClick={() => setDraft(DEFAULT_HERO_CONFIG)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
}
