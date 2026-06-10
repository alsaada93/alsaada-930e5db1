import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
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
  Table as TableIcon,
  Bath,
  Rows3,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useProjectTypes, useEquipment, useCalcSettings } from "@/hooks/useRestaurant";
import type { Equipment } from "@/hooks/useRestaurant";

import { steelTablePrice, sinkPrice, shelfPrice, SIZE_MIN, SIZE_MAX, BHD } from "@/lib/restaurant-calc";
import type {
  SteelTableConfig,
  SinkConfig,
  ShelfConfig,
  SteelTableSettings,
  SinkSettings,
  ShelfSettings,
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
  splashBack: boolean;
  splashRight: boolean;
  splashLeft: boolean;
}

interface SinkItem extends SinkConfig {
  uid: string;
  price: number;
  splashBack: boolean;
  splashRight: boolean;
  splashLeft: boolean;
}

interface ShelfItem extends ShelfConfig {
  uid: string;
  price: number;
}

const newUid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const calculateFinalPrice = (rawPrice: number): number => {
  if (rawPrice <= 0) return 0;
  const afterDiscount = rawPrice * 0.9;
  return Math.floor(afterDiscount / 10) * 10;
};

function RestaurantPage() {
  const { user } = useAuth();
  const { types } = useProjectTypes();
  const { equipment } = useEquipment();
  const { steel, sink, shelf } = useCalcSettings();

  const [activeType, setActiveType] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sinks, setSinks] = useState<SinkItem[]>([]);
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [editSink, setEditSink] = useState<SinkItem | null>(null);
  const [editShelf, setEditShelf] = useState<ShelfItem | null>(null);

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
        setSelected(parsed.selected || {});
        setTables(parsed.tables || []);
        setSinks(parsed.sinks || []);
        setShelves(parsed.shelves || []);
        toast.info("تم استعادة مسودة مشروعك السابقة");
      }
    } catch {
      // استرجاع المسودة فشل بصمت
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
      selected,
      tables,
      sinks,
      shelves,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [activeType, customerName, customerPhone, deliveryDate, notes, discount, selected, tables, sinks, shelves]);

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
  const finalTotal = Math.max(0, subTotal - discountAmount);

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

  const printGroups = useMemo(() => {
    let index = 1;
    const items: Array<{
      id: number;
      img: ReactNode | string;
      title: string;
      desc: string;
      qty: number;
      unitPrice: number;
      total: number;
    }> = [];

    chosen.forEach(({ e, sel }) => {
      const unitPrice = sel.condition === "new" ? e.price_new : e.price_used;
      items.push({
        id: index++,
        img: e.image_url || "/placeholder.svg",
        title: e.name,
        desc: `الحالة: ${sel.condition === "new" ? "جديد" : "مستعمل"} | ${[e.manufacturer, e.country_of_origin].filter(Boolean).join(" - ")}`,
        qty: 1,
        unitPrice,
        total: unitPrice,
      });
    });

    const groupedTables = tables.reduce(
      (acc, t) => {
        const key = `${t.grade}-${t.length}-${t.width}-${t.midShelf}-${t.splashBack}-${t.splashRight}-${t.splashLeft}`;
        if (!acc[key]) acc[key] = { ...t, qty: 0 };
        acc[key].qty += 1;
        return acc;
      },
      {} as Record<string, any>,
    );
    Object.values(groupedTables).forEach((t) => {
      const extras = [
        t.midShelf ? "شلف وسطي" : "",
        t.splashBack ? "حاجز خلفي" : "",
        t.splashRight ? "حاجز يمين" : "",
        t.splashLeft ? "حاجز يسار" : "",
      ]
        .filter(Boolean)
        .join("، ");

      items.push({
        id: index++,
        img: <TableIcon className="h-6 w-6 text-gray-500" />,
        title: `طاولة ستانلس ستيل (درجة ${t.grade})`,
        desc: `المقاس: ${t.length}×${t.width} سم${extras ? ` | الإضافات: ${extras}` : ""}`,
        qty: t.qty,
        unitPrice: t.price,
        total: t.price * t.qty,
      });
    });

    const groupedSinks = sinks.reduce(
      (acc, s) => {
        const key = `${s.length}-${s.width}-${s.bowls}-${s.bottomShelf}-${s.bowlDepth}-${s.splashBack}-${s.splashRight}-${s.splashLeft}`;
        if (!acc[key]) acc[key] = { ...s, qty: 0 };
        acc[key].qty += 1;
        return acc;
      },
      {} as Record<string, any>,
    );
    Object.values(groupedSinks).forEach((s) => {
      const extras = [
        s.bottomShelf ? "شلف سفلي" : "",
        s.splashBack ? "حاجز خلفي (10سم)" : "",
        s.splashRight ? "حاجز يمين" : "",
        s.splashLeft ? "حاجز يسار" : "",
      ]
        .filter(Boolean)
        .join("، ");

      items.push({
        id: index++,
        img: <Bath className="h-6 w-6 text-gray-500" />,
        title: `مغسلة ستانلس ستيل (درجة 304)`,
        desc: `المقاس: ${s.length}×${s.width} سم | عدد الأحواض: ${s.bowls} | عمق الحوض: ${s.bowlDepth} سم${extras ? ` | الإضافات: ${extras}` : ""}`,
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
        img: <Rows3 className="h-6 w-6 text-gray-500" />,
        title: `رف جداري ستانلس ستيل`,
        desc: `المقاس: ${s.length}×${s.width} سم | يعلق على الحائط`,
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
              {types &&
                types.map((t) => {
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
                                className="h-10 w-10 rounded object-cover border"
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
                            طاولة ستانلس {t.grade} ({t.length}×{t.width}سم)
                            <div className="text-xs text-muted-foreground mt-1">
                              {[
                                t.midShelf ? "شلف وسطي" : "",
                                t.splashBack ? "حاجز خلفي" : "",
                                t.splashRight ? "حاجز يمين" : "",
                                t.splashLeft ? "حاجز يسار" : "",
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
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
                            مغسلة ستانلس 304 ({s.length}×{s.width}سم، عمق {s.bowlDepth}سم)
                            <div className="text-xs text-muted-foreground mt-1">
                              {s.bowls} حوض •{" "}
                              {[
                                s.bottomShelf ? "شلف سفلي" : "",
                                s.splashBack ? "حاجز خلفي" : "",
                                s.splashRight ? "حاجز يمين" : "",
                                s.splashLeft ? "حاجز يسار" : "",
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
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
                            رف جداري ستانلس ({s.length}×{s.width}سم)
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="الإجمالي الفرعي" value={BHD(subTotal)} />
                  <Stat label="نسبة التوفير (مستعمل/جديد)" value={`${savings}%`} accent />
                  <Stat label="الخصم الإضافي" value={`- ${BHD(discountAmount)}`} />
                  <Stat label="المجموع النهائي" value={BHD(finalTotal)} primary />
                </div>
              </section>
            </>
          )}
        </div>

        {/* عرض الطباعة - فاتورة عرض أسعار احترافي */}
        <div
          className="hidden print:block font-sans text-black bg-white w-full print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact]"
          dir="rtl"
        >
          <table className="w-full">
            <thead className="table-header-group">
              <tr>
                <td>
                  <div className="h-[160px]"></div>
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
                        <span className="font-bold">{types?.find((t) => t.slug === activeType)?.name || "-"}</span>
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
                        <th className="py-3 px-2 text-center font-bold w-12 border-l border-gray-300">م</th>
                        <th className="py-3 px-4 font-bold border-l border-gray-300">تفاصيل العنصر</th>
                        <th className="py-3 px-2 text-center font-bold w-20 border-l border-gray-300">الكمية</th>
                        <th className="py-3 px-2 text-center font-bold w-32 border-l border-gray-300">سعر الوحدة</th>
                        <th className="py-3 px-2 text-center font-bold w-32">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printGroups.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 print:break-inside-avoid">
                          <td className="py-4 px-2 text-center text-sm font-bold text-gray-500 align-middle border-l border-gray-100">
                            {item.id}
                          </td>
                          <td className="py-4 px-4 align-middle border-l border-gray-100">
                            <div className="flex items-center gap-4">
                              {typeof item.img === "string" ? (
                                <img
                                  src={item.img}
                                  alt=""
                                  className="w-14 h-14 object-cover rounded-md border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 shrink-0">
                                  {item.img}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-base text-gray-900">{item.title}</span>
                                <span className="text-gray-600 text-sm mt-0.5">{item.desc}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center font-medium align-middle border-l border-gray-100">
                            {item.qty}
                          </td>
                          <td className="py-4 px-2 text-center font-medium align-middle border-l border-gray-100">
                            {BHD(item.unitPrice)}
                          </td>
                          <td className="py-4 px-2 text-center font-bold text-gray-900 align-middle">
                            {BHD(item.total)}
                          </td>
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
                          <h4 className="font-bold mb-2 border-b pb-1 text-gray-700">ملاحظات وشروط المشروع:</h4>
                          <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="w-[45%] border-2 border-gray-900 rounded-lg overflow-hidden">
                      <div className="flex justify-between py-3 px-5 border-b border-gray-200 bg-white">
                        <span className="font-bold text-gray-600">الإجمالي الفرعي:</span>
                        <span className="font-bold text-lg">{BHD(subTotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between py-3 px-5 border-b border-gray-200 bg-red-50 text-red-600">
                          <span className="font-bold">الخصم الممنوح:</span>
                          <span className="font-bold text-lg">- {BHD(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-4 px-5 bg-gray-900 text-white">
                        <span className="font-extrabold text-xl">الإجمالي النهائي:</span>
                        <span className="font-extrabold text-xl">{BHD(finalTotal)}</span>
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
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : accent
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-border bg-card shadow-sm"
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-700">
        <Ruler className="h-4 w-4 text-primary/70" />
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
      onBlur={() => {
        if (value !== "") {
          onChange(Math.min(SIZE_MAX, Math.max(SIZE_MIN, Number(value))));
        }
      }}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold"
    />
  );
}

function SteelTableCalculator({
  settings,
  onAdd,
}: {
  settings: SteelTableSettings;
  onAdd: (cfg: Omit<TableItem, "uid" | "price">, price: number, count: number) => void;
}) {
  const [grade, setGrade] = useState<"201" | "304">("201");
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [midShelf, setMidShelf] = useState(false);
  const [splashBack, setSplashBack] = useState(false);
  const [splashRight, setSplashRight] = useState(false);
  const [splashLeft, setSplashLeft] = useState(false);
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid
    ? steelTablePrice({ grade, length: Number(length), width: Number(width), midShelf }, settings)
    : 0;
  const price = calculateFinalPrice(rawPrice);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٣. حاسبة تصنيع الطاولات الستانلس</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2 bg-card shadow-sm">
        <div className="space-y-5">
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

          <div className="border-t pt-4">
            <Field label="الإضافات والحواجز">
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={midShelf}
                    onChange={(e) => setMidShelf(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  شلف وسطي إضافي
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashBack}
                    onChange={(e) => setSplashBack(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  حاجز خلفي
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashRight}
                    onChange={(e) => setSplashRight(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  حاجز يمين
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashLeft}
                    onChange={(e) => setSplashLeft(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  حاجز يسار
                </label>
              </div>
            </Field>
          </div>

          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden border border-dashed border-gray-200">
          <TableDrawing
            length={length}
            width={width}
            midShelf={midShelf}
            splashBack={splashBack}
            splashRight={splashRight}
            splashLeft={splashLeft}
            grade={grade}
          />
          <div className="text-center z-10 bg-background/80 px-6 py-3 rounded-2xl shadow-sm backdrop-blur-sm mt-4">
            <div className="text-sm text-muted-foreground font-bold">التكلفة المتوقعة</div>
            <div className="text-3xl font-black text-primary my-1">{isValid ? BHD(price) : "---"}</div>
            {isValid && <div className="text-xs text-emerald-600 font-bold mb-2">شامل خصم 10%</div>}
            {count > 1 && isValid && (
              <div className="text-xs text-muted-foreground font-bold border-t pt-2 mt-1">
                الإجمالي ({count}): <span className="text-foreground">{BHD(price * count)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onAdd(
                  {
                    grade,
                    length: Number(length),
                    width: Number(width),
                    midShelf,
                    splashBack,
                    splashRight,
                    splashLeft,
                  },
                  price,
                  count,
                );
                setLength("");
                setWidth("");
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10 shadow-md mt-2 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-5 w-5" /> إضافة الطاولة للمشروع
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
  onAdd: (cfg: Omit<SinkItem, "uid" | "price">, price: number, count: number) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [bowls, setBowls] = useState(1);
  const [bottomShelf, setBottomShelf] = useState(false);
  const [bowlDepth, setBowlDepth] = useState(settings.defaultDepth);
  const [splashBack, setSplashBack] = useState(true);
  const [splashRight, setSplashRight] = useState(false);
  const [splashLeft, setSplashLeft] = useState(false);
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid
    ? sinkPrice({ length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth }, settings)
    : 0;
  const price = calculateFinalPrice(rawPrice);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٤. حاسبة تفصيل المغاسل (استيل 304)</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2 bg-card shadow-sm">
        <div className="space-y-5">
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
                  {d === settings.defaultDepth && <span className="ms-1 text-[10px] text-emerald-600">(موصى به)</span>}
                </button>
              ))}
            </div>
          </Field>

          <div className="border-t pt-4">
            <Field label="الإضافات والحواجز">
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bottomShelf}
                    onChange={(e) => setBottomShelf(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  شلف سفلي
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-emerald-700">
                  <input
                    type="checkbox"
                    checked={splashBack}
                    onChange={(e) => setSplashBack(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                  />
                  حاجز خلفي (10سم ستاندرد)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashRight}
                    onChange={(e) => setSplashRight(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  حاجز يمين
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashLeft}
                    onChange={(e) => setSplashLeft(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  حاجز يسار
                </label>
              </div>
            </Field>
          </div>

          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden border border-dashed border-gray-200">
          <SinkDrawing
            length={length}
            width={width}
            bowls={bowls}
            bottomShelf={bottomShelf}
            bowlDepth={bowlDepth}
            splashBack={splashBack}
            splashRight={splashRight}
            splashLeft={splashLeft}
          />
          <div className="text-center z-10 bg-background/80 px-6 py-3 rounded-2xl shadow-sm backdrop-blur-sm mt-4">
            <div className="text-sm text-muted-foreground font-bold">التكلفة المتوقعة</div>
            <div className="text-3xl font-black text-primary my-1">{isValid ? BHD(price) : "---"}</div>
            {isValid && <div className="text-xs text-emerald-600 font-bold mb-2">شامل خصم 10%</div>}
            {count > 1 && isValid && (
              <div className="text-xs text-muted-foreground font-bold border-t pt-2 mt-1">
                الإجمالي ({count}): <span className="text-foreground">{BHD(price * count)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onAdd(
                  {
                    length: Number(length),
                    width: Number(width),
                    bowls,
                    bottomShelf,
                    bowlDepth,
                    splashBack,
                    splashRight,
                    splashLeft,
                  },
                  price,
                  count,
                );
                setLength("");
                setWidth("");
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10 shadow-md mt-2 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-5 w-5" /> إضافة المغسلة للمشروع
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
  const rawPrice = isValid ? shelfPrice({ length: Number(length), width: Number(width) }, settings) : 0;
  const price = calculateFinalPrice(rawPrice);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٥. حاسبة تفصيل أرفف جدارية (استيل)</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2 bg-card shadow-sm">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الطول (سم)">
              <NumInput value={length} onChange={setLength} />
            </Field>
            <Field label="العمق/البروز (سم)">
              <NumInput value={width} onChange={setWidth} />
            </Field>
          </div>
          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed font-medium bg-muted/50 p-3 rounded-lg border">
            المقاس المعياري {settings.base.width}×{settings.base.depth}سم بسعر {BHD(settings.base.price)}، ويرتفع السعر
            تلقائياً كلما زادت المساحة. هذا الرف مخصص للتعليق على الجدار.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4 relative overflow-hidden border border-dashed border-gray-200">
          <WallShelfDrawing length={length} width={width} />
          <div className="text-center z-10 bg-background/80 px-6 py-3 rounded-2xl shadow-sm backdrop-blur-sm mt-4">
            <div className="text-sm text-muted-foreground font-bold">التكلفة المتوقعة</div>
            <div className="text-3xl font-black text-primary my-1">{isValid ? BHD(price) : "---"}</div>
            {isValid && <div className="text-xs text-emerald-600 font-bold mb-2">شامل خصم 10%</div>}
            {count > 1 && isValid && (
              <div className="text-xs text-muted-foreground font-bold border-t pt-2 mt-1">
                الإجمالي ({count}): <span className="text-foreground">{BHD(price * count)}</span>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed z-10 shadow-md mt-2 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-5 w-5" /> إضافة الرف للمشروع
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
        <div className="mb-5 flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg hover:bg-muted p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5">{children}</div>
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t">{footer}</div>
      </div>
    </div>
  );
}

function SaveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
    >
      حفظ التعديل
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-bold hover:bg-muted transition-colors"
    >
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
  const [splashBack, setSplashBack] = useState(value.splashBack);
  const [splashRight, setSplashRight] = useState(value.splashRight);
  const [splashLeft, setSplashLeft] = useState(value.splashLeft);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid
    ? steelTablePrice({ grade, length: Number(length), width: Number(width), midShelf }, settings)
    : 0;
  const price = calculateFinalPrice(rawPrice);

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
              isValid &&
              onSave({
                ...value,
                grade,
                length: Number(length),
                width: Number(width),
                midShelf,
                splashBack,
                splashRight,
                splashLeft,
                price,
              })
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
      <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={midShelf}
            onChange={(e) => setMidShelf(e.target.checked)}
            className="h-4 w-4"
          />
          شلف وسطي
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={splashBack}
            onChange={(e) => setSplashBack(e.target.checked)}
            className="h-4 w-4"
          />
          حاجز خلفي
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={splashRight}
            onChange={(e) => setSplashRight(e.target.checked)}
            className="h-4 w-4"
          />
          حاجز يمين
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={splashLeft}
            onChange={(e) => setSplashLeft(e.target.checked)}
            className="h-4 w-4"
          />
          حاجز يسار
        </label>
      </div>
      <div className="text-sm font-bold bg-primary/5 p-3 rounded-lg border border-primary/20 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1">
          <span>السعر المعدل:</span>
          <span className="text-primary text-lg">{isValid ? BHD(price) : "---"}</span>
        </div>
        <div className="text-[10px] text-emerald-600 self-end">شامل خصم 10% وجبر للكسور</div>
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
  const [splashBack, setSplashBack] = useState(value.splashBack);
  const [splashRight, setSplashRight] = useState(value.splashRight);
  const [splashLeft, setSplashLeft] = useState(value.splashLeft);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid
    ? sinkPrice({ length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth }, settings)
    : 0;
  const price = calculateFinalPrice(rawPrice);

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
              onSave({
                ...value,
                length: Number(length),
                width: Number(width),
                bowls,
                bottomShelf,
                bowlDepth,
                splashBack,
                splashRight,
                splashLeft,
                price,
              })
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
      <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={bottomShelf}
            onChange={(e) => setBottomShelf(e.target.checked)}
            className="h-4 w-4"
          />
          شلف سفلي
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-emerald-700">
          <input
            type="checkbox"
            checked={splashBack}
            onChange={(e) => setSplashBack(e.target.checked)}
            className="h-4 w-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
          />
          حاجز خلفي (ستاندرد)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={splashRight}
            onChange={(e) => setSplashRight(e.target.checked)}
            className="h-4 w-4"
          />
          حاجز يمين
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={splashLeft}
            onChange={(e) => setSplashLeft(e.target.checked)}
            className="h-4 w-4"
          />
          حاجز يسار
        </label>
      </div>
      <div className="text-sm font-bold bg-primary/5 p-3 rounded-lg border border-primary/20 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1">
          <span>السعر المعدل:</span>
          <span className="text-primary text-lg">{isValid ? BHD(price) : "---"}</span>
        </div>
        <div className="text-[10px] text-emerald-600 self-end">شامل خصم 10% وجبر للكسور</div>
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
  const rawPrice = isValid ? shelfPrice({ length: Number(length), width: Number(width) }, settings) : 0;
  const price = calculateFinalPrice(rawPrice);

  return (
    <DialogShell
      title="تعديل الرف الجداري"
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
        <Field label="العمق (سم)">
          <NumInput value={width} onChange={setWidth} />
        </Field>
      </div>
      <div className="text-sm font-bold bg-primary/5 p-3 rounded-lg border border-primary/20 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1">
          <span>السعر المعدل:</span>
          <span className="text-primary text-lg">{isValid ? BHD(price) : "---"}</span>
        </div>
        <div className="text-[10px] text-emerald-600 self-end">شامل خصم 10% وجبر للكسور</div>
      </div>
    </DialogShell>
  );
}

function TableDrawing({
  length,
  width,
  midShelf,
  splashBack,
  splashRight,
  splashLeft,
  grade,
}: {
  length: NumOrEmpty;
  width: NumOrEmpty;
  midShelf: boolean;
  splashBack: boolean;
  splashRight: boolean;
  splashLeft: boolean;
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
  const spH = 15;

  const startX = 30 + dz;
  const startY = 50;

  const pA = { x: startX, y: startY };
  const pB = { x: startX + dx, y: startY + dyL };
  const pC = { x: startX + dx - dz, y: startY + dyL + dyW };
  const pD = { x: startX - dz, y: startY + dyW };

  const topFace = `${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`;
  const midFace = `${pA.x},${pA.y + h / 2} ${pB.x},${pB.y + h / 2} ${pC.x},${pC.y + h / 2} ${pD.x},${pD.y + h / 2}`;
  const bottomFace = `${pA.x},${pA.y + h} ${pB.x},${pB.y + h} ${pC.x},${pC.y + h} ${pD.x},${pD.y + h}`;

  void grade;

  return (
    <svg viewBox="0 0 250 180" className="h-44 w-full max-w-[280px] drop-shadow-md">
      <line x1={pA.x} y1={pA.y} x2={pA.x} y2={pA.y + h} stroke="#64748b" strokeWidth="2" />
      <line x1={pD.x} y1={pD.y} x2={pD.x} y2={pD.y + h} stroke="#475569" strokeWidth="3" />
      <line x1={pB.x} y1={pB.y} x2={pB.x} y2={pB.y + h} stroke="#475569" strokeWidth="3" />

      <polygon points={bottomFace} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      {midShelf && <polygon points={midFace} fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />}

      <line x1={pC.x} y1={pC.y} x2={pC.x} y2={pC.y + h} stroke="#334155" strokeWidth="3" />

      <polygon points={topFace} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />

      {splashBack && (
        <polygon
          points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pB.x},${pB.y - spH} ${pA.x},${pA.y - spH}`}
          fill="#94a3b8"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}
      {splashLeft && (
        <polygon
          points={`${pD.x},${pD.y} ${pA.x},${pA.y} ${pA.x},${pA.y - spH} ${pD.x},${pD.y - spH}`}
          fill="#64748b"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}
      {splashRight && (
        <polygon
          points={`${pB.x},${pB.y} ${pC.x},${pC.y} ${pC.x},${pC.y - spH} ${pB.x},${pB.y - spH}`}
          fill="#e2e8f0"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}

      {length !== "" && (
        <text
          x={pA.x + dx / 2 + 10}
          y={pA.y + dyL / 2 - 5}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(20 ${pA.x + dx / 2} ${pA.y + dyL / 2})`}
        >
          طول {length}
        </text>
      )}
      {width !== "" && (
        <text
          x={pA.x - dz / 2 - 15}
          y={pA.y + dyW / 2 + 15}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-35 ${pA.x - dz / 2} ${pA.y + dyW / 2})`}
        >
          عرض {width}
        </text>
      )}
    </svg>
  );
}

function SinkDrawing({
  length,
  width,
  bowls,
  bottomShelf,
  bowlDepth,
  splashBack,
  splashRight,
  splashLeft,
}: {
  length: NumOrEmpty;
  width: NumOrEmpty;
  bowls: number;
  bottomShelf: boolean;
  bowlDepth: number;
  splashBack: boolean;
  splashRight: boolean;
  splashLeft: boolean;
}) {
  const l = length === "" ? 120 : length;
  const w = width === "" ? 60 : width;

  const scale = 140 / Math.max(l, w, 100);
  const dx = l * scale * 0.8;
  const dyL = l * scale * 0.3;
  const dz = w * scale * 0.6;
  const dyW = w * scale * 0.4;
  const h = 50;
  const spH = 15;

  const depthVisual = (bowlDepth / 30) * 16;

  const startX = 30 + dz;
  const startY = 50;

  const pA = { x: startX, y: startY };
  const pB = { x: startX + dx, y: startY + dyL };
  const pC = { x: startX + dx - dz, y: startY + dyL + dyW };
  const pD = { x: startX - dz, y: startY + dyW };

  const topFace = `${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`;
  const bottomFace = `${pA.x},${pA.y + h} ${pB.x},${pB.y + h} ${pC.x},${pC.y + h} ${pD.x},${pD.y + h}`;

  const actualBowls = Math.min(bowls, 5);

  return (
    <svg viewBox="0 0 250 180" className="h-44 w-full max-w-[280px] drop-shadow-md">
      <line x1={pA.x} y1={pA.y} x2={pA.x} y2={pA.y + h} stroke="#64748b" strokeWidth="2" />
      <line x1={pD.x} y1={pD.y} x2={pD.x} y2={pD.y + h} stroke="#475569" strokeWidth="3" />
      <line x1={pB.x} y1={pB.y} x2={pB.x} y2={pB.y + h} stroke="#475569" strokeWidth="3" />

      {bottomShelf && <polygon points={bottomFace} fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />}

      <line x1={pC.x} y1={pC.y} x2={pC.x} y2={pC.y + h} stroke="#334155" strokeWidth="3" />

      <polygon points={topFace} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />

      {Array.from({ length: actualBowls }).map((_, i) => {
        const fractionX = (i + 0.5) / actualBowls;
        const cx = startX + dx * fractionX - dz * 0.5;
        const cy = startY + dyL * fractionX + dyW * 0.5;
        const bW = (dx / actualBowls) * 0.7;
        const bD = dz * 0.7;

        const hA = { x: cx - bW / 2, y: cy - bD / 2 };
        const hB = { x: cx + bW / 2, y: cy - bD / 2 + dyL / actualBowls };
        const hC = { x: cx + bW / 2 - bD / 2, y: cy + dyL / actualBowls + bD / 2 };
        const hD = { x: cx - bW / 2 - bD / 2, y: cy + bD / 2 };

        const dropY = depthVisual;

        return (
          <g key={i}>
            <polygon
              points={`${hB.x},${hB.y} ${hC.x},${hC.y} ${hC.x},${hC.y + dropY} ${hB.x},${hB.y + dropY}`}
              fill="#64748b"
            />
            <polygon
              points={`${hA.x},${hA.y} ${hB.x},${hB.y} ${hB.x},${hB.y + dropY} ${hA.x},${hA.y + dropY}`}
              fill="#475569"
            />
            <polygon
              points={`${hA.x},${hA.y + dropY} ${hB.x},${hB.y + dropY} ${hC.x},${hC.y + dropY} ${hD.x},${hD.y + dropY}`}
              fill="#334155"
            />
            <ellipse cx={cx - bD / 4} cy={cy + dropY + dyL / (actualBowls * 2)} rx={3} ry={1.5} fill="#0f172a" />
          </g>
        );
      })}

      {splashBack && (
        <polygon
          points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pB.x},${pB.y - spH} ${pA.x},${pA.y - spH}`}
          fill="#94a3b8"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}
      {splashLeft && (
        <polygon
          points={`${pD.x},${pD.y} ${pA.x},${pA.y} ${pA.x},${pA.y - spH} ${pD.x},${pD.y - spH}`}
          fill="#64748b"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}
      {splashRight && (
        <polygon
          points={`${pB.x},${pB.y} ${pC.x},${pC.y} ${pC.x},${pC.y - spH} ${pB.x},${pB.y - spH}`}
          fill="#e2e8f0"
          stroke="#334155"
          strokeWidth="1.5"
        />
      )}

      {length !== "" && (
        <text
          x={pA.x + dx / 2 + 10}
          y={pA.y + dyL / 2 - 5}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(20 ${pA.x + dx / 2} ${pA.y + dyL / 2})`}
        >
          طول {length}
        </text>
      )}
      {width !== "" && (
        <text
          x={pA.x - dz / 2 - 15}
          y={pA.y + dyW / 2 + 15}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-35 ${pA.x - dz / 2} ${pA.y + dyW / 2})`}
        >
          عرض {width}
        </text>
      )}
    </svg>
  );
}

function WallShelfDrawing({ length, width }: { length: NumOrEmpty; width: NumOrEmpty }) {
  const l = length === "" ? 120 : length;
  const w = width === "" ? 30 : width;

  const scale = 140 / Math.max(l, w, 100);
  const dx = l * scale * 0.8;
  const dyL = l * scale * 0.3;
  const dz = w * scale * 0.6;
  const dyW = w * scale * 0.4;

  const startX = 40 + dz;
  const startY = 80;

  const face = `${startX},${startY} ${startX + dx},${startY + dyL} ${startX + dx - dz},${startY + dyL + dyW} ${startX - dz},${startY + dyW}`;

  const edgeH = 5;
  const frontEdge = `${startX + dx},${startY + dyL} ${startX + dx - dz},${startY + dyL + dyW} ${startX + dx - dz},${startY + dyL + dyW + edgeH} ${startX + dx},${startY + dyL + edgeH}`;
  const sideEdge = `${startX - dz},${startY + dyW} ${startX + dx - dz},${startY + dyL + dyW} ${startX + dx - dz},${startY + dyL + dyW + edgeH} ${startX - dz},${startY + dyW + edgeH}`;

  const bracketDrop = 30;
  const br1_X = startX - dz * 0.8;
  const br1_Y = startY + dyW * 0.8 + edgeH;
  const br1_Wall = { x: startX + dx * 0.1 - dz * 0.8, y: startY + dyL * 0.1 + dyW * 0.8 + edgeH };
  const br2_X = startX + dx * 0.8 - dz * 0.8;
  const br2_Y = startY + dyL * 0.8 + dyW * 0.8 + edgeH;
  const br2_Wall = { x: startX + dx * 0.9 - dz * 0.8, y: startY + dyL * 0.9 + dyW * 0.8 + edgeH };

  return (
    <svg viewBox="0 0 250 180" className="h-44 w-full max-w-[280px] drop-shadow-md">
      <path
        d={`M ${br1_Wall.x} ${br1_Wall.y} L ${br1_Wall.x} ${br1_Wall.y + bracketDrop} L ${br1_X} ${br1_Y} Z`}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="1"
      />
      <path
        d={`M ${br2_Wall.x} ${br2_Wall.y} L ${br2_Wall.x} ${br2_Wall.y + bracketDrop} L ${br2_X} ${br2_Y} Z`}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="1"
      />

      <polygon points={face} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
      <polygon points={frontEdge} fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <polygon points={sideEdge} fill="#64748b" stroke="#475569" strokeWidth="1.5" />

      <line
        x1={startX}
        y1={startY}
        x2={startX + dx}
        y2={startY + dyL}
        stroke="#334155"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {length !== "" && (
        <text x={startX + dx / 2} y={startY + dyL / 2 - 10} fill="#0f172a" fontSize="11" fontWeight="bold">
          طول {length}
        </text>
      )}
      {width !== "" && (
        <text
          x={startX - dz / 2 - 15}
          y={startY + dyW / 2 + 25}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-35 ${startX - dz / 2} ${startY + dyW / 2})`}
        >
          بروز {width}
        </text>
      )}
    </svg>
  );
}
