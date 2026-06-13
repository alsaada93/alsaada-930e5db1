import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Upload, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";

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

interface SpecPair {
  k: string;
  v: string;
}

interface Equip {
  id: string;
  name: string;
  manufacturer: string | null;
  country_of_origin: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  category: string | null;
  condition: string; // new | used
  used_condition: string | null; // جيدة | ممتازة | شبه جديد | غير مستخدمة
  price_new: number;
  price_new_discounted: number | null;
  price_used: number;
  specs: Record<string, string>;
  linked_listing_id: string | null;
  tier: string; // economy | standard | premium
  essential: boolean;
  cost_layer: string; // core | extra | operating
  default_qty: number;
  project_type_slugs: string[];
  active: boolean;
  sort_order: number;
}

interface ListingLite {
  id: string;
  title: string;
  price: number | null;
  condition: string | null;
  city: string | null;
  images: string[] | null;
}

interface Pkg {
  id: string;
  project_type_slug: string;
  tier: string;
  name: string;
  description: string | null;
  items: { equipment_id: string; qty: number }[];
  active: boolean;
  sort_order: number;
}

type Tab = "equipment" | "packages" | "types" | "leads";

const TIERS: [string, string][] = [
  ["economy", "اقتصادية"],
  ["standard", "متوسطة"],
  ["premium", "احترافية"],
];
const LAYERS: [string, string][] = [
  ["core", "معدات أساسية"],
  ["extra", "معدات إضافية"],
  ["operating", "تجهيزات تشغيل"],
];
const USED_CONDS = ["جيدة", "ممتازة", "شبه جديد", "غير مستخدمة"];

function AdminRestaurantPage() {
  const [tab, setTab] = useState<Tab>("equipment");
  return (
    <div>
      <AdminHeader
        title="منصة تصميم مشاريع المطاعم"
        subtitle="تحكم كامل بالمعدات والباقات وأنواع المشاريع — لإدارة الأسعار افتح «لوحة الحاسبة»"
      />
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-2 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["equipment", "المعدات"],
                ["packages", "الباقات الجاهزة"],
                ["types", "أنواع المشاريع"],
                ["leads", "طلبات العملاء"],
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
        {tab === "packages" && <PackagesTab />}
        {tab === "types" && <TypesTab />}
        {tab === "leads" && <LeadsTab />}
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
  images: [],
  category: "",
  condition: "new",
  used_condition: null,
  price_new: 0,
  price_new_discounted: null,
  price_used: 0,
  specs: {},
  linked_listing_id: null,
  tier: "standard",
  essential: true,
  cost_layer: "core",
  default_qty: 1,
  project_type_slugs: [],
  active: true,
  sort_order: 0,
};

function normalizeEquip(d: any): Equip {
  return {
    ...EMPTY,
    ...d,
    images: d.images ?? [],
    specs: d.specs ?? {},
    price_new: Number(d.price_new ?? 0),
    price_new_discounted: d.price_new_discounted == null ? null : Number(d.price_new_discounted),
    price_used: Number(d.price_used ?? 0),
    default_qty: Number(d.default_qty ?? 1),
    project_type_slugs: d.project_type_slugs ?? [],
    condition: d.condition ?? "new",
    tier: d.tier ?? "standard",
    cost_layer: d.cost_layer ?? "core",
  };
}

function EquipmentTab() {
  const [rows, setRows] = useState<Equip[]>([]);
  const [types, setTypes] = useState<PType[]>([]);
  const [listings, setListings] = useState<ListingLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Equip | null>(null);

  const load = async () => {
    const [{ data: eq }, { data: ty }, { data: ls }] = await Promise.all([
      db.from("restaurant_equipment").select("*").order("sort_order", { ascending: true }),
      db.from("restaurant_project_types").select("*").order("sort_order", { ascending: true }),
      db
        .from("listings")
        .select("id,title,price,condition,city,images")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    setRows((eq ?? []).map(normalizeEquip));
    setTypes((ty ?? []) as PType[]);
    setListings(
      (ls ?? []).map((l: any) => ({
        id: l.id,
        title: l.title,
        price: l.price == null ? null : Number(l.price),
        condition: l.condition,
        city: l.city,
        images: l.images,
      })),
    );
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
                src={r.image_url || r.images[0] || "/placeholder.svg"}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {r.condition === "used"
                    ? `مستعمل ${r.price_used} د.ب`
                    : `جديد ${r.price_new_discounted ?? r.price_new} د.ب`}
                  {" · "}
                  {TIERS.find((t) => t[0] === r.tier)?.[1]}
                  {r.linked_listing_id && " · مرتبط بإعلان"}
                </p>
              </div>
              {!r.active && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">مخفية</span>
              )}
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
          listings={listings}
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
  listings,
  onClose,
  onSaved,
}: {
  value: Equip;
  types: PType[];
  listings: ListingLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Equip>(value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [listingSearch, setListingSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const specPairs: SpecPair[] = useMemo(
    () => Object.entries(f.specs).map(([k, v]) => ({ k, v: String(v) })),
    [f.specs],
  );

  const setSpecs = (pairs: SpecPair[]) =>
    setF((p) => ({
      ...p,
      specs: pairs.reduce<Record<string, string>>((acc, { k, v }) => {
        if (k.trim()) acc[k.trim()] = v;
        return acc;
      }, {}),
    }));

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return listings.slice(0, 30);
    return listings.filter((l) => l.title.toLowerCase().includes(q)).slice(0, 30);
  }, [listings, listingSearch]);

  const linked = listings.find((l) => l.id === f.linked_listing_id);

  const upload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `restaurant/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("listings").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setF((p) => ({
      ...p,
      images: [...p.images, ...urls],
      image_url: p.image_url || urls[0] || p.image_url,
    }));
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
      image_url: f.image_url || f.images[0] || null,
      images: f.images,
      category: f.category || null,
      condition: f.condition,
      used_condition: f.condition === "used" ? f.used_condition || null : null,
      price_new: Number(f.price_new) || 0,
      price_new_discounted:
        f.price_new_discounted == null || f.price_new_discounted === ("" as any)
          ? null
          : Number(f.price_new_discounted),
      price_used: Number(f.price_used) || 0,
      specs: f.specs,
      linked_listing_id: f.linked_listing_id || null,
      tier: f.tier,
      essential: f.essential,
      cost_layer: f.cost_layer,
      default_qty: Number(f.default_qty) || 1,
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
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{f.id ? "تعديل معدة" : "إضافة معدة"}</h3>
          <button onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          {/* الصور */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => upload(e.target.files)}
          />
          <div className="flex flex-wrap items-center gap-2">
            {f.images.map((img, i) => (
              <div key={img} className="relative">
                <img src={img} alt="" className="h-16 w-16 rounded object-cover" />
                <button
                  onClick={() =>
                    setF((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))
                  }
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                  aria-label="حذف الصورة"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded border border-dashed border-border text-xs text-muted-foreground"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              صور
            </button>
          </div>

          <Inp label="اسم المعدة" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="الشركة المصنعة" value={f.manufacturer ?? ""} onChange={(v) => setF({ ...f, manufacturer: v })} />
            <Inp label="بلد الصنع" value={f.country_of_origin ?? ""} onChange={(v) => setF({ ...f, country_of_origin: v })} />
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

          {/* الحالة */}
          <div className="grid grid-cols-2 gap-3">
            <Sel
              label="حالة المعدة"
              value={f.condition}
              onChange={(v) => setF({ ...f, condition: v })}
              options={[
                ["new", "جديدة"],
                ["used", "مستعملة"],
              ]}
            />
            {f.condition === "used" && (
              <Sel
                label="مستوى الحالة"
                value={f.used_condition ?? ""}
                onChange={(v) => setF({ ...f, used_condition: v })}
                options={[["", "—"], ...USED_CONDS.map((c) => [c, c] as [string, string])]}
              />
            )}
          </div>

          {/* الأسعار */}
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 text-xs font-bold text-muted-foreground">الأسعار (د.ب)</p>
            <div className="grid grid-cols-2 gap-3">
              <Inp
                label="سعر الجديد قبل الخصم"
                type="number"
                value={String(f.price_new)}
                onChange={(v) => setF({ ...f, price_new: Number(v) })}
              />
              <Inp
                label="سعر الجديد بعد الخصم"
                type="number"
                value={f.price_new_discounted == null ? "" : String(f.price_new_discounted)}
                onChange={(v) =>
                  setF({ ...f, price_new_discounted: v === "" ? null : Number(v) })
                }
              />
            </div>
            {f.condition === "used" && (
              <div className="mt-3">
                <Inp
                  label="سعر المستعمل الآن"
                  type="number"
                  value={String(f.price_used)}
                  onChange={(v) => setF({ ...f, price_used: Number(v) })}
                />
              </div>
            )}
          </div>

          {/* تصنيف الباقة والتكلفة */}
          <div className="grid grid-cols-2 gap-3">
            <Sel
              label="مستوى الباقة"
              value={f.tier}
              onChange={(v) => setF({ ...f, tier: v })}
              options={TIERS}
            />
            <Sel
              label="طبقة التكلفة"
              value={f.cost_layer}
              onChange={(v) => setF({ ...f, cost_layer: v })}
              options={LAYERS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Inp
              label="الكمية الافتراضية"
              type="number"
              value={String(f.default_qty)}
              onChange={(v) => setF({ ...f, default_qty: Number(v) })}
            />
            <Inp
              label="ترتيب العرض"
              type="number"
              value={String(f.sort_order)}
              onChange={(v) => setF({ ...f, sort_order: Number(v) })}
            />
          </div>

          {/* المواصفات */}
          <div>
            <label className="mb-1.5 block text-sm font-bold">المواصفات</label>
            <div className="space-y-2">
              {specPairs.map((sp, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="الخاصية"
                    value={sp.k}
                    onChange={(e) => {
                      const next = [...specPairs];
                      next[i] = { ...next[i], k: e.target.value };
                      setSpecs(next);
                    }}
                    className="w-1/3 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="القيمة"
                    value={sp.v}
                    onChange={(e) => {
                      const next = [...specPairs];
                      next[i] = { ...next[i], v: e.target.value };
                      setSpecs(next);
                    }}
                    className="flex-1 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => setSpecs(specPairs.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-destructive"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSpecs([...specPairs, { k: "", v: "" }])}
                className="flex items-center gap-1 text-xs font-bold text-primary"
              >
                <Plus className="h-3 w-3" /> إضافة مواصفة
              </button>
            </div>
          </div>

          {/* ربط بإعلان */}
          <div className="rounded-xl border border-border p-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
              <Link2 className="h-4 w-4" /> إعلان مطابق (اختياري)
            </label>
            {linked ? (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <img src={linked.images?.[0] || "/placeholder.svg"} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{linked.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {linked.price ?? "—"} د.ب · {linked.condition ?? ""} {linked.city ? `· ${linked.city}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setF({ ...f, linked_listing_id: null })}
                  className="p-1 text-destructive"
                  aria-label="إلغاء الربط"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="ابحث في الإعلانات..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                />
                {listingSearch && (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {filteredListings.map((l) => (
                      <li key={l.id}>
                        <button
                          onClick={() => {
                            setF({ ...f, linked_listing_id: l.id });
                            setListingSearch("");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg p-1.5 text-right hover:bg-muted"
                        >
                          <img src={l.images?.[0] || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover" />
                          <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.price ?? "—"} د.ب</span>
                        </button>
                      </li>
                    ))}
                    {filteredListings.length === 0 && (
                      <li className="py-2 text-center text-xs text-muted-foreground">لا نتائج</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* أنواع المشاريع */}
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

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={f.essential} onChange={(e) => setF({ ...f, essential: e.target.checked })} className="h-4 w-4" />
              معدة أساسية
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4" />
              ظاهرة في الموقع
            </label>
          </div>
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

/* ===================== Packages ===================== */
const EMPTY_PKG: Pkg = {
  id: "",
  project_type_slug: "",
  tier: "standard",
  name: "",
  description: "",
  items: [],
  active: true,
  sort_order: 0,
};

function PackagesTab() {
  const [rows, setRows] = useState<Pkg[]>([]);
  const [types, setTypes] = useState<PType[]>([]);
  const [equipment, setEquipment] = useState<Equip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pkg | null>(null);

  const load = async () => {
    const [{ data: pk }, { data: ty }, { data: eq }] = await Promise.all([
      db.from("restaurant_packages").select("*").order("sort_order", { ascending: true }),
      db.from("restaurant_project_types").select("*").order("sort_order", { ascending: true }),
      db.from("restaurant_equipment").select("*").order("sort_order", { ascending: true }),
    ]);
    setRows(
      (pk ?? []).map((p: any) => ({ ...EMPTY_PKG, ...p, items: p.items ?? [] })) as Pkg[],
    );
    setTypes((ty ?? []) as PType[]);
    setEquipment((eq ?? []).map(normalizeEquip));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الباقة؟")) return;
    await db.from("restaurant_packages").delete().eq("id", id);
    setRows((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />;
  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ ...EMPTY_PKG, project_type_slug: types[0]?.slug ?? "" })}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        <Plus className="h-4 w-4" /> إضافة باقة
      </button>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد باقات بعد. أنشئ باقة اقتصادية/متوسطة/احترافية لكل نوع مشروع.
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {types.find((t) => t.slug === r.project_type_slug)?.name ?? r.project_type_slug} ·{" "}
                    {TIERS.find((t) => t[0] === r.tier)?.[1]} · {r.items.length} معدة
                  </p>
                </div>
                {!r.active && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">مخفية</span>
                )}
                <button onClick={() => setEditing(r)} className="p-1.5 text-primary" aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 text-destructive" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <PackageDialog
          value={editing}
          types={types}
          equipment={equipment}
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

function PackageDialog({
  value,
  types,
  equipment,
  onClose,
  onSaved,
}: {
  value: Pkg;
  types: PType[];
  equipment: Equip[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Pkg>(value);
  const [saving, setSaving] = useState(false);

  // المعدات المتاحة لنوع المشروع المختار
  const available = useMemo(
    () =>
      equipment.filter(
        (e) =>
          e.project_type_slugs.length === 0 ||
          e.project_type_slugs.includes(f.project_type_slug),
      ),
    [equipment, f.project_type_slug],
  );

  const setQty = (equipment_id: string, qty: number) =>
    setF((p) => {
      const items = p.items.filter((it) => it.equipment_id !== equipment_id);
      if (qty > 0) items.push({ equipment_id, qty });
      return { ...p, items };
    });

  const qtyOf = (id: string) => f.items.find((it) => it.equipment_id === id)?.qty ?? 0;

  const save = async () => {
    if (!f.name.trim()) return toast.error("اسم الباقة مطلوب");
    if (!f.project_type_slug) return toast.error("اختر نوع المشروع");
    setSaving(true);
    const payload = {
      project_type_slug: f.project_type_slug,
      tier: f.tier,
      name: f.name.trim(),
      description: f.description || null,
      items: f.items,
      active: f.active,
      sort_order: Number(f.sort_order) || 0,
    };
    const { error } = f.id
      ? await db.from("restaurant_packages").update(payload).eq("id", f.id)
      : await db.from("restaurant_packages").insert(payload);
    setSaving(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{f.id ? "تعديل باقة" : "إضافة باقة"}</h3>
          <button onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Inp label="اسم الباقة" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Sel
              label="نوع المشروع"
              value={f.project_type_slug}
              onChange={(v) => setF({ ...f, project_type_slug: v })}
              options={types.map((t) => [t.slug, t.name] as [string, string])}
            />
            <Sel label="المستوى" value={f.tier} onChange={(v) => setF({ ...f, tier: v })} options={TIERS} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold">وصف الباقة</label>
            <textarea
              value={f.description ?? ""}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">معدات الباقة وكمياتها</label>
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد معدات لهذا النوع. أضف معدات أولاً.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {available.map((e) => {
                  const q = qtyOf(e.id);
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-2 rounded-lg p-1.5 ${q > 0 ? "bg-primary/5" : ""}`}
                    >
                      <img src={e.image_url || e.images[0] || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm">{e.name}</span>
                      <input
                        type="number"
                        min={0}
                        value={q}
                        onChange={(ev) => setQty(e.id, Number(ev.target.value))}
                        className="w-16 rounded-lg border border-input bg-transparent px-2 py-1 text-center text-sm"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4" />
            ظاهرة في الموقع
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

/* ===================== Leads ===================== */
interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  project_type_slug: string | null;
  project_name: string | null;
  total: number;
  created_at: string;
}

function LeadsTab() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await db
      .from("restaurant_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    await db.from("restaurant_leads").delete().eq("id", id);
    setRows((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />;
  if (rows.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        لا توجد طلبات عملاء بعد.
      </div>
    );
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold">{r.name}</h3>
            <p className="text-xs text-muted-foreground">
              {r.project_name || "مشروع"} · الإجمالي {r.total} د.ب ·{" "}
              {new Date(r.created_at).toLocaleDateString("ar")}
            </p>
          </div>
          <a
            href={`https://wa.me/${r.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600"
          >
            واتساب {r.whatsapp}
          </a>
          <button onClick={() => remove(r.id)} className="p-1.5 text-destructive" aria-label="حذف">
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ===================== Inputs ===================== */
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

function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
