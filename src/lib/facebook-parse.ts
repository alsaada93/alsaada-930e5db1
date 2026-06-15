/**
 * Facebook post parsing & category detection.
 * Pure functions — safe to import on both client and server.
 *
 * Expected post format (Arabic):
 *   الاسم: ...
 *   رقم الهاتف: ...
 *   التصنيف: ...
 *   الوصف: ...
 */

export type FbCategorySlug =
  | "cars"
  | "real_estate"
  | "jobs"
  | "equipment"
  | "electronics"
  | "furniture"
  | "services"
  | "other";

export interface FbCategory {
  slug: FbCategorySlug;
  name: string; // Arabic
  icon: string;
}

export const FB_CATEGORIES: FbCategory[] = [
  { slug: "cars", name: "سيارات", icon: "🚗" },
  { slug: "real_estate", name: "عقارات", icon: "🏠" },
  { slug: "jobs", name: "وظائف", icon: "💼" },
  { slug: "equipment", name: "معدات", icon: "🛠️" },
  { slug: "electronics", name: "إلكترونيات", icon: "📱" },
  { slug: "furniture", name: "أثاث", icon: "🛋️" },
  { slug: "services", name: "خدمات", icon: "🧰" },
  { slug: "other", name: "أخرى", icon: "📦" },
];

export function categoryLabel(slug: string): FbCategory {
  return FB_CATEGORIES.find((c) => c.slug === slug) ?? FB_CATEGORIES[FB_CATEGORIES.length - 1];
}

/** Keyword sets per category (Arabic + a few English terms). */
const CATEGORY_KEYWORDS: Record<Exclude<FbCategorySlug, "other">, string[]> = {
  cars: [
    "سيارة", "سيارات", "مركبة", "تويوتا", "نيسان", "هوندا", "لكزس", "مرسيدس",
    "بي ام", "هونداي", "كيا", "موديل", "ماشي", "ممشى", "جيب", "دباب", "car", "cars",
  ],
  real_estate: [
    "عقار", "عقارات", "شقة", "شقق", "فيلا", "فلل", "بيت", "منزل", "أرض", "ارض",
    "للايجار", "للإيجار", "للبيع ارض", "محل", "عمارة", "ستوديو", "غرفة", "إيجار",
    "real estate", "apartment", "villa",
  ],
  jobs: [
    "وظيفة", "وظائف", "مطلوب موظف", "مطلوب عامل", "مطلوب عاملة", "توظيف", "عمل",
    "راتب", "دوام", "خبرة", "سيرة ذاتية", "job", "jobs", "hiring",
  ],
  equipment: [
    "معدات", "معدة", "ماكينة", "ماكينات", "ثلاجة عرض", "فرن", "مطعم", "مطبخ صناعي",
    "كمبروسر", "مولد", "رافعة", "عدة", "equipment",
  ],
  electronics: [
    "جوال", "ايفون", "آيفون", "موبايل", "هاتف", "لابتوب", "كمبيوتر", "تلفزيون",
    "شاشة", "بلايستيشن", "سماعة", "كاميرا", "تابلت", "ايباد", "phone", "iphone",
    "laptop", "electronics",
  ],
  furniture: [
    "أثاث", "اثاث", "كنب", "كنبة", "سرير", "دولاب", "طاولة", "كرسي", "مجلس",
    "خزانة", "ديكور", "furniture", "sofa",
  ],
  services: [
    "خدمة", "خدمات", "صيانة", "تنظيف", "نقل عفش", "تركيب", "توصيل", "سباك",
    "كهربائي", "نجار", "دهان", "service", "services",
  ],
};

/** Detects a category slug from free text. Returns "other" when nothing matches. */
export function detectCategory(text: string, explicit?: string | null): FbCategorySlug {
  const haystack = `${explicit ?? ""} ${text}`.toLowerCase();

  // explicit Arabic category words take priority
  if (explicit) {
    const direct = FB_CATEGORIES.find((c) => explicit.includes(c.name));
    if (direct) return direct.slug;
  }

  let best: FbCategorySlug = "other";
  let bestScore = 0;
  for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w.toLowerCase())) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = slug as FbCategorySlug;
    }
  }
  return best;
}

const LABELS = {
  name: ["الاسم", "الإسم", "اسم البائع", "البائع", "name"],
  phone: ["رقم الهاتف", "الهاتف", "الجوال", "رقم الجوال", "للتواصل", "phone", "mobile"],
  category: ["التصنيف", "القسم", "النوع", "category"],
  description: ["الوصف", "التفاصيل", "description"],
};

function matchLabel(line: string, keys: string[]): string | null {
  const idx = line.indexOf(":");
  const altIdx = line.indexOf("："); // full-width colon
  const sep = idx === -1 ? altIdx : altIdx === -1 ? idx : Math.min(idx, altIdx);
  if (sep === -1) return null;
  const label = line.slice(0, sep).trim().toLowerCase();
  if (keys.some((k) => label === k.toLowerCase() || label.startsWith(k.toLowerCase()))) {
    return line.slice(sep + 1).trim();
  }
  return null;
}

/** Normalises Arabic-Indic digits to ASCII and keeps phone-friendly chars. */
export function normalizePhone(raw: string): string {
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };
  return raw
    .replace(/[٠-٩]/g, (d) => map[d] ?? d)
    .replace(/[^\d+]/g, "")
    .slice(0, 20);
}

export interface ParsedPost {
  title: string;
  seller_name: string | null;
  phone: string | null;
  category: FbCategorySlug;
  description: string;
}

/** Extracts structured fields from raw Facebook post text. */
export function parsePost(rawText: string): ParsedPost {
  const text = (rawText ?? "").replace(/\r/g, "");
  const lines = text.split("\n");

  let seller_name: string | null = null;
  let phone: string | null = null;
  let explicitCategory: string | null = null;
  let description: string | null = null;
  const leftover: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const n = matchLabel(trimmed, LABELS.name);
    if (n !== null && !seller_name) {
      seller_name = n || null;
      continue;
    }
    const p = matchLabel(trimmed, LABELS.phone);
    if (p !== null && !phone) {
      phone = normalizePhone(p) || null;
      continue;
    }
    const c = matchLabel(trimmed, LABELS.category);
    if (c !== null && !explicitCategory) {
      explicitCategory = c || null;
      continue;
    }
    const d = matchLabel(trimmed, LABELS.description);
    if (d !== null && !description) {
      description = d || null;
      continue;
    }
    leftover.push(trimmed);
  }

  // phone fallback: scan whole text for a number
  if (!phone) {
    const m = text.match(/(\+?\d[\d\s\-]{6,})/);
    if (m) phone = normalizePhone(m[0]) || null;
  }

  // description fallback: use the leftover body
  const body = description ?? leftover.join("\n").trim();
  const category = detectCategory(`${body} ${explicitCategory ?? ""}`, explicitCategory);

  // title: explicit category name + first meaningful sentence
  const firstLine =
    (description ?? leftover[0] ?? "").split("\n")[0].slice(0, 80).trim() ||
    categoryLabel(category).name;

  return {
    title: firstLine || "إعلان",
    seller_name,
    phone,
    category,
    description: body || firstLine,
  };
}
