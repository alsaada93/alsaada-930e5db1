import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";


export const Route = createFileRoute("/admin/restaurant")({
  component: AdminRestaurantPage,
});

const db = supabase as any;

interface PType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  active: boolean;
}
interface Equip {
  id: string;
  name: string;
  manufacturer: string | null;
  country_of_origin: string | null;
  description: string | null;
  image_url: string | null;
  category: string | null;
  price_new: number;
  price_used: number;
  project_type_slugs: string[];
  active: boolean;
  sort_order: number;
}

type Tab = "equipment" | "types";

function AdminRestaurantPage() {
  const [tab, setTab] = useState<Tab>("equipment");
  return (
    <div>
      <AdminHeader
        title="دراسة تكلفة مشاريع المطاعم"
        subtitle="تحكم كامل بالمعدات وأنواع المشاريع — لإدارة الأسعار افتح «لوحة الحاسبة»"
      />
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-2 border-b border-border">
          <div className="flex gap-2">
            {(
              [
                ["equipment", "المعدات"],
                ["types", "أنواع المشاريع"],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2 text-sm font-bold ${
                  tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            to="/admin/calculator"
            className="mb-1 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
          >
            إدارة الأسعار ←
          </Link>
        </div>
        {tab === "equipment" && <EquipmentTab />}
        {tab === "types" && <TypesTab />}
      </div>
    </div>
  );
}


/* ===================== Project types ===================== */
function TypesTab() {
  const [rows, setRows] = useState<PType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await db
      .from("restaurant_project_types")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows((data ?? []) as PType[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const name = prompt("اسم النوع")?.trim();
    if (!name) return;
    const slug = prompt("المعرف اللطيف (إنجليزي صغير، مثل: bakery)")?.trim();
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return toast.error("معرف غير صالح");
    const { error } = await db
      .from("restaurant_project_types")
      .insert({ name, slug, sort_order: rows.length + 1 });
    if (error) return toast.error("تعذّر الإضافة (قد يكون المعرف مكرراً)");
    toast.success("تمت الإضافة");
    load();
  };
  const edit = async (r: PType) => {
    const name = prompt("تعديل الاسم", r.name)?.trim();
    if (!name) return;
    const { error } = await db.from("restaurant_project_types").update({ name }).eq("id", r.id);
    if (error) return toast.error("تعذّر التعديل");
    load();
  };
  const toggleActive = async (r: PType) => {
    await db.from("restaurant_project_types").update({ active: !r.active }).eq("id", r.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف هذا النوع؟")) return;
    await db.from("restaurant_project_types").delete().eq("id", id);
    setRows((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />;
  return (
    <div className="space-y-3">
      <button
        onClick={add}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        <Plus className="h-4 w-4" /> إضافة نوع مشروع
      </button>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex-1">
              <h3 className="font-bold">{r.name}</h3>
              <p className="text-xs text-muted-foreground">{r.slug}</p>
            </div>
            <button
              onClick={() => toggleActive(r)}
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                r.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {r.active ? "مفعّل" : "موقوف"}
            </button>
            <button onClick={() => edit(r)} className="p-1.5 text-primary" aria-label="تعديل">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove(r.id)} className="p-1.5 text-destructive" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===================== Equipment ===================== */
const EMPTY: Equip = {
  id: "",
  name: "",
  manufacturer: "",
  country_of_origin: "",
  description: "",
  image_url: "",
  category: "",
  price_new: 0,
  price_used: 0,
  project_type_slugs: [],
  active: true,
  sort_order: 0,
};

function EquipmentTab() {
  const [rows, setRows] = useState<Equip[]>([]);
  const [types, setTypes] = useState<PType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Equip | null>(null);

  const load = async () => {
    const [{ data: eq }, { data: ty }] = await Promise.all([
      db.from("restaurant_equipment").select("*").order("sort_order", { ascending: true }),
      db.from("restaurant_project_types").select("*").order("sort_order", { ascending: true }),
    ]);
    setRows(
      (eq ?? []).map((d: any) => ({
        ...d,
        price_new: Number(d.price_new ?? 0),
        price_used: Number(d.price_used ?? 0),
        project_type_slugs: d.project_type_slugs ?? [],
      })) as Equip[],
    );
    setTypes((ty ?? []) as PType[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("حذف هذه المعدة؟")) return;
    await db.from("restaurant_equipment").delete().eq("id", id);
    setRows((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />;
  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ ...EMPTY })}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        <Plus className="h-4 w-4" /> إضافة معدة
      </button>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد معدات بعد.
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <img
                src={r.image_url || "/placeholder.svg"}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">
                  جديد {r.price_new} / مستعمل {r.price_used} د.ب
                </p>
              </div>
              <button onClick={() => setEditing(r)} className="p-1.5 text-primary" aria-label="تعديل">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(r.id)} className="p-1.5 text-destructive" aria-label="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <EquipmentDialog
          value={editing}
          types={types}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EquipmentDialog({
  value,
  types,
  onClose,
  onSaved,
}: {
  value: Equip;
  types: PType[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Equip>(value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `restaurant/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file);
    if (error) {
      toast.error("تعذّر رفع الصورة");
    } else {
      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      setF((p) => ({ ...p, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const save = async () => {
    if (!f.name.trim()) return toast.error("الاسم مطلوب");
    setSaving(true);
    const payload = {
      name: f.name.trim(),
      manufacturer: f.manufacturer || null,
      country_of_origin: f.country_of_origin || null,
      description: f.description || null,
      image_url: f.image_url || null,
      category: f.category || null,
      price_new: Number(f.price_new) || 0,
      price_used: Number(f.price_used) || 0,
      project_type_slugs: f.project_type_slugs,
      active: f.active,
      sort_order: Number(f.sort_order) || 0,
    };
    const { error } = f.id
      ? await db.from("restaurant_equipment").update(payload).eq("id", f.id)
      : await db.from("restaurant_equipment").insert(payload);
    setSaving(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{f.id ? "تعديل معدة" : "إضافة معدة"}</h3>
          <button onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          <div className="flex items-center gap-3">
            <img src={f.image_url || "/placeholder.svg"} alt="" className="h-16 w-16 rounded object-cover" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} رفع صورة
            </button>
          </div>
          <Inp label="اسم المعدة" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="الشركة المصنعة" value={f.manufacturer ?? ""} onChange={(v) => setF({ ...f, manufacturer: v })} />
            <Inp label="بلد المنشأ" value={f.country_of_origin ?? ""} onChange={(v) => setF({ ...f, country_of_origin: v })} />
          </div>
          <Inp label="التصنيف" value={f.category ?? ""} onChange={(v) => setF({ ...f, category: v })} />
          <div>
            <label className="mb-1 block text-sm font-bold">الوصف</label>
            <textarea
              value={f.description ?? ""}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Inp label="سعر الجديد" type="number" value={String(f.price_new)} onChange={(v) => setF({ ...f, price_new: Number(v) })} />
            <Inp label="سعر المستعمل" type="number" value={String(f.price_used)} onChange={(v) => setF({ ...f, price_used: Number(v) })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">أنواع المشاريع المناسبة</label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => {
                const on = f.project_type_slugs.includes(t.slug);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setF((p) => ({
                        ...p,
                        project_type_slugs: on
                          ? p.project_type_slugs.filter((s) => s !== t.slug)
                          : [...p.project_type_slugs, t.slug],
                      }))
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">إن لم تُحدّد نوعاً ستظهر المعدة لكل المشاريع.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4" />
            مفعّلة
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-bold">
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Inp({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
      />
    </div>
  );
}
