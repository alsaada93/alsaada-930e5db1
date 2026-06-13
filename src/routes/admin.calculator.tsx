import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Upload,
  X,
  Save,
  Layers,
  Package,
  Settings2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_FAB_DISCOUNTS,
  DEFAULT_FAB_QUOTE,
  DEFAULT_GRADES,
  DEFAULT_THICKNESSES,
  BHD,
  type FabCategory,
  type FabFields,
  type FabImage,
  type FabImageTags,
  type FabPricing,
  type FabProduct,
} from "@/lib/fabrication";
import { useFabricationData } from "@/hooks/useFabrication";

export const Route = createFileRoute("/admin/calculator")({
  component: AdminCalculatorPage,
});

const db = supabase as any;

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `fabrication/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listings").upload(path, file);
  if (error) {
    toast.error("تعذّر رفع الصورة");
    return null;
  }
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

function AdminCalculatorPage() {
  const data = useFabricationData(false);

  return (
    <div>
      <AdminHeader
        title="لوحة حاسبة تفصيل الستانلس ستيل"
        subtitle="تحكم كامل بالفئات والمنتجات والصور والأسعار والقياسات والإضافات — كل التعديلات تظهر مباشرة في صفحة الحاسبة"
      />
      <div className="p-4 sm:p-6">
        {data.loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" /> المنتجات
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <Layers className="h-4 w-4" /> الفئات
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings2 className="h-4 w-4" /> الإعدادات العامة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ProductsTab data={data} />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesTab data={data} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab data={data} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

/* ============================ الفئات ============================ */

function CategoriesTab({ data }: { data: ReturnType<typeof useFabricationData> }) {
  const { categories, reload } = data;
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<FabCategory> | null>(null);
  const [saving, setSaving] = useState(false);

  const blank: Partial<FabCategory> = {
    name: "",
    slug: "",
    icon: "",
    description: "",
    active: true,
    sort_order: categories.length,
  };

  const save = async () => {
    if (!edit?.name?.trim()) return toast.error("اسم الفئة مطلوب");
    setSaving(true);
    const payload = {
      name: edit.name.trim(),
      slug: (edit.slug || edit.name).trim().replace(/\s+/g, "-"),
      icon: edit.icon || null,
      description: edit.description || null,
      active: edit.active ?? true,
      sort_order: Number(edit.sort_order ?? 0),
    };
    const { error } = edit.id
      ? await db.from("fabrication_categories").update(payload).eq("id", edit.id)
      : await db.from("fabrication_categories").insert(payload);
    setSaving(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    setOpen(false);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الفئة؟ سيتم فقد ربط منتجاتها.")) return;
    const { error } = await db.from("fabrication_categories").delete().eq("id", id);
    if (error) return toast.error("تعذّر الحذف");
    toast.success("تم الحذف");
    reload();
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEdit(blank);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> فئة جديدة
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div>
              <p className="flex items-center gap-2 font-bold text-card-foreground">
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.active ? "مفعّلة" : "مخفية"} · ترتيب {c.sort_order}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEdit(c);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "تعديل فئة" : "فئة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>الاسم</Label>
              <Input
                value={edit?.name ?? ""}
                onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>الأيقونة (إيموجي اختياري)</Label>
              <Input
                value={edit?.icon ?? ""}
                onChange={(e) => setEdit((p) => ({ ...p, icon: e.target.value }))}
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={edit?.description ?? ""}
                onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={edit?.sort_order ?? 0}
                  onChange={(e) => setEdit((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={edit?.active ?? true}
                  onCheckedChange={(v) => setEdit((p) => ({ ...p, active: v }))}
                />
                <Label>مفعّلة</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ المنتجات ============================ */

const FIELD_LABELS: { key: keyof FabFields; label: string }[] = [
  { key: "length", label: "الطول" },
  { key: "width", label: "العرض" },
  { key: "height", label: "الارتفاع" },
  { key: "shelves", label: "عدد الأرفف" },
  { key: "tiers", label: "عدد الأدوار" },
  { key: "bowls", label: "عدد الأحواض" },
  { key: "topShelf", label: "رف علوي" },
  { key: "bottomShelf", label: "رف سفلي" },
  { key: "wheels", label: "عجلات" },
  { key: "grade", label: "نوع الستانلس" },
  { key: "thickness", label: "السماكة" },
  { key: "quantity", label: "الكمية" },
  { key: "notes", label: "ملاحظات" },
];

const EXTRA_LABELS: { key: keyof NonNullable<FabPricing["extras"]>; label: string }[] = [
  { key: "topShelf", label: "سعر الرف العلوي" },
  { key: "bottomShelf", label: "سعر الرف السفلي" },
  { key: "wheels", label: "سعر العجلات" },
  { key: "extraBowl", label: "سعر الحوض الإضافي" },
  { key: "perShelf", label: "سعر كل رف" },
  { key: "perTier", label: "سعر كل دور" },
];

function ProductsTab({ data }: { data: ReturnType<typeof useFabricationData> }) {
  const { products, categories, grades, thicknesses, reload } = data;
  const [filterCat, setFilterCat] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<FabProduct> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => (filterCat ? products.filter((p) => p.category_id === filterCat) : products),
    [products, filterCat],
  );

  const blank = (): Partial<FabProduct> => ({
    name: "",
    slug: "",
    category_id: categories[0]?.id ?? null,
    image_url: "",
    images: [],
    description: "",
    base_price: 0,
    price_per_m2: 0,
    fields: { length: true, width: true, grade: true, thickness: true, quantity: true, notes: true },
    pricing: { extras: {} },
    active: true,
    sort_order: products.length,
  });

  const setField = (key: keyof FabFields, v: boolean) =>
    setEdit((p) => ({ ...p, fields: { ...(p?.fields ?? {}), [key]: v } }));

  const setExtra = (key: string, v: number) =>
    setEdit((p) => ({
      ...p,
      pricing: { ...(p?.pricing ?? {}), extras: { ...(p?.pricing?.extras ?? {}), [key]: v } },
    }));

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if ((edit?.images?.length ?? 0) >= 10) {
      toast.error("الحد الأقصى ١٠ صور لكل نوع");
      return;
    }
    setUploading(true);
    const url = await uploadImage(file);
    if (url)
      setEdit((p) => {
        const images: FabImage[] = [...(p?.images ?? []), { url, tags: {} }];
        return { ...p, image_url: p?.image_url || url, images };
      });
    setUploading(false);
  };

  const setImageTag = (idx: number, patch: Partial<FabImageTags>) =>
    setEdit((p) => {
      const images = [...(p?.images ?? [])];
      images[idx] = { ...images[idx], tags: { ...images[idx].tags, ...patch } };
      return { ...p, images };
    });

  const save = async () => {
    if (!edit?.name?.trim()) return toast.error("اسم المنتج مطلوب");
    setSaving(true);
    const payload = {
      name: edit.name.trim(),
      slug: (edit.slug || edit.name).trim().replace(/\s+/g, "-"),
      category_id: edit.category_id || null,
      image_url: edit.image_url || null,
      images: edit.images ?? [],
      description: edit.description || null,
      base_price: Number(edit.base_price ?? 0),
      price_per_m2: Number(edit.price_per_m2 ?? 0),
      fields: edit.fields ?? {},
      pricing: edit.pricing ?? {},
      active: edit.active ?? true,
      sort_order: Number(edit.sort_order ?? 0),
    };
    const { error } = edit.id
      ? await db.from("fabrication_products").update(payload).eq("id", edit.id)
      : await db.from("fabrication_products").insert(payload);
    setSaving(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    setOpen(false);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    const { error } = await db.from("fabrication_products").delete().eq("id", id);
    if (error) return toast.error("تعذّر الحذف");
    toast.success("تم الحذف");
    reload();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button
          onClick={() => {
            setEdit(blank());
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> منتج جديد
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex h-32 items-center justify-center bg-muted">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-card-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {categories.find((c) => c.id === p.category_id)?.name ?? "بدون فئة"}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                أساسي {BHD(p.base_price)} · م² {BHD(p.price_per_m2)}
              </p>
              <div className="mt-2 flex justify-between">
                <span className="text-xs text-muted-foreground">{p.active ? "مفعّل" : "مخفي"}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEdit(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "تعديل منتج" : "منتج جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>الاسم</Label>
                <Input
                  value={edit?.name ?? ""}
                  onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>الفئة</Label>
                <select
                  value={edit?.category_id ?? ""}
                  onChange={(e) => setEdit((p) => ({ ...p, category_id: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">بدون فئة</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>الوصف</Label>
              <Textarea
                value={edit?.description ?? ""}
                onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* الصور */}
            <div>
              <Label>الصور</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(edit?.images ?? []).map((url) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setEdit((p) => {
                          const images = (p?.images ?? []).filter((u) => u !== url);
                          return {
                            ...p,
                            images,
                            image_url: p?.image_url === url ? images[0] ?? "" : p?.image_url,
                          };
                        })
                      }
                      className="absolute right-0 top-0 bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed text-muted-foreground"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </div>
            </div>

            {/* الأسعار */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>السعر الأساسي (د.ب)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={edit?.base_price ?? 0}
                  onChange={(e) => setEdit((p) => ({ ...p, base_price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>سعر المتر المربع (د.ب)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={edit?.price_per_m2 ?? 0}
                  onChange={(e) => setEdit((p) => ({ ...p, price_per_m2: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* الحقول/القياسات */}
            <div>
              <Label>الحقول والقياسات الظاهرة للعميل</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FIELD_LABELS.map((f) => (
                  <label
                    key={f.key}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <Switch
                      checked={!!edit?.fields?.[f.key]}
                      onCheckedChange={(v) => setField(f.key, v)}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            {/* أسعار الإضافات */}
            <div>
              <Label>أسعار الإضافات (د.ب)</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {EXTRA_LABELS.map((ex) => (
                  <div key={ex.key}>
                    <Label className="text-xs text-muted-foreground">{ex.label}</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={edit?.pricing?.extras?.[ex.key] ?? 0}
                      onChange={(e) => setExtra(ex.key, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={edit?.sort_order ?? 0}
                  onChange={(e) => setEdit((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={edit?.active ?? true}
                  onCheckedChange={(v) => setEdit((p) => ({ ...p, active: v }))}
                />
                <Label>مفعّل</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ الإعدادات العامة ============================ */

function SettingsTab({ data }: { data: ReturnType<typeof useFabricationData> }) {
  const { grades, thicknesses, discounts, quote, reload } = data;
  const [g, setG] = useState(JSON.stringify(grades ?? DEFAULT_GRADES, null, 2));
  const [t, setT] = useState(JSON.stringify(thicknesses ?? DEFAULT_THICKNESSES, null, 2));
  const [d, setD] = useState(discounts?.default ?? DEFAULT_FAB_DISCOUNTS.default);
  const [q, setQ] = useState({ ...DEFAULT_FAB_QUOTE, ...quote });
  const [saving, setSaving] = useState(false);

  const saveSetting = async (key: string, value: unknown) => {
    const { error } = await db
      .from("fabrication_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const parsedG = JSON.parse(g);
      const parsedT = JSON.parse(t);
      await saveSetting("steel_grades", parsedG);
      await saveSetting("thicknesses", parsedT);
      await saveSetting("discounts", { default: Number(d) });
      await saveSetting("quote", q);
      toast.success("تم حفظ الإعدادات");
      reload();
    } catch {
      toast.error("تحقق من صيغة الأنواع/السماكات (JSON غير صحيح)");
    }
    setSaving(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 font-bold text-card-foreground">أنواع الستانلس ومعاملاتها</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          مثال: {"{ \"201\": 1, \"304\": 1.35 }"}
        </p>
        <Textarea rows={6} value={g} onChange={(e) => setG(e.target.value)} className="font-mono text-xs" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 font-bold text-card-foreground">السماكات ومعاملاتها</h3>
        <Textarea rows={6} value={t} onChange={(e) => setT(e.target.value)} className="font-mono text-xs" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-bold text-card-foreground">الخصم الافتراضي (%)</h3>
        <Input type="number" value={d} onChange={(e) => setD(Number(e.target.value))} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-bold text-card-foreground">إعدادات عرض السعر</h3>
        <div className="space-y-3">
          <div>
            <Label>عنوان عرض السعر (PDF)</Label>
            <Input value={q.pdfTitle} onChange={(e) => setQ((p) => ({ ...p, pdfTitle: e.target.value }))} />
          </div>
          <div>
            <Label>تذييل عرض السعر</Label>
            <Input value={q.pdfFooter} onChange={(e) => setQ((p) => ({ ...p, pdfFooter: e.target.value }))} />
          </div>
          <div>
            <Label>رقم واتساب</Label>
            <Input value={q.whatsapp} onChange={(e) => setQ((p) => ({ ...p, whatsapp: e.target.value }))} />
          </div>
          <div>
            <Label>رسالة العميل</Label>
            <Textarea
              value={q.clientMessage}
              onChange={(e) => setQ((p) => ({ ...p, clientMessage: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <Button onClick={saveAll} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ كل الإعدادات
        </Button>
      </div>
    </div>
  );
}
