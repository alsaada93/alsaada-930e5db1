// ============================================================
// نظام حاسبة تفصيل الستانلس ستيل الديناميكي — منطق الأنواع والتسعير
// كل البيانات تأتي من قاعدة البيانات؛ لا توجد قيم تسعير ثابتة في الكود.
// ============================================================

/** الحد الأدنى والأقصى لأي مقاس (سم) */
export const SIZE_MIN = 1;
export const SIZE_MAX = 400;

/** صيغة العملة البحرينية */
export const BHD = (n: number) =>
  `${(Math.round(n * 1000) / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 3 })} د.ب`;

/** فئة تفصيل (طاولات، مغاسل، أرفف...) */
export interface FabCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  active: boolean;
  sort_order: number;
}

/** الحقول القابلة للتفعيل لكل منتج */
export interface FabFields {
  length?: boolean;
  width?: boolean;
  height?: boolean;
  shelves?: boolean;
  tiers?: boolean;
  bowls?: boolean;
  topShelf?: boolean;
  bottomShelf?: boolean;
  wheels?: boolean;
  grade?: boolean;
  thickness?: boolean;
  quantity?: boolean;
  notes?: boolean;
}

/** إعدادات تسعير الإضافات لكل منتج */
export interface FabPricing {
  extras?: {
    topShelf?: number;
    bottomShelf?: number;
    wheels?: number;
    extraBowl?: number;
    perShelf?: number;
    perTier?: number;
  };
}

/** منتج تفصيل */
export interface FabProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  images: string[];
  description: string | null;
  specs: Record<string, unknown>;
  base_price: number;
  price_per_m2: number;
  fields: FabFields;
  pricing: FabPricing;
  active: boolean;
  sort_order: number;
}

/** معاملات أنواع الستانلس (201 / 304 ...) */
export type SteelGrades = Record<string, number>;

/** السماكات ومعاملاتها */
export interface Thicknesses {
  options: number[];
  multipliers: Record<string, number>;
  default: number;
}

/** الخصومات (نسبة مئوية افتراضية) */
export interface FabDiscounts {
  default: number;
}

/** إعدادات عرض السعر */
export interface FabQuote {
  pdfTitle: string;
  pdfFooter: string;
  whatsapp: string;
  clientMessage: string;
}

export const DEFAULT_GRADES: SteelGrades = { "201": 1, "304": 1.35 };
export const DEFAULT_THICKNESSES: Thicknesses = {
  options: [0.8, 1, 1.2, 1.5, 2],
  multipliers: { "0.8": 0.9, "1": 1, "1.2": 1.15, "1.5": 1.35, "2": 1.6 },
  default: 1,
};
export const DEFAULT_FAB_DISCOUNTS: FabDiscounts = { default: 10 };
export const DEFAULT_FAB_QUOTE: FabQuote = {
  pdfTitle: "عرض سعر — السعادة ماركت",
  pdfFooter: "شكراً لتعاملكم مع السعادة ماركت",
  whatsapp: "",
  clientMessage: "مرحباً، نشكر طلبكم. هذا عرض السعر الخاص بكم.",
};

/** القيم المُدخلة من المستخدم لمنتج معيّن */
export interface FabConfig {
  length: number;
  width: number;
  height: number;
  shelves: number;
  tiers: number;
  bowls: number;
  topShelf: boolean;
  bottomShelf: boolean;
  wheels: boolean;
  grade: string;
  thickness: string;
  quantity: number;
  notes: string;
}

/** عنصر مُضاف إلى المشروع */
export interface FabLineItem extends FabConfig {
  uid: string;
  productId: string;
  productName: string;
  categorySlug: string;
  icon: string | null;
  unitPrice: number;
}

export function defaultConfig(thicknesses: Thicknesses): FabConfig {
  return {
    length: 100,
    width: 60,
    height: 85,
    shelves: 1,
    tiers: 2,
    bowls: 1,
    topShelf: false,
    bottomShelf: false,
    wheels: false,
    grade: "201",
    thickness: String(thicknesses.default ?? 1),
    quantity: 1,
    notes: "",
  };
}

/**
 * حساب سعر الوحدة لمنتج حسب التسعير الديناميكي:
 * السعر = (السعر الأساسي + سعر المتر × المساحة × معامل النوع × معامل السماكة) + الإضافات
 */
export function calcUnitPrice(
  product: FabProduct,
  cfg: FabConfig,
  grades: SteelGrades,
  thicknesses: Thicknesses,
): number {
  const f = product.fields ?? {};
  const L = f.length ? Math.max(1, cfg.length || 0) : 100;
  const W = f.width ? Math.max(1, cfg.width || 0) : 60;
  const area = (L * W) / 10000; // م²
  const gradeMul = f.grade ? grades[cfg.grade] ?? 1 : 1;
  const thickMul = f.thickness ? thicknesses.multipliers[cfg.thickness] ?? 1 : 1;

  let unit = Number(product.base_price) + Number(product.price_per_m2) * area * gradeMul * thickMul;

  const extras = product.pricing?.extras ?? {};
  if (f.topShelf && cfg.topShelf && extras.topShelf) unit += extras.topShelf;
  if (f.bottomShelf && cfg.bottomShelf && extras.bottomShelf) unit += extras.bottomShelf;
  if (f.wheels && cfg.wheels && extras.wheels) unit += extras.wheels;
  if (f.bowls && extras.extraBowl) unit += Math.max(0, (cfg.bowls || 1) - 1) * extras.extraBowl;
  if (f.shelves && extras.perShelf) unit += Math.max(0, cfg.shelves || 0) * extras.perShelf;
  if (f.tiers && extras.perTier) unit += Math.max(0, cfg.tiers || 0) * extras.perTier;

  return Math.round(unit * 100) / 100;
}

/** يطبّق نسبة الخصم ثم يجبر السعر لأقرب ١٠ للأسفل */
export function applyDiscount(rawPrice: number, percent: number): number {
  if (rawPrice <= 0) return 0;
  const pct = Math.min(100, Math.max(0, percent));
  const afterDiscount = rawPrice * (1 - pct / 100);
  return Math.floor(afterDiscount / 10) * 10;
}

/** وصف نصي مختصر لإعدادات العنصر */
export function describeItem(item: FabLineItem, product?: FabProduct): string {
  const f = product?.fields ?? {};
  const parts: string[] = [];
  if (f.length || f.width) {
    const dims = [f.length ? item.length : null, f.width ? item.width : null, f.height ? item.height : null]
      .filter((n) => n != null)
      .join("×");
    if (dims) parts.push(`المقاس: ${dims} سم`);
  }
  if (f.grade) parts.push(`ستانلس ${item.grade}`);
  if (f.thickness) parts.push(`سماكة ${item.thickness} ملم`);
  if (f.bowls) parts.push(`${item.bowls} حوض`);
  if (f.shelves) parts.push(`${item.shelves} رف`);
  if (f.tiers) parts.push(`${item.tiers} دور`);
  if (f.topShelf && item.topShelf) parts.push("رف علوي");
  if (f.bottomShelf && item.bottomShelf) parts.push("رف سفلي");
  if (f.wheels && item.wheels) parts.push("عجلات");
  if (item.notes) parts.push(`ملاحظة: ${item.notes}`);
  return parts.join(" | ");
}
