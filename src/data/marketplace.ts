export interface BrandInfo {
  name: string;
  country: string;
  type: string;
  description: string;
}

export const brandsCatalog: BrandInfo[] = [
  // مثال للأنواع الجديدة المعتمدة:
  { name: "Rational", country: "ألمانيا", type: "أفران", description: "الرقم 1 عالمياً في أفران الكومبي." },
  { name: "La Marzocco", country: "إيطاليا", type: "مكائن قهوة", description: "الأيقونة الفاخرة للمقاهي المختصة." },
  { name: "Mahlkönig", country: "ألمانيا", type: "مطاحن قهوة", description: "التوب عالمياً في صناعة الطواحين." },
  { name: "Winterhalter", country: "ألمانيا", type: "غسالات صحون", description: "الفئة الأفخم في غسالات الأطباق." },
  { name: "True Refrigeration", country: "أمريكا", type: "ثلاجات", description: "الأكثر متانة وعزلاً عالمياً." },
  { name: "Hobart", country: "أمريكا", type: "عجانات", description: "الماركة الأسطورية في العجانات الكوكبية." },
  // يمكنك إضافة باقي الماركات بنفس النسق...
];

const byKey = new Map<string, BrandInfo>();
for (const b of brandsCatalog) byKey.set(b.name.toLowerCase(), b);

export function brandInfo(name?: string | null): BrandInfo | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  const exact = byKey.get(key);
  if (exact) return exact;
  return brandsCatalog.find((b) => b.name.toLowerCase().includes(key) || key.includes(b.name.toLowerCase()));
}
