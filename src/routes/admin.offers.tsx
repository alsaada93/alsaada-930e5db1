import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Star, Eye, EyeOff, CheckCircle2, Pencil, X, Upload } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  adminListOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminDeleteOffer,
  type AdminOfferRow,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/offers")({
  component: AdminOffersPage,
});

interface FormState {
  id?: string;
  title: string;
  description: string;
  price: string;
  city: string;
  images: string[];
  featured: boolean;
  categoryId: string;
  groupName: string;
  itemName: string;
  brand: string;
  condition: string;
  negotiable: boolean;
  contactName: string;
  contactPhone: string;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  price: "",
  city: "",
  images: [],
  featured: false,
  categoryId: "",
  groupName: "",
  itemName: "",
  brand: "",
  condition: "مستعمل",
  negotiable: false,
  contactName: "",
  contactPhone: "",
};

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `offers/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("listings")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

function AdminOffersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListOffers);
  const createFn = useServerFn(adminCreateOffer);
  const updateFn = useServerFn(adminUpdateOffer);
  const deleteFn = useServerFn(adminDeleteOffer);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-offers"] });

  const startCreate = () => setForm({ ...EMPTY });
  const startEdit = (o: AdminOfferRow) =>
    setForm({
      id: o.id,
      title: o.title,
      description: o.description ?? "",
      price: o.price ? String(o.price) : "",
      city: o.city ?? "",
      images: o.images,
      featured: o.featured,
    });

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !form) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setForm((f) => (f ? { ...f, images: [...f.images, ...urls] } : f));
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim()) return toast.error("اكتب عنوان العرض");
    if (form.images.length === 0) return toast.error("أضف صورة واحدة على الأقل");
    setSaving(true);
    try {
      const price = form.price ? Number(form.price) : 0;
      if (form.id) {
        await updateFn({
          data: {
            id: form.id,
            title: form.title.trim(),
            description: form.description.trim() || null,
            price,
            city: form.city.trim() || null,
            images: form.images,
            featured: form.featured,
          },
        });
        toast.success("تم تحديث العرض");
      } else {
        await createFn({
          data: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            price,
            city: form.city.trim() || null,
            images: form.images,
            featured: form.featured,
          },
        });
        toast.success("تم إضافة العرض");
      }
      setForm(null);
      refresh();
    } catch {
      toast.error("تعذّر حفظ العرض");
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, data: Partial<{ sold: boolean; featured: boolean; status: "approved" | "suspended" }>) => {
    setBusy(id);
    try {
      await updateFn({ data: { id, ...data } });
      refresh();
    } catch {
      toast.error("تعذّرت العملية");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا العرض نهائياً؟")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("تم حذف العرض");
      refresh();
    } catch {
      toast.error("تعذّر الحذف");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHeader title="العروض الخاصة" />
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            العروض تظهر في صفحة <span className="font-bold">/offers</span> والصفحة الرئيسية ونتائج البحث. الإدارة فقط تنشر هنا.
          </p>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> إضافة عرض
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            لا توجد عروض بعد.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <div key={o.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {o.image && <img src={o.image} alt={o.title} className="h-full w-full object-cover" loading="lazy" />}
                  {o.featured && (
                    <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-2 py-0.5 text-[11px] font-bold text-white">مثبّت</span>
                  )}
                  {o.sold && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">تم البيع</span>
                  )}
                  {o.status === "suspended" && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">مخفي</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 font-bold">{o.title}</h3>
                  <p className="text-sm font-extrabold text-primary">
                    {o.price > 1 ? `${o.price.toLocaleString("ar")} د.ب` : "تواصل لمعرفة السعر"}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                    <button disabled={busy === o.id} onClick={() => patch(o.id, { sold: !o.sold })}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 font-bold hover:bg-accent">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {o.sold ? "متاح" : "تم البيع"}
                    </button>
                    <button disabled={busy === o.id} onClick={() => patch(o.id, { featured: !o.featured })}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 font-bold hover:bg-accent">
                      <Star className="h-3.5 w-3.5" /> {o.featured ? "إلغاء التثبيت" : "تثبيت"}
                    </button>
                    <button disabled={busy === o.id} onClick={() => patch(o.id, { status: o.status === "suspended" ? "approved" : "suspended" })}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 font-bold hover:bg-accent">
                      {o.status === "suspended" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {o.status === "suspended" ? "إظهار" : "إخفاء"}
                    </button>
                    <button disabled={busy === o.id} onClick={() => startEdit(o)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 font-bold hover:bg-accent">
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </button>
                    <button disabled={busy === o.id} onClick={() => remove(o.id)}
                      className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 font-bold text-destructive hover:bg-destructive/20">
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setForm(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{form.id ? "تعديل العرض" : "عرض جديد"}</h2>
              <button onClick={() => setForm(null)} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان العرض" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف العرض" rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} inputMode="numeric"
                  placeholder="السعر (د.ب) — اتركه فارغاً لعرض تواصل" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="المدينة/المنطقة" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>

              <div className="flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setForm({ ...form, images: form.images.filter((u) => u !== url) })}
                      className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                تثبيت العرض في الأعلى
              </label>

              <button onClick={save} disabled={saving || uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
