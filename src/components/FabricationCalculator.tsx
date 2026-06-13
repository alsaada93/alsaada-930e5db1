import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Bath,
  Rows3,
  Archive,
  Layers,
  Truck,
  Wind,
  Settings2,
  Plus,
  Minus,
  X,
  Ruler,
} from "lucide-react";
import {
  applyDiscount,
  calcUnitPrice,
  defaultConfig,
  SIZE_MAX,
  SIZE_MIN,
  BHD,
  type FabCategory,
  type FabConfig,
  type FabLineItem,
  type FabProduct,
  type SteelGrades,
  type Thicknesses,
} from "@/lib/fabrication";

const ICONS: Record<string, typeof Table> = {
  Table,
  Bath,
  Rows3,
  Archive,
  Layers,
  Truck,
  Wind,
  Settings2,
};

const newUid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface Props {
  categories: FabCategory[];
  products: FabProduct[];
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discountPct: number;
  onAdd: (item: FabLineItem) => void;
  editItem: FabLineItem | null;
  onEditSave: (item: FabLineItem) => void;
  onEditCancel: () => void;
}

export function FabricationCalculator({
  categories,
  products,
  grades,
  thicknesses,
  discountPct,
  onAdd,
  editItem,
  onEditSave,
  onEditCancel,
}: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(categories[0]?.slug ?? null);
  const [dialogProduct, setDialogProduct] = useState<FabProduct | null>(null);

  useEffect(() => {
    if (!activeCat && categories[0]) setActiveCat(categories[0].slug);
  }, [categories, activeCat]);

  const editProduct = useMemo(
    () => (editItem ? products.find((p) => p.id === editItem.productId) ?? null : null),
    [editItem, products],
  );

  const visibleProducts = useMemo(() => {
    const cat = categories.find((c) => c.slug === activeCat);
    if (!cat) return [];
    return products.filter((p) => p.category_id === cat.id);
  }, [products, categories, activeCat]);

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-bold">حاسبة تفصيل الستانلس ستيل</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        اختر النوع ثم القطعة، وحدّد المقاسات والخيارات ليُحسب السعر مباشرة ويُضاف إلى مشروعك.
      </p>

      {/* تبويبات الفئات */}
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => {
          const Icon = ICONS[c.icon ?? ""] ?? Settings2;
          const active = activeCat === c.slug;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.slug)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* شبكة المنتجات */}
      {visibleProducts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
          لا توجد منتجات في هذه الفئة بعد. يمكن للإدارة إضافتها من لوحة التحكم.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p) => {
            const Icon = ICONS[p.icon ?? ""] ?? Settings2;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDialogProduct(p)}
                className="flex items-start gap-3 rounded-2xl border border-border p-4 text-right transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="font-bold leading-tight">{p.name}</span>
                  {p.description && (
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</span>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Plus className="h-3.5 w-3.5" /> تخصيص وإضافة
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* نافذة تخصيص منتج جديد */}
      {dialogProduct && (
        <ConfigDialog
          product={dialogProduct}
          grades={grades}
          thicknesses={thicknesses}
          discountPct={discountPct}
          onClose={() => setDialogProduct(null)}
          onSubmit={(cfg, unitPrice) => {
            onAdd({
              ...cfg,
              uid: newUid(),
              productId: dialogProduct.id,
              productName: dialogProduct.name,
              categorySlug: categories.find((c) => c.id === dialogProduct.category_id)?.slug ?? "",
              icon: dialogProduct.icon,
              unitPrice,
            });
            setDialogProduct(null);
          }}
        />
      )}

      {/* نافذة تعديل عنصر قائم */}
      {editItem && editProduct && (
        <ConfigDialog
          product={editProduct}
          grades={grades}
          thicknesses={thicknesses}
          discountPct={discountPct}
          initial={editItem}
          onClose={onEditCancel}
          onSubmit={(cfg, unitPrice) => onEditSave({ ...editItem, ...cfg, unitPrice })}
        />
      )}
    </section>
  );
}

function ConfigDialog({
  product,
  grades,
  thicknesses,
  discountPct,
  initial,
  onClose,
  onSubmit,
}: {
  product: FabProduct;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discountPct: number;
  initial?: FabLineItem;
  onClose: () => void;
  onSubmit: (cfg: FabConfig, unitPrice: number) => void;
}) {
  const f = product.fields ?? {};
  const [cfg, setCfg] = useState<FabConfig>(() => {
    const base = defaultConfig(thicknesses);
    if (initial) {
      return {
        length: initial.length,
        width: initial.width,
        height: initial.height,
        shelves: initial.shelves,
        tiers: initial.tiers,
        bowls: initial.bowls,
        topShelf: initial.topShelf,
        bottomShelf: initial.bottomShelf,
        wheels: initial.wheels,
        grade: initial.grade,
        thickness: initial.thickness,
        quantity: initial.quantity,
        notes: initial.notes,
      };
    }
    const gradeKeys = Object.keys(grades);
    return { ...base, grade: gradeKeys.includes(base.grade) ? base.grade : gradeKeys[0] ?? base.grade };
  });

  const set = <K extends keyof FabConfig>(k: K, v: FabConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const unitPrice = useMemo(
    () => applyDiscount(calcUnitPrice(product, cfg, grades, thicknesses), discountPct),
    [product, cfg, grades, thicknesses, discountPct],
  );
  const total = unitPrice * Math.max(1, cfg.quantity || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{product.name}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {f.length && <Num label="الطول (سم)" value={cfg.length} onChange={(n) => set("length", n)} />}
          {f.width && <Num label="العرض (سم)" value={cfg.width} onChange={(n) => set("width", n)} />}
          {f.height && <Num label="الارتفاع (سم)" value={cfg.height} onChange={(n) => set("height", n)} />}
          {f.shelves && <Num label="عدد الأرفف" value={cfg.shelves} onChange={(n) => set("shelves", n)} min={0} max={20} />}
          {f.tiers && <Num label="عدد الأدوار" value={cfg.tiers} onChange={(n) => set("tiers", n)} min={1} max={10} />}
          {f.bowls && <Num label="عدد الأحواض" value={cfg.bowls} onChange={(n) => set("bowls", n)} min={1} max={6} />}

          {f.grade && (
            <Field label="نوع الستانلس">
              <select
                value={cfg.grade}
                onChange={(e) => set("grade", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold"
              >
                {Object.keys(grades).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {f.thickness && (
            <Field label="السماكة (ملم)">
              <select
                value={cfg.thickness}
                onChange={(e) => set("thickness", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold"
              >
                {thicknesses.options.map((t) => (
                  <option key={t} value={String(t)}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {(f.topShelf || f.bottomShelf || f.wheels) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {f.topShelf && <Toggle label="رف علوي" on={cfg.topShelf} onClick={() => set("topShelf", !cfg.topShelf)} />}
            {f.bottomShelf && (
              <Toggle label="رف سفلي" on={cfg.bottomShelf} onClick={() => set("bottomShelf", !cfg.bottomShelf)} />
            )}
            {f.wheels && <Toggle label="عجلات متحركة" on={cfg.wheels} onClick={() => set("wheels", !cfg.wheels)} />}
          </div>
        )}

        {f.notes && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-bold text-muted-foreground">ملاحظات</label>
            <textarea
              value={cfg.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
              rows={2}
              placeholder="أي تفاصيل إضافية..."
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          {f.quantity ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground">الكمية</span>
              <button
                type="button"
                onClick={() => set("quantity", Math.max(1, cfg.quantity - 1))}
                className="rounded-lg border border-border p-2 hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{cfg.quantity}</span>
              <button
                type="button"
                onClick={() => set("quantity", Math.min(99, cfg.quantity + 1))}
                className="rounded-lg border border-border p-2 hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="text-left">
            <div className="text-xs text-muted-foreground">السعر التقديري</div>
            <div className="text-2xl font-extrabold text-primary">{BHD(total)}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSubmit({ ...cfg, quantity: Math.max(1, cfg.quantity || 1) }, unitPrice)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
        >
          <Plus className="h-5 w-5" /> {initial ? "حفظ التعديل" : "إضافة إلى المشروع"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
        <Ruler className="h-3.5 w-3.5 text-primary/70" />
        {label}
      </div>
      {children}
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  min = SIZE_MIN,
  max = SIZE_MAX,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={() => onChange(Math.min(max, Math.max(min, value || min)))}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </Field>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
        on ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}
