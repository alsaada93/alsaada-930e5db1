import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  Copy,
  User,
  FolderOpen,
  Share2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logCalcEvent } from "@/hooks/useCalculatorAdmin";
import { toast } from "sonner";

import { useProjectTypes, useEquipment, usePackages } from "@/hooks/useRestaurant";
import type { Equipment, RestaurantPackage } from "@/hooks/useRestaurant";
import { useFabricationData } from "@/hooks/useFabrication";
import { FabricationCalculator } from "@/components/FabricationCalculator";
import { BHD, describeItem, type FabLineItem, type FabProduct } from "@/lib/fabrication";

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
      { title: "حاسبة تفصيل الستانلس ستيل ودراسة تكلفة المشاريع | حراج السعادة" },
      {
        name: "description",
        content:
          "حاسبة تفصيل الستانلس ستيل: طاولات، مغاسل، أرفف، خزائن، قواعد معدات، عربات وشفاطات بمقاسات حسب الطلب، مع حفظ المشاريع وتقرير قابل للطباعة ومشاركة عبر واتساب.",
      },
      { property: "og:title", content: "حاسبة تفصيل الستانلس ستيل | حراج السعادة" },
      {
        property: "og:description",
        content: "صمّم قطع الستانلس ستيل بمقاسات حسب الطلب واحسب التكلفة فوراً.",
      },
      { property: "og:url", content: "https://www.alsaada.sale/restaurant" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/restaurant" }],
  }),
  component: RestaurantPage,
});

type Cond = "new" | "used";
interface Selection {
  condition: Cond;
  qty: number;
}

const LAYER_LABELS: Record<string, string> = {
  core: "معدات أساسية",
  extra: "معدات إضافية",
  operating: "تجهيزات تشغيل",
};

const TIER_LABELS: Record<string, string> = {
  economy: "اقتصادية",
  standard: "متوسطة",
  premium: "احترافية",
};

interface SavedProject {
  id: string;
  name: string;
  total: number;
  data: any;
  updated_at: string;
}

const db = supabase as any;

function RestaurantPage() {
  const { user } = useAuth();
  const { types } = useProjectTypes();
  const { equipment } = useEquipment();
  const { packages } = usePackages();
  const { categories, products, grades, thicknesses, discounts, quote } = useFabricationData(true);

  const [activeType, setActiveType] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [fabItems, setFabItems] = useState<FabLineItem[]>([]);
  const [editItem, setEditItem] = useState<FabLineItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "fabrication">("fabrication");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  // بيانات عرض السعر (تُحسب في المتصفح لتجنّب اختلاف SSR)
  const [quoteMeta, setQuoteMeta] = useState<{ no: string; date: string }>({ no: "------", date: "" });
  useEffect(() => {
    setQuoteMeta({
      no: Math.floor(Date.now() / 1000).toString().slice(-6),
      date: new Date().toLocaleDateString("ar-BH"),
    });
  }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // ====== مسودة محلية ======
  const draftKey = "alsaada_fab_draft";
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const p = JSON.parse(saved);
        setActiveType(p.activeType ?? null);
        setCustomerName(p.customerName ?? "");
        setCustomerPhone(p.customerPhone ?? "");
        setDeliveryDate(p.deliveryDate ?? "");
        setNotes(p.notes ?? "");
        setDiscount(p.discount ?? 0);
        setSelected(p.selected ?? {});
        setFabItems(p.fabItems ?? []);
        if (p.fabItems?.length || Object.keys(p.selected ?? {}).length) {
          toast.info("تم استعادة مسودة مشروعك السابقة");
        }
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({ activeType, customerName, customerPhone, deliveryDate, notes, discount, selected, fabItems }),
    );
  }, [activeType, customerName, customerPhone, deliveryDate, notes, discount, selected, fabItems]);

  // ====== المشاريع المحفوظة ======
  const loadProjects = async () => {
    if (!user) return;
    const { data } = await db
      .from("fabrication_projects")
      .select("id,name,total,data,updated_at")
      .order("updated_at", { ascending: false });
    setSavedProjects((data ?? []) as SavedProject[]);
  };
  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const visibleEquipment = useMemo(() => {
    if (!activeType) return [];
    return equipment.filter((e) => e.project_type_slugs.length === 0 || e.project_type_slugs.includes(activeType));
  }, [equipment, activeType]);

  const toggle = (e: Equipment) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[e.id]) delete next[e.id];
      else next[e.id] = { condition: "new", qty: e.default_qty || 1 };
      return next;
    });
  const setCond = (id: string, condition: Cond) =>
    setSelected((s) => ({ ...s, [id]: { condition, qty: s[id]?.qty ?? 1 } }));
  const setQty = (id: string, qty: number) =>
    setSelected((s) => ({ ...s, [id]: { condition: s[id]?.condition ?? "new", qty: Math.max(1, qty) } }));

  /** السعر الفعلي لقطعة جديدة (يستخدم سعر الخصم إن وُجد) */
  const effNew = (e: Equipment) =>
    e.price_new_discounted != null && e.price_new_discounted > 0 ? e.price_new_discounted : e.price_new;

  /** أضف قائمة معدات دفعة واحدة (مع كميات اختيارية) */
  const addMany = (items: { id: string; qty?: number }[]) => {
    setSelected((s) => {
      const next = { ...s };
      let added = 0;
      for (const it of items) {
        const eq = equipment.find((e) => e.id === it.id);
        if (!eq) continue;
        if (!next[it.id]) added++;
        next[it.id] = {
          condition: next[it.id]?.condition ?? "new",
          qty: it.qty ?? next[it.id]?.qty ?? eq.default_qty ?? 1,
        };
      }
      if (added > 0) toast.success(`تمت إضافة ${added} معدة إلى مشروعك`);
      else toast.info("هذه المعدات مضافة بالفعل");
      return next;
    });
  };

  const addPackage = (pkg: RestaurantPackage) => {
    addMany(pkg.items.map((i) => ({ id: i.equipment_id, qty: i.qty })));
    toast.success(`تم تطبيق الباقة: ${pkg.name}`);
  };

  const addSuggested = () => {
    const essentials = visibleEquipment.filter((e) => e.essential);
    if (essentials.length === 0) {
      toast.info("لا توجد معدات أساسية محددة لهذا النوع");
      return;
    }
    addMany(essentials.map((e) => ({ id: e.id, qty: e.default_qty || 1 })));
  };

  const typePackages = useMemo(
    () => packages.filter((p) => !activeType || p.project_type_slug === activeType),
    [packages, activeType],
  );

  const equipMap = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment]);
  const chosen = Object.entries(selected)
    .map(([id, sel]) => ({ e: equipMap.get(id), sel }))
    .filter((x) => x.e) as { e: Equipment; sel: Selection }[];

  const equipNewTotal = chosen.reduce((a, x) => a + effNew(x.e) * x.sel.qty, 0);
  const equipUsedTotal = chosen.reduce((a, x) => a + x.e.price_used * x.sel.qty, 0);
  const equipChosenTotal = chosen.reduce(
    (a, x) => a + (x.sel.condition === "new" ? effNew(x.e) : x.e.price_used) * x.sel.qty,
    0,
  );
  const fabTotal = fabItems.reduce((a, it) => a + it.unitPrice * it.quantity, 0);

  // تقسيم التكلفة حسب طبقة المعدات (أساسية / إضافية / تجهيزات تشغيل)
  const layerTotals = useMemo(() => {
    const out: Record<string, number> = { core: 0, extra: 0, operating: 0 };
    chosen.forEach((x) => {
      const up = x.sel.condition === "new" ? effNew(x.e) : x.e.price_used;
      const layer = out[x.e.cost_layer] != null ? x.e.cost_layer : "core";
      out[layer] += up * x.sel.qty;
    });
    return out;
  }, [chosen]);

  const subTotal = equipChosenTotal + fabTotal;
  const finalTotal = Math.max(0, subTotal - discount);
  const savings = equipNewTotal > 0 ? Math.round((1 - equipUsedTotal / equipNewTotal) * 100) : 0;


  const resetProject = () => {
    setActiveType(null);
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryDate("");
    setNotes("");
    setDiscount(0);
    setSelected({});
    setFabItems([]);
    setProjectId(null);
  };

  const collectData = () => ({
    activeType,
    customerName,
    customerPhone,
    deliveryDate,
    notes,
    discount,
    selected,
    fabItems,
  });

  const saveProject = async () => {
    if (!user) {
      toast.info("سجّل الدخول لحفظ المشروع واستكماله لاحقاً");
      return;
    }
    if (subTotal === 0) {
      toast.error("لا يمكن حفظ مشروع فارغ. أضف عناصر أولاً.");
      return;
    }
    setSaving(true);
    const name = types.find((t) => t.slug === activeType)?.name ?? "مشروعي";
    const payload = {
      user_id: user.id,
      name,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      total: finalTotal,
      data: collectData(),
    };
    const res = projectId
      ? await db.from("fabrication_projects").update(payload).eq("id", projectId)
      : await db.from("fabrication_projects").insert(payload).select("id").single();
    setSaving(false);
    if (res.error) {
      toast.error("تعذّر حفظ المشروع");
    } else {
      if (!projectId && res.data?.id) setProjectId(res.data.id);
      toast.success("تم حفظ المشروع بنجاح");
      loadProjects();
    }
  };

  const loadProject = (p: SavedProject, asCopy = false) => {
    const d = p.data ?? {};
    setActiveType(d.activeType ?? null);
    setCustomerName(d.customerName ?? "");
    setCustomerPhone(d.customerPhone ?? "");
    setDeliveryDate(d.deliveryDate ?? "");
    setNotes(d.notes ?? "");
    setDiscount(d.discount ?? 0);
    setSelected(d.selected ?? {});
    setFabItems(d.fabItems ?? []);
    setProjectId(asCopy ? null : p.id);
    setShowProjects(false);
    toast.success(asCopy ? "تم نسخ المشروع — احفظه كمشروع جديد" : "تم فتح المشروع");
  };

  const deleteProject = async (id: string) => {
    const { error } = await db.from("fabrication_projects").delete().eq("id", id);
    if (error) return toast.error("تعذّر حذف المشروع");
    if (projectId === id) setProjectId(null);
    toast.success("تم حذف المشروع");
    loadProjects();
  };

  const shareWhatsApp = () => {
    const lines = [
      `*${quote.pdfTitle}*`,
      customerName ? `العميل: ${customerName}` : "",
      "",
      ...chosen.map(
        (c) =>
          `• ${c.e.name} ×${c.sel.qty} (${c.sel.condition === "new" ? "جديد" : "مستعمل"}) — ${BHD((c.sel.condition === "new" ? effNew(c.e) : c.e.price_used) * c.sel.qty)}`,
      ),
      ...fabItems.map(
        (it) => `• ${it.productName} ×${it.quantity} — ${BHD(it.unitPrice * it.quantity)}`,
      ),
      "",
      `الإجمالي: ${BHD(finalTotal)}`,
      quote.clientMessage,
    ]
      .filter((l) => l !== "")
      .join("\n");
    const phone = (quote.whatsapp || "").replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
  };

  const printGroups = useMemo(() => {
    let index = 1;
    const items: Array<{ id: number; title: string; desc: string; qty: number; unitPrice: number; total: number; img: string | null }> = [];
    chosen.forEach(({ e, sel }) => {
      const unitPrice = sel.condition === "new" ? effNew(e) : e.price_used;
      items.push({
        id: index++,
        title: e.name,
        desc: `الحالة: ${sel.condition === "new" ? "جديد" : "مستعمل"} | ${[e.manufacturer, e.country_of_origin].filter(Boolean).join(" - ")}`,
        qty: sel.qty,
        unitPrice,
        total: unitPrice * sel.qty,
        img: e.image_url || null,
      });
    });
    fabItems.forEach((it) => {
      items.push({
        id: index++,
        title: it.productName,
        desc: describeItem(it, productMap.get(it.productId) as FabProduct | undefined),
        qty: it.quantity,
        unitPrice: it.unitPrice,
        total: it.unitPrice * it.quantity,
        img: it.imageUrl || null,
      });
    });
    return items;
  }, [chosen, fabItems, productMap]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:m-0 print:max-w-none print:p-0">
        <div className="print:hidden">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold md:text-4xl">حاسبة تفصيل الستانلس ستيل</h1>
            <p className="mt-2 text-muted-foreground">
              صمّم قطع الستانلس ستيل بمقاسات حسب الطلب واحسب تكلفة مشروعك بالكامل
            </p>
          </header>

          {/* شريط الإجراءات العلوي */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetProject}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
              >
                <Plus className="h-4 w-4" /> مشروع جديد
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProjects((v) => !v);
                    loadProjects();
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                >
                  <FolderOpen className="h-4 w-4" /> مشاريعي ({savedProjects.length})
                </button>
              )}
            </div>
            {projectId && <span className="text-xs font-bold text-emerald-600">يتم تعديل مشروع محفوظ</span>}
          </div>

          {showProjects && user && (
            <section className="mb-8 rounded-2xl border border-border bg-muted/10 p-4">
              <h2 className="mb-3 text-lg font-bold">المشاريع المحفوظة</h2>
              {savedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مشاريع محفوظة بعد.</p>
              ) : (
                <div className="space-y-2">
                  {savedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
                    >
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {BHD(p.total)} • {new Date(p.updated_at).toLocaleDateString("ar-BH")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadProject(p)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                        >
                          فتح
                        </button>
                        <button
                          onClick={() => loadProject(p, true)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
                        >
                          <Copy className="h-3.5 w-3.5" /> نسخ
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mb-10 rounded-2xl border border-border bg-muted/10 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
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

          {/* تبويبات: دراسة تكلفة المشاريع | تفصيل الستانلس ستيل */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/20 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "projects" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              دراسة تكلفة المشاريع
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fabrication")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "fabrication" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              تفصيل الستانلس ستيل
            </button>
          </div>

          {activeTab === "projects" && (
          <>
          {/* اختياري: نوع المشروع + معدات جاهزة */}
          <section>
            <h2 className="mb-3 text-lg font-bold">نوع المشروع (اختياري — لعرض المعدات الجاهزة)</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {types?.map((t) => {
                const Icon = ICONS[t.icon ?? ""] ?? Settings2;
                const active = activeType === t.slug;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveType(active ? null : t.slug)}
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

          {activeType && typePackages.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-1 text-lg font-bold">باقات جاهزة — صمّم مشروعك بضغطة واحدة</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                اختر باقة جاهزة تناسب ميزانيتك وأضف كل معداتها دفعة واحدة، ثم عدّل ما تشاء.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {typePackages.map((pkg) => {
                  const pkgTotal = pkg.items.reduce((a, it) => {
                    const eq = equipMap.get(it.equipment_id);
                    return a + (eq ? effNew(eq) * it.qty : 0);
                  }, 0);
                  return (
                    <div key={pkg.id} className="flex flex-col rounded-2xl border border-border p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="font-bold">{pkg.name}</h3>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {TIER_LABELS[pkg.tier] ?? pkg.tier}
                        </span>
                      </div>
                      {pkg.description && (
                        <p className="mb-2 text-xs text-muted-foreground">{pkg.description}</p>
                      )}
                      <p className="mb-3 text-sm text-muted-foreground">
                        {pkg.items.length} معدة • تبدأ من {BHD(pkgTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addPackage(pkg)}
                        className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-primary p-2 text-sm font-bold text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" /> أضف الباقة كاملة
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeType && visibleEquipment.length > 0 && (
            <section className="mt-10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">معدات جاهزة لهذا المشروع</h2>
                {visibleEquipment.some((e) => e.essential) && (
                  <button
                    type="button"
                    onClick={addSuggested}
                    className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                  >
                    <Plus className="h-4 w-4" /> أضف المعدات الأساسية المقترحة دفعة واحدة
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleEquipment.map((e) => {
                  const sel = selected[e.id];
                  const hasDisc = e.price_new_discounted != null && e.price_new_discounted > 0;
                  const specEntries = Object.entries(e.specs || {}).slice(0, 3);
                  return (
                    <div
                      key={e.id}
                      className={`flex flex-col overflow-hidden rounded-2xl border ${sel ? "border-primary" : "border-border"}`}
                    >
                      <div className="relative">
                        <img
                          src={e.image_url || "/placeholder.svg"}
                          alt={e.name}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
                        {e.essential && (
                          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            أساسية
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold leading-tight">{e.name}</h3>
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {LAYER_LABELS[e.cost_layer] ?? e.cost_layer}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[e.manufacturer, e.country_of_origin].filter(Boolean).join(" • ")}
                        </p>
                        {specEntries.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                            {specEntries.map(([k, v]) => (
                              <li key={k}>
                                <span className="font-bold">{k}:</span> {v}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              if (!sel) toggle(e);
                              setCond(e.id, "new");
                            }}
                            className={`rounded-lg border p-2 text-center ${
                              sel?.condition === "new" ? "border-primary bg-primary/10 font-bold text-primary" : "border-border"
                            }`}
                          >
                            جديد
                            <div className="text-xs">
                              {hasDisc ? (
                                <>
                                  <span className="text-primary">{BHD(e.price_new_discounted as number)}</span>{" "}
                                  <span className="text-[10px] text-muted-foreground line-through">{BHD(e.price_new)}</span>
                                </>
                              ) : (
                                BHD(e.price_new)
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!sel) toggle(e);
                              setCond(e.id, "used");
                            }}
                            className={`rounded-lg border p-2 text-center ${
                              sel?.condition === "used" ? "border-primary bg-primary/10 font-bold text-primary" : "border-border"
                            }`}
                          >
                            مستعمل
                            <div className="text-xs">{BHD(e.price_used)}</div>
                            {e.used_condition && (
                              <div className="text-[10px] text-muted-foreground">{e.used_condition}</div>
                            )}
                          </button>
                        </div>
                        {sel && (
                          <div className="mt-2 flex items-center justify-between rounded-lg border border-border p-1.5">
                            <span className="text-xs font-bold text-muted-foreground">الكمية</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQty(e.id, sel.qty - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded border border-border"
                                aria-label="إنقاص"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold">{sel.qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(e.id, sel.qty + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded border border-border"
                                aria-label="زيادة"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggle(e)}
                          className={`mt-2 flex items-center justify-center gap-1 rounded-lg p-2 text-sm font-bold ${
                            sel ? "bg-destructive/10 text-destructive" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {sel ? (
                            <>
                              <Minus className="h-4 w-4" /> إزالة
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" /> إضافة
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          </>
          )}

          {activeTab === "fabrication" && (
          /* حاسبة التفصيل الديناميكية */
          <FabricationCalculator
            categories={categories}
            products={products}
            grades={grades}
            thicknesses={thicknesses}
            discountPct={discounts.default}
            onAdd={(item) => setFabItems((p) => [...p, item])}
            editItem={editItem}
            onEditSave={(updated) => {
              setFabItems((p) => p.map((x) => (x.uid === updated.uid ? updated : x)));
              setEditItem(null);
            }}
            onEditCancel={() => setEditItem(null)}
          />
          )}

          {/* الملخص */}
          <section className="mt-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">ملخص المشروع</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" /> واتساب
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logCalcEvent(activeType ?? "fab", "تفصيل ستانلس", finalTotal);
                    window.print();
                  }}
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
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted text-right">
                  <tr>
                    <th className="p-3">العنصر</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">سعر الوحدة</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {chosen.map(({ e, sel }) => {
                    const up = sel.condition === "new" ? effNew(e) : e.price_used;
                    return (
                      <tr key={e.id} className="border-t border-border">
                        <td className="p-3">
                          {e.name}
                          <div className="text-xs text-muted-foreground">معدة {sel.condition === "new" ? "جديدة" : "مستعملة"}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setQty(e.id, sel.qty - 1)} aria-label="إنقاص" className="rounded border border-border p-0.5">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center font-bold">{sel.qty}</span>
                            <button onClick={() => setQty(e.id, sel.qty + 1)} aria-label="زيادة" className="rounded border border-border p-0.5">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3">{BHD(up)}</td>
                        <td className="p-3 font-bold">{BHD(up * sel.qty)}</td>
                        <td className="p-3">
                          <button onClick={() => toggle(e)} aria-label="حذف">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {fabItems.map((it) => (
                    <tr key={it.uid} className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {it.imageUrl && (
                            <img src={it.imageUrl} alt={it.productName} loading="lazy" className="h-10 w-10 shrink-0 rounded-md border object-cover" />
                          )}
                          <div>
                            {it.productName}
                            <div className="mt-1 text-xs text-muted-foreground">
                              {describeItem(it, productMap.get(it.productId) as FabProduct | undefined)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{it.quantity}</td>
                      <td className="p-3">{BHD(it.unitPrice)}</td>
                      <td className="p-3 font-bold">{BHD(it.unitPrice * it.quantity)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditItem(it)} aria-label="تعديل">
                            <Pencil className="h-4 w-4 text-primary" />
                          </button>
                          <button onClick={() => setFabItems((p) => p.filter((x) => x.uid !== it.uid))} aria-label="حذف">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {chosen.length === 0 && fabItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
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
                  className="min-h-[100px] w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="شروط التركيب، الضمان، أو الدفع..."
                />
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold">قيمة الخصم الثابت (د.ب)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-center text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="الإجمالي الفرعي" value={BHD(subTotal)} />
              <Stat label="نسبة التوفير (مستعمل/جديد)" value={`${savings}%`} accent />
              <Stat label="الخصم الإضافي" value={`- ${BHD(discount)}`} />
              <Stat label="المجموع النهائي" value={BHD(finalTotal)} primary />
            </div>

            {chosen.length > 0 && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* تقسيم التكلفة حسب الطبقة */}
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="mb-3 text-base font-bold">تقسيم تكلفة المعدات</h3>
                  <div className="space-y-2">
                    {(["core", "extra", "operating"] as const).map((layer) => (
                      <div key={layer} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{LAYER_LABELS[layer]}</span>
                        <span className="font-bold">{BHD(layerTotals[layer])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* مقارنة جديد مقابل مستعمل */}
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="mb-3 text-base font-bold">مقارنة ذكية: جديد مقابل مستعمل</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إجمالي لو كل المعدات جديدة</span>
                      <span className="font-bold">{BHD(equipNewTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إجمالي لو كل المعدات مستعملة</span>
                      <span className="font-bold">{BHD(equipUsedTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">الفرق المحتمل (توفير)</span>
                      <span className="font-bold text-emerald-600">{BHD(equipNewTotal - equipUsedTotal)}</span>
                    </div>
                    <p className="pt-1 text-xs text-muted-foreground">
                      {savings >= 40
                        ? "التوفير كبير جداً عند اختيار المستعمل — مناسب للبداية بميزانية محدودة."
                        : savings > 0
                          ? "يمكنك توفير جزء من الميزانية باختيار بعض المعدات مستعملة."
                          : "أضف معدات لمقارنة خيارات الجديد والمستعمل."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* طلب عرض سعر / تسجيل اهتمام (Leads) */}
            {subTotal > 0 && (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="mb-1 text-base font-bold">اطلب عرض سعر رسمي</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  اترك اسمك ورقم الواتساب وسنتواصل معك بعرض سعر مفصّل لمشروعك.
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="الاسم"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="رقم الواتساب"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={submitLead}
                    disabled={leadSaving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </div>
            )}

          </section>
        </div>

        {/* عرض الطباعة */}
        <div
          className="hidden bg-white font-sans text-black print:block print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact]"
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
                  <div className="fixed left-0 right-0 top-0 z-50 flex items-end justify-between border-b-4 border-gray-900 bg-white pb-4 pt-8">
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tight">حراج السعادة</h1>
                      <h2 className="mt-1 text-xl font-bold uppercase tracking-widest text-gray-600">Alsaada Market</h2>
                    </div>
                    <div className="space-y-1 text-left text-sm font-medium">
                      <p>
                        <span className="text-gray-500">رقم العرض:</span> QT-{quoteMeta.no}
                      </p>
                      <p>
                        <span className="text-gray-500">التاريخ:</span> {quoteMeta.date}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 mt-4 flex justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-5">
                    <div className="space-y-2">
                      <p>
                        <span className="inline-block w-24 font-bold text-gray-500">العميل:</span>{" "}
                        <span className="text-lg font-bold">{customerName || "........................"}</span>
                      </p>
                      <p>
                        <span className="inline-block w-24 font-bold text-gray-500">الهاتف:</span>{" "}
                        <span className="font-bold" dir="ltr">
                          {customerPhone || "........................"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p>
                        <span className="inline-block w-24 font-bold text-gray-500">نوع المشروع:</span>{" "}
                        <span className="font-bold">{types?.find((t) => t.slug === activeType)?.name || "تفصيل ستانلس"}</span>
                      </p>
                      <p>
                        <span className="inline-block w-24 font-bold text-gray-500">الاستلام:</span>{" "}
                        <span className="font-bold">{deliveryDate || "........................"}</span>
                      </p>
                    </div>
                  </div>

                  <table className="mb-8 w-full border-collapse text-right">
                    <thead>
                      <tr className="border-y-2 border-gray-900 bg-gray-100">
                        <th className="w-12 border-l border-gray-300 px-2 py-3 text-center font-bold">م</th>
                        <th className="border-l border-gray-300 px-4 py-3 font-bold">تفاصيل العنصر</th>
                        <th className="w-20 border-l border-gray-300 px-2 py-3 text-center font-bold">الكمية</th>
                        <th className="w-32 border-l border-gray-300 px-2 py-3 text-center font-bold">سعر الوحدة</th>
                        <th className="w-32 px-2 py-3 text-center font-bold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printGroups.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 print:break-inside-avoid">
                          <td className="border-l border-gray-100 px-2 py-4 text-center align-middle text-sm font-bold text-gray-500">
                            {item.id}
                          </td>
                          <td className="border-l border-gray-100 px-4 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              {item.img && (
                                <img src={item.img} alt={item.title} className="h-14 w-14 shrink-0 rounded-md border border-gray-200 object-cover print:[-webkit-print-color-adjust:exact]" />
                              )}
                              <div>
                                <span className="block font-bold text-gray-900">{item.title}</span>
                                <span className="mt-0.5 block text-sm text-gray-600">{item.desc}</span>
                              </div>
                            </div>
                          </td>
                          <td className="border-l border-gray-100 px-2 py-4 text-center align-middle font-medium">{item.qty}</td>
                          <td className="border-l border-gray-100 px-2 py-4 text-center align-middle font-medium">
                            {BHD(item.unitPrice)}
                          </td>
                          <td className="px-2 py-4 text-center align-middle font-bold text-gray-900">{BHD(item.total)}</td>
                        </tr>
                      ))}
                      {printGroups.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center font-bold text-gray-600">
                            لا توجد عناصر في المشروع
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mb-16 flex items-start justify-between print:break-inside-avoid">
                    <div className="w-1/2 pr-4">
                      {notes && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                          <h4 className="mb-2 border-b pb-1 font-bold text-gray-700">ملاحظات وشروط المشروع:</h4>
                          <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="w-[45%] overflow-hidden rounded-lg border-2 border-gray-900">
                      <div className="flex justify-between border-b border-gray-200 bg-white px-5 py-3">
                        <span className="font-bold text-gray-600">الإجمالي الفرعي:</span>
                        <span className="text-lg font-bold">{BHD(subTotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between border-b border-gray-200 bg-red-50 px-5 py-3 text-red-600">
                          <span className="font-bold">الخصم الممنوح:</span>
                          <span className="text-lg font-bold">- {BHD(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between bg-gray-900 px-5 py-4 text-white">
                        <span className="text-xl font-extrabold">الإجمالي النهائي:</span>
                        <span className="text-xl font-extrabold">{BHD(finalTotal)}</span>
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

          <div className="fixed bottom-0 left-0 right-0 border-t-2 border-gray-900 bg-white pb-3 pt-3 text-center text-sm text-gray-600">
            <p className="mb-1 font-bold text-black">متخصصون في معدات مطاعم، أثاث، إلكترونيات وتفصيل الستانلس</p>
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
