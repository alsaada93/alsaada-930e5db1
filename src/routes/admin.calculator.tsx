import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  Save,
  Power,
  BarChart3,
  Package,
  Coins,
  Puzzle,
  Ruler,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  calcProductPrice,
  BHD,
  type CalcAccessory,
  type CalcProduct,
  type PricingSettings,
  type QuoteSettings,
  type SizeLimits,
} from "@/lib/restaurant-calc";
import { useCalculatorData } from "@/hooks/useCalculatorAdmin";

export const Route = createFileRoute("/admin/calculator")({
  head: () => ({ meta: [{ title: "لوحة الحاسبة | حراج السعادة" }] }),
  component: AdminCalculatorPage,
});

const db = supabase as any;
const BUCKET = "listings";

type Tab = "products" | "pricing" | "accessories" | "sizes" | "quote" | "stats";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "المنتجات", icon: Package },
  { id: "pricing", label: "الأسعار", icon: Coins },
  { id: "accessories", label: "الملحقات", icon: Puzzle },
  { id: "sizes", label: "المقاسات", icon: Ruler },
  { id: "quote", label: "عرض السعر", icon: FileText },
  { id: "stats", label: "الإحصائيات", icon: BarChart3 },
];

function AdminCalculatorPage() {
  const { products, accessories, pricing, sizes, quote, loading, reload } =
    useCalculatorData(false);
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div>
      <AdminHeader
        title="لوحة تحكم الحاسبة"
        subtitle="إدارة المنتجات والأسعار والملحقات والمقاسات وعرض السعر — دون الحاجة لتعديل الكود"
      />
      <div className="p-4 md:p-6">
        <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {tab === "products" && (
              <ProductsTab products={products} reload={reload} pricing={pricing} sizes={sizes} />
            )}
            {tab === "pricing" && <PricingTab pricing={pricing} reload={reload} />}
            {tab === "accessories" && (
              <AccessoriesTab accessories={accessories} reload={reload} />
            )}
            {tab === "sizes" && <SizesTab sizes={sizes} reload={reload} />}
            {tab === "quote" && <QuoteTab quote={quote} reload={reload} />}
            {tab === "stats" && <StatsTab />}
          </>
        )}
      </div>
    </div>
  );
}

/* ===================== المنتجات ===================== */
function ProductsTab({
  products,
  reload,
  pricing,
  sizes,
}: {
  products: CalcProduct[];
  reload: () => void;
  pricing: PricingSettings;
  sizes: SizeLimits;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addProduct = async () => {
    const name = prompt("اسم المنتج الجديد:");
    if (!name) return;
    const slug =
      name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
      `product-${Date.now()}`;
    const { error } = await db.from("restaurant_products").insert({
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      kind: "table",
      base_price: 0,
      sort_order: products.length + 1,
    });
    if (error) return toast.error("تعذر الإضافة");
    toast.success("تمت إضافة المنتج");
    reload();
  };

  const saveProduct = async (p: CalcProduct) => {
    setSaving(p.id);
    const { error } = await db
      .from("restaurant_products")
      .update({
        name: p.name,
        kind: p.kind,
        base_price: p.base_price,
        active: p.active,
        sort_order: p.sort_order,
      })
      .eq("id", p.id);
    setSaving(null);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم الحفظ");
    reload();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    const { error } = await db.from("restaurant_products").delete().eq("id", id);
    if (error) return toast.error("تعذر الحذف");
    toast.success("تم الحذف");
    reload();
  };

  const toggleActive = async (p: CalcProduct) => {
    await db.from("restaurant_products").update({ active: !p.active }).eq("id", p.id);
    reload();
  };

  const uploadImage = async (p: CalcProduct, file: File) => {
    setSaving(p.id);
    const path = `calculator/${p.slug}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) {
      setSaving(null);
      return toast.error("تعذر رفع الصورة");
    }
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    await db.from("restaurant_products").update({ image_url: url }).eq("id", p.id);
    setSaving(null);
    toast.success("تم تحديث الصورة");
    reload();
  };

  return (
    <div className="space-y-4">
      <Button onClick={addProduct} className="gap-2">
        <Plus className="h-4 w-4" /> إضافة منتج
      </Button>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            saving={saving === p.id}
            onSave={saveProduct}
            onRemove={removeProduct}
            onToggle={toggleActive}
            onUploadClick={() => fileRefs.current[p.id]?.click()}
            pricing={pricing}
            sizes={sizes}
            fileInput={
              <input
                ref={(el) => {
                  fileRefs.current[p.id] = el;
                }}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(p, f);
                }}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  saving,
  onSave,
  onRemove,
  onToggle,
  onUploadClick,
  fileInput,
  pricing,
  sizes,
}: {
  product: CalcProduct;
  saving: boolean;
  onSave: (p: CalcProduct) => void;
  onRemove: (id: string) => void;
  onToggle: (p: CalcProduct) => void;
  onUploadClick: () => void;
  fileInput: React.ReactNode;
  pricing: PricingSettings;
  sizes: SizeLimits;
}) {
  const [p, setP] = useState(product);
  useEffect(() => setP(product), [product]);

  // معاينة مباشرة لسعر مقاس افتراضي
  const previewPrice = useMemo(
    () =>
      calcProductPrice({
        basePrice: p.base_price,
        lengthCm: 100,
        widthCm: 60,
        grade: "304",
        thicknessMm: "1",
        pricing,
        accessories: 0,
      }),
    [p.base_price, pricing],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={onUploadClick}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40"
          title="تغيير الصورة"
        >
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          {fileInput}
        </button>
        <div className="min-w-0 flex-1">
          <Input
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            className="font-semibold"
          />
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={p.active} onCheckedChange={() => onToggle(p)} />
            <Power className="h-3 w-3" /> {p.active ? "مفعّل" : "موقوف"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">النوع</Label>
          <select
            value={p.kind}
            onChange={(e) => setP({ ...p, kind: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="table">طاولة</option>
            <option value="sink">مغسلة</option>
            <option value="shelf">رف</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">السعر الأساسي (د.ب)</Label>
          <Input
            type="number"
            value={p.base_price}
            onChange={(e) => setP({ ...p, base_price: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        معاينة (100×60، 304، 1مم):{" "}
        <span className="font-bold text-primary">{BHD(previewPrice)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onSave(p)} disabled={saving} className="flex-1 gap-1">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          حفظ
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onRemove(p.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ===================== الأسعار ===================== */
function PricingTab({ pricing, reload }: { pricing: PricingSettings; reload: () => void }) {
  const [p, setP] = useState(pricing);
  const [saving, setSaving] = useState(false);
  useEffect(() => setP(pricing), [pricing]);

  const save = async () => {
    setSaving(true);
    const { error } = await db
      .from("restaurant_calc_settings")
      .upsert({ key: "pricing", value: p }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم حفظ الأسعار");
    reload();
  };

  const setGrade = (g: string, v: number) => setP({ ...p, grades: { ...p.grades, [g]: v } });
  const setThick = (t: string, v: number) =>
    setP({ ...p, thickness: { ...p.thickness, [t]: v } });

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="سعر المتر الأساسي">
        <Field label="سعر المتر المربع (د.ب)">
          <Input
            type="number"
            value={p.basePerM2}
            onChange={(e) => setP({ ...p, basePerM2: Number(e.target.value) })}
          />
        </Field>
      </Section>

      <Section title="معامل نوع الستانلس (مضاعف السعر)">
        <div className="grid grid-cols-3 gap-3">
          {["201", "304", "316"].map((g) => (
            <Field key={g} label={`ستانلس ${g}`}>
              <Input
                type="number"
                step="0.01"
                value={p.grades[g] ?? 1}
                onChange={(e) => setGrade(g, Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="معامل السمك (مضاعف السعر)">
        <div className="grid grid-cols-3 gap-3">
          {["0.8", "1", "1.2"].map((t) => (
            <Field key={t} label={`${t} مم`}>
              <Input
                type="number"
                step="0.01"
                value={p.thickness[t] ?? 1}
                onChange={(e) => setThick(t, Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ الأسعار
      </Button>
    </div>
  );
}

/* ===================== الملحقات ===================== */
function AccessoriesTab({
  accessories,
  reload,
}: {
  accessories: CalcAccessory[];
  reload: () => void;
}) {
  const [rows, setRows] = useState(accessories);
  const [saving, setSaving] = useState(false);
  useEffect(() => setRows(accessories), [accessories]);

  const add = async () => {
    const name = prompt("اسم الملحق الجديد:");
    if (!name) return;
    const { error } = await db.from("restaurant_accessories").insert({
      name,
      slug: `acc-${Date.now().toString(36)}`,
      price: 0,
      sort_order: rows.length + 1,
    });
    if (error) return toast.error("تعذر الإضافة");
    toast.success("تمت الإضافة");
    reload();
  };

  const saveRow = async (a: CalcAccessory) => {
    setSaving(true);
    const { error } = await db
      .from("restaurant_accessories")
      .update({ name: a.name, price: a.price, active: a.active })
      .eq("id", a.id);
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم الحفظ");
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الملحق؟")) return;
    await db.from("restaurant_accessories").delete().eq("id", id);
    reload();
  };

  return (
    <div className="max-w-2xl space-y-3">
      <Button onClick={add} className="gap-2">
        <Plus className="h-4 w-4" /> إضافة ملحق
      </Button>
      {rows.map((a, i) => (
        <div
          key={a.id}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex-1 min-w-[160px]">
            <Label className="text-xs">الاسم</Label>
            <Input
              value={a.name}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...a, name: e.target.value };
                setRows(next);
              }}
            />
          </div>
          <div className="w-28">
            <Label className="text-xs">السعر (د.ب)</Label>
            <Input
              type="number"
              value={a.price}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...a, price: Number(e.target.value) };
                setRows(next);
              }}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              checked={a.active}
              onCheckedChange={(v) => {
                const next = [...rows];
                next[i] = { ...a, active: v };
                setRows(next);
              }}
            />
          </div>
          <Button size="sm" onClick={() => saveRow(rows[i])} disabled={saving}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ===================== المقاسات ===================== */
function SizesTab({ sizes, reload }: { sizes: SizeLimits; reload: () => void }) {
  const [s, setS] = useState(sizes);
  const [saving, setSaving] = useState(false);
  useEffect(() => setS(sizes), [sizes]);

  const save = async () => {
    setSaving(true);
    const { error } = await db
      .from("restaurant_calc_settings")
      .upsert({ key: "sizes", value: s }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم حفظ المقاسات");
    reload();
  };

  const dims: { key: "length" | "width" | "height"; label: string }[] = [
    { key: "length", label: "الطول" },
    { key: "width", label: "العرض" },
    { key: "height", label: "الارتفاع" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="الوحدة">
        <select
          value={s.unit}
          onChange={(e) => setS({ ...s, unit: e.target.value as "cm" | "m" })}
          className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="cm">سنتيمتر (سم)</option>
          <option value="m">متر (م)</option>
        </select>
      </Section>
      {dims.map((d) => (
        <Section key={d.key} title={d.label}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الحد الأدنى">
              <Input
                type="number"
                value={s[d.key].min}
                onChange={(e) =>
                  setS({ ...s, [d.key]: { ...s[d.key], min: Number(e.target.value) } })
                }
              />
            </Field>
            <Field label="الحد الأقصى">
              <Input
                type="number"
                value={s[d.key].max}
                onChange={(e) =>
                  setS({ ...s, [d.key]: { ...s[d.key], max: Number(e.target.value) } })
                }
              />
            </Field>
          </div>
        </Section>
      ))}
      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ المقاسات
      </Button>
    </div>
  );
}

/* ===================== عرض السعر ===================== */
function QuoteTab({ quote, reload }: { quote: QuoteSettings; reload: () => void }) {
  const [q, setQ] = useState(quote);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  useEffect(() => setQ(quote), [quote]);

  const save = async () => {
    setSaving(true);
    const { error } = await db
      .from("restaurant_calc_settings")
      .upsert({ key: "quote", value: q }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم حفظ إعدادات عرض السعر");
    reload();
  };

  const uploadLogo = async (file: File) => {
    const path = `calculator/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) return toast.error("تعذر رفع الشعار");
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    setQ({ ...q, logoUrl: url });
    toast.success("تم رفع الشعار (لا تنسَ الحفظ)");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="عنوان عرض السعر (PDF)">
        <Input value={q.pdfTitle} onChange={(e) => setQ({ ...q, pdfTitle: e.target.value })} />
      </Field>
      <Field label="نص تذييل عرض السعر">
        <Input value={q.pdfFooter} onChange={(e) => setQ({ ...q, pdfFooter: e.target.value })} />
      </Field>
      <Field label="رقم واتساب">
        <Input
          value={q.whatsapp}
          onChange={(e) => setQ({ ...q, whatsapp: e.target.value })}
          placeholder="مثال: 97312345678"
        />
      </Field>
      <Field label="الرسالة المرسلة للعميل">
        <Textarea
          value={q.clientMessage}
          onChange={(e) => setQ({ ...q, clientMessage: e.target.value })}
          rows={3}
        />
      </Field>
      <Field label="شعار السعادة ماركت">
        <div className="flex items-center gap-3">
          {q.logoUrl && (
            <img src={q.logoUrl} alt="logo" className="h-12 w-auto rounded border border-border" />
          )}
          <Button variant="outline" onClick={() => logoRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> رفع شعار
          </Button>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadLogo(f);
            }}
          />
        </div>
      </Field>
      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
}

/* ===================== الإحصائيات ===================== */
interface CalcEvent {
  product_slug: string | null;
  product_name: string | null;
  total_price: number;
  created_at: string;
}
function StatsTab() {
  const [events, setEvents] = useState<CalcEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    db.from("restaurant_calc_events")
      .select("product_slug,product_name,total_price,created_at")
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data }: any) => {
        setEvents(
          (data ?? []).map((d: any) => ({ ...d, total_price: Number(d.total_price ?? 0) })),
        );
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const sum = events.reduce((s, e) => s + e.total_price, 0);
    const avg = total ? sum / total : 0;
    const counts: Record<string, number> = {};
    for (const e of events) {
      const k = e.product_name || e.product_slug || "غير محدد";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { total, avg, top };
  }, [events]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="مرات استخدام الحاسبة" value={String(stats.total)} icon={Eye} />
        <StatCard
          label="عروض الأسعار المُنشأة"
          value={String(stats.total)}
          icon={FileText}
        />
        <StatCard label="متوسط سعر الطلب" value={BHD(stats.avg)} icon={Coins} />
      </div>
      <Section title="أكثر المنتجات طلباً">
        {stats.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
        ) : (
          <div className="space-y-2">
            {stats.top.map(([name, count]) => {
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ===================== عناصر مساعدة ===================== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}
