import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Upload, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOffersConfig, DEFAULT_OFFERS_CONFIG, type OffersConfig } from "@/hooks/useOffersConfig";
import { deleteStorageImage } from "@/lib/storage";

async function uploadBanner(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `offers/banner-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("listings")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

/**
 * لوحة التحكم بشكل صفحة العروض: الصورة، الرمز، العنوان، طريقة العرض،
 * عدد الأعمدة والصفوف، حجم البطاقات، اتجاه السحب، والظهور في الرئيسية.
 */
export function OffersSettingsPanel() {
  const { config, loading, save } = useOffersConfig();
  const [draft, setDraft] = useState<OffersConfig>(DEFAULT_OFFERS_CONFIG);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    if (!loading) setDraft(config);
  }, [loading, config]);

  const set = <K extends keyof OffersConfig>(k: K, v: OffersConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("تم حفظ إعدادات صفحة العروض");
    } catch {
      toast.error("تعذّر الحفظ — تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const previous = draft.bannerImage;
      const url = await uploadBanner(file);
      set("bannerImage", url);
      if (previous && previous !== url) await deleteStorageImage(previous);
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const removeBanner = () => {
    const previous = draft.bannerImage;
    set("bannerImage", "");
    set("showBanner", false);
    void deleteStorageImage(previous);
  };

  const onUploadIcon = async (file: File | null) => {
    if (!file) return;
    setUploadingIcon(true);
    try {
      const previous = draft.iconImage;
      const url = await uploadBanner(file);
      set("iconImage", url);
      if (previous && previous !== url) await deleteStorageImage(previous);
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeIcon = () => {
    const previous = draft.iconImage;
    set("iconImage", "");
    void deleteStorageImage(previous);
  };


  const field = "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm";
  const lbl = "text-xs font-semibold text-muted-foreground";

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Settings2 className="h-4 w-4 text-primary" /> إعدادات صفحة العروض
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* صورة البانر */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>صورة البانر الرئيسي</label>
          {draft.bannerImage ? (
            <img src={draft.bannerImage} alt="بانر العروض" className="h-20 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              لا توجد صورة
            </div>
          )}
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold hover:bg-accent">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} رفع صورة
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
            </label>
            {draft.bannerImage && (
              <button type="button" onClick={removeBanner} className="rounded-lg border border-input px-3 py-1.5 text-xs font-bold hover:bg-accent">
                حذف وإخفاء
              </button>
            )}
          </div>
        </div>

        {/* الرمز */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>رمز القسم (إيموجي)</label>
          <div className="flex gap-2">
            <input className={field} value={draft.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🔥" />
            {draft.icon && (
              <button
                type="button"
                onClick={() => set("icon", "")}
                className="shrink-0 rounded-lg border border-input px-3 py-1.5 text-xs font-bold hover:bg-accent"
              >
                حذف الرمز
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">احذف الرمز لمنع ظهور شعار 🔥 والوميض على الصور.</p>
        </div>


        {/* صورة الأيقونة لبطاقة العروض */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>صورة أيقونة بطاقة العروض</label>
          {draft.iconImage ? (
            <img src={draft.iconImage} alt="أيقونة العروض" className="h-16 w-16 rounded-2xl border border-border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border text-2xl">
              {draft.icon || "🔥"}
            </div>
          )}
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold hover:bg-accent">
              {uploadingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} رفع صورة
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadIcon(e.target.files?.[0] ?? null)} />
            </label>
            {draft.iconImage && (
              <button type="button" onClick={removeIcon} className="rounded-lg border border-input px-3 py-1.5 text-xs font-bold hover:bg-accent">
                حذف الصورة
              </button>
            )}
          </div>
        </div>


        {/* العنوان بالعربية */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>العنوان (عربي)</label>
          <input className={field} value={draft.titleAr} onChange={(e) => set("titleAr", e.target.value)} />
        </div>

        {/* العنوان بالإنجليزية */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>العنوان (إنجليزي)</label>
          <input className={field} value={draft.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
        </div>

        {/* طريقة العرض */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>طريقة عرض الإعلانات</label>
          <select className={field} value={draft.displayMode} onChange={(e) => set("displayMode", e.target.value as OffersConfig["displayMode"])}>
            <option value="grid">شبكة ثابتة</option>
            <option value="carousel">شريط سحب أفقي</option>
          </select>
        </div>

        {/* اتجاه السحب */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>اتجاه السحب</label>
          <select className={field} value={draft.swipeDirection} onChange={(e) => set("swipeDirection", e.target.value as OffersConfig["swipeDirection"])}>
            <option value="rtl">يمين ← يسار</option>
            <option value="ltr">يسار ← يمين</option>
          </select>
        </div>

        {/* أعمدة الجوال */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>أعمدة الجوال (شبكة)</label>
          <select className={field} value={draft.gridColsMobile} onChange={(e) => set("gridColsMobile", Number(e.target.value))}>
            <option value={1}>عمود واحد</option>
            <option value={2}>عمودان</option>
            <option value={3}>ثلاثة</option>
          </select>
        </div>

        {/* أعمدة سطح المكتب */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>أعمدة الشاشات الكبيرة (شبكة)</label>
          <select className={field} value={draft.gridColsDesktop} onChange={(e) => set("gridColsDesktop", Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* عدد الصفوف */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>عدد الصفوف الظاهرة (0 = الكل)</label>
          <input type="number" min={0} className={field} value={draft.rows} onChange={(e) => set("rows", Math.max(0, Number(e.target.value)))} />
        </div>

        {/* حجم البطاقة في وضع السحب */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>حجم بطاقة السحب على الجوال: {draft.cardWidthPct}%</label>
          <input type="range" min={40} max={100} step={2} value={draft.cardWidthPct} onChange={(e) => set("cardWidthPct", Number(e.target.value))} />
        </div>

        {/* إظهار البانر العلوي */}
        <div className="flex items-center gap-2 pt-5">
          <input id="offers-show-banner" type="checkbox" checked={draft.showBanner} onChange={(e) => set("showBanner", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="offers-show-banner" className="text-sm font-semibold">إظهار صورة البانر العلوية</label>
        </div>

        {/* شارة الخصومات: إظهار */}
        <div className="flex items-center gap-2 pt-5">
          <input id="offers-badge-show" type="checkbox" checked={draft.badgeShow} onChange={(e) => set("badgeShow", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="offers-badge-show" className="text-sm font-semibold">إظهار شارة "خصومات حصرية"</label>
        </div>

        {/* نص الشارة عربي */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>نص الشارة (عربي)</label>
          <input className={field} value={draft.badgeTextAr} onChange={(e) => set("badgeTextAr", e.target.value)} />
        </div>

        {/* نص الشارة إنجليزي */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>نص الشارة (إنجليزي)</label>
          <input className={field} value={draft.badgeTextEn} onChange={(e) => set("badgeTextEn", e.target.value)} />
        </div>

        {/* موضع الشارة */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>موضع الشارة</label>
          <select className={field} value={draft.badgePosition} onChange={(e) => set("badgePosition", e.target.value as OffersConfig["badgePosition"])}>
            <option value="top">أعلى العنوان</option>
            <option value="bottom">أسفل العنوان</option>
          </select>
        </div>

        {/* جملة عدد العروض: إظهار */}
        <div className="flex items-center gap-2 pt-5">
          <input id="offers-count-show" type="checkbox" checked={draft.countShow} onChange={(e) => set("countShow", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="offers-count-show" className="text-sm font-semibold">إظهار جملة عدد العروض</label>
        </div>

        {/* موضع جملة العدد */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>موضع جملة العدد</label>
          <select className={field} value={draft.countPosition} onChange={(e) => set("countPosition", e.target.value as OffersConfig["countPosition"])}>
            <option value="bottom">داخل البانر (أسفل)</option>
            <option value="top">أعلى الصفحة</option>
          </select>
        </div>

        {/* الظهور في الرئيسية */}
        <div className="flex items-center gap-2 pt-5">
          <input id="offers-show-home" type="checkbox" checked={draft.showOnHome} onChange={(e) => set("showOnHome", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="offers-show-home" className="text-sm font-semibold">إظهار قسم العروض في الصفحة الرئيسية</label>
        </div>
      </div>

      {/* شريط الصور المتحرك */}
      <div className="mt-5 rounded-xl border border-border bg-background/50 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={draft.slideEnabled} onChange={(e) => set("slideEnabled", e.target.checked)} className="h-4 w-4" />
            تفعيل شريط الصور المتحرك
          </label>
          <div className="flex items-center gap-2">
            <span className={lbl}>الموضع</span>
            <select className={field + " w-auto"} value={draft.slidePosition} onChange={(e) => set("slidePosition", e.target.value as OffersConfig["slidePosition"])}>
              <option value="top">أعلى الإعلانات</option>
              <option value="bottom">أسفل البانر مباشرة</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>مدة التحريك (ث)</span>
            <input
              type="number"
              min={1.5}
              step={0.5}
              className={field + " w-20"}
              value={draft.slideIntervalMs / 1000}
              onChange={(e) => set("slideIntervalMs", Math.max(1500, Number(e.target.value) * 1000))}
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold hover:bg-accent">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} إضافة صور
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length === 0) return;
                setUploading(true);
                try {
                  const urls: string[] = [];
                  for (const f of files) urls.push(await uploadBanner(f));
                  set("slideImages", [...draft.slideImages, ...urls]);
                } catch {
                  toast.error("تعذّر رفع بعض الصور");
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>
        {draft.slideImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {draft.slideImages.map((src, i) => (
              <div key={src + i} className="group relative overflow-hidden rounded-lg border border-border">
                <img src={src} alt="" className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    set("slideImages", draft.slideImages.filter((_, j) => j !== i));
                    void deleteStorageImage(src);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لا توجد صور — أضف صوراً لعرضها كشريط متحرك.</p>
        )}
      </div>




      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
