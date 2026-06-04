import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useViewBoost, type ViewBoost } from "@/hooks/useViewBoost";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save, Upload } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import {
  useTheme,
  COLOR_FIELDS,
  FONT_OPTIONS,
  DEFAULT_THEME,
  type ThemeSettings,
} from "@/hooks/useTheme";
import {
  useSiteIdentity,
  DEFAULT_IDENTITY,
  type SiteIdentity,
} from "@/hooks/useSiteIdentity";
import {
  useHomeBanners,
  BANNER_POSITIONS,
  type HomeBanners,
  type HomeBanner,
  type BannerPosition,
} from "@/hooks/useHomeBanners";

export const Route = createFileRoute("/admin/appearance")({
  component: AppearancePage,
});

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `identity/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("listings").upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

function IdentitySection() {
  const { identity, save } = useSiteIdentity();
  const [draft, setDraft] = useState<SiteIdentity>(identity);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  const set = <K extends keyof SiteIdentity>(key: K, value: SiteIdentity[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onUpload = async (field: "logoUrl" | "faviconUrl", file: File | undefined) => {
    if (!file) return;
    setUploading(field === "logoUrl" ? "logo" : "favicon");
    try {
      const url = await uploadImage(file);
      set(field, url);
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(null);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ هوية الموقع");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  const field = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-1 font-bold text-card-foreground">هوية الموقع</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        تحكّم في شعار الموقع واسمه ووصفه ورمز المتصفح (الأيقونة).
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Logo */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">الشعار</label>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-border bg-navy">
              {draft.logoUrl ? (
                <img src={draft.logoUrl} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-foreground">لا يوجد</span>
              )}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted">
              {uploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              رفع شعار
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload("logoUrl", e.target.files?.[0])} />
            </label>
            {draft.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", "")} className="text-xs text-destructive hover:underline">
                إزالة
              </button>
            )}
          </div>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">رمز الموقع (Favicon)</label>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
              {draft.faviconUrl ? (
                <img src={draft.faviconUrl} alt="favicon" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-foreground">لا يوجد</span>
              )}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted">
              {uploading === "favicon" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              رفع رمز
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload("faviconUrl", e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold">اسم الموقع (عربي)</label>
          <input className={field} value={draft.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">اسم الموقع (إنجليزي)</label>
          <input className={field} value={draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">الوصف (عربي)</label>
          <input className={field} value={draft.taglineAr} onChange={(e) => set("taglineAr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">الوصف (إنجليزي)</label>
          <input className={field} value={draft.taglineEn} onChange={(e) => set("taglineEn", e.target.value)} />
        </div>
      </div>

      {/* Header logo box fine controls */}
      <div className="mt-6 space-y-5 rounded-xl border border-border p-4">
        <h4 className="font-bold text-card-foreground">حجم مربع الشعار والخط (ترويسة الموقع)</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>عرض المربع</span>
            <span className="text-primary">{draft.logoBoxWidth}px</span>
          </div>
          <Slider min={24} max={120} step={1} value={[draft.logoBoxWidth]} onValueChange={(v) => set("logoBoxWidth", v[0])} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>ارتفاع المربع</span>
            <span className="text-primary">{draft.logoBoxHeight}px</span>
          </div>
          <Slider min={24} max={120} step={1} value={[draft.logoBoxHeight]} onValueChange={(v) => set("logoBoxHeight", v[0])} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>حجم خط الاسم</span>
            <span className="text-primary">{draft.logoFontSize}px</span>
          </div>
          <Slider min={10} max={40} step={1} value={[draft.logoFontSize]} onValueChange={(v) => set("logoFontSize", v[0])} />
        </div>
      </div>

      {/* Contact & social */}
      <div className="mt-6 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
        <h4 className="font-bold text-card-foreground sm:col-span-2">معلومات التواصل والروابط</h4>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">رابط حساب الانستقرام</label>
          <input className={field} placeholder="https://instagram.com/..." value={draft.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">رقم الهاتف / واتساب</label>
          <input className={field} placeholder="973XXXXXXXX" value={draft.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">الموقع (عربي)</label>
          <input className={field} value={draft.locationAr} onChange={(e) => set("locationAr", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold">الموقع (إنجليزي)</label>
          <input className={field} value={draft.locationEn} onChange={(e) => set("locationEn", e.target.value)} />
        </div>
      </div>


      <div className="mt-4 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={draft.showLogo} onChange={(e) => set("showLogo", e.target.checked)} />
          إظهار الشعار
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={draft.showName} onChange={(e) => set("showName", e.target.checked)} />
          إظهار الاسم
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الهوية
        </button>
        <button
          onClick={() => setDraft(DEFAULT_IDENTITY)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
        </button>
      </div>
    </div>
  );
}

function BannersSection() {
  const { banners, save } = useHomeBanners();
  const [draft, setDraft] = useState<HomeBanners>(banners);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const addImage = async (pos: BannerPosition, file: File | undefined) => {
    if (!file) return;
    setUploading(pos);
    try {
      const url = await uploadImage(file);
      const item: HomeBanner = { id: crypto.randomUUID(), imageUrl: url, link: "" };
      setDraft((d) => ({ ...d, [pos]: [...d[pos], item] }));
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(null);
    }
  };

  const setLink = (pos: BannerPosition, id: string, link: string) =>
    setDraft((d) => ({ ...d, [pos]: d[pos].map((b) => (b.id === id ? { ...b, link } : b)) }));

  const remove = (pos: BannerPosition, id: string) =>
    setDraft((d) => ({ ...d, [pos]: d[pos].filter((b) => b.id !== id) }));

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ صور الصفحة الرئيسية");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  const field = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-1 font-bold text-card-foreground">صور الصفحة الرئيسية</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        ارفع صوراً إعلانية في أعلى وأسفل ويمين ويسار الصفحة الرئيسية. كل صورة يمكن ربطها برابط.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {BANNER_POSITIONS.map(({ key, ar }) => (
          <div key={key} className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">{ar}</span>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-bold hover:bg-muted">
                {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                رفع صورة
                <input type="file" accept="image/*" className="hidden" onChange={(e) => addImage(key, e.target.files?.[0])} />
              </label>
            </div>
            {draft[key].length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد صور بعد.</p>
            ) : (
              <div className="space-y-3">
                {draft[key].map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <img src={b.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                    <input
                      className={field}
                      placeholder="رابط عند النقر (اختياري)"
                      value={b.link}
                      onChange={(e) => setLink(key, b.id, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(key, b.id)}
                      className="shrink-0 text-xs text-destructive hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ صور الصفحة
        </button>
      </div>
    </div>
  );
}



function ViewBoostSection() {
  const { boost, save } = useViewBoost();
  const [draft, setDraft] = useState(boost);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(boost), [boost]);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ إعدادات المشاهدات");
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 font-bold text-card-foreground">عدد المشاهدات الوهمي</h3>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
            className="h-4 w-4"
          />
          إظهار المشاهدات الوهمية
        </label>
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">العدد المضاف فوق المشاهدات الحقيقية</span>
          <input
            type="number"
            min={0}
            value={draft.base}
            onChange={(e) => setDraft((d) => ({ ...d, base: Math.max(0, Number(e.target.value) || 0) }))}
            className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
      </div>
    </div>
  );
}

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
      <AdminHeader title="مظهر الموقع" subtitle="تحكّم كامل بهوية وألوان وخطوط الموقع" />
      <div className="space-y-6 p-6">
        {/* Site identity */}
        <IdentitySection />

        {/* Fake views boost */}
        <ViewBoostSection />

        {/* Home page banners */}
        <BannersSection />


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
              <span className="font-extrabold">حراج السعادة</span> — ترويسة الموقع
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
