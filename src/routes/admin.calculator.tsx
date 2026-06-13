import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SINK,
  DEFAULT_STEEL,
  DEFAULT_SHELF,
  DEFAULT_DISCOUNTS,
  DEFAULT_THICKNESS,
  type Discounts,
  type ShelfSettings,
  type ThicknessSettings,
} from "@/lib/restaurant-calc";

export const Route = createFileRoute("/admin/calculator")({
  component: AdminCalculatorPage,
});

const db = supabase as any;

function AdminCalculatorPage() {
  return (
    <div>
      <AdminHeader
        title="لوحة حاسبة التصنيع"
        subtitle="تحكم كامل بأسعار الطاولات والمغاسل والأرفف ونسب الخصم والسُمك — التعديلات تظهر مباشرة في صفحة الحاسبة"
      />
      <div className="p-6">
        <CalcSettings />
      </div>
    </div>
  );
}

function CalcSettings() {
  const [steel, setSteel] = useState(JSON.stringify(DEFAULT_STEEL, null, 2));
  const [sink, setSink] = useState(JSON.stringify(DEFAULT_SINK, null, 2));
  const [discounts, setDiscounts] = useState<Discounts>(DEFAULT_DISCOUNTS);
  const [shelf, setShelf] = useState<ShelfSettings>(DEFAULT_SHELF);
  const [thickness, setThickness] = useState<ThicknessSettings>(DEFAULT_THICKNESS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.from("restaurant_calc_settings")
      .select("key,value")
      .then(({ data }: any) => {
        for (const r of data ?? []) {
          if (r.key === "steel_table" && r.value) setSteel(JSON.stringify(r.value, null, 2));
          if (r.key === "sink" && r.value) setSink(JSON.stringify(r.value, null, 2));
          if (r.key === "discounts" && r.value) setDiscounts({ ...DEFAULT_DISCOUNTS, ...r.value });
          if (r.key === "shelf" && r.value) setShelf({ ...DEFAULT_SHELF, ...r.value });
          if (r.key === "thickness" && r.value) setThickness({ ...DEFAULT_THICKNESS, ...r.value });
        }
        setLoading(false);
      });
  }, []);

  const saveValue = async (key: string, value: unknown) => {
    const { error } = await db
      .from("restaurant_calc_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم حفظ الإعدادات وستظهر فوراً في صفحة الحاسبة");
  };

  const saveJson = async (key: string, raw: string) => {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return toast.error("صيغة JSON غير صحيحة");
    }
    saveValue(key, value);
  };

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-primary" />;

  const numCls = "w-24 rounded-lg border border-input bg-transparent px-3 py-1.5 text-center text-sm";

  return (
    <div className="space-y-8">
      {/* نسبة الخصم لكل نوع */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-bold">نسبة الخصم لكل نوع تصنيع (٪)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["table", "الطاولات"],
              ["sink", "المغاسل"],
              ["shelf", "الأرفف"],
            ] as [keyof Discounts, string][]
          ).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <label className="text-sm font-bold">{label}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discounts[k]}
                onChange={(e) => setDiscounts({ ...discounts, [k]: Number(e.target.value) })}
                className={numCls}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => saveValue("discounts", discounts)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          حفظ نسب الخصم
        </button>
      </section>

      {/* أسعار الأرفف + الاستيل 304 */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-bold">أسعار الأرفف الجدارية</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">عرض المقاس المعياري (سم)</label>
            <input type="number" value={shelf.base.width} onChange={(e) => setShelf({ ...shelf, base: { ...shelf.base, width: Number(e.target.value) } })} className={numCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">عمق المقاس المعياري (سم)</label>
            <input type="number" value={shelf.base.depth} onChange={(e) => setShelf({ ...shelf, base: { ...shelf.base, depth: Number(e.target.value) } })} className={numCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">سعر المقاس المعياري (استيل 201) د.ب</label>
            <input type="number" value={shelf.base.price} onChange={(e) => setShelf({ ...shelf, base: { ...shelf.base, price: Number(e.target.value) } })} className={numCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">معامل سعر الاستيل 304 (مثلاً 1.4)</label>
            <input type="number" step="0.05" value={shelf.grade304Multiplier} onChange={(e) => setShelf({ ...shelf, grade304Multiplier: Number(e.target.value) })} className={numCls} />
          </div>
        </div>
        <button
          onClick={() => saveValue("shelf", shelf)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          حفظ أسعار الأرفف
        </button>
      </section>

      {/* سمك الاستانلس ستيل */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-1 font-bold">سُمك الاستانلس ستيل ومعاملات السعر</h3>
        <p className="mb-3 text-xs text-muted-foreground">معامل ١ = السعر الأساسي. أكبر من ١ يزيد السعر، أقل من ١ يقلّله. يُطبّق على كل التفصيل.</p>
        <div className="grid gap-3 sm:grid-cols-5">
          {thickness.options.map((mm) => (
            <div key={mm}>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">{mm} ملم</label>
              <input
                type="number"
                step="0.05"
                value={thickness.multipliers[String(mm)] ?? 1}
                onChange={(e) =>
                  setThickness({
                    ...thickness,
                    multipliers: { ...thickness.multipliers, [String(mm)]: Number(e.target.value) },
                  })
                }
                className={numCls}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm font-bold">السمك الافتراضي (ملم)</label>
          <select
            value={thickness.default}
            onChange={(e) => setThickness({ ...thickness, default: Number(e.target.value) })}
            className={numCls}
          >
            {thickness.options.map((mm) => (
              <option key={mm} value={mm}>
                {mm}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => saveValue("thickness", thickness)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          حفظ إعدادات السُمك
        </button>
      </section>

      {/* أسعار الطاولات والمغاسل (متقدم) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold">أسعار حاسبة الطاولات الستانلس (متقدم)</h3>
          <textarea
            value={steel}
            onChange={(e) => setSteel(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-input bg-transparent p-3 font-mono text-xs"
            dir="ltr"
          />
          <button
            onClick={() => saveJson("steel_table", steel)}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            حفظ أسعار الطاولات
          </button>
        </div>
        <div>
          <h3 className="mb-2 font-bold">أسعار حاسبة المغاسل (متقدم)</h3>
          <textarea
            value={sink}
            onChange={(e) => setSink(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-input bg-transparent p-3 font-mono text-xs"
            dir="ltr"
          />
          <button
            onClick={() => saveJson("sink", sink)}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            حفظ أسعار المغاسل
          </button>
        </div>
      </div>
    </div>
  );
}
