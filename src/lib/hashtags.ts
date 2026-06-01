/**
 * توليد هاشتاقات تلقائية ذات صلة لكل إعلان لزيادة الظهور داخل الموقع وخارجه.
 * نضمن وجود ١٠ هاشتاقات على الأقل لكل إعلان مرتبطة بالأثاث والمعدات والإلكترونيات.
 */

const GENERAL_BANK = [
  "السعادة_ماركت",
  "البحرين",
  "بيع_وشراء",
  "عروض_البحرين",
  "سوق_البحرين",
];

const CATEGORY_BANKS: { match: (s: string) => boolean; tags: string[] }[] = [
  {
    match: (s) => /مطاعم|معدات|كوفي|مخابز|مطعم|كافيه/.test(s),
    tags: [
      "معدات_مطاعم",
      "ستانلس_ستيل",
      "تجهيز_مطاعم",
      "معدات_كوفي_شوب",
      "أفران",
      "مكائن_شاورما",
      "طاولات_ومغاسل",
      "ثلاجات_عرض",
      "معدات_مستعملة",
      "تجهيزات_مطابخ",
    ],
  },
  {
    match: (s) => /فنادق|فندق|شقق|نزل/.test(s),
    tags: [
      "معدات_فنادق",
      "أثاث_فنادق",
      "غرف_نوم",
      "أثاث_استقبال",
      "غسالات_صناعية",
      "ستائر_وسجاد",
      "تجهيز_شقق",
    ],
  },
  {
    match: (s) => /إلكترون|الكترون|تلفزيون|موبايل|مكيف|أجهزة|لابتوب|كمبيوتر|كاميرا/.test(s),
    tags: [
      "إلكترونيات",
      "تلفزيونات",
      "موبايلات",
      "مكيفات",
      "أجهزة_منزلية",
      "لابتوبات",
      "كاميرات",
      "أجهزة_مستعملة",
      "تكنولوجيا_البحرين",
      "عروض_إلكترونيات",
    ],
  },
  {
    match: (s) => /أثاث|اثاث|كنب|طاولة|طاولات|سرير|دواليب|مكاتب|كراسي/.test(s),
    tags: [
      "أثاث",
      "أثاث_منزلي",
      "طاولات",
      "كنب",
      "طاولات_تلفزيون",
      "طاولات_قهوة",
      "أثاث_مكتبي",
      "ديكور",
      "أثاث_مستعمل",
      "تجهيز_منازل",
    ],
  },
];

const toTag = (s: string) => `#${s.trim().replace(/\s+/g, "_")}`;

/**
 * يبني قائمة هاشتاقات نظيفة (بدون تكرار) بحد أدنى ١٠ عناصر.
 * يبدأ بالوسوم المخصصة للإعلان ثم يكملها من بنوك التصنيف ثم البنك العام.
 */
export function buildHashtags(
  tags: (string | null | undefined)[],
  min = 10,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw?: string | null) => {
    if (!raw) return;
    const v = raw.trim();
    if (!v) return;
    const key = v.replace(/\s+/g, "_").toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(toTag(v));
  };

  // وسوم الإعلان المباشرة (التصنيف، المجموعة، المدينة...)
  tags.forEach(push);

  // وسوم مرتبطة بالتصنيف المكتشف
  const haystack = tags.filter(Boolean).join(" ");
  for (const bank of CATEGORY_BANKS) {
    if (bank.match(haystack)) bank.tags.forEach(push);
  }

  // وسوم عامة لزيادة الانتشار
  GENERAL_BANK.forEach(push);

  // إن لم نصل للحد الأدنى بعد، أضف من جميع البنوك
  if (out.length < min) {
    for (const bank of CATEGORY_BANKS) {
      bank.tags.forEach(push);
      if (out.length >= min) break;
    }
  }

  // نُبقي عدداً معقولاً (حتى ١٤) مع ضمان الحد الأدنى
  return out.slice(0, Math.max(min, Math.min(out.length, 14)));
}
