// حسابات حاسبتي الطاولات الستانلس والمغاسل — تعتمد على إعدادات قاعدة البيانات

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

export const BHD = (n: number) =>
  `${(Math.round(n * 1000) / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 3 })} د.ب`;
