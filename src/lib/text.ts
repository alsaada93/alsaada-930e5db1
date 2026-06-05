/** توحيد النص العربي/الإنجليزي للبحث: يلغي الفرق بين أشكال الألف والتاء المربوطة والتشكيل */
export function normalizeAr(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** مطابقة بحث مرنة: يتجاهل اختلاف الألف والحالة بين النصين */
export function matchesAr(haystack: string, needle: string): boolean {
  const n = normalizeAr(needle);
  if (!n) return true;
  return normalizeAr(haystack).includes(n);
}
