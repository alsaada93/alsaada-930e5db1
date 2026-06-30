/**
 * يحدّد نوع التصنيف (مركبات / عقارات / غير ذلك) اعتماداً على الاسم أو المعرّف.
 * يُستخدم لإخفاء وسم الحالة (جديد/مستعمل) في العقارات والسيارات.
 */
export type CategoryKind = "vehicle" | "realestate" | "other";

/** معرّفات التصنيفات المعروفة في قاعدة البيانات. */
const VEHICLE_IDS = new Set(["ea7fe359-6b22-49e8-8249-2db1d1610913"]);
const REALESTATE_IDS = new Set(["b7e8cb10-8df5-489e-829d-3ca28e71487f"]);

export function categoryKind(name?: string | null, nameEn?: string | null): CategoryKind {
  const raw = `${name ?? ""}`.trim();
  if (VEHICLE_IDS.has(raw)) return "vehicle";
  if (REALESTATE_IDS.has(raw)) return "realestate";
  const s = `${name ?? ""} ${nameEn ?? ""}`.toLowerCase();
  if (/مركب|سيار|vehicle|car|truck|شاحن|دراج/.test(s)) return "vehicle";
  if (/عقار|real ?estate|propert/.test(s)) return "realestate";
  return "other";
}

/** هل يُعرض وسم الحالة (جديد/مستعمل) لهذا التصنيف؟ — يُخفى للسيارات والعقارات. */
export function showsCondition(name?: string | null, nameEn?: string | null): boolean {
  return categoryKind(name, nameEn) === "other";
}

/**
 * وسم العقارات: «للإيجار» أو «للبيع» بدلاً من جديد/مستعمل.
 * يُستنتج من نص الإعلان (العنوان/الوصف)؛ الافتراضي «للبيع».
 */
export function realEstateLabel(text?: string | null): { ar: string; en: string } {
  const s = `${text ?? ""}`.toLowerCase();
  if (/إيجار|ايجار|للايجار|للإيجار|تأجير|تاجير|for ?rent|rental|rent/.test(s)) {
    return { ar: "للإيجار", en: "For Rent" };
  }
  return { ar: "للبيع", en: "For Sale" };
}

/** يحوّل وسم الحالة (جديد/مستعمل) إلى اللغة المختارة. */
export function conditionLabel(condition?: string | null, lang: "ar" | "en" = "ar"): string {
  const s = `${condition ?? ""}`.trim();
  if (!s) return s;
  const isNew = /جديد|new/i.test(s);
  const isUsed = /مستعمل|used|secondhand|pre.?owned/i.test(s);
  if (lang === "en") {
    if (isNew) return "New";
    if (isUsed) return "Used";
    return s;
  }
  if (isNew) return "جديد";
  if (isUsed) return "مستعمل";
  return s;
}
