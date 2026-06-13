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
  Check,
  Ruler,
} from "lucide-react";
import {
  applyDiscount,
  calcUnitPrice,
  defaultConfig,
  pickImage,
  resolveKind,
  SIZE_MAX,
  SIZE_MIN,
  BHD,
  DEFAULT_BOWL,
  type BowlSize,
  type DrawerSide,
  type FabCategory,
  type FabConfig,
  type FabFields,
  type FabKind,
  type FabLineItem,
  type FabProduct,
  type ShelfPosition,
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
  const editProduct = useMemo(
    () => (editItem ? products.find((p) => p.id === editItem.productId) ?? null : null),
    [editItem, products],
  );

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-bold">حاسبة تفصيل الستانلس ستيل</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        جميع الأصناف معروضة في صفحة واحدة. حدّد المقاسات والخيارات لكل قطعة ويتغيّر الرسم ثلاثي الأبعاد والسعر مباشرة.
      </p>

      {sortedCats.map((cat) => {
        const Icon = ICONS[cat.icon ?? ""] ?? Settings2;
        const catProducts = products
          .filter((p) => p.category_id === cat.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        if (catProducts.length === 0) return null;
        return (
          <div key={cat.id} className="mb-10">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">{cat.name}</h3>
            </div>
            <div className="grid gap-5">
              {catProducts.map((p) => (
                <ProductConfigurator
                  key={p.id}
                  product={p}
                  categorySlug={cat.slug}
                  grades={grades}
                  thicknesses={thicknesses}
                  discountPct={discountPct}
                  onAdd={(cfg, unitPrice, imageUrl) =>
                    onAdd({
                      ...cfg,
                      uid: newUid(),
                      productId: p.id,
                      productName: p.name,
                      categorySlug: cat.slug,
                      icon: p.icon,
                      unitPrice,
                      imageUrl,
                    })
                  }
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* نافذة تعديل عنصر قائم */}
      {editItem && editProduct && (
        <EditDialog
          product={editProduct}
          categorySlug={editItem.categorySlug}
          grades={grades}
          thicknesses={thicknesses}
          discountPct={discountPct}
          initial={editItem}
          onClose={onEditCancel}
          onSave={(cfg, unitPrice) => onEditSave({ ...editItem, ...cfg, unitPrice })}
        />
      )}
    </section>
  );
}

function configFromItem(item: FabLineItem): FabConfig {
  return {
    length: item.length,
    width: item.width,
    height: item.height,
    shelves: item.shelves,
    tiers: item.tiers,
    bowls: item.bowls,
    bowlSide: item.bowlSide ?? "center",
    bowlSizes: item.bowlSizes ?? [{ ...DEFAULT_BOWL }],
    topShelf: item.topShelf,
    bottomShelf: item.bottomShelf,
    wheels: item.wheels,
    shelfPosition: item.shelfPosition ?? "top",
    drawers: item.drawers ?? 0,
    drawerSide: item.drawerSide ?? "right",
    backGuard: item.backGuard ?? false,
    rightGuard: item.rightGuard ?? false,
    leftGuard: item.leftGuard ?? false,
    grade: item.grade,
    thickness: item.thickness,
    quantity: item.quantity,
    notes: item.notes,
  };
}

/** لوحة تخصيص منتج داخل الصفحة مباشرة (بدون نافذة منبثقة) */
function ProductConfigurator({
  product,
  categorySlug,
  grades,
  thicknesses,
  discountPct,
  onAdd,
}: {
  product: FabProduct;
  categorySlug: string;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discountPct: number;
  onAdd: (cfg: FabConfig, unitPrice: number, imageUrl: string | null) => void;
}) {
  const [cfg, setCfg] = useState<FabConfig>(() => {
    const base = defaultConfig(thicknesses);
    const gradeKeys = Object.keys(grades);
    return { ...base, grade: gradeKeys.includes(base.grade) ? base.grade : gradeKeys[0] ?? base.grade };
  });
  const [added, setAdded] = useState(false);

  const unitPrice = useMemo(
    () => applyDiscount(calcUnitPrice(product, cfg, grades, thicknesses), discountPct),
    [product, cfg, grades, thicknesses, discountPct],
  );
  const total = unitPrice * Math.max(1, cfg.quantity || 1);
  const previewImg = useMemo(() => pickImage(product.images ?? [], cfg, product.image_url), [product, cfg]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </span>
        )}
        <div>
          <div className="font-bold leading-tight">{product.name}</div>
          {product.description && <div className="line-clamp-1 text-xs text-muted-foreground">{product.description}</div>}
        </div>
      </div>

      <ConfigBody
        product={product}
        categorySlug={categorySlug}
        grades={grades}
        thicknesses={thicknesses}
        cfg={cfg}
        setCfg={setCfg}
        total={total}
      />


      <button
        type="button"
        onClick={() => {
          onAdd({ ...cfg, quantity: Math.max(1, cfg.quantity || 1) }, unitPrice, previewImg);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground transition-colors"
      >
        {added ? <><Check className="h-5 w-5" /> أُضيف للمشروع</> : <><Plus className="h-5 w-5" /> إضافة إلى المشروع</>}
      </button>
    </div>
  );
}

function EditDialog({
  product,
  categorySlug,
  grades,
  thicknesses,
  discountPct,
  initial,
  onClose,
  onSave,
}: {
  product: FabProduct;
  categorySlug: string;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discountPct: number;
  initial: FabLineItem;
  onClose: () => void;
  onSave: (cfg: FabConfig, unitPrice: number) => void;
}) {
  const [cfg, setCfg] = useState<FabConfig>(() => configFromItem(initial));
  const unitPrice = useMemo(
    () => applyDiscount(calcUnitPrice(product, cfg, grades, thicknesses), discountPct),
    [product, cfg, grades, thicknesses, discountPct],
  );
  const total = unitPrice * Math.max(1, cfg.quantity || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">تعديل: {product.name}</h3>
        <ConfigBody product={product} categorySlug={categorySlug} grades={grades} thicknesses={thicknesses} cfg={cfg} setCfg={setCfg} total={total} />
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 font-bold">
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...cfg, quantity: Math.max(1, cfg.quantity || 1) }, unitPrice)}
            className="flex-1 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground"
          >
            حفظ التعديل
          </button>
        </div>
      </div>
    </div>
  );
}

/** جسم نموذج التخصيص المشترك (معاينة + حقول) */
function ConfigBody({
  product,
  categorySlug,
  grades,
  thicknesses,
  cfg,
  setCfg,
  total,
}: {
  product: FabProduct;
  categorySlug: string;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  cfg: FabConfig;
  setCfg: React.Dispatch<React.SetStateAction<FabConfig>>;
  total: number;
}) {
  const f = product.fields ?? {};
  const set = <K extends keyof FabConfig>(k: K, v: FabConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const maxDrawers = Math.max(1, Math.min(20, Number(f.maxDrawers) || 4));
  const kind = useMemo(() => resolveKind(f, categorySlug), [f, categorySlug]);

  const previewImg = useMemo(() => pickImage(product.images ?? [], cfg, product.image_url), [product, cfg]);

  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      {/* العمود الأيسر على سطح المكتب: الرسم ثلاثي الأبعاد ثم الصورة */}
      <div className="mb-4 space-y-3 lg:order-2 lg:mb-0 lg:sticky lg:top-4 lg:w-2/5 lg:shrink-0">
        <Schematic3D cfg={cfg} fields={f} kind={kind} />
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
          {previewImg ? (
            <img src={previewImg} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">لا توجد صورة</span>
          )}
        </div>
      </div>

      {/* العمود الأيمن: الحقول والخيارات */}
      <div className="min-w-0 lg:order-1 lg:flex-1">
      <div className="grid grid-cols-2 gap-4">

        {f.length && <Num label="الطول (سم)" value={cfg.length} onChange={(n) => set("length", n)} />}
        {f.width && <Num label="العرض (سم)" value={cfg.width} onChange={(n) => set("width", n)} />}
        {f.height && <Num label="الارتفاع (سم)" value={cfg.height} onChange={(n) => set("height", n)} />}
        {f.shelves && <Num label="عدد الأرفف" value={cfg.shelves} onChange={(n) => set("shelves", n)} min={0} max={20} />}
        {f.tiers && <Num label="عدد الأدوار" value={cfg.tiers} onChange={(n) => set("tiers", n)} min={1} max={10} />}
        {f.bowls && <Num label="عدد الأحواض" value={cfg.bowls} onChange={(n) => {
          const count = Math.max(1, Math.min(6, n || 1));
          setCfg((c) => {
            const sizes = [...(c.bowlSizes ?? [])];
            while (sizes.length < count) sizes.push({ ...DEFAULT_BOWL });
            sizes.length = count;
            return { ...c, bowls: count, bowlSizes: sizes };
          });
        }} min={1} max={6} />}

        {f.grade && (
          <Field label="نوع الستانلس">
            <select value={cfg.grade} onChange={(e) => set("grade", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold">
              {Object.keys(grades).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        )}
        {f.thickness && (
          <Field label="السماكة (ملم)">
            <select value={cfg.thickness} onChange={(e) => set("thickness", e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold">
              {thicknesses.options.map((t) => (
                <option key={t} value={String(t)}>{t}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* تفاصيل الأحواض: الجهة والقياس والعمق لكل حوض */}
      {f.bowls && (
        <div className="mt-4 space-y-3">
          {cfg.bowls === 1 && (
            <Field label="جهة الحوض">
              <select value={cfg.bowlSide} onChange={(e) => set("bowlSide", e.target.value as DrawerSide)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold">
                <option value="right">يمين</option>
                <option value="center">وسط</option>
                <option value="left">يسار</option>
              </select>
            </Field>
          )}
          <div className="space-y-3">
            {Array.from({ length: cfg.bowls }).map((_, i) => {
              const b = cfg.bowlSizes?.[i] ?? { ...DEFAULT_BOWL };
              const setBowl = (patch: Partial<BowlSize>) => {
                setCfg((c) => {
                  const sizes = [...(c.bowlSizes ?? [])];
                  while (sizes.length < c.bowls) sizes.push({ ...DEFAULT_BOWL });
                  sizes[i] = { ...sizes[i], ...patch };
                  return { ...c, bowlSizes: sizes };
                });
              };
              return (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-2 text-sm font-bold text-muted-foreground">
                    {cfg.bowls === 1 ? "قياس الحوض" : `قياس الحوض ${i + 1}`}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Num label="العرض (سم)" value={b.width} onChange={(n) => setBowl({ width: n })} min={5} max={200} />
                    <Num label="الطول (سم)" value={b.length} onChange={(n) => setBowl({ length: n })} min={5} max={200} />
                    <Num label="العمق (سم)" value={b.depth} onChange={(n) => setBowl({ depth: n })} min={5} max={100} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* الأدراج */}
      {f.drawers && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Num label={`عدد الأدراج (حد أقصى ${maxDrawers})`} value={cfg.drawers} onChange={(n) => set("drawers", n)} min={0} max={maxDrawers} />
          {cfg.drawers > 0 && (
            <Field label="جهة الأدراج">
              <select value={cfg.drawerSide} onChange={(e) => set("drawerSide", e.target.value as DrawerSide)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold">
                <option value="right">يمين</option>
                <option value="center">وسط</option>
                <option value="left">يسار</option>
              </select>
            </Field>
          )}
        </div>
      )}

      {/* الأرفف والعجلات */}
      {(f.topShelf || f.bottomShelf || f.wheels) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {f.topShelf && <Toggle label="رف إضافي" on={cfg.topShelf} onClick={() => set("topShelf", !cfg.topShelf)} />}
          {f.bottomShelf && <Toggle label="رف سفلي" on={cfg.bottomShelf} onClick={() => set("bottomShelf", !cfg.bottomShelf)} />}
          {f.wheels && <Toggle label="عجلات متحركة" on={cfg.wheels} onClick={() => set("wheels", !cfg.wheels)} />}
        </div>
      )}

      {/* الحواجز الجانبية والخلفية */}
      {(f.backGuard || f.rightGuard || f.leftGuard) && (
        <div className="mt-4">
          <div className="mb-1.5 text-sm font-bold text-muted-foreground">الحواجز</div>
          <div className="flex flex-wrap gap-2">
            {f.backGuard && <Toggle label="حاجز خلفي" on={cfg.backGuard} onClick={() => set("backGuard", !cfg.backGuard)} />}
            {f.rightGuard && <Toggle label="حاجز يمين" on={cfg.rightGuard} onClick={() => set("rightGuard", !cfg.rightGuard)} />}
            {f.leftGuard && <Toggle label="حاجز يسار" on={cfg.leftGuard} onClick={() => set("leftGuard", !cfg.leftGuard)} />}
          </div>
        </div>
      )}

      {/* موضع الرف الإضافي: علوي أو وسطي */}
      {f.topShelf && cfg.topShelf && (
        <div className="mt-3">
          <div className="mb-1.5 text-sm font-bold text-muted-foreground">موضع الرف الإضافي</div>
          <div className="flex gap-2">
            <Toggle label="علوي" on={cfg.shelfPosition === "top"} onClick={() => set("shelfPosition", "top" as ShelfPosition)} />
            <Toggle label="وسطي" on={cfg.shelfPosition === "middle"} onClick={() => set("shelfPosition", "middle" as ShelfPosition)} />
          </div>
        </div>
      )}

      {f.notes && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-bold text-muted-foreground">ملاحظات</label>
          <textarea value={cfg.notes} onChange={(e) => set("notes", e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-sm" rows={2} placeholder="أي تفاصيل إضافية..." />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        {f.quantity ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground">الكمية</span>
            <button type="button" onClick={() => set("quantity", Math.max(1, cfg.quantity - 1))} className="rounded-lg border border-border p-2 hover:bg-muted">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold">{cfg.quantity}</span>
            <button type="button" onClick={() => set("quantity", Math.min(99, cfg.quantity + 1))} className="rounded-lg border border-border p-2 hover:bg-muted">
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

/**
 * رسم توضيحي ثلاثي الأبعاد يتغيّر شكله حسب نوع الصنف (طاولة، مغسلة، رف جداري،
 * رف وقافي، خزانة، عربة، هود) وحسب المقاسات والخيارات المختارة.
 */
function Schematic3D({ cfg, fields, kind }: { cfg: FabConfig; fields: FabFields; kind: FabKind }) {
  const VBW = 300;
  const VBH = 230;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);

  const Lraw = fields.length ? Math.max(1, cfg.length || 0) : 100;
  const Wraw = fields.width ? Math.max(1, cfg.width || 0) : 60;
  const Hraw = fields.height ? Math.max(1, cfg.height || 0) : 85;
  const maxDim = Math.max(Lraw, Wraw, Hraw, 1);

  const bw = 70 + (Lraw / maxDim) * 120; // عرض الواجهة
  const bd = 24 + (Wraw / maxDim) * 50; // العمق
  const dx = bd * 0.95;
  const dy = -bd * 0.5;

  const defs = (
    <defs>
      <linearGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" className="text-primary" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" className="text-primary" />
      </linearGradient>
      <linearGradient id={`${gid}-side`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" className="text-primary" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.16" className="text-primary" />
      </linearGradient>
      <linearGradient id={`${gid}-front`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" className="text-primary" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.07" className="text-primary" />
      </linearGradient>
    </defs>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background">
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="aspect-[4/3] w-full" aria-label="رسم توضيحي للقطعة">
        {defs}
        {children}
      </svg>
    </div>
  );

  // رف جداري ستانلس
  if (kind === "wallShelf") {
    const n = Math.max(1, Math.min(8, fields.shelves ? cfg.shelves || 1 : 2));
    const left = 50;
    const right = VBW - 50;
    const top = 28;
    const bottom = 196;
    const sd = 30; // عمق الرف
    const sdx = sd * 0.95;
    const sdy = -sd * 0.5;
    const shelves = [];
    for (let i = 0; i < n; i++) {
      const y = top + 22 + (i * (bottom - top - 30)) / Math.max(1, n);
      shelves.push(
        <g key={i}>
          {/* السطح العلوي للرف */}
          <polygon
            points={`${left},${y} ${right},${y} ${right + sdx},${y + sdy} ${left + sdx},${y + sdy}`}
            fill={`url(#${gid}-top)`}
            className="stroke-primary"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* الحافة الأمامية */}
          <rect x={left} y={y} width={right - left} height="5" className="fill-primary/20 stroke-primary" strokeWidth="1.2" />
          {/* حوامل مثلثة */}
          <polygon points={`${left + 14},${y + 5} ${left + 14},${y + 22} ${left + 14 + sdx * 0.7},${y + 5 + sdy * 0.7}`} className="fill-primary/25 stroke-primary" strokeWidth="1" />
          <polygon points={`${right - 14},${y + 5} ${right - 14},${y + 22} ${right - 14 + sdx * 0.7},${y + 5 + sdy * 0.7}`} className="fill-primary/25 stroke-primary" strokeWidth="1" />
        </g>,
      );
    }
    return wrap(
      <>
        {/* الجدار */}
        <rect x={left - 10} y={top - 6} width={right - left + 20} height={bottom - top + 12} rx="4" className="fill-muted-foreground/5 stroke-muted-foreground/30" strokeWidth="1" strokeDasharray="4 4" />
        {shelves}
        <text x={(left + right) / 2} y={bottom + 22} textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="bold">
          {Lraw} سم · {n} رف
        </text>
      </>,
    );
  }

  // رف ستانلس وقافي (أرضي متعدد الأدوار)
  if (kind === "standingShelf") {
    const n = Math.max(2, Math.min(8, fields.tiers ? cfg.tiers || 2 : 4));
    const ox = (VBW - bw - dx) / 2;
    const topY = 26;
    const botY = 200;
    const span = botY - topY;
    const post = (hx: number, v: number) => (
      <line key={`p${hx}-${v}`} x1={ox + hx + v * dx} y1={topY + v * dy} x2={ox + hx + v * dx} y2={botY + v * dy} className={v ? "stroke-primary/70" : "stroke-primary"} strokeWidth="3" strokeLinecap="round" />
    );
    const tiers = [];
    for (let i = 0; i < n; i++) {
      const y = topY + (i * span) / (n - 1);
      tiers.push(
        <polygon
          key={i}
          points={`${ox},${y} ${ox + bw},${y} ${ox + bw + dx},${y + dy} ${ox + dx},${y + dy}`}
          fill={`url(#${gid}-top)`}
          className="stroke-primary"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />,
      );
    }
    return wrap(
      <>
        {post(5, 1)}
        {post(bw - 5, 1)}
        {tiers}
        {post(5, 0)}
        {post(bw - 5, 0)}
        <text x={ox + bw / 2} y={botY + 24} textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="bold">
          {Lraw} سم · {n} دور
        </text>
      </>,
    );
  }

  // الهود/الشفاط (شكل شبه منحرف)
  if (kind === "hood") {
    const ox = (VBW - bw - dx) / 2;
    const baseY = 170;
    const topY = 70;
    const inset = bw * 0.16;
    return wrap(
      <>
        {/* قناة التهوية */}
        <rect x={ox + bw / 2 - 10} y={28} width="20" height={topY - 24} className="fill-primary/15 stroke-primary" strokeWidth="1.4" />
        {/* الواجهة شبه المنحرفة */}
        <polygon
          points={`${ox},${baseY} ${ox + bw},${baseY} ${ox + bw - inset},${topY} ${ox + inset},${topY}`}
          fill={`url(#${gid}-front)`}
          className="stroke-primary"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* الجانب */}
        <polygon
          points={`${ox + bw},${baseY} ${ox + bw + dx},${baseY + dy} ${ox + bw - inset + dx},${topY + dy} ${ox + bw - inset},${topY}`}
          fill={`url(#${gid}-side)`}
          className="stroke-primary"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* السطح العلوي */}
        <polygon
          points={`${ox + inset},${topY} ${ox + bw - inset},${topY} ${ox + bw - inset + dx},${topY + dy} ${ox + inset + dx},${topY + dy}`}
          fill={`url(#${gid}-top)`}
          className="stroke-primary"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <text x={ox + bw / 2} y={baseY + 26} textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="bold">
          {Lraw} سم
        </text>
      </>,
    );
  }

  // الأصناف الصندوقية: طاولة / مغسلة / خزانة / عربة
  const bh = 26 + (Hraw / maxDim) * 70;
  const wantLegs = kind === "table" || kind === "sink" || kind === "trolley";
  const legH = wantLegs ? 24 + (Hraw / maxDim) * 22 : 0;
  const guardH = Math.min(20, 10 + bh * 0.12);

  const ox = (VBW - bw - dx) / 2;
  const oy = VBH - legH - 26;

  // P(hx, v, up): إسقاط نقطة
  const P = (hx: number, v: number, up: number): [number, number] => [ox + hx + v * dx, oy - up + v * dy];
  const pts = (arr: [number, number][]) => arr.map((p) => `${p[0]},${p[1]}`).join(" ");

  const showWheels = (fields.wheels && cfg.wheels) || kind === "trolley";
  const showShelf = fields.topShelf && cfg.topShelf;
  const shelfMiddle = cfg.shelfPosition === "middle";
  const showBottom = (fields.bottomShelf && cfg.bottomShelf) || kind === "trolley";
  const drawers = fields.drawers ? Math.max(0, cfg.drawers || 0) : 0;
  const bowls = kind === "sink" ? Math.max(1, fields.bowls ? cfg.bowls || 1 : 1) : 0;

  // أدراج على الواجهة
  const drawerEls: React.ReactNode[] = [];
  if (drawers > 0) {
    const colW = bw * 0.3;
    const x0 = cfg.drawerSide === "left" ? 6 : cfg.drawerSide === "center" ? (bw - colW) / 2 : bw - colW - 6;
    const gap = 4;
    const dh = (bh - gap * (drawers + 1)) / drawers;
    for (let i = 0; i < drawers; i++) {
      const upTop = bh - gap - i * (dh + gap);
      const a = P(x0, 0, upTop);
      drawerEls.push(
        <g key={i}>
          <rect x={a[0]} y={a[1]} width={colW} height={Math.max(4, dh)} rx="2.5" className="fill-primary/15 stroke-primary" strokeWidth="1.3" />
          <rect x={a[0] + colW * 0.34} y={a[1] + Math.max(4, dh) / 2 - 1.1} width={colW * 0.32} height="2.2" rx="1.1" className="fill-primary" />
        </g>,
      );
    }
  }

  // أحواض المغسلة على السطح
  const bowlEls: React.ReactNode[] = [];
  if (bowls > 0) {
    for (let i = 0; i < bowls; i++) {
      const cellW = bw / bowls;
      let m = cellW * 0.16;
      let cellStart = i * cellW;
      // حوض واحد: ضعه حسب الجهة المختارة (يمين/يسار/وسط)
      if (bowls === 1) {
        const bw2 = bw * 0.46;
        const pad = bw * 0.07;
        cellStart = cfg.bowlSide === "left" ? pad : cfg.bowlSide === "center" ? (bw - bw2) / 2 : bw - bw2 - pad;
        m = 0;
        const hx0 = cellStart;
        const hx1 = cellStart + bw2;
        const corners: [number, number][] = [P(hx0, 0.2, bh), P(hx1, 0.2, bh), P(hx1, 0.85, bh), P(hx0, 0.85, bh)];
        bowlEls.push(
          <g key={i}>
            <polygon points={pts(corners)} className="fill-primary/30 stroke-primary" strokeWidth="1.3" strokeLinejoin="round" />
          </g>,
        );
        continue;
      }
      const hx0 = cellStart + m;
      const hx1 = (i + 1) * cellW - m;
      const corners: [number, number][] = [P(hx0, 0.2, bh), P(hx1, 0.2, bh), P(hx1, 0.85, bh), P(hx0, 0.85, bh)];
      bowlEls.push(
        <g key={i}>
          <polygon points={pts(corners)} className="fill-primary/30 stroke-primary" strokeWidth="1.3" strokeLinejoin="round" />
        </g>,
      );
    }
    // الحنفية في المنتصف الخلفي
    const fx = P(bw / 2, 0.95, bh);
    bowlEls.push(
      <g key="faucet">
        <line x1={fx[0]} y1={fx[1]} x2={fx[0]} y2={fx[1] - 18} className="stroke-primary" strokeWidth="2.4" strokeLinecap="round" />
        <line x1={fx[0]} y1={fx[1] - 18} x2={fx[0] + 10} y2={fx[1] - 14} className="stroke-primary" strokeWidth="2.4" strokeLinecap="round" />
      </g>,
    );
  }

  return wrap(
    <>
      {/* ظل أرضي */}
      <ellipse cx={ox + bw / 2 + dx / 2} cy={oy + legH + 6} rx={bw * 0.52} ry={bd * 0.16} className="fill-foreground/10" />

      {/* الجسم: سطح + جانب + واجهة */}
      <polygon points={pts([P(0, 0, bh), P(0, 1, bh), P(bw, 1, bh), P(bw, 0, bh)])} fill={`url(#${gid}-top)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points={pts([P(bw, 0, bh), P(bw, 1, bh), P(bw, 1, 0), P(bw, 0, 0)])} fill={`url(#${gid}-side)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points={pts([P(0, 0, bh), P(bw, 0, bh), P(bw, 0, 0), P(0, 0, 0)])} fill={`url(#${gid}-front)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />

      {/* أبواب الخزانة */}
      {kind === "cabinet" && (
        <>
          <line x1={P(bw / 2, 0, bh)[0]} y1={P(bw / 2, 0, bh)[1]} x2={P(bw / 2, 0, 0)[0]} y2={P(bw / 2, 0, 0)[1]} className="stroke-primary/60" strokeWidth="1.3" />
          <circle cx={P(bw / 2 - 6, 0, bh / 2)[0]} cy={P(bw / 2 - 6, 0, bh / 2)[1]} r="2.4" className="fill-primary" />
          <circle cx={P(bw / 2 + 6, 0, bh / 2)[0]} cy={P(bw / 2 + 6, 0, bh / 2)[1]} r="2.4" className="fill-primary" />
        </>
      )}

      {bowlEls}
      {drawerEls}

      {/* الحواجز */}
      {fields.backGuard && cfg.backGuard && (
        <polygon points={pts([P(0, 1, bh), P(bw, 1, bh), P(bw, 1, bh + guardH), P(0, 1, bh + guardH)])} fill={`url(#${gid}-side)`} className="stroke-primary" strokeWidth="1.4" strokeLinejoin="round" />
      )}
      {fields.rightGuard && cfg.rightGuard && (
        <polygon points={pts([P(bw, 0, bh), P(bw, 1, bh), P(bw, 1, bh + guardH), P(bw, 0, bh + guardH)])} fill={`url(#${gid}-side)`} className="stroke-primary" strokeWidth="1.4" strokeLinejoin="round" />
      )}
      {fields.leftGuard && cfg.leftGuard && (
        <polygon points={pts([P(0, 0, bh), P(0, 1, bh), P(0, 1, bh + guardH), P(0, 0, bh + guardH)])} fill={`url(#${gid}-front)`} className="stroke-primary" strokeWidth="1.4" strokeLinejoin="round" />
      )}

      {/* رف إضافي علوي/وسطي */}
      {showShelf && (() => {
        const up = shelfMiddle ? bh * 0.5 : bh + 26;
        return (
          <g>
            <polygon points={pts([P(0, 0, up), P(bw, 0, up), P(bw, 1, up), P(0, 1, up)])} fill={`url(#${gid}-top)`} className="stroke-primary" strokeWidth="1.4" strokeLinejoin="round" />
            {!shelfMiddle && (
              <>
                <line x1={P(6, 0, up)[0]} y1={P(6, 0, up)[1]} x2={P(6, 0, bh)[0]} y2={P(6, 0, bh)[1]} className="stroke-primary/60" strokeWidth="1.4" />
                <line x1={P(bw - 6, 0, up)[0]} y1={P(bw - 6, 0, up)[1]} x2={P(bw - 6, 0, bh)[0]} y2={P(bw - 6, 0, bh)[1]} className="stroke-primary/60" strokeWidth="1.4" />
              </>
            )}
          </g>
        );
      })()}

      {/* رف سفلي */}
      {showBottom && legH > 0 && (
        <polygon points={pts([P(4, 0, -legH * 0.5), P(bw - 4, 0, -legH * 0.5), P(bw - 4, 1, -legH * 0.5), P(4, 1, -legH * 0.5)])} fill={`url(#${gid}-top)`} className="stroke-primary" strokeWidth="1.2" strokeLinejoin="round" />
      )}

      {/* الأرجل */}
      {legH > 0 && (
        <>
          {([[5, 0], [bw - 5, 0], [5, 1], [bw - 5, 1]] as [number, number][]).map(([hx, v], i) => {
            const a = P(hx, v, 0);
            const b = P(hx, v, -legH);
            return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={v ? "stroke-primary/70" : "stroke-primary"} strokeWidth="2.6" strokeLinecap="round" />;
          })}
        </>
      )}

      {/* العجلات */}
      {showWheels && legH > 0 && (
        <>
          {([[5, 0], [bw - 5, 0], [5, 1], [bw - 5, 1]] as [number, number][]).map(([hx, v], i) => {
            const a = P(hx, v, -legH);
            return <circle key={i} cx={a[0]} cy={a[1] + 4} r={v ? 3.8 : 4.5} className={v ? "fill-primary/70" : "fill-primary"} />;
          })}
        </>
      )}

      {/* أدلّة القياس */}
      {fields.length && (
        <>
          <line x1={P(0, 0, 0)[0]} y1={oy + legH + 16} x2={P(bw, 0, 0)[0]} y2={oy + legH + 16} className="stroke-muted-foreground/60" strokeWidth="1" />
          <text x={ox + bw / 2} y={oy + legH + 30} textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="bold">
            {Lraw} سم
          </text>
        </>
      )}
      {fields.height && (
        <text x={ox - 12} y={oy - bh / 2} textAnchor="end" className="fill-foreground" fontSize="11" fontWeight="bold">
          {Hraw}
        </text>
      )}
    </>,
  );
}
