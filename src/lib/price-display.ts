/**
 * منطق عرض السعر الموحّد.
 * أي إعلان بلا سعر فعلي (null/0/1 دينار) يُعرض له «تواصل لمعرفة السعر»
 * بدلاً من رقم، مع زر/خانة تواصل. ينطبق على جميع الإعلانات السابقة والمستقبلية.
 */

/** هل السعر «عند الطلب» (بلا سعر حقيقي)؟ يشمل null و0 و1 دينار. */
export function isPriceOnRequest(price?: number | null): boolean {
  if (price === null || price === undefined) return true;
  return price <= 1;
}

/** نص «تواصل لمعرفة السعر» حسب اللغة. */
export function priceOnRequestLabel(lang: "ar" | "en" = "ar"): string {
  return lang === "en" ? "Contact for price" : "تواصل لمعرفة السعر";
}
