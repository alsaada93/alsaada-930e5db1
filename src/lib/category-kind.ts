/**
 * يحدّد نوع التصنيف (مركبات / عقارات / غير ذلك) اعتماداً على الاسم.
 * يُستخدم لإخفاء وسم الحالة (جديد/مستعمل) في العقارات والسيارات.
 */
export type CategoryKind = "vehicle" | "realestate" | "other";

export function categoryKind(name?: string | null, nameEn?: string | null): CategoryKind {
  const s = `${name ?? ""} ${nameEn ?? ""}`.toLowerCase();
  if (/مركب|سيار|vehicle|car|truck|شاحن|دراج/.test(s)) return "vehicle";
  if (/عقار|real ?estate|propert/.test(s)) return "realestate";
  return "other";
}

/** هل يُعرض وسم الحالة (جديد/مستعمل) لهذا التصنيف؟ — يُخفى للسيارات والعقارات. */
export function showsCondition(name?: string | null, nameEn?: string | null): boolean {
  return categoryKind(name, nameEn) === "other";
}
