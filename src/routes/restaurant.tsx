import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  UtensilsCrossed,
  Coffee,
  Croissant,
  ChefHat,
  Sandwich,
  CupSoda,
  Cake,
  Settings2,
  Plus,
  Minus,
  Trash2,
  Printer,
  Save,
  Pencil,
  X,
  Ruler,
  User,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProjectTypes, useEquipment, useCalcSettings, type Equipment } from "@/hooks/useRestaurant";
import {
  steelTablePrice,
  sinkPrice,
  shelfPrice,
  SIZE_MIN,
  SIZE_MAX,
  BHD,
  type SteelTableConfig,
  type SinkConfig,
  type ShelfConfig,
  type SteelTableSettings,
  type SinkSettings,
  type ShelfSettings,
} from "@/lib/restaurant-calc";

const ICONS: Record<string, typeof Coffee> = {
  UtensilsCrossed,
  Coffee,
  Croissant,
  ChefHat,
  Sandwich,
  CupSoda,
  Cake,
  Settings2,
};

export const Route = createFileRoute("/restaurant")({
  head: () => ({
    meta: [
      { title: "دراسة تكلفة المشاريع | حراج السعادة" },
      {
        name: "description",
        content:
          "احسب تكلفة مشروع مطعمك أو الكوفي شوب بالكامل بأسعار حقيقية للمعدات الجديدة والمستعملة، مع حاسبة الطاولات الستانلس والمغاسل والأرفف وتقرير قابل للطباعة.",
      },
      { property: "og:title", content: "دراسة تكلفة المشاريع | حراج السعادة" },
      {
        property: "og:description",
        content: "نظام احترافي لبناء مشروعك وحساب تكلفته بالكامل بأسعار حقيقية.",
      },
      { property: "og:url", content: "https://www.alsaada.sale/restaurant" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/restaurant" }],
  }),
  component: RestaurantPage,
});

type Cond = "new" | "used";
type NumOrEmpty = number | "";

interface Selection {
  condition: Cond;
}
interface TableItem extends SteelTableConfig {
  uid: string;
  price: number;
}
interface SinkItem extends SinkConfig {
  uid: string;
  price: number;
}
interface ShelfItem extends ShelfConfig {
  uid: string;
  price: number;
}

const newUid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function RestaurantPage() {
  const { user } = useAuth();
  const { types } = useProjectTypes();
  const { equipment } = useEquipment();
  const { steel, sink, shelf } = useCalcSettings();

  const [activeType, setActiveType] = useState<string | null>(null);

  // بيانات العميل والمالية
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(10); // الافتراضي 10%

  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sinks, setSinks] = useState<SinkItem[]>([]);
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [editSink, setEditSink] = useState<SinkItem | null>(null);
  const [editShelf, setEditShelf] = useState<ShelfItem | null>(null);

  // نظام الحفظ التلقائي (Drafting)
  const draftKey = "alsaada_project_draft";

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setActiveType(parsed.activeType || null);
        setCustomerName(parsed.customerName || "");
        setCustomerPhone(parsed.customerPhone || "");
        setDeliveryDate(parsed.deliveryDate || "");
        setNotes(parsed.notes || "");
        setDiscount(parsed.discount || 0);
        setVatRate(parsed.vatRate ?? 10);
        setSelected(parsed.selected || {});
        setTables(parsed.tables || []);
        setSinks(parsed.sinks || []);
        setShelves(parsed.shelves || []);
        toast.info("تم استعادة مسودة مشروعك السابقة");
      }
    } catch (e) {
      console.error("خطأ في استرجاع المسودة:", e);
    }
  }, []);

  useEffect(() => {
    const draft = {
      activeType,
      customerName,
      customerPhone,
      deliveryDate,
      notes,
      discount,
      vatRate,
      selected,
      tables,
      sinks,
      shelves,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    activeType,
    customerName,
    customerPhone,
    deliveryDate,
    notes,
    discount,
    vatRate,
    selected,
    tables,
    sinks,
    shelves,
  ]);

  const visibleEquipment = useMemo(() => {
    if (!activeType) return [];
    return equipment.filter((e) => e.project_type_slugs.length === 0 || e.project_type_slugs.includes(activeType));
  }, [equipment, activeType]);

  const toggle = (e: Equipment) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[e.id]) delete next[e.id];
      else next[e.id] = { condition: "new" };
      return next;
    });

  const setCond = (id: string, condition: Cond) => setSelected((s) => ({ ...s, [id]: { condition } }));

  // الإجماليات
  const equipMap = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment]);
  const chosen = Object.entries(selected)
    .map(([id, sel]) => ({ e: equipMap.get(id), sel }))
    .filter((x) => x.e) as { e: Equipment; sel: Selection }[];

  const equipNewTotal = chosen.reduce((a, x) => a + x.e.price_new, 0);
  const equipUsedTotal = chosen.reduce((a, x) => a + x.e.price_used, 0);
  const equipChosenTotal = chosen.reduce((a, x) => a + (x.sel.condition === "new" ? x.e.price_new : x.e.price_used), 0);
  const tablesTotal = tables.reduce((a, t) => a + t.price, 0);
  const sinksTotal = sinks.reduce((a, s) => a + s.price, 0);
  const shelvesTotal = shelves.reduce((a, s) => a + s.price, 0);

  const subTotal = equipChosenTotal + tablesTotal + sinksTotal + shelvesTotal;
  const discountAmount = discount;
  const netTotal = Math.max(0, subTotal - discountAmount);
  const vatAmount = netTotal * (vatRate / 100);
  const finalTotal = netTotal + vatAmount;

  const savings = equipNewTotal > 0 ? Math.round((1 - equipUsedTotal / equipNewTotal) * 100) : 0;

  const saveProject = async () => {
    if (!user) {
      toast.info("سجّل الدخول لحفظ المشروع واستكماله لاحقاً");
      return;
    }
    if (subTotal === 0) {
      toast.error("لا يمكن حفظ مشروع فارغ. قم بإضافة معدات أولاً.");
      return;
    }

    setSaving(true);
    const { error } = await (supabase as any).from("saved_restaurant_projects").insert({
      user_id: user.id,
      name: types.find((t) => t.slug === activeType)?.name ?? "مشروعي",
      total: finalTotal,
      data: {
        activeType,
        customerName,
        customerPhone,
        deliveryDate,
        notes,
        discount,
        vatRate,
        selected,
        tables,
        sinks,
        shelves,
      },
    });
    setSaving(false);

    if (error) {
      toast.error("تعذّر حفظ المشروع");
    } else {
      toast.success("تم حفظ المشروع بنجاح");
      localStorage.removeItem(draftKey);
    }
  };

  // تجميع العناصر للطباعة
  const printGroups = useMemo(() => {
    let index = 1;
    const items: Array<{ id: number; desc: string; qty: number; unitPrice: number; total: number }> = [];

    chosen.forEach(({ e, sel }) => {
      const price = sel.condition === "new" ? e.price_new : e.price_used;
      items.push({
        id: index++,
        desc: `${e.name} (${sel.condition === "new" ? "جديد" : "مستعمل"})`,
        qty: 1,
        unitPrice: price,
        total: price,
      });
    });

    const groupedTables = tables.reduce(
      (acc, t) => {
        const key = `${t.grade}-${t.length}-${t.width}-${t.midShelf}`;
        if (!acc[key]) acc[key] = { ...t, qty: 0 };
        acc[key].qty += 1;
        return acc;
      },
      {} as Record<string, any>,
    );
    Object.values(groupedTables).forEach((t) => {
      items.push({
        id: index++,
        desc: `طاولة ستانلس ${t.grade} (${t.length}×${t.width}سم) ${t.midShelf ? "+ شلف وسطي" : ""}`,
        qty: t.qty,
        unitPrice: t.price,
        total: t.price * t.qty,
      });
    });

    const groupedSinks = sinks.reduce(
      (acc, s) => {
        const key = `${s.length}-${s.width}-${s.bowls}-${s.bottomShelf}-${s.bowlDepth}`;
        if (!acc[key]) acc[key] = { ...s, qty: 0 };
        acc[key].qty += 1;
        return acc;
      },
      {} as Record<string, any>,
    );
    Object.values(groupedSinks).forEach((s) => {
      items.push({
        id: index++,
        desc: `مغسلة ستانلس 304 (${s.length}×${s.width}سم، ${s.bowls} حوض، عمق ${s.bowlDepth}سم) ${s.bottomShelf ? "+ شلف سفلي" : ""}`,
        qty: s.qty,
        unitPrice: s.price,
        total: s.price * s.qty,
      });
    });

    const groupedShelves = shelves.reduce(
      (acc, s) => {
        const key = `${s.length}-${s.width}`;
        if (!acc[key]) acc[key] = { ...s, qty: 0 };
        acc[key].qty += 1;
        return acc;
      },
      {} as Record<string, any>,
    );
    Object.values(groupedShelves).forEach((s) => {
      items.push({
        id: index++,
        desc: `رف ستانلس (${s.length}×${s.width}سم)`,
        qty: s.qty,
        unitPrice: s.price,
        total: s.price * s.qty,
      });
    });

    return items;
  }, [chosen, tables, sinks, shelves]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:p-0 print:m-0 print:max-w-none">
        {/* المحتوى التفاعلي (يخفى عند الطباعة) */}
        <div className="print:hidden">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold md:text-4xl">دراسة تكلفة المشاريع</h1>
            <p className="mt-2 text-muted-foreground">
              ابنِ مشروعك بالكامل واحسب تكلفته بأسعار حقيقية للمعدات الجديدة والمستعملة
            </p>
          </header>

          <section className="mb-10 rounded-2xl border border-border p-5 bg-muted/10">
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بيانات العميل (لعرض السعر)
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">اسم العميل</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="شركة التقدم..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="33XXXXXX"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">تاريخ الاستلام المتوقع</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">١. اختر نوع المشروع</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {types.map((t) => {
                const Icon = ICONS[t.icon ?? ""] ?? Settings2;
                const active = activeType === t.slug;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveType(t.slug)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                    <span className="text-sm font-bold">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {activeType && (
            <>
              <section className="mt-10">
                <h2 className="mb-3 text-lg font-bold">٢. اختر معدات المشروع</h2>
                {visibleEquipment.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                    لا توجد معدات مضافة لهذا النوع بعد. يمكن للإدارة إضافتها من لوحة التحكم.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleEquipment.map((e) => {
                      const sel = selected[e.id];
                      return (
                        <div
                          key={e.id}
                          className={`flex flex-col overflow-hidden rounded-2xl border ${
                            sel ? "border-primary" : "border-border"
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={e.image_url || "/placeholder.svg"}
                              alt={e.name}
                              loading="lazy"
                              className="aspect-[4/3] w-full object-cover"
                            />
                            {e.brand_logo_url && (
                              <span className="absolute left-2 top-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-1 shadow">
                                <img
                                  src={e.brand_logo_url}
                                  alt={e.manufacturer ?? ""}
                                  className="h-full w-full object-contain"
                                />
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-1 p-3">
                            <h3 className="font-bold leading-tight">{e.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {[e.manufacturer, e.country_of_origin].filter(Boolean).join(" • ")}
                            </p>
                            {e.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
                            )}
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sel) toggle(e);
                                  setCond(e.id, "new");
                                }}
                                className={`rounded-lg border p-2 text-center ${
                                  sel?.condition === "new"
                                    ? "border-primary bg-primary/10 font-bold text-primary"
                                    : "border-border"
                                }`}
                              >
                                جديد
                                <div className="text-xs">{BHD(e.price_new)}</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sel) toggle(e);
                                  setCond(e.id, "used");
                                }}
                                className={`rounded-lg border p-2 text-center ${
                                  sel?.condition === "used"
                                    ? "border-primary bg-primary/10 font-bold text-primary"
                                    : "border-border"
                                }`}
                              >
                                مستعمل
                                <div className="text-xs">{BHD(e.price_used)}</div>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggle(e)}
                              className={`mt-2 flex items-center justify-center gap-1 rounded-lg p-2 text-sm font-bold ${
                                sel ? "bg-destructive/10 text-destructive" : "bg-primary text-primary-foreground"
                              }`}
                            >
                              {sel ? (
                                <>
                                  <Minus className="h-4 w-4" /> إزالة من المشروع
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" /> إضافة للمشروع
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <SteelTableCalculator
                settings={steel}
                onAdd={(cfg, price, count) =>
                  setTables((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])
                }
              />

              <SinkCalculator
                settings={sink}
                onAdd={(cfg, price, count) =>
                  setSinks((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])
                }
              />

              <ShelfCalculator
                settings={shelf}
                onAdd={(cfg, price, count) =>
                  setShelves((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])
                }
              />

              <section className="mt-12">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">٦. ملخص المشروع</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                    >
                      <Printer className="h-4 w-4" /> طباعة / PDF
                    </button>
                    <button
                      type="button"
                      onClick={saveProject}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" /> حفظ المشروع
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-muted text-right">
                      <tr>
                        <th className="p-3">العنصر</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">التكلفة</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {chosen.map(({ e, sel }) => (
                        <tr key={e.id} className="border-t border-border">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={e.image_url || "/placeholder.svg"}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                              {e.name}
                            </div>
                          </td>
                          <td className="p-3">{sel.condition === "new" ? "جديد" : "مستعمل"}</td>
                          <td className="p-3 font-bold">{BHD(sel.condition === "new" ? e.price_new : e.price_used)}</td>
                          <td className="p-3">
                            <button onClick={() => toggle(e)} aria-label="حذف">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tables.map((t) => (
                        <tr key={t.uid} className="border-t border-border">
                          <td className="p-3">
                            طاولة ستانلس {t.grade} ({t.length}×{t.width}سم{t.midShelf ? " + شلف وسطي" : ""})
                          </td>
                          <td className="p-3">تصنيع</td>
                          <td className="p-3 font-bold">{BHD(t.price)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditTable(t)} aria-label="تعديل">
                                <Pencil className="h-4 w-4 text-primary" />
                              </button>
                              <button
                                onClick={() => setTables((p) => p.filter((x) => x.uid !== t.uid))}
                                aria-label="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sinks.map((s) => (
                        <tr key={s.uid} className="border-t border-border">
                          <td className="p-3">
                            مغسلة ستانلس 304 ({s.length}×{s.width}سم، {s.bowls} حوض، عمق {s.bowlDepth}سم
                            {s.bottomShelf ? " + شلف سفلي" : ""})
                          </td>
                          <td className="p-3">تصنيع</td>
                          <td className="p-3 font-bold">{BHD(s.price)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditSink(s)} aria-label="تعديل">
                                <Pencil className="h-4 w-4 text-primary" />
                              </button>
                              <button
                                onClick={() => setSinks((p) => p.filter((x) => x.uid !== s.uid))}
                                aria-label="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {shelves.map((s) => (
                        <tr key={s.uid} className="border-t border-border">
                          <td className="p-3">
                            رف ستانلس ({s.length}×{s.width}سم)
                          </td>
                          <td className="p-3">تصنيع</td>
                          <td className="p-3 font-bold">{BHD(s.price)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditShelf(s)} aria-label="تعديل">
                                <Pencil className="h-4 w-4 text-primary" />
                              </button>
                              <button
                                onClick={() => setShelves((p) => p.filter((x) => x.uid !== s.uid))}
                                aria-label="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {chosen.length === 0 && tables.length === 0 && sinks.length === 0 && shelves.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            لم تتم إضافة أي عناصر بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4">
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">
                      ملاحظات وشروط المشروع (تظهر في عرض السعر)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="اكتب هنا أي شروط خاصة بالتركيب، الضمان، أو الدفع..."
                    />
                  </div>
                  <div className="rounded-2xl border border-border p-4 flex flex-col justify-center space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold">نسبة ضريبة القيمة المضافة (%)</label>
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(Number(e.target.value))}
                        className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold">قيمة الخصم الثابت (د.ب)</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Stat label="الإجمالي الفرعي" value={BHD(subTotal)} />
                  <Stat label="نسبة التوفير" value={`${savings}%`} accent />
                  <Stat label="الخصم" value={`- ${BHD(discountAmount)}`} />
                  <Stat label={`الضريبة (${vatRate}%)`} value={BHD(vatAmount)} />
                  <Stat label="المجموع النهائي" value={BHD(finalTotal)} primary />
                </div>
              </section>
            </>
          )}
        </div>

        {/* عرض الطباعة - عرض أسعار احترافي */}
        <div
          className="hidden print:block font-sans text-black bg-white w-full print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact]"
          dir="rtl"
        >
          <table className="w-full">
            <thead className="table-header-group">
              <tr>
                <td>
                  <div className="h-[180px]"></div>
                </td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <div className="fixed top-0 left-0 right-0 pt-8 pb-4 border-b-4 border-gray-900 bg-white z-50 flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tight">حراج السعادة</h1>
                      <h2 className="text-xl font-bold text-gray-600 mt-1 uppercase tracking-widest">Alsaada Market</h2>
                    </div>
                    <div className="text-left text-sm font-medium space-y-1">
                      <p>
                        <span className="text-gray-500">رقم العرض:</span> QT-
                        {Math.floor(Date.now() / 1000)
                          .toString()
                          .slice(-6)}
                      </p>
                      <p>
                        <span className="text-gray-500">التاريخ:</span> {new Date().toLocaleDateString("ar-BH")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between border-2 border-gray-200 rounded-lg p-5 mb-8 bg-gray-50 mt-4">
                    <div className="space-y-2">
                      <p>
                        <span className="font-bold text-gray-500 w-24 inline-block">العميل:</span>{" "}
                        <span className="font-bold text-lg">{customerName || "........................"}</span>
                      </p>
                      <p>
                        <span className="font-bold text-gray-500 w-24 inline-block">الهاتف:</span>{" "}
                        <span className="font-bold" dir="ltr">
                          {customerPhone || "........................"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p>
                        <span className="font-bold text-gray-500 w-24 inline-block">نوع المشروع:</span>{" "}
                        <span className="font-bold">{types.find((t) => t.slug === activeType)?.name || "-"}</span>
                      </p>
                      <p>
                        <span className="font-bold text-gray-500 w-24 inline-block">الاستلام:</span>{" "}
                        <span className="font-bold">{deliveryDate || "........................"}</span>
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-right mb-8 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-y-2 border-gray-900">
                        <th className="py-3 px-2 text-center font-bold w-12">م</th>
                        <th className="py-3 px-2 font-bold">الوصف</th>
                        <th className="py-3 px-2 text-center font-bold w-20">الكمية</th>
                        <th className="py-3 px-2 text-center font-bold w-32">سعر الوحدة</th>
                        <th className="py-3 px-2 text-center font-bold w-32">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printGroups.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 print:break-inside-avoid">
                          <td className="py-3 px-2 text-center text-sm font-bold text-gray-500">{item.id}</td>
                          <td className="py-3 px-2 text-sm font-bold">{item.desc}</td>
                          <td className="py-3 px-2 text-center text-sm">{item.qty}</td>
                          <td className="py-3 px-2 text-center text-sm">{BHD(item.unitPrice)}</td>
                          <td className="py-3 px-2 text-center font-bold">{BHD(item.total)}</td>
                        </tr>
                      ))}
                      {printGroups.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 font-bold">
                            لا توجد عناصر في المشروع
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-start mb-16 print:break-inside-avoid">
                    <div className="w-1/2 pr-4">
                      {notes && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm">
                          <h4 className="font-bold mb-2 border-b pb-1">ملاحظات وشروط المشروع:</h4>
                          <p className="whitespace-pre-wrap leading-relaxed">{notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="w-[45%] border-2 border-gray-900 rounded-lg overflow-hidden">
                      <div className="flex justify-between py-2 px-4 border-b border-gray-200 bg-white text-sm">
                        <span className="font-bold text-gray-600">الإجمالي الفرعي:</span>
                        <span className="font-bold">{BHD(subTotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between py-2 px-4 border-b border-gray-200 bg-white text-sm text-red-600">
                          <span className="font-bold">الخصم:</span>
                          <span className="font-bold">- {BHD(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 px-4 border-b border-gray-200 bg-white text-sm">
                        <span className="font-bold text-gray-600">ضريبة القيمة المضافة ({vatRate}%):</span>
                        <span className="font-bold">{BHD(vatAmount)}</span>
                      </div>
                      <div className="flex justify-between py-4 px-4 bg-gray-900 text-white text-lg">
                        <span className="font-extrabold">الإجمالي النهائي:</span>
                        <span className="font-extrabold">{BHD(finalTotal)}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot className="table-footer-group">
              <tr>
                <td>
                  <div className="h-[80px]"></div>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="fixed bottom-0 left-0 right-0 pt-3 border-t-2 border-gray-900 text-center text-sm text-gray-600 bg-white pb-3">
            <p className="font-bold text-black mb-1">متخصصون في معدات مطاعم، أثاث، إلكترونيات</p>
            <p className="font-medium">
              مملكة البحرين - توبلي | هاتف:{" "}
              <span className="font-bold text-black" dir="ltr">
                33982383
              </span>{" "}
              | الموقع: www.alsaada.sale
            </p>
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>

      {editTable && (
        <EditTableDialog
          settings={steel}
          value={editTable}
          onClose={() => setEditTable(null)}
          onSave={(updated) => {
            setTables((p) => p.map((x) => (x.uid === updated.uid ? updated : x)));
            setEditTable(null);
          }}
        />
      )}
      {editSink && (
        <EditSinkDialog
          settings={sink}
          value={editSink}
          onClose={() => setEditSink(null)}
          onSave={(updated) => {
            setSinks((p) => p.map((x) => (x.uid === updated.uid ? updated : x)));
            setEditSink(null);
          }}
        />
      )}
      {editShelf && (
        <EditShelfDialog
          settings={shelf}
          value={editShelf}
          onClose={() => setEditShelf(null)}
          onSave={(updated) => {
            setShelves((p) => p.map((x) => (x.uid === updated.uid ? updated : x)));
            setEditShelf(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  primary,
  accent,
}: {
  label: string;
  value: string;
  primary?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        primary
          ? "border-primary bg-primary text-primary-foreground"
          : accent
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-border"
      }`}
    >
      <div className={`text-xs ${primary ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  );
}

function CountField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Field label="العدد">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="rounded-lg border border-border p-2 hover:bg-muted"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(50, value + 1))}
          className="rounded-lg border border-border p-2 hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Field>
  );
}

function SteelTableCalculator({
  settings,
  onAdd,
}: {
  settings: SteelTableSettings;
  onAdd: (cfg: SteelTableConfig, price: number, count: number) => void;
}) {
  const [grade, setGrade] = useState<"201" | "304">("201");
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [midShelf, setMidShelf] = useState(false);
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const price = isValid
    ? steelTablePrice({ grade, length: Number(length), width: Number(width), midShelf }, settings)
    : 0;

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٣. حاسبة تصنيع الطاولات الستانلس</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="نوعية الاستيل">
            <div className="flex gap-2">
              {(["201", "304"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`flex-1 rounded-lg border p-2 font-bold ${
                    grade === g ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                  }`}
                >
                  استيل {g}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الطول (سم)">
              <NumInput value={length} onChange={setLength} />
            </Field>
            <Field label="العرض (سم)">
              <NumInput value={width} onChange={setWidth} />
            </Field>
          </div>
          <CountField value={count} onChange={setCount} />
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={midShelf}
              onChange={(e) => setMidShelf(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            إضافة شلف وسطي (الشلف السفلي مشمول افتراضياً)
          </label>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden">
          <TableDrawing length={length} width={width} midShelf={midShelf} grade={grade} />
          <div className="text-center z-10">
            <div className="text-sm text-muted-foreground">السعر للقطعة الواحدة</div>
            <div className="text-2xl font-extrabold text-primary">{isValid ? BHD(price) : "---"}</div>
            {count > 1 && isValid && (
              <div className="mt-1 text-xs text-muted-foreground">
                الإجمالي ({count}): <span className="font-bold">{BHD(price * count)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onAdd({ grade, length: Number(length), width: Number(width), midShelf }, price, count);
                setLength("");
                setWidth("");
              }
            }}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            <Plus className="h-4 w-4" /> إضافة إلى المشروع
          </button>
        </div>
      </div>
    </section>
  );
}

function SinkCalculator({
  settings,
  onAdd,
}: {
  settings: SinkSettings;
  onAdd: (cfg: SinkConfig, price: number, count: number) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [bowls, setBowls] = useState(1);
  const [bottomShelf, setBottomShelf] = useState(false);
  const [bowlDepth, setBowlDepth] = useState(settings.defaultDepth);
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const price = isValid
    ? sinkPrice({ length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth }, settings)
    : 0;

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٤. حاسبة تفصيل المغاسل (استيل 304)</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الطول (سم)">
              <NumInput value={length} onChange={setLength} />
            </Field>
            <Field label="العرض (سم)">
              <NumInput value={width} onChange={setWidth} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد الأحواض">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBowls((b) => Math.max(1, b - 1))}
                  className="rounded-lg border border-border p-2 hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold">{bowls}</span>
                <button
                  type="button"
                  onClick={() => setBowls((b) => Math.min(10, b + 1))}
                  className="rounded-lg border border-border p-2 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <CountField value={count} onChange={setCount} />
          </div>
          <Field label="عمق الحوض (سم)">
            <div className="flex flex-wrap gap-2">
              {settings.depths.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setBowlDepth(d)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                    bowlDepth === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                  }`}
                >
                  {d}
                  {d === settings.defaultDepth && <span className="ms-1 text-[10px] text-emerald-600">موصى به</span>}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={bottomShelf}
              onChange={(e) => setBottomShelf(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            إضافة شلف سفلي
          </label>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden">
          <SinkDrawing length={length} width={width} bowls={bowls} bottomShelf={bottomShelf} bowlDepth={bowlDepth} />
          <div className="text-center z-10">
            <div className="text-sm text-muted-foreground">السعر للقطعة الواحدة</div>
            <div className="text-2xl font-extrabold text-primary">{isValid ? BHD(price) : "---"}</div>
            {count > 1 && isValid && (
              <div className="mt-1 text-xs text-muted-foreground">
                الإجمالي ({count}): <span className="font-bold">{BHD(price * count)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onAdd({ length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth }, price, count);
                setLength("");
                setWidth("");
              }
            }}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            <Plus className="h-4 w-4" /> إضافة إلى المشروع
          </button>
        </div>
      </div>
    </section>
  );
}

function ShelfCalculator({
  settings,
  onAdd,
}: {
  settings: ShelfSettings;
  onAdd: (cfg: ShelfConfig, price: number, count: number) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const price = isValid ? shelfPrice({ length: Number(length), width: Number(width) }, settings) : 0;

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٥. حاسبة تفصيل الأرفف (استيل)</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الطول (سم)">
              <NumInput value={length} onChange={setLength} />
            </Field>
            <Field label="العرض (سم)">
              <NumInput value={width} onChange={setWidth} />
            </Field>
          </div>
          <CountField value={count} onChange={setCount} />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden">
          <ShelfDrawing length={length} width={width} />
          <div className="text-center z-10">
            <div className="text-sm text-muted-foreground">السعر للقطعة الواحدة</div>
            <div className="text-2xl font-extrabold text-primary">{isValid ? BHD(price) : "---"}</div>
            {count > 1 && isValid && (
              <div className="mt-1 text-xs text-muted-foreground">
                الإجمالي ({count}): <span className="font-bold">{BHD(price * count)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onAdd({ length: Number(length), width: Number(width) }, price, count);
                setLength("");
                setWidth("");
              }
            }}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            <Plus className="h-4 w-4" /> إضافة إلى المشروع
          </button>
        </div>
      </div>
    </section>
  );
}

function DialogShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="rounded hover:bg-muted p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

function SaveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
    >
      حفظ التعديل
    </button>
  );
}
function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted">
      إلغاء
    </button>
  );
}

function EditTableDialog({
  settings,
  value,
  onClose,
  onSave,
}: {
  settings: SteelTableSettings;
  value: TableItem;
  onClose: () => void;
  onSave: (t: TableItem) => void;
}) {
  const [grade, setGrade] = useState<"201" | "304">(value.grade);
  const [length, setLength] = useState<NumOrEmpty>(value.length);
  const [width, setWidth] = useState<NumOrEmpty>(value.width);
  const [midShelf, setMidShelf] = useState(value.midShelf);

  const isValid = length !== "" && width !== "";
  const price = isValid
    ? steelTablePrice({ grade, length: Number(length), width: Number(width), midShelf }, settings)
    : 0;

  return (
    <DialogShell
      title="تعديل الطاولة"
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SaveBtn
            disabled={!isValid}
            onClick={() =>
              isValid && onSave({ ...value, grade, length: Number(length), width: Number(width), midShelf, price })
            }
          />
        </>
      }
    >
      <Field label="نوعية الاستيل">
        <div className="flex gap-2">
          {(["201", "304"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`flex-1 rounded-lg border p-2 font-bold ${
                grade === g ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              استيل {g}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الطول (سم)">
          <NumInput value={length} onChange={setLength} />
        </Field>
        <Field label="العرض (سم)">
          <NumInput value={width} onChange={setWidth} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="checkbox" checked={midShelf} onChange={(e) => setMidShelf(e.target.checked)} className="h-4 w-4" />
        إضافة شلف وسطي
      </label>
      <div className="text-sm">
        السعر: <span className="font-bold text-primary">{isValid ? BHD(price) : "---"}</span>
      </div>
    </DialogShell>
  );
}

function EditSinkDialog({
  settings,
  value,
  onClose,
  onSave,
}: {
  settings: SinkSettings;
  value: SinkItem;
  onClose: () => void;
  onSave: (s: SinkItem) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>(value.length);
  const [width, setWidth] = useState<NumOrEmpty>(value.width);
  const [bowls, setBowls] = useState(value.bowls);
  const [bottomShelf, setBottomShelf] = useState(value.bottomShelf);
  const [bowlDepth, setBowlDepth] = useState(value.bowlDepth);

  const isValid = length !== "" && width !== "";
  const price = isValid
    ? sinkPrice({ length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth }, settings)
    : 0;

  return (
    <DialogShell
      title="تعديل المغسلة"
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SaveBtn
            disabled={!isValid}
            onClick={() =>
              isValid &&
              onSave({ ...value, length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth, price })
            }
          />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="الطول (سم)">
          <NumInput value={length} onChange={setLength} />
        </Field>
        <Field label="العرض (سم)">
          <NumInput value={width} onChange={setWidth} />
        </Field>
      </div>
      <Field label="عدد الأحواض">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBowls((b) => Math.max(1, b - 1))}
            className="rounded-lg border border-border p-2"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold">{bowls}</span>
          <button
            type="button"
            onClick={() => setBowls((b) => Math.min(10, b + 1))}
            className="rounded-lg border border-border p-2"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Field>
      <Field label="عمق الحوض (سم)">
        <div className="flex flex-wrap gap-2">
          {settings.depths.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setBowlDepth(d)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                bowlDepth === d ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={bottomShelf}
          onChange={(e) => setBottomShelf(e.target.checked)}
          className="h-4 w-4"
        />
        إضافة شلف سفلي
      </label>
      <div className="text-sm">
        السعر: <span className="font-bold text-primary">{isValid ? BHD(price) : "---"}</span>
      </div>
    </DialogShell>
  );
}

function EditShelfDialog({
  settings,
  value,
  onClose,
  onSave,
}: {
  settings: ShelfSettings;
  value: ShelfItem;
  onClose: () => void;
  onSave: (s: ShelfItem) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>(value.length);
  const [width, setWidth] = useState<NumOrEmpty>(value.width);

  const isValid = length !== "" && width !== "";
  const price = isValid ? shelfPrice({ length: Number(length), width: Number(width) }, settings) : 0;

  return (
    <DialogShell
      title="تعديل الرف"
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SaveBtn
            disabled={!isValid}
            onClick={() => isValid && onSave({ ...value, length: Number(length), width: Number(width), price })}
          />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="الطول (سم)">
          <NumInput value={length} onChange={setLength} />
        </Field>
        <Field label="العرض (سم)">
          <NumInput value={width} onChange={setWidth} />
        </Field>
      </div>
      <div className="text-sm">
        السعر: <span className="font-bold text-primary">{isValid ? BHD(price) : "---"}</span>
      </div>
    </DialogShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-sm font-bold">
        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </div>
      {children}
    </div>
  );
}

function NumInput({ value, onChange }: { value: NumOrEmpty; onChange: (n: NumOrEmpty) => void }) {
  return (
    <input
      type="number"
      value={value === "" ? "" : value}
      min={SIZE_MIN}
      max={SIZE_MAX}
      placeholder="0"
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") return onChange("");
        const n = Number(val);
        if (Number.isNaN(n)) return onChange("");
        onChange(n);
      }}
      onBlur={(e) => {
        if (value !== "") {
          onChange(Math.min(SIZE_MAX, Math.max(SIZE_MIN, Number(value))));
        }
      }}
      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  );
}

function TableDrawing({
  length,
  width,
  midShelf,
  grade,
}: {
  length: NumOrEmpty;
  width: NumOrEmpty;
  midShelf: boolean;
  grade: string;
}) {
  const l = length === "" ? 120 : length;
  const w = width === "" ? 60 : width;

  const scale = 140 / Math.max(l, w, 100);
  const dx = l * scale * 0.8;
  const dyL = l * scale * 0.3;
  const dz = w * scale * 0.6;
  const dyW = w * scale * 0.4;
  const h = 50;

  const startX = 20 + dz;
  const startY = 40;

  const topFace = `${startX},${startY} ${startX + dx},${startY + dyL} ${startX + dx - dz},${startY + dyL + dyW} ${startX - dz},${startY + dyW}`;
  const midFace = `${startX},${startY + h / 2} ${startX + dx},${startY + h / 2 + dyL} ${startX + dx - dz},${startY + h / 2 + dyL + dyW} ${startX - dz},${startY + h / 2 + dyW}`;
  const bottomFace = `${startX},${startY + h} ${startX + dx},${startY + h + dyL} ${startX + dx - dz},${startY + h + dyL + dyW} ${startX - dz},${startY + h + dyW}`;

  return (
    <svg viewBox="0 0 250 160" className="h-40 w-full max-w-[250px] opacity-90 drop-shadow-md">
      <line x1={startX} y1={startY} x2={startX} y2={startY + h} stroke="#64748b" strokeWidth="2" />
      <line
        x1={startX - dz}
        y1={startY + dyW}
        x2={startX - dz}
        y2={startY + dyW + h}
        stroke="#475569"
        strokeWidth="3"
      />
      <line
        x1={startX + dx}
        y1={startY + dyL}
        x2={startX + dx}
        y2={startY + dyL + h}
        stroke="#475569"
        strokeWidth="3"
      />
      <polygon points={bottomFace} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      {midShelf && <polygon points={midFace} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />}
      <line
        x1={startX + dx - dz}
        y1={startY + dyL + dyW}
        x2={startX + dx - dz}
        y2={startY + dyL + dyW + h}
        stroke="#334155"
        strokeWidth="3"
      />
      <polygon points={topFace} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      {length !== "" && (
        <text
          x={startX + dx / 2 + 10}
          y={startY + dyL / 2 - 5}
          fill="#0f172a"
          fontSize="10"
          fontWeight="bold"
          transform={`rotate(20 ${startX + dx / 2} ${startY + dyL / 2})`}
        >
          L: {length}cm
        </text>
      )}
      {width !== "" && (
        <text
          x={startX - dz / 2 - 15}
          y={startY + dyW / 2 + 15}
          fill="#0f172a"
          fontSize="10"
          fontWeight="bold"
          transform={`rotate(-35 ${startX - dz / 2} ${startY + dyW / 2})`}
        >
          W: {width}cm
        </text>
      )}
      <text x="125" y="150" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
        طاولة {grade}
      </text>
    </svg>
  );
}

function SinkDrawing({
  length,
  width,
  bowls,
  bottomShelf,
  bowlDepth,
}: {
  length: NumOrEmpty;
  width: NumOrEmpty;
  bowls: number;
  bottomShelf: boolean;
  bowlDepth: number;
}) {
  const l = length === "" ? 120 : length;
  const w = width === "" ? 60 : width;

  const scale = 140 / Math.max(l, w, 100);
  const dx = l * scale * 0.8;
  const dyL = l * scale * 0.3;
  const dz = w * scale * 0.6;
  const dyW = w * scale * 0.4;
  const h = 50;

  const startX = 20 + dz;
  const startY = 40;

  const topFace = `${startX},${startY} ${startX + dx},${startY + dyL} ${startX + dx - dz},${startY + dyL + dyW} ${startX - dz},${startY + dyW}`;
  const bottomFace = `${startX},${startY + h} ${startX + dx},${startY + h + dyL} ${startX + dx - dz},${startY + h + dyL + dyW} ${startX - dz},${startY + h + dyW}`;

  const actualBowls = Math.min(bowls, 5);

  return (
    <svg viewBox="0 0 250 160" className="h-40 w-full max-w-[250px] opacity-90 drop-shadow-md">
      <line x1={startX} y1={startY} x2={startX} y2={startY + h} stroke="#64748b" strokeWidth="2" />
      <line
        x1={startX - dz}
        y1={startY + dyW}
        x2={startX - dz}
        y2={startY + dyW + h}
        stroke="#475569"
        strokeWidth="3"
      />
      <line
        x1={startX + dx}
        y1={startY + dyL}
        x2={startX + dx}
        y2={startY + dyL + h}
        stroke="#475569"
        strokeWidth="3"
      />
      {bottomShelf && <polygon points={bottomFace} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />}
      <line
        x1={startX + dx - dz}
        y1={startY + dyL + dyW}
        x2={startX + dx - dz}
        y2={startY + dyL + dyW + h}
        stroke="#334155"
        strokeWidth="3"
      />
      <polygon points={topFace} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      {Array.from({ length: actualBowls }).map((_, i) => {
        const fractionX = (i + 0.5) / actualBowls;
        const cx = startX + dx * fractionX - dz * 0.5;
        const cy = startY + dyL * fractionX + dyW * 0.5;
        const bW = (dx / actualBowls) * 0.6;
        const bD = dz * 0.5;

        return (
          <g key={i}>
            <polygon
              points={`${cx - bW / 2},${cy - bD / 2} ${cx + bW / 2},${cy - bD / 2 + dyL / actualBowls} ${cx + bW / 2 - bD / 2},${cy + dyL / actualBowls + bD / 2} ${cx - bW / 2 - bD / 2},${cy + bD / 2}`}
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1"
            />
          </g>
        );
      })}
      {length !== "" && (
        <text
          x={startX + dx / 2 + 10}
          y={startY + dyL / 2 - 5}
          fill="#0f172a"
          fontSize="10"
          fontWeight="bold"
          transform={`rotate(20 ${startX + dx / 2} ${startY + dyL / 2})`}
        >
          L: {length}cm
        </text>
      )}
      {width !== "" && (
        <text
          x={startX - dz / 2 - 15}
          y={startY + dyW / 2 + 15}
          fill="#0f172a"
          fontSize="10"
          fontWeight="bold"
          transform={`rotate(-35 ${startX - dz / 2} ${startY + dyW / 2})`}
        >
          W: {width}cm
        </text>
      )}
      <text x="125" y="150" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
        مغسلة {bowls} حوض (عمق {bowlDepth})
      </text>
    </svg>
  );
}

function ShelfDrawing({ length, width }: { length: NumOrEmpty; width: NumOrEmpty }) {
  const l = length === "" ? 120 : length;
  const w = width === "" ? 40 : width;

  const scale = 140 / Math.max(l, w, 100);
  const dx = l * scale * 0.8;
  const dyL = l * scale * 0.3;
  const dz = w * scale * 0.6;
  const dyW = w * scale * 0.4;
  const h = 70;
  const levels = 4;

  const startX = 20 + dz;
  const startY = 20;

  return (
    <svg viewBox="0 0 250 160" className="h-40 w-full max-w-[250px] opacity-90 drop-shadow-md">
      <line x1={startX} y1={startY} x2={startX} y2={startY + h} stroke="#64748b" strokeWidth="2" />
      <line
        x1={startX + dx}
        y1={startY + dyL}
        x2={startX + dx}
        y2={startY + dyL + h}
        stroke="#475569"
        strokeWidth="2"
      />
      {Array.from({ length: levels }).map((_, i) => {
        const yOffset = (h / (levels - 1)) * i;
        const face = `${startX},${startY + yOffset} ${startX + dx},${startY + yOffset + dyL} ${startX + dx - dz},${startY + yOffset + dyL + dyW} ${startX - dz},${startY + yOffset + dyW}`;
        return (
          <polygon key={i} points={face} fill={i === 0 ? "#cbd5e1" : "#e2e8f0"} stroke="#475569" strokeWidth="1.5" />
        );
      })}
      <line
        x1={startX - dz}
        y1={startY + dyW}
        x2={startX - dz}
        y2={startY + dyW + h}
        stroke="#334155"
        strokeWidth="3"
      />
      <line
        x1={startX + dx - dz}
        y1={startY + dyL + dyW}
        x2={startX + dx - dz}
        y2={startY + dyL + dyW + h}
        stroke="#334155"
        strokeWidth="3"
      />
      {length !== "" && (
        <text x={startX + dx / 2} y={startY + dyL / 2 - 10} fill="#0f172a" fontSize="10" fontWeight="bold">
          L: {length}cm
        </text>
      )}
      {width !== "" && (
        <text
          x={startX - dz / 2 - 15}
          y={startY + dyW / 2 + 25}
          fill="#0f172a"
          fontSize="10"
          fontWeight="bold"
          transform={`rotate(-35 ${startX - dz / 2} ${startY + dyW / 2})`}
        >
          W: {width}cm
        </text>
      )}
      <text x="125" y="150" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
        أرفف تخزين
      </text>
    </svg>
  );
}
