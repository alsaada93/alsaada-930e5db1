import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
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
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useCalcSettings } from "@/hooks/useRestaurant";
import {
  steelTablePrice,
  sinkPrice,
  shelfPrice,
  applyDiscount,
  SIZE_MIN,
  SIZE_MAX,
  BHD,
} from "@/lib/restaurant-calc";
import type {
  SteelTableConfig,
  SinkConfig,
  ShelfConfig,
  SteelTableSettings,
  SinkSettings,
  ShelfSettings,
} from "@/lib/restaurant-calc";

import steelTableImg from "@/assets/manufacturing/steel-table-3d.jpg";
import steelSinkImg from "@/assets/manufacturing/steel-sink-3d.jpg";
import steelShelfImg from "@/assets/manufacturing/steel-shelf-3d.jpg";

export const Route = createFileRoute("/restaurant/manufacturing")({
  head: () => ({
    meta: [
      { title: "حاسبة تصنيع الستيل (طاولات ومغاسل وأرفف) | حراج السعادة" },
      {
        name: "description",
        content:
          "احسب تكلفة تصنيع الطاولات الستانلس والمغاسل والأرفف الجدارية حسب المقاس بأسعار حقيقية مع رسم ثلاثي الأبعاد وعرض سعر قابل للطباعة.",
      },
      { property: "og:title", content: "حاسبة تصنيع الستيل | حراج السعادة" },
      {
        property: "og:description",
        content: "حاسبة تصنيع الطاولات الستانلس والمغاسل والأرفف حسب المقاس.",
      },
    ],
  }),
  component: ManufacturingPage,
});

type NumOrEmpty = number | "";

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

/* ===================== الرسم ثلاثي الأبعاد ===================== */
const IMG = { table: steelTableImg, sink: steelSinkImg, shelf: steelShelfImg };

function Item3D({
  type,
  length,
  width,
  depthLabel = "العرض",
}: {
  type: "table" | "sink" | "shelf";
  length: NumOrEmpty;
  width: NumOrEmpty;
  depthLabel?: string;
}) {
  const l = length === "" ? 120 : Number(length);
  const w = width === "" ? 60 : Number(width);
  // عرض الصورة المعروضة يتناسب مع طول القطعة لإيحاء تغيّر الحجم مع القياس
  const widthPct = Math.min(100, Math.max(45, 45 + (l / SIZE_MAX) * 55));

  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      <div className="relative transition-all duration-300" style={{ width: `${widthPct}%` }}>
        <img
          src={IMG[type]}
          alt="رسم ثلاثي الأبعاد للقطعة"
          loading="lazy"
          decoding="async"
          width={768}
          height={576}
          className="w-full rounded-xl object-contain drop-shadow-md"
        />
        {length !== "" && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-foreground/85 px-2.5 py-0.5 text-[11px] font-bold text-background">
            طول {length} سم
          </span>
        )}
        {width !== "" && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
            {depthLabel} {width} سم
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] font-bold text-muted-foreground">صورة توضيحية ثلاثية الأبعاد — تتناسب مع المقاس</p>
    </div>
  );
}

/* ===================== عناصر مشتركة ===================== */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground/80">
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
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
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

/* ===================== الحاسبات ===================== */
function SteelTableCalculator({
  settings,
  discount,
  factor,
  onAdd,
}: {
  settings: SteelTableSettings;
  discount: number;
  factor: number;
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
  const price = applyDiscount(rawPrice * factor, discount);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">١. حاسبة تصنيع الطاولات الستانلس</h2>
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
                <CheckRow label="شلف وسطي إضافي" checked={midShelf} onChange={setMidShelf} />
                <CheckRow label="حاجز خلفي" checked={splashBack} onChange={setSplashBack} />
                <CheckRow label="حاجز يمين" checked={splashRight} onChange={setSplashRight} />
                <CheckRow label="حاجز يسار" checked={splashLeft} onChange={setSplashLeft} />
              </div>
            </Field>
          </div>
          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
        </div>
        <PreviewPane
          type="table"
          length={length}
          width={width}
          isValid={isValid}
          price={price}
          count={count}
          discount={discount}
          addLabel="إضافة الطاولة للمشروع"
          onAdd={() => {
            if (!isValid) return;
            onAdd(
              { grade, length: Number(length), width: Number(width), midShelf, splashBack, splashRight, splashLeft },
              price,
              count,
            );
            setLength("");
            setWidth("");
          }}
        />
      </div>
    </section>
  );
}

function SinkCalculator({
  settings,
  discount,
  factor,
  onAdd,
}: {
  settings: SinkSettings;
  discount: number;
  factor: number;
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
  const price = applyDiscount(rawPrice * factor, discount);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٢. حاسبة تفصيل المغاسل (استيل 304)</h2>
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
                <CheckRow label="شلف سفلي" checked={bottomShelf} onChange={setBottomShelf} />
                <CheckRow label="حاجز خلفي (10سم)" checked={splashBack} onChange={setSplashBack} accent />
                <CheckRow label="حاجز يمين" checked={splashRight} onChange={setSplashRight} />
                <CheckRow label="حاجز يسار" checked={splashLeft} onChange={setSplashLeft} />
              </div>
            </Field>
          </div>
          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
        </div>
        <PreviewPane
          type="sink"
          length={length}
          width={width}
          isValid={isValid}
          price={price}
          count={count}
          discount={discount}
          addLabel="إضافة المغسلة للمشروع"
          onAdd={() => {
            if (!isValid) return;
            onAdd(
              { length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth, splashBack, splashRight, splashLeft },
              price,
              count,
            );
            setLength("");
            setWidth("");
          }}
        />
      </div>
    </section>
  );
}

function ShelfCalculator({
  settings,
  discount,
  factor,
  onAdd,
}: {
  settings: ShelfSettings;
  discount: number;
  factor: number;
  onAdd: (cfg: ShelfConfig, price: number, count: number) => void;
}) {
  const [grade, setGrade] = useState<"201" | "304">("201");
  const [length, setLength] = useState<NumOrEmpty>("");
  const [width, setWidth] = useState<NumOrEmpty>("");
  const [count, setCount] = useState(1);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid ? shelfPrice({ grade, length: Number(length), width: Number(width) }, settings) : 0;
  const price = applyDiscount(rawPrice * factor, discount);

  return (
    <section className="mt-10 print:hidden">
      <h2 className="mb-3 text-lg font-bold">٣. حاسبة تفصيل أرفف جدارية (استيل)</h2>
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
            <Field label="العمق/البروز (سم)">
              <NumInput value={width} onChange={setWidth} />
            </Field>
          </div>
          <div className="border-t pt-4">
            <CountField value={count} onChange={setCount} />
          </div>
          <p className="mt-4 rounded-lg border bg-muted/50 p-3 text-xs font-medium leading-relaxed text-muted-foreground">
            المقاس المعياري {settings.base.width}×{settings.base.depth}سم بسعر {BHD(settings.base.price)}، ويرتفع السعر
            تلقائياً كلما زادت المساحة. هذا الرف مخصص للتعليق على الجدار.
          </p>
        </div>
        <PreviewPane
          type="shelf"
          length={length}
          width={width}
          depthLabel="البروز"
          isValid={isValid}
          price={price}
          count={count}
          discount={discount}
          addLabel="إضافة الرف للمشروع"
          onAdd={() => {
            if (!isValid) return;
            onAdd({ grade, length: Number(length), width: Number(width) }, price, count);
            setLength("");
            setWidth("");
          }}
        />
      </div>
    </section>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  accent,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${accent ? "text-emerald-700" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
      {label}
    </label>
  );
}

function PreviewPane({
  type,
  length,
  width,
  depthLabel,
  isValid,
  price,
  count,
  discount,
  addLabel,
  onAdd,
}: {
  type: "table" | "sink" | "shelf";
  length: NumOrEmpty;
  width: NumOrEmpty;
  depthLabel?: string;
  isValid: boolean;
  price: number;
  count: number;
  discount: number;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-dashed border-gray-200 bg-muted/40 p-4">
      <Item3D type={type} length={length} width={width} depthLabel={depthLabel} />
      <div className="z-10 mt-2 rounded-2xl bg-background/80 px-6 py-3 text-center shadow-sm backdrop-blur-sm">
        <div className="text-sm font-bold text-muted-foreground">التكلفة المتوقعة</div>
        <div className="my-1 text-3xl font-black text-primary">{isValid ? BHD(price) : "---"}</div>
        {isValid && discount > 0 && (
          <div className="mb-2 text-xs font-bold text-emerald-600">شامل خصم {discount}%</div>
        )}
        {count > 1 && isValid && (
          <div className="mt-1 border-t pt-2 text-xs font-bold text-muted-foreground">
            الإجمالي ({count}): <span className="text-foreground">{BHD(price * count)}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={!isValid}
        onClick={onAdd}
        className="z-10 mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-5 w-5" /> {addLabel}
      </button>
    </div>
  );
}

/* ===================== نوافذ التعديل ===================== */
function EditTableDialog({
  settings,
  discount,
  factor,
  value,
  onClose,
  onSave,
}: {
  settings: SteelTableSettings;
  discount: number;
  factor: number;
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
  const price = applyDiscount(rawPrice * factor, discount);

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
              onSave({ ...value, grade, length: Number(length), width: Number(width), midShelf, splashBack, splashRight, splashLeft, price })
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
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <CheckRow label="شلف وسطي" checked={midShelf} onChange={setMidShelf} />
        <CheckRow label="حاجز خلفي" checked={splashBack} onChange={setSplashBack} />
        <CheckRow label="حاجز يمين" checked={splashRight} onChange={setSplashRight} />
        <CheckRow label="حاجز يسار" checked={splashLeft} onChange={setSplashLeft} />
      </div>
      <PriceRow isValid={isValid} price={price} discount={discount} />
    </DialogShell>
  );
}

function EditSinkDialog({
  settings,
  discount,
  factor,
  value,
  onClose,
  onSave,
}: {
  settings: SinkSettings;
  discount: number;
  factor: number;
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
  const price = applyDiscount(rawPrice * factor, discount);

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
              onSave({ ...value, length: Number(length), width: Number(width), bowls, bottomShelf, bowlDepth, splashBack, splashRight, splashLeft, price })
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
          <button type="button" onClick={() => setBowls((b) => Math.max(1, b - 1))} className="rounded-lg border border-border p-2 hover:bg-muted">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold">{bowls}</span>
          <button type="button" onClick={() => setBowls((b) => Math.min(10, b + 1))} className="rounded-lg border border-border p-2 hover:bg-muted">
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
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <CheckRow label="شلف سفلي" checked={bottomShelf} onChange={setBottomShelf} />
        <CheckRow label="حاجز خلفي" checked={splashBack} onChange={setSplashBack} accent />
        <CheckRow label="حاجز يمين" checked={splashRight} onChange={setSplashRight} />
        <CheckRow label="حاجز يسار" checked={splashLeft} onChange={setSplashLeft} />
      </div>
      <PriceRow isValid={isValid} price={price} discount={discount} />
    </DialogShell>
  );
}

function EditShelfDialog({
  settings,
  discount,
  value,
  onClose,
  onSave,
}: {
  settings: ShelfSettings;
  discount: number;
  value: ShelfItem;
  onClose: () => void;
  onSave: (s: ShelfItem) => void;
}) {
  const [length, setLength] = useState<NumOrEmpty>(value.length);
  const [width, setWidth] = useState<NumOrEmpty>(value.width);

  const isValid = length !== "" && width !== "";
  const rawPrice = isValid ? shelfPrice({ length: Number(length), width: Number(width) }, settings) : 0;
  const price = applyDiscount(rawPrice, discount);

  return (
    <DialogShell
      title="تعديل الرف الجداري"
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SaveBtn disabled={!isValid} onClick={() => isValid && onSave({ ...value, length: Number(length), width: Number(width), price })} />
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
      <PriceRow isValid={isValid} price={price} discount={discount} />
    </DialogShell>
  );
}

function PriceRow({ isValid, price, discount }: { isValid: boolean; price: number; discount: number }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-bold">
      <div className="mb-1 flex items-center justify-between">
        <span>السعر المعدل:</span>
        <span className="text-lg text-primary">{isValid ? BHD(price) : "---"}</span>
      </div>
      {discount > 0 && <div className="self-end text-[10px] text-emerald-600">شامل خصم {discount}% وجبر للكسور</div>}
    </div>
  );
}

/* ===================== الصفحة ===================== */
const DRAFT_KEY = "alsaada_manufacturing_draft";

function ManufacturingPage() {
  const { user } = useAuth();
  const { steel, sink, shelf, discounts } = useCalcSettings();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [sinks, setSinks] = useState<SinkItem[]>([]);
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [editSink, setEditSink] = useState<SinkItem | null>(null);
  const [editShelf, setEditShelf] = useState<ShelfItem | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        setCustomerName(p.customerName || "");
        setCustomerPhone(p.customerPhone || "");
        setDeliveryDate(p.deliveryDate || "");
        setNotes(p.notes || "");
        setDiscount(p.discount || 0);
        setTables(p.tables || []);
        setSinks(p.sinks || []);
        setShelves(p.shelves || []);
      }
    } catch {
      // تجاهل
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ customerName, customerPhone, deliveryDate, notes, discount, tables, sinks, shelves }),
    );
  }, [customerName, customerPhone, deliveryDate, notes, discount, tables, sinks, shelves]);

  const tablesTotal = tables.reduce((a, t) => a + t.price, 0);
  const sinksTotal = sinks.reduce((a, s) => a + s.price, 0);
  const shelvesTotal = shelves.reduce((a, s) => a + s.price, 0);
  const subTotal = tablesTotal + sinksTotal + shelvesTotal;
  const finalTotal = Math.max(0, subTotal - discount);

  const printGroups = useMemo(() => {
    let index = 1;
    const items: Array<{ id: number; img: ReactNode; title: string; desc: string; qty: number; unitPrice: number; total: number }> = [];

    const gTables = tables.reduce((acc, t) => {
      const key = `${t.grade}-${t.length}-${t.width}-${t.midShelf}-${t.splashBack}-${t.splashRight}-${t.splashLeft}`;
      if (!acc[key]) acc[key] = { ...t, qty: 0 };
      acc[key].qty += 1;
      return acc;
    }, {} as Record<string, any>);
    Object.values(gTables).forEach((t: any) => {
      const extras = [t.midShelf ? "شلف وسطي" : "", t.splashBack ? "حاجز خلفي" : "", t.splashRight ? "حاجز يمين" : "", t.splashLeft ? "حاجز يسار" : ""].filter(Boolean).join("، ");
      items.push({ id: index++, img: <TableIcon className="h-6 w-6 text-gray-500" />, title: `طاولة ستانلس ستيل (درجة ${t.grade})`, desc: `المقاس: ${t.length}×${t.width} سم${extras ? ` | الإضافات: ${extras}` : ""}`, qty: t.qty, unitPrice: t.price, total: t.price * t.qty });
    });

    const gSinks = sinks.reduce((acc, s) => {
      const key = `${s.length}-${s.width}-${s.bowls}-${s.bottomShelf}-${s.bowlDepth}-${s.splashBack}-${s.splashRight}-${s.splashLeft}`;
      if (!acc[key]) acc[key] = { ...s, qty: 0 };
      acc[key].qty += 1;
      return acc;
    }, {} as Record<string, any>);
    Object.values(gSinks).forEach((s: any) => {
      const extras = [s.bottomShelf ? "شلف سفلي" : "", s.splashBack ? "حاجز خلفي" : "", s.splashRight ? "حاجز يمين" : "", s.splashLeft ? "حاجز يسار" : ""].filter(Boolean).join("، ");
      items.push({ id: index++, img: <Bath className="h-6 w-6 text-gray-500" />, title: "مغسلة ستانلس ستيل (درجة 304)", desc: `المقاس: ${s.length}×${s.width} سم | الأحواض: ${s.bowls} | عمق: ${s.bowlDepth} سم${extras ? ` | ${extras}` : ""}`, qty: s.qty, unitPrice: s.price, total: s.price * s.qty });
    });

    const gShelves = shelves.reduce((acc, s) => {
      const key = `${s.length}-${s.width}`;
      if (!acc[key]) acc[key] = { ...s, qty: 0 };
      acc[key].qty += 1;
      return acc;
    }, {} as Record<string, any>);
    Object.values(gShelves).forEach((s: any) => {
      items.push({ id: index++, img: <Rows3 className="h-6 w-6 text-gray-500" />, title: "رف جداري ستانلس ستيل", desc: `المقاس: ${s.length}×${s.width} سم | يعلق على الحائط`, qty: s.qty, unitPrice: s.price, total: s.price * s.qty });
    });

    return items;
  }, [tables, sinks, shelves]);

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
    const { error } = await (supabase as any).from("saved_restaurant_projects").insert({
      user_id: user.id,
      name: "تصنيع ستيل",
      total: finalTotal,
      data: { kind: "manufacturing", customerName, customerPhone, deliveryDate, notes, discount, tables, sinks, shelves },
    });
    setSaving(false);
    if (error) toast.error("تعذّر حفظ المشروع");
    else {
      toast.success("تم حفظ المشروع بنجاح");
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="container mx-auto flex-1 px-4 py-8" dir="rtl">
        <div className="print:hidden">
          <Link
            to="/restaurant"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <ArrowRight className="h-4 w-4" /> العودة لحاسبة المشاريع
          </Link>
          <header className="mb-8">
            <h1 className="text-2xl font-extrabold sm:text-3xl">حاسبة تصنيع الستيل</h1>
            <p className="mt-2 text-muted-foreground">
              صمّم طاولاتك الستانلس والمغاسل والأرفف الجدارية حسب المقاس واحصل على عرض سعر فوري قابل للطباعة.
            </p>
          </header>

          <section className="mb-6 rounded-2xl border border-border bg-muted/10 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <User className="h-5 w-5 text-primary" /> بيانات العميل (لعرض السعر)
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">اسم العميل</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="شركة التقدم..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رقم الهاتف</label>
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="33XXXXXX" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">تاريخ الاستلام المتوقع</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <SteelTableCalculator
            settings={steel}
            discount={discounts.table}
            onAdd={(cfg, price, count) => setTables((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])}
          />
          <SinkCalculator
            settings={sink}
            discount={discounts.sink}
            onAdd={(cfg, price, count) => setSinks((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])}
          />
          <ShelfCalculator
            settings={shelf}
            discount={discounts.shelf}
            onAdd={(cfg, price, count) => setShelves((p) => [...p, ...Array.from({ length: count }, () => ({ ...cfg, uid: newUid(), price }))])}
          />

          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">٤. ملخص التصنيع</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted">
                  <Printer className="h-4 w-4" /> طباعة / PDF
                </button>
                <button onClick={saveProject} disabled={saving} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  <Save className="h-4 w-4" /> حفظ المشروع
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted text-right">
                  <tr>
                    <th className="p-3">العنصر</th>
                    <th className="p-3">التكلفة</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => (
                    <tr key={t.uid} className="border-t border-border">
                      <td className="p-3">
                        طاولة ستانلس {t.grade} ({t.length}×{t.width}سم)
                      </td>
                      <td className="p-3 font-bold">{BHD(t.price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditTable(t)} aria-label="تعديل"><Pencil className="h-4 w-4 text-primary" /></button>
                          <button onClick={() => setTables((p) => p.filter((x) => x.uid !== t.uid))} aria-label="حذف"><Trash2 className="h-4 w-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sinks.map((s) => (
                    <tr key={s.uid} className="border-t border-border">
                      <td className="p-3">مغسلة ستانلس 304 ({s.length}×{s.width}سم، عمق {s.bowlDepth}سم)</td>
                      <td className="p-3 font-bold">{BHD(s.price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditSink(s)} aria-label="تعديل"><Pencil className="h-4 w-4 text-primary" /></button>
                          <button onClick={() => setSinks((p) => p.filter((x) => x.uid !== s.uid))} aria-label="حذف"><Trash2 className="h-4 w-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shelves.map((s) => (
                    <tr key={s.uid} className="border-t border-border">
                      <td className="p-3">رف جداري ستانلس ({s.length}×{s.width}سم)</td>
                      <td className="p-3 font-bold">{BHD(s.price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditShelf(s)} aria-label="تعديل"><Pencil className="h-4 w-4 text-primary" /></button>
                          <button onClick={() => setShelves((p) => p.filter((x) => x.uid !== s.uid))} aria-label="حذف"><Trash2 className="h-4 w-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tables.length === 0 && sinks.length === 0 && shelves.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-muted-foreground">لم تتم إضافة أي عناصر بعد.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">ملاحظات وشروط (تظهر في عرض السعر)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px] w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="شروط التركيب، الضمان، الدفع..." />
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold">قيمة الخصم الثابت (د.ب)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-center text-sm" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="الإجمالي الفرعي" value={BHD(subTotal)} />
              <Stat label="الخصم الإضافي" value={`- ${BHD(discount)}`} />
              <Stat label="المجموع النهائي" value={BHD(finalTotal)} primary />
            </div>
          </section>
        </div>

        {/* عرض الطباعة */}
        <div className="hidden bg-white font-sans text-black print:block" dir="rtl">
          <div className="mb-6 flex items-end justify-between border-b-4 border-gray-900 pb-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">حراج السعادة</h1>
              <h2 className="mt-1 text-lg font-bold uppercase tracking-widest text-gray-600">عرض سعر تصنيع ستيل</h2>
            </div>
            <div className="text-left text-sm font-medium">
              <p><span className="text-gray-500">التاريخ:</span> {new Date().toLocaleDateString("ar-BH")}</p>
            </div>
          </div>
          <div className="mb-6 flex justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
            <p><span className="font-bold text-gray-500">العميل:</span> <span className="font-bold">{customerName || "—"}</span></p>
            <p><span className="font-bold text-gray-500">الهاتف:</span> <span className="font-bold" dir="ltr">{customerPhone || "—"}</span></p>
            <p><span className="font-bold text-gray-500">الاستلام:</span> <span className="font-bold">{deliveryDate || "—"}</span></p>
          </div>
          <table className="mb-6 w-full border-collapse text-right">
            <thead>
              <tr className="border-y-2 border-gray-900 bg-gray-100">
                <th className="w-10 border-l border-gray-300 px-2 py-2 text-center">م</th>
                <th className="border-l border-gray-300 px-3 py-2">التفاصيل</th>
                <th className="w-16 border-l border-gray-300 px-2 py-2 text-center">الكمية</th>
                <th className="w-24 border-l border-gray-300 px-2 py-2 text-center">السعر</th>
                <th className="w-24 px-2 py-2 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {printGroups.map((it) => (
                <tr key={it.id} className="border-b border-gray-200">
                  <td className="px-2 py-3 text-center text-sm font-bold text-gray-500">{it.id}</td>
                  <td className="px-3 py-3">
                    <div className="font-bold">{it.title}</div>
                    <div className="text-sm text-gray-600">{it.desc}</div>
                  </td>
                  <td className="px-2 py-3 text-center">{it.qty}</td>
                  <td className="px-2 py-3 text-center">{BHD(it.unitPrice)}</td>
                  <td className="px-2 py-3 text-center font-bold">{BHD(it.total)}</td>
                </tr>
              ))}
              {printGroups.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center font-bold text-gray-400">لا توجد عناصر</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-72 overflow-hidden rounded-lg border-2 border-gray-900">
              <div className="flex justify-between border-b border-gray-200 px-4 py-2"><span className="font-bold text-gray-600">الإجمالي الفرعي:</span><span className="font-bold">{BHD(subTotal)}</span></div>
              {discount > 0 && <div className="flex justify-between border-b border-gray-200 bg-red-50 px-4 py-2 text-red-600"><span className="font-bold">الخصم:</span><span className="font-bold">- {BHD(discount)}</span></div>}
              <div className="flex justify-between bg-gray-900 px-4 py-3 text-white"><span className="font-extrabold">الإجمالي النهائي:</span><span className="font-extrabold">{BHD(finalTotal)}</span></div>
            </div>
          </div>
          {notes && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <h4 className="mb-1 border-b pb-1 font-bold text-gray-700">ملاحظات وشروط:</h4>
              <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{notes}</p>
            </div>
          )}
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>

      {editTable && (
        <EditTableDialog settings={steel} discount={discounts.table} value={editTable} onClose={() => setEditTable(null)} onSave={(u) => { setTables((p) => p.map((x) => (x.uid === u.uid ? u : x))); setEditTable(null); }} />
      )}
      {editSink && (
        <EditSinkDialog settings={sink} discount={discounts.sink} value={editSink} onClose={() => setEditSink(null)} onSave={(u) => { setSinks((p) => p.map((x) => (x.uid === u.uid ? u : x))); setEditSink(null); }} />
      )}
      {editShelf && (
        <EditShelfDialog settings={shelf} discount={discounts.shelf} value={editShelf} onClose={() => setEditShelf(null)} onSave={(u) => { setShelves((p) => p.map((x) => (x.uid === u.uid ? u : x))); setEditShelf(null); }} />
      )}
    </div>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${primary ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card shadow-sm"}`}>
      <div className={`text-xs ${primary ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  );
}
