import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
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
  Check,
  Ruler,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useProjectTypes,
  useEquipment,
  useCalcSettings,
  type Equipment,
} from "@/hooks/useRestaurant";
import {
  steelTablePrice,
  sinkPrice,
  BHD,
  type SteelTableConfig,
  type SinkConfig,
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
      { title: "دراسة تكلفة مشاريع المطاعم | حراج السعادة" },
      {
        name: "description",
        content:
          "احسب تكلفة مشروع مطعمك أو الكوفي شوب بالكامل بأسعار حقيقية للمعدات الجديدة والمستعملة، مع حاسبة الطاولات الستانلس والمغاسل وتقرير قابل للطباعة.",
      },
      { property: "og:title", content: "دراسة تكلفة مشاريع المطاعم | حراج السعادة" },
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

function RestaurantPage() {
  const { user } = useAuth();
  const { types } = useProjectTypes();
  const { equipment } = useEquipment();
  const { steel, sink } = useCalcSettings();

  const [activeType, setActiveType] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sinks, setSinks] = useState<SinkItem[]>([]);
  const [saving, setSaving] = useState(false);

  const visibleEquipment = useMemo(() => {
    if (!activeType) return [];
    return equipment.filter(
      (e) => e.project_type_slugs.length === 0 || e.project_type_slugs.includes(activeType),
    );
  }, [equipment, activeType]);

  const toggle = (e: Equipment) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[e.id]) delete next[e.id];
      else next[e.id] = { condition: "new" };
      return next;
    });

  const setCond = (id: string, condition: Cond) =>
    setSelected((s) => ({ ...s, [id]: { condition } }));

  // الإجماليات
  const equipMap = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment]);
  const chosen = Object.entries(selected)
    .map(([id, sel]) => ({ e: equipMap.get(id), sel }))
    .filter((x) => x.e) as { e: Equipment; sel: Selection }[];

  const equipNewTotal = chosen.reduce((a, x) => a + x.e.price_new, 0);
  const equipUsedTotal = chosen.reduce((a, x) => a + x.e.price_used, 0);
  const equipChosenTotal = chosen.reduce(
    (a, x) => a + (x.sel.condition === "new" ? x.e.price_new : x.e.price_used),
    0,
  );
  const tablesTotal = tables.reduce((a, t) => a + t.price, 0);
  const sinksTotal = sinks.reduce((a, s) => a + s.price, 0);
  const finalTotal = equipChosenTotal + tablesTotal + sinksTotal;
  const savings = equipNewTotal > 0 ? Math.round((1 - equipUsedTotal / equipNewTotal) * 100) : 0;

  const saveProject = async () => {
    if (!user) {
      toast.info("سجّل الدخول لحفظ المشروع واستكماله لاحقاً");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("saved_restaurant_projects").insert({
      user_id: user.id,
      name: types.find((t) => t.slug === activeType)?.name ?? "مشروعي",
      total: finalTotal,
      data: { activeType, selected, tables, sinks },
    });
    setSaving(false);
    if (error) toast.error("تعذّر حفظ المشروع");
    else toast.success("تم حفظ المشروع بنجاح");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-8 text-center print:hidden">
          <h1 className="text-3xl font-extrabold md:text-4xl">دراسة تكلفة مشاريع المطاعم</h1>
          <p className="mt-2 text-muted-foreground">
            ابنِ مشروعك بالكامل واحسب تكلفته بأسعار حقيقية للمعدات الجديدة والمستعملة
          </p>
        </header>

        {/* 1) اختيار نوع المشروع */}
        <section className="print:hidden">
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
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
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
            {/* 2) المعدات */}
            <section className="mt-10 print:hidden">
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
                        <img
                          src={e.image_url || "/placeholder.svg"}
                          alt={e.name}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
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
                              sel
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary text-primary-foreground"
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

            {/* 3) حاسبة الطاولات */}
            <SteelTableCalculator settings={steel} onAdd={(t) => setTables((p) => [...p, t])} />

            {/* 4) حاسبة المغاسل */}
            <SinkCalculator settings={sink} onAdd={(s) => setSinks((p) => [...p, s])} />

            {/* 5) ملخص المشروع */}
            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between print:hidden">
                <h2 className="text-lg font-bold">٥. ملخص المشروع</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold"
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

              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-right">
                    <tr>
                      <th className="p-3">العنصر</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">التكلفة</th>
                      <th className="p-3 print:hidden"></th>
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
                        <td className="p-3 font-bold">
                          {BHD(sel.condition === "new" ? e.price_new : e.price_used)}
                        </td>
                        <td className="p-3 print:hidden">
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
                        <td className="p-3 print:hidden">
                          <button
                            onClick={() => setTables((p) => p.filter((x) => x.uid !== t.uid))}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
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
                        <td className="p-3 print:hidden">
                          <button
                            onClick={() => setSinks((p) => p.filter((x) => x.uid !== s.uid))}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {chosen.length === 0 && tables.length === 0 && sinks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          لم تتم إضافة أي عناصر بعد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="إجمالي المعدات (جديد)" value={BHD(equipNewTotal)} />
                <Stat label="إجمالي المعدات (مستعمل)" value={BHD(equipUsedTotal)} />
                <Stat label="نسبة التوفير" value={`${savings}%`} accent />
                <Stat label="تكلفة المشروع النهائية" value={BHD(finalTotal)} primary />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Stat label="تكلفة الطاولات" value={BHD(tablesTotal)} />
                <Stat label="تكلفة المغاسل" value={BHD(sinksTotal)} />
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
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

/* ===================== حاسبة الطاولات ===================== */
function SteelTableCalculator({
  settings,
  onAdd,
}: {
  settings: import("@/lib/restaurant-calc").SteelTableSettings;
  onAdd: (t: TableItem) => void;
}) {
  const [grade, setGrade] = useState<"201" | "304">("201");
  const [length, setLength] = useState(100);
  const [width, setWidth] = useState(60);
  const [midShelf, setMidShelf] = useState(false);
  const cfg: SteelTableConfig = { grade, length, width, midShelf };
  const price = steelTablePrice(cfg, settings);

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
              <NumInput value={length} min={20} onChange={setLength} />
            </Field>
            <Field label="العرض (سم)">
              <NumInput value={width} min={20} onChange={setWidth} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={midShelf}
              onChange={(e) => setMidShelf(e.target.checked)}
              className="h-4 w-4"
            />
            إضافة شلف وسطي (الشلف السفلي مشمول افتراضياً)
          </label>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4">
          <TableDrawing midShelf={midShelf} />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">السعر النهائي</div>
            <div className="text-2xl font-extrabold text-primary">{BHD(price)}</div>
          </div>
          <button
            type="button"
            onClick={() =>
              onAdd({ ...cfg, uid: crypto.randomUUID(), price })
            }
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> إضافة إلى المشروع
          </button>
        </div>
      </div>
    </section>
  );
}

/* ===================== حاسبة المغاسل ===================== */
function SinkCalculator({
  settings,
  onAdd,
}: {
  settings: import("@/lib/restaurant-calc").SinkSettings;
  onAdd: (s: SinkItem) => void;
}) {
  const [length, setLength] = useState(settings.base.width);
  const [width, setWidth] = useState(settings.base.depth);
  const [bowls, setBowls] = useState(1);
  const [bottomShelf, setBottomShelf] = useState(false);
  const [bowlDepth, setBowlDepth] = useState(settings.defaultDepth);
  const cfg: SinkConfig = { length, width, bowls, bottomShelf, bowlDepth };
  const price = sinkPrice(cfg, settings);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٤. حاسبة تفصيل المغاسل (استيل 304)</h2>
      <div className="grid gap-6 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الطول (سم)">
              <NumInput value={length} min={20} onChange={setLength} />
            </Field>
            <Field label="العرض (سم)">
              <NumInput value={width} min={20} onChange={setWidth} />
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
                  {d === settings.defaultDepth && (
                    <span className="ms-1 text-[10px] text-emerald-600">موصى به</span>
                  )}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={bottomShelf}
              onChange={(e) => setBottomShelf(e.target.checked)}
              className="h-4 w-4"
            />
            إضافة شلف سفلي
          </label>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 p-4">
          <SinkDrawing bowls={bowls} bottomShelf={bottomShelf} />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">السعر النهائي</div>
            <div className="text-2xl font-extrabold text-primary">{BHD(price)}</div>
          </div>
          <button
            type="button"
            onClick={() => onAdd({ ...cfg, uid: crypto.randomUUID(), price })}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> إضافة إلى المشروع
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

function NumInput({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
    />
  );
}

/* رسم توضيحي آيزومتري مبسّط للطاولة (أعلى-يمين) */
function TableDrawing({ midShelf }: { midShelf: boolean }) {
  return (
    <svg viewBox="0 0 200 150" className="h-32 w-44">
      <polygon points="40,40 150,40 180,60 70,60" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      <polygon points="70,60 180,60 180,75 70,75" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
      <line x1="75" y1="75" x2="75" y2="130" stroke="#475569" strokeWidth="3" />
      <line x1="175" y1="75" x2="175" y2="130" stroke="#475569" strokeWidth="3" />
      <line x1="45" y1="40" x2="45" y2="110" stroke="#475569" strokeWidth="3" />
      {midShelf && (
        <polygon points="55,95 165,95 175,103 65,103" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      )}
      <polygon points="60,120 170,120 180,128 70,128" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
    </svg>
  );
}

function SinkDrawing({ bowls, bottomShelf }: { bowls: number; bottomShelf: boolean }) {
  const n = Math.min(bowls, 4);
  return (
    <svg viewBox="0 0 200 150" className="h-32 w-44">
      <polygon points="30,45 150,45 185,65 65,65" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      {Array.from({ length: n }).map((_, i) => (
        <polygon
          key={i}
          points={`${50 + i * 30},48 ${72 + i * 30},48 ${82 + i * 30},58 ${60 + i * 30},58`}
          fill="#64748b"
          stroke="#334155"
          strokeWidth="1"
        />
      ))}
      <line x1="68" y1="65" x2="68" y2="125" stroke="#475569" strokeWidth="3" />
      <line x1="180" y1="65" x2="180" y2="125" stroke="#475569" strokeWidth="3" />
      <line x1="33" y1="45" x2="33" y2="105" stroke="#475569" strokeWidth="3" />
      {bottomShelf && (
        <polygon points="55,115 170,115 182,123 67,123" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      )}
    </svg>
  );
}
