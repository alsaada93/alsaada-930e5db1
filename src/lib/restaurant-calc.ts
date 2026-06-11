// حسابات حاسبات الطاولات الستانلس والمغاسل والأرفف — تعتمد على إعدادات قاعدة البيانات

/** الحد الأدنى والأقصى لأي مقاس (سم) */
export const SIZE_MIN = 1;
export const SIZE_MAX = 295;

export interface SteelTableSettings {
  base: { width: number; depth: number };
  grades: Record<
    string,
    { base: number; midShelf: { lt100: number; lt200: number; gte200: number } }
  >;
}

export interface SinkSettings {
  base: { width: number; depth: number; price: number; bowl: { w: number; d: number } };
  extraBowl: number;
  bottomShelf: { lt100: number; lt200: number; gte200: number };
  depths: number[];
  defaultDepth: number;
}

export const DEFAULT_STEEL: SteelTableSettings = {
  base: { width: 100, depth: 60 },
  grades: {
    "201": { base: 60, midShelf: { lt100: 15, lt200: 20, gte200: 25 } },
    "304": { base: 80, midShelf: { lt100: 20, lt200: 30, gte200: 40 } },
  },
};

export const DEFAULT_SINK: SinkSettings = {
  base: { width: 100, depth: 60, price: 90, bowl: { w: 45, d: 45 } },
  extraBowl: 25,
  bottomShelf: { lt100: 20, lt200: 30, gte200: 40 },
  depths: [10, 15, 20, 25, 30, 35, 40],
  defaultDepth: 30,
};

/** اختيار قيمة الشلف حسب الطول */
function byLength(length: number, t: { lt100: number; lt200: number; gte200: number }): number {
  if (length < 100) return t.lt100;
  if (length < 200) return t.lt200;
  return t.gte200;
}

export interface SteelTableConfig {
  grade: "201" | "304";
  length: number; // الطول سم
  width: number; // العرض سم
  midShelf: boolean;
}

/** السعر يتناسب مع المساحة بالنسبة للمقاس الأساسي 100×60، مع إضافة الشلف الوسطي */
export function steelTablePrice(cfg: SteelTableConfig, s: SteelTableSettings): number {
  const g = s.grades[cfg.grade] ?? s.grades["201"];
  const baseArea = s.base.width * s.base.depth;
  const area = Math.max(1, cfg.length) * Math.max(1, cfg.width);
  let price = g.base * (area / baseArea);
  if (cfg.midShelf) price += byLength(cfg.length, g.midShelf);
  return Math.round(price * 100) / 100;
}

export interface SinkConfig {
  length: number;
  width: number;
  bowls: number;
  bottomShelf: boolean;
  bowlDepth: number;
}

export function sinkPrice(cfg: SinkConfig, s: SinkSettings): number {
  const baseArea = s.base.width * s.base.depth;
  const area = Math.max(1, cfg.length) * Math.max(1, cfg.width);
  let price = s.base.price * (area / baseArea);
  const extraBowls = Math.max(0, cfg.bowls - 1);
  price += extraBowls * s.extraBowl;
  if (cfg.bottomShelf) price += byLength(cfg.length, s.bottomShelf);
  return Math.round(price * 100) / 100;
}

/* ===================== الأرفف ===================== */
export interface ShelfSettings {
  /** المقاس المعياري وسعره الثابت (استيل 201) */
  base: { width: number; depth: number; price: number };
  /** معامل سعر الاستيل 304 مقارنة بـ 201 */
  grade304Multiplier: number;
}

/** الرف 100×30سم = 20 د.ب أي ~66.67 د.ب لكل متر مربع */
export const DEFAULT_SHELF: ShelfSettings = {
  base: { width: 100, depth: 30, price: 20 },
  grade304Multiplier: 1.4,
};

export interface ShelfConfig {
  grade?: "201" | "304";
  length: number; // الطول سم
  width: number; // العمق سم
}

/** السعر يتناسب طردياً مع المساحة بالنسبة للمقاس المعياري */
export function shelfPrice(cfg: ShelfConfig, s: ShelfSettings): number {
  const baseArea = s.base.width * s.base.depth;
  const area = Math.max(1, cfg.length) * Math.max(1, cfg.width);
  let price = s.base.price * (area / baseArea);
  if (cfg.grade === "304") price *= s.grade304Multiplier ?? 1.4;
  return Math.round(price * 100) / 100;
}

/* ===================== سمك الاستانلس ستيل ===================== */
export interface ThicknessSettings {
  /** خيارات السمك المتاحة (ملم) */
  options: number[];
  /** معامل السعر لكل سمك */
  multipliers: Record<string, number>;
  /** السمك الافتراضي */
  default: number;
}

export const DEFAULT_THICKNESS: ThicknessSettings = {
  options: [0.8, 1, 1.2, 1.5, 2],
  multipliers: { "0.8": 0.9, "1": 1, "1.2": 1.15, "1.5": 1.35, "2": 1.6 },
  default: 1,
};

/** معامل السعر حسب السمك المختار */
export function thicknessFactor(t: ThicknessSettings, mm: number): number {
  return t.multipliers[String(mm)] ?? 1;
}

export const BHD = (n: number) =>
  `${(Math.round(n * 1000) / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 3 })} د.ب`;

/* ===================== الخصومات حسب نوع التصنيع ===================== */
export interface Discounts {
  /** نسبة الخصم للطاولات (٪) */
  table: number;
  /** نسبة الخصم للمغاسل (٪) */
  sink: number;
  /** نسبة الخصم للأرفف (٪) */
  shelf: number;
}

export const DEFAULT_DISCOUNTS: Discounts = { table: 10, sink: 10, shelf: 10 };

/** يطبّق نسبة الخصم ثم يجبر السعر لأقرب ١٠ للأسفل (سلوك التسعير الحالي) */
export function applyDiscount(rawPrice: number, percent: number): number {
  if (rawPrice <= 0) return 0;
  const pct = Math.min(100, Math.max(0, percent));
  const afterDiscount = rawPrice * (1 - pct / 100);
  return Math.floor(afterDiscount / 10) * 10;
}
