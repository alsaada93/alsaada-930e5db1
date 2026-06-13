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
  SIZE_MAX,
  SIZE_MIN,
  BHD,
  type DrawerSide,
  type FabCategory,
  type FabConfig,
  type FabFields,
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
                  onAdd={(cfg, unitPrice) =>
                    onAdd({
                      ...cfg,
                      uid: newUid(),
                      productId: p.id,
                      productName: p.name,
                      categorySlug: cat.slug,
                      icon: p.icon,
                      unitPrice,
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
  grades,
  thicknesses,
  discountPct,
  onAdd,
}: {
  product: FabProduct;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  discountPct: number;
  onAdd: (cfg: FabConfig, unitPrice: number) => void;
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
        grades={grades}
        thicknesses={thicknesses}
        cfg={cfg}
        setCfg={setCfg}
        total={total}
      />

      <button
        type="button"
        onClick={() => {
          onAdd({ ...cfg, quantity: Math.max(1, cfg.quantity || 1) }, unitPrice);
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
  grades,
  thicknesses,
  discountPct,
  initial,
  onClose,
  onSave,
}: {
  product: FabProduct;
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
        <ConfigBody product={product} grades={grades} thicknesses={thicknesses} cfg={cfg} setCfg={setCfg} total={total} />
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
  grades,
  thicknesses,
  cfg,
  setCfg,
  total,
}: {
  product: FabProduct;
  grades: SteelGrades;
  thicknesses: Thicknesses;
  cfg: FabConfig;
  setCfg: React.Dispatch<React.SetStateAction<FabConfig>>;
  total: number;
}) {
  const f = product.fields ?? {};
  const set = <K extends keyof FabConfig>(k: K, v: FabConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const maxDrawers = Math.max(1, Math.min(20, Number(f.maxDrawers) || 4));

  const previewImg = useMemo(() => pickImage(product.images ?? [], cfg, product.image_url), [product, cfg]);

  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      {/* العمود الأيسر على سطح المكتب: الرسم ثلاثي الأبعاد ثم الصورة */}
      <div className="mb-4 space-y-3 lg:order-2 lg:mb-0 lg:sticky lg:top-4 lg:w-2/5 lg:shrink-0">
        <Schematic3D cfg={cfg} fields={f} />
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
        {f.bowls && <Num label="عدد الأحواض" value={cfg.bowls} onChange={(n) => set("bowls", n)} min={1} max={6} />}

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
 * رسم ثلاثي الأبعاد (إسقاط متساوي القياس) يتغيّر حسب المقاسات والخيارات:
 * يعرض الجسم، الأرجل، العجلات، الرف العلوي/الوسطي، الرف السفلي والأدراج.
 */
function Schematic3D({ cfg, fields }: { cfg: FabConfig; fields: FabFields }) {
  const VBW = 300;
  const VBH = 230;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);

  // أبعاد منطقية مُطبّعة إلى وحدات الرسم
  const Lraw = fields.length ? Math.max(1, cfg.length || 0) : 100;
  const Wraw = fields.width ? Math.max(1, cfg.width || 0) : 60;
  const Hraw = fields.height ? Math.max(1, cfg.height || 0) : 85;
  const maxDim = Math.max(Lraw, Wraw, Hraw, 1);
  const bw = 60 + (Lraw / maxDim) * 110; // عرض الواجهة
  const bd = 26 + (Wraw / maxDim) * 60; // العمق (depth)
  const bh = 34 + (Hraw / maxDim) * 90; // ارتفاع الجسم
  const legH = fields.height ? 22 + (Hraw / maxDim) * 26 : 0;

  // زاوية الإسقاط المتساوي
  const dx = bd * 0.72;
  const dy = -bd * 0.42;

  // نقطة أصل أمامية-سفلية-يسرى (موسّطة)
  const ox = (VBW - bw - dx) / 2;
  const oy = (VBH + bh - dy) / 2 - legH / 2;

  const showWheels = fields.wheels && cfg.wheels;
  const showShelf = fields.topShelf && cfg.topShelf;
  const shelfMiddle = cfg.shelfPosition === "middle";
  const showBottom = fields.bottomShelf && cfg.bottomShelf;
  const drawers = fields.drawers ? Math.max(0, cfg.drawers || 0) : 0;

  // إحداثيات صندوق الجسم (واجهة + سطح + جانب)
  const fTL = [ox, oy - bh];
  const fTR = [ox + bw, oy - bh];
  const fBR = [ox + bw, oy];
  const fBL = [ox, oy];
  const tTL = [ox + dx, oy - bh + dy];
  const tTR = [ox + bw + dx, oy - bh + dy];
  const tBR = [ox + bw + dx, oy + dy];

  const pt = (p: number[]) => `${p[0]},${p[1]}`;

  // أدراج: مستطيلات على الواجهة حسب الجهة
  const drawerEls = [];
  if (drawers > 0) {
    const colW = bw * 0.32;
    const dxPos =
      cfg.drawerSide === "left" ? ox + 6 : cfg.drawerSide === "center" ? ox + (bw - colW) / 2 : ox + bw - colW - 6;
    const gap = 4;
    const dh = (bh - gap * (drawers + 1)) / drawers;
    for (let i = 0; i < drawers; i++) {
      const dyTop = oy - bh + gap + i * (dh + gap);
      const h = Math.max(4, dh);
      drawerEls.push(
        <g key={i}>
          <rect x={dxPos} y={dyTop} width={colW} height={h} rx="2.5" className="fill-primary/15 stroke-primary" strokeWidth="1.4" />
          <rect x={dxPos + colW * 0.32} y={dyTop + h / 2 - 1.2} width={colW * 0.36} height="2.4" rx="1.2" className="fill-primary" />
        </g>,
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background">
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="aspect-[4/3] w-full" aria-label="رسم ثلاثي الأبعاد للقطعة">
        <defs>
          <linearGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" className="text-primary" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.32" className="text-primary" />
          </linearGradient>
          <linearGradient id={`${gid}-side`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.30" className="text-primary" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.16" className="text-primary" />
          </linearGradient>
          <linearGradient id={`${gid}-front`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" className="text-primary" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" className="text-primary" />
          </linearGradient>
        </defs>

        {/* ظل أرضي ناعم */}
        <ellipse cx={ox + bw / 2 + dx / 2} cy={oy + legH + 6} rx={bw * 0.55} ry={bd * 0.18} className="fill-foreground/10" />

        {/* السطح العلوي */}
        <polygon points={`${pt(fTL)} ${pt(tTL)} ${pt(tTR)} ${pt(fTR)}`} fill={`url(#${gid}-top)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />
        {/* الجانب الأيمن */}
        <polygon points={`${pt(fTR)} ${pt(tTR)} ${pt(tBR)} ${pt(fBR)}`} fill={`url(#${gid}-side)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />
        {/* الواجهة */}
        <polygon points={`${pt(fTL)} ${pt(fTR)} ${pt(fBR)} ${pt(fBL)}`} fill={`url(#${gid}-front)`} className="stroke-primary" strokeWidth="1.6" strokeLinejoin="round" />

        {/* الأدراج */}
        {drawerEls}

        {/* رف إضافي (علوي أو وسطي) */}
        {showShelf && (() => {
          const sy = shelfMiddle ? oy - bh * 0.45 : oy - bh - 16;
          return (
            <g>
              <polygon
                points={`${ox},${sy} ${ox + dx},${sy + dy} ${ox + bw + dx},${sy + dy} ${ox + bw},${sy}`}
                fill={`url(#${gid}-top)`}
                className="stroke-primary"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              {!shelfMiddle && (
                <>
                  <line x1={ox + 6} y1={sy} x2={ox + 6} y2={oy - bh} className="stroke-primary/60" strokeWidth="1.4" />
                  <line x1={ox + bw - 6} y1={sy} x2={ox + bw - 6} y2={oy - bh} className="stroke-primary/60" strokeWidth="1.4" />
                </>
              )}
            </g>
          );
        })()}

        {/* رف سفلي */}
        {showBottom && legH > 0 && (
          <polygon
            points={`${ox + 3},${oy + legH * 0.6} ${ox + 3 + dx},${oy + legH * 0.6 + dy} ${ox + bw - 3 + dx},${oy + legH * 0.6 + dy} ${ox + bw - 3},${oy + legH * 0.6}`}
            fill={`url(#${gid}-top)`}
            className="stroke-primary"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}

        {/* الأرجل */}
        {legH > 0 && (
          <>
            <line x1={ox + 5} y1={oy} x2={ox + 5} y2={oy + legH} className="stroke-primary" strokeWidth="2.6" strokeLinecap="round" />
            <line x1={ox + bw - 5} y1={oy} x2={ox + bw - 5} y2={oy + legH} className="stroke-primary" strokeWidth="2.6" strokeLinecap="round" />
            <line x1={ox + 5 + dx} y1={oy + dy} x2={ox + 5 + dx} y2={oy + legH + dy} className="stroke-primary/70" strokeWidth="2.6" strokeLinecap="round" />
            <line x1={ox + bw - 5 + dx} y1={oy + dy} x2={ox + bw - 5 + dx} y2={oy + legH + dy} className="stroke-primary/70" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}

        {/* عجلات */}
        {showWheels && legH > 0 && (
          <>
            <circle cx={ox + 5} cy={oy + legH + 4} r="4.5" className="fill-primary" />
            <circle cx={ox + bw - 5} cy={oy + legH + 4} r="4.5" className="fill-primary" />
            <circle cx={ox + 5 + dx} cy={oy + legH + 4 + dy} r="3.8" className="fill-primary/70" />
            <circle cx={ox + bw - 5 + dx} cy={oy + legH + 4 + dy} r="3.8" className="fill-primary/70" />
          </>
        )}

        {/* أدلّة القياس */}
        {fields.length && (
          <>
            <line x1={ox} y1={oy + legH + 16} x2={ox + bw} y2={oy + legH + 16} className="stroke-muted-foreground/60" strokeWidth="1" />
            <line x1={ox} y1={oy + legH + 12} x2={ox} y2={oy + legH + 20} className="stroke-muted-foreground/60" strokeWidth="1" />
            <line x1={ox + bw} y1={oy + legH + 12} x2={ox + bw} y2={oy + legH + 20} className="stroke-muted-foreground/60" strokeWidth="1" />
            <text x={ox + bw / 2} y={oy + legH + 30} textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="bold">
              {Lraw} سم
            </text>
          </>
        )}
        {fields.height && (
          <>
            <line x1={ox - 12} y1={oy - bh} x2={ox - 12} y2={oy} className="stroke-muted-foreground/60" strokeWidth="1" />
            <text x={ox - 16} y={oy - bh / 2} textAnchor="end" className="fill-foreground" fontSize="11" fontWeight="bold">
              {Hraw}
            </text>
          </>
        )}
        {fields.width && (
          <text x={ox + bw + dx + 8} y={oy - bh + dy + 4} textAnchor="start" className="fill-foreground" fontSize="10" fontWeight="bold">
            عمق {Wraw}
          </text>
        )}
      </svg>
    </div>
  );

}
