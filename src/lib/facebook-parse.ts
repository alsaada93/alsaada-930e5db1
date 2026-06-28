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
    "بي ام", "هونداي", "كيا", "رينو", "سوزوكي", "مازيراتي", "موديل", "ماشي", "ممشى", "جيب", "دباب", "car", "cars",
    "scooter", "bicycle", "bike", "e-scooter",
  ],
  real_estate: [
    "عقار", "عقارات", "شقة", "شقق", "فيلا", "فلل", "بيت", "منزل", "أرض", "ارض",
    "للايجار", "للإيجار", "للبيع ارض", "محل", "عمارة", "ستوديو", "استوديو", "غرفة", "إيجار",
    "مستودع", "مخزن", "real estate", "apartment", "villa", "studio", "flat", "room", "warehouse",
  ],
  jobs: [
    "وظيفة", "وظائف", "مطلوب موظف", "مطلوب عامل", "مطلوب عاملة", "توظيف", "عمل",
    "راتب", "دوام", "خبرة", "سيرة ذاتية", "job", "jobs", "hiring",
  ],
  equipment: [
    "معدات", "معدة", "ماكينة", "ماكينات", "ثلاجة عرض", "فرن", "مطعم", "مطبخ صناعي",
    "كمبروسر", "مولد", "رافعة", "عدة", "equipment", "commercial kitchen", "coffee shop", "cafe",
    "cooking range", "burner", "oven", "grill",
  ],
  electronics: [
    "جوال", "ايفون", "آيفون", "موبايل", "هاتف", "لابتوب", "كمبيوتر", "تلفزيون",
    "شاشة", "بلايستيشن", "سماعة", "كاميرا", "تابلت", "ايباد", "phone", "iphone",
    "laptop", "electronics", "dell", "hp", "lenovo", "acer", "asus", "macbook", "desktop", "computer",
    "powerbank", "charger", "samsung", "galaxy", "tablet", "ipad", "playstation", "printer", "hard disk",
  ],
  furniture: [
    "أثاث", "اثاث", "كنب", "كنبة", "سرير", "دولاب", "طاولة", "كرسي", "مجلس",
    "خزانة", "ديكور", "furniture", "sofa", "trolley", "jewellery", "jewelry", "ring", "stone", "gas cylinder",
  ],
  services: [
    "خدمة", "خدمات", "صيانة", "تنظيف", "نقل عفش", "تركيب", "توصيل", "سباك",
    "كهربائي", "نجار", "دهان", "service", "services", "repair", "maintenance", "shifting", "movers",
    "packers", "delivery", "clearance", "cpr", "scrap", "recycling", "course", "diploma",
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

  // Tokenize once so short keywords match whole words only (avoids "مستعمل" ⊃ "عمل").
  const tokens = new Set(haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const matches = (kw: string): boolean => {
    const k = kw.toLowerCase();
    if (k.includes(" ")) return haystack.includes(k); // multi-word phrase
    if (tokens.has(k)) return true; // exact word
    return k.length >= 5 && haystack.includes(k); // long stems may appear inflected
  };

  let best: FbCategorySlug = "other";
  let bestScore = 0;
  for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (matches(w)) score += 1;
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

// ───────────────────────── Smart field extraction (bot ingest) ─────────────────────────

/** Converts Arabic-Indic digits to ASCII. */
function normDigits(t: string): string {
  return (t ?? "").replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Splits text into whitespace tokens (digits already normalised). */
function toWords(t: string): string[] {
  return normDigits(t).split(/\s+/).filter(Boolean);
}

/** Parses a money token: keeps the dot as a decimal separator. "4,500"→4500, "4500.000"→4500, "4.5K"→4500. */
function parsePriceNum(tok: string): number | null {
  let s = tok.toLowerCase().replace(/[^\d.,k]/g, "");
  if (!/\d/.test(s)) return null;
  let mult = 1;
  if (s.endsWith("k")) {
    mult = 1000;
    s = s.slice(0, -1);
  }
  s = s.replace(/,/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.join(""); // multiple dots → thousand separators
  const v = Number(s);
  return Number.isFinite(v) ? v * mult : null;
}

/** Parses an integer-ish token: strips ALL separators. "120.000"→120000, "1,500"→1500, "3"→3. */
function parseIntNum(tok: string): number | null {
  let s = tok.toLowerCase().replace(/[^\d k]/gi, "").replace(/\s/g, "");
  if (!/\d/.test(s)) return null;
  let mult = 1;
  if (s.endsWith("k")) {
    mult = 1000;
    s = s.slice(0, -1);
  }
  s = s.replace(/[.,]/g, "");
  const v = Number(s);
  return Number.isFinite(v) ? v * mult : null;
}

const PRICE_KW = [
  "price", "cost", "asking", "offer", "nego", "obo", "only",
  "السعر", "بسعر", "سعر", "مطلوب", "فقط", "بيع", "للبيع", "بكم", "السوم", "required",
];
const CURRENCY = ["bd", "bhd", "kd", "kwd", "sar", "aed", "usd", "$", "دينار", "د.ب", "ريال", "درهم"];

export interface PriceResult {
  price: number | null;
  detected: boolean;
}

/**
 * Extracts the ad price with strict priority:
 *  (a) a number within 2 words of a price keyword / currency symbol;
 *  (b) otherwise the LAST remaining number after excluding year / mileage / phone / area;
 *  (c) null when nothing is found with confidence.
 */
export function extractPriceSmart(text: string): PriceResult {
  if (!text) return { price: null, detected: false };
  // أزل أرقام الهواتف بالكامل قبل أي تحليل حتى لا تُعتبر سعراً
  const raw = stripPhoneLike(normDigits(text));
  const words = raw.split(/\s+/).filter(Boolean);


  // A bare 4-digit number in the model-year range is a year, NOT a price.
  const isYearValue = (n: number, tok: string): boolean => {
    const digitsOnly = tok.replace(/\D/g, "");
    if (digitsOnly.length !== 4) return false;
    return Number.isInteger(n) && n >= 1950 && n <= 2035;
  };
  const hasCurrency = (tok: string): boolean => {
    const w = tok.toLowerCase();
    return CURRENCY.some((c) => (c === "$" ? w.includes("$") : w.includes(c)));
  };
  // Tokens/contexts that signal the number is NOT a price (year/model/mileage/area/part no.).
  const nonPriceContext = (s: string): boolean =>
    /موديل|model|سنة|سنه|year|عداد|كيلومتر|كيلو|\bkm\b|mileage|مقاس|مقاعد|مقعد|seat|رقم|قطعة|قطعه|part|sku|متر|م2|م²|sqm/i.test(s);
  const isPhoneish = (tok: string): boolean => tok.replace(/\D/g, "").length >= 8;

  // (a) keyword / currency adjacency (max 2 words either side)
  const kw = [...PRICE_KW, ...CURRENCY];
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[:：]/g, "");
    const isKw = kw.some((k) => (k === "$" ? w.includes("$") : w === k || w === k + "." ));
    // attached currency+number e.g "4500BD", "$4500", "BD4500"
    if (!isKw) {
      const attached = CURRENCY.some((c) => c !== "$" && w.includes(c)) || w.includes("$");
      if (attached && /\d/.test(w) && !isPhoneish(w)) {
        const n = parsePriceNum(w);
        if (n && n > 0) return { price: n, detected: true };
      }
      continue;
    }
    for (let d = 1; d <= 2; d++) {
      for (const j of [i + d, i - d]) {
        if (j >= 0 && j < words.length && /\d/.test(words[j])) {
          if (isPhoneish(words[j])) continue; // phone number, never a price
          // skip non-price contexts (model/year/km/area/part no.) adjacent to the number
          const ctx = `${words[i]} ${words[j - 1] ?? ""} ${words[j]} ${words[j + 1] ?? ""}`;
          if (nonPriceContext(ctx)) continue;
          const n = parsePriceNum(words[j]);
          if (!n || n <= 0) continue;
          // a bare year with no currency is not a price
          if (isYearValue(n, words[j]) && !hasCurrency(words[j])) continue;
          return { price: n, detected: true };
        }
      }
    }
  }

  // (b) exclusion-based fallback — pick the last surviving number
  const survivors: number[] = [];
  for (let i = 0; i < words.length; i++) {
    if (!/\d/.test(words[i])) continue;
    const digitsOnly = words[i].replace(/\D/g, "");
    if (!digitsOnly) continue;
    const around = `${words[i - 1] ?? ""} ${words[i]} ${words[i + 1] ?? ""}`.toLowerCase();

    // year (1950 .. 2035) unless an explicit currency is attached to the token
    if (digitsOnly.length === 4) {
      const y = Number(digitsOnly);
      if (y >= 1950 && y <= 2035 && !hasCurrency(words[i])) continue;
    }
    // model/year/mileage/area/part/phone context → skip
    if (nonPriceContext(around)) continue;
    // phone (8+ digits, or near a call keyword)
    if (digitsOnly.length >= 8) continue;
    if (/call|اتصال|جوال|واتساب|whatsapp|للتواصل|hatif|هاتف/i.test(around)) continue;

    const n = parsePriceNum(words[i]);
    if (n && n > 0) survivors.push(n);
  }
  if (survivors.length) return { price: survivors[survivors.length - 1], detected: true };

  return { price: null, detected: false };
}

/** Removes phone-like digit sequences (8–15 digits, common separators) from text. */
function stripPhoneLike(text: string): string {
  return text.replace(/\+?\d[\d\s\-()]{6,}\d/g, (m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? " " : m;
  });
}


/** Finds a number within `radius` words of any keyword. */
function numberNear(words: string[], keys: string[], radius = 2): number | null {
  const lk = keys.map((k) => k.toLowerCase());
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if (!lk.some((k) => w.includes(k))) continue;
    // same token may contain the number, e.g "150متر"
    if (/\d/.test(words[i])) {
      const inline = parseIntNum(words[i]);
      if (inline !== null) return inline;
    }
    for (let d = 1; d <= radius; d++) {
      for (const j of [i + d, i - d]) {
        if (j >= 0 && j < words.length && /\d/.test(words[j])) {
          const n = parseIntNum(words[j]);
          if (n !== null) return n;
        }
      }
    }
  }
  return null;
}

/** Known Bahrain regions (subset used for matching). */
export const BAHRAIN_REGIONS = [
  "المنامة", "الرفاع", "المحرق", "عيسى تاون", "مدينة عيسى", "حمد تاون", "مدينة حمد",
  "سار", "الجفير", "السيف", "توبلي", "الحد", "البديع", "الزنج", "العدلية", "جدحفص",
  "سترة", "عالي", "الدراز", "بوقوة", "سند", "الماحوز", "القضيبية", "أم الحصم",
];

export interface CarSpecs {
  year: number | null;
  mileage_km: number | null;
  transmission: string | null;
  fuel: string | null;
  accident_free: boolean | null;
  previous_owners: number | null;
  brand: string | null;
  engine_cc: number | null;
  cylinders: number | null;
  body_type: string | null;
  color: string | null;
  seats: number | null;
}

export interface RealEstateSpecs {
  property_type: string | null;
  offer_type: string;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  region: string | null;
}

const CAR_BRANDS: Record<string, string> = {
  toyota: "Toyota", تويوتا: "Toyota", nissan: "Nissan", نيسان: "Nissan",
  honda: "Honda", هوندا: "Honda", lexus: "Lexus", لكزس: "Lexus",
  mercedes: "Mercedes", مرسيدس: "Mercedes", bmw: "BMW", "بي ام": "BMW", "بي إم": "BMW",
  hyundai: "Hyundai", هونداي: "Hyundai", هيونداي: "Hyundai", kia: "Kia", كيا: "Kia",
  ford: "Ford", فورد: "Ford", chevrolet: "Chevrolet", شفروليه: "Chevrolet", شيفروليه: "Chevrolet",
  mitsubishi: "Mitsubishi", ميتسوبيشي: "Mitsubishi", mazda: "Mazda", مازدا: "Mazda",
  gmc: "GMC", "جي ام سي": "GMC", "جمس": "GMC", jeep: "Jeep", جيب: "Jeep",
  dodge: "Dodge", دودج: "Dodge", audi: "Audi", اودي: "Audi", أودي: "Audi",
  volkswagen: "Volkswagen", فولكس: "Volkswagen", "فولكس واجن": "Volkswagen",
  porsche: "Porsche", بورش: "Porsche", بورشه: "Porsche",
  "land rover": "Land Rover", "لاند روفر": "Land Rover", "رنج روفر": "Range Rover", "range rover": "Range Rover",
  suzuki: "Suzuki", سوزوكي: "Suzuki", subaru: "Subaru", سوبارو: "Subaru",
  peugeot: "Peugeot", بيجو: "Peugeot", renault: "Renault", رينو: "Renault",
  chrysler: "Chrysler", كرايسلر: "Chrysler", cadillac: "Cadillac", كاديلاك: "Cadillac",
  infiniti: "Infiniti", انفنيتي: "Infiniti", إنفينيتي: "Infiniti",
  genesis: "Genesis", جينيسيس: "Genesis", jaguar: "Jaguar", جاكوار: "Jaguar",
  mg: "MG", "ام جي": "MG", changan: "Changan", شانجان: "Changan", تشانجان: "Changan",
  geely: "Geely", جيلي: "Geely", chery: "Chery", شيري: "Chery",
  haval: "Haval", هافال: "Haval", volvo: "Volvo", فولفو: "Volvo",
  isuzu: "Isuzu", ايسوزو: "Isuzu", إيسوزو: "Isuzu", daihatsu: "Daihatsu", دايهاتسو: "Daihatsu",
  tesla: "Tesla", تسلا: "Tesla", hummer: "Hummer", همر: "Hummer",
  bentley: "Bentley", بنتلي: "Bentley", "rolls royce": "Rolls Royce", "رولز رويس": "Rolls Royce",
  ferrari: "Ferrari", فيراري: "Ferrari", lamborghini: "Lamborghini", لامبورغيني: "Lamborghini",
  maserati: "Maserati", مازيراتي: "Maserati", skoda: "Skoda", سكودا: "Skoda",
  acura: "Acura", اكورا: "Acura", أكورا: "Acura", lincoln: "Lincoln", لينكون: "Lincoln",
  buick: "Buick", بويك: "Buick", mini: "Mini", ميني: "Mini",
  fiat: "Fiat", فيات: "Fiat", "alfa romeo": "Alfa Romeo", "الفا روميو": "Alfa Romeo",
  seat: "Seat", سيات: "Seat", opel: "Opel", اوبل: "Opel", أوبل: "Opel",
  citroen: "Citroen", ستروين: "Citroen", سيتروين: "Citroen",
  ssangyong: "SsangYong", "سانغ يونغ": "SsangYong", byd: "BYD", "بي واي دي": "BYD",
  "aston martin": "Aston Martin", "استون مارتن": "Aston Martin",
  mclaren: "McLaren", مكلارين: "McLaren", مكلارن: "McLaren",
  mahindra: "Mahindra", مهيندرا: "Mahindra", tata: "Tata", تاتا: "Tata",
  jetour: "Jetour", جيتور: "Jetour", "great wall": "Great Wall", "جريت وول": "Great Wall",
  lucid: "Lucid", لوسيد: "Lucid", rivian: "Rivian", ريفيان: "Rivian",
  proton: "Proton", بروتون: "Proton", baic: "BAIC", "بايك": "BAIC",
};

/** Detects a known car brand (English name) from free text, or null. */
export function detectBrand(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(CAR_BRANDS)) {
    if (lower.includes(k)) return v;
  }
  return null;
}

export function extractCarSpecs(text: string): CarSpecs {
  const words = toWords(text);
  const lower = normDigits(text).toLowerCase();
  const year = new Date().getFullYear();

  // year: near MODEL/موديل, else a standalone valid 4-digit number
  let yr = numberNear(words, ["model", "موديل"], 2);
  if (yr !== null && (yr < 1990 || yr > year + 1)) yr = null;
  if (yr === null) {
    for (const w of words) {
      const m = w.match(/\b(\d{4})\b/);
      if (m) {
        const y = Number(m[1]);
        if (y >= 1990 && y <= year + 1) {
          yr = y;
          break;
        }
      }
    }
  }

  const mileage = numberNear(words, ["km", "كم", "كيلومتر", "mileage"], 2);

  let transmission: string | null = null;
  if (/automatic|أوتوماتيك|اوتوماتيك|اتوماتيك/i.test(lower)) transmission = "automatic";
  else if (/manual|مانيوال|عادي/i.test(lower)) transmission = "manual";

  let fuel: string | null = null;
  if (/petrol|gasoline|بنزين/i.test(lower)) fuel = "petrol";
  else if (/diesel|ديزل/i.test(lower)) fuel = "diesel";
  else if (/hybrid|هايبرد|هجين/i.test(lower)) fuel = "hybrid";
  else if (/electric|كهرباء|كهربائي/i.test(lower)) fuel = "electric";

  let accident_free: boolean | null = null;
  if (/zero accident|no accident|بدون حادث|بدون حوادث|ما فيها حوادث|وكاله|وكالة|agency/i.test(lower))
    accident_free = true;
  else if (/accident|حادث|حوادث/i.test(lower)) accident_free = false;

  let previous_owners: number | null = numberNear(words, ["owner", "owners", "مالك", "ملاك"], 2);
  if (previous_owners === null) {
    if (/first owner|أول مالك|اول مالك/i.test(lower)) previous_owners = 1;
    else if (/second owner|second owners|ثاني مالك/i.test(lower)) previous_owners = 2;
    else if (/third owner|ثالث مالك/i.test(lower)) previous_owners = 3;
  }

  let brand: string | null = null;
  for (const [k, v] of Object.entries(CAR_BRANDS)) {
    if (lower.includes(k)) {
      brand = v;
      break;
    }
  }

  // engine capacity: "2.0L", "2000cc", "سعة 1600"
  let engine_cc: number | null = null;
  const litreMatch = lower.match(/(\d(?:\.\d)?)\s*(?:l\b|liter|litre|لتر)/);
  if (litreMatch) engine_cc = Math.round(parseFloat(litreMatch[1]) * 1000);
  if (engine_cc === null) {
    const ccMatch = lower.match(/(\d{3,4})\s*(?:cc|سي سي)/);
    if (ccMatch) engine_cc = Number(ccMatch[1]);
  }
  if (engine_cc === null) engine_cc = numberNear(words, ["سعة", "محرك", "engine"], 2);
  if (engine_cc !== null && (engine_cc < 600 || engine_cc > 9000)) engine_cc = null;

  let cylinders: number | null = numberNear(words, ["سلندر", "اسطوانة", "cylinder", "cyl"], 2);
  if (cylinders !== null && (cylinders < 2 || cylinders > 16)) cylinders = null;

  let body_type: string | null = null;
  if (/sedan|سيدان|صالون/i.test(lower)) body_type = "sedan";
  else if (/\bsuv\b|جيب|دفع رباعي|دبل/i.test(lower)) body_type = "suv";
  else if (/coupe|كوبيه/i.test(lower)) body_type = "coupe";
  else if (/hatchback|هاتشباك/i.test(lower)) body_type = "hatchback";
  else if (/pickup|بيك اب|بيكب|وانيت/i.test(lower)) body_type = "pickup";
  else if (/van\b|فان/i.test(lower)) body_type = "van";

  let color: string | null = null;
  const colorMap: Array<[RegExp, string]> = [
    [/أبيض|ابيض|white/i, "أبيض"], [/أسود|اسود|black/i, "أسود"],
    [/فضي|silver/i, "فضي"], [/رمادي|gray|grey/i, "رمادي"],
    [/أحمر|احمر|red/i, "أحمر"], [/أزرق|ازرق|blue/i, "أزرق"],
    [/أخضر|اخضر|green/i, "أخضر"], [/ذهبي|gold/i, "ذهبي"],
    [/بني|brown/i, "بني"], [/بيج|beige/i, "بيج"],
  ];
  for (const [re, name] of colorMap) {
    if (re.test(lower)) { color = name; break; }
  }

  // عدد المقاعد: "7 مقاعد", "5 seats", "7 seater", "ركاب"
  let seats: number | null = numberNear(words, ["مقعد", "مقاعد", "راكب", "ركاب", "seat", "seats", "seater"], 2);
  if (seats === null) {
    const seatM = lower.match(/(\d{1,2})\s*(?:مقاعد|مقعد|seats?|seater|راكب|ركاب)/);
    if (seatM) seats = Number(seatM[1]);
  }
  if (seats !== null && (seats < 2 || seats > 50)) seats = null;

  return {
    year: yr, mileage_km: mileage, transmission, fuel, accident_free,
    previous_owners, brand, engine_cc, cylinders, body_type, color, seats,
  };
}

export function extractRealEstateSpecs(text: string): RealEstateSpecs {
  const words = toWords(text);
  const lower = normDigits(text).toLowerCase();

  let property_type: string | null = null;
  if (/studio|استوديو|ستوديو/i.test(lower)) property_type = "studio";
  else if (/apartment|شقة|شقق/i.test(lower)) property_type = "apartment";
  else if (/villa|فيلا|فلل/i.test(lower)) property_type = "villa";
  else if (/\bland\b|أرض|ارض/i.test(lower)) property_type = "land";
  else if (/office|مكتب/i.test(lower)) property_type = "office";
  else if (/\bshop\b|محل/i.test(lower)) property_type = "shop";

  const offer_type = /rent|للايجار|للإيجار|إيجار|ايجار/i.test(lower) ? "rent" : "sale";

  const area_sqm = numberNear(words, ["م2", "م²", "متر", "sqm", "sq"], 2);
  const bedrooms = numberNear(words, ["غرفة", "غرف", "bedroom", "bedrooms", "bhk", "غرفة نوم"], 2);
  const bathrooms = numberNear(words, ["حمام", "حمامات", "bathroom", "bathrooms"], 2);

  let region: string | null = null;
  for (const r of BAHRAIN_REGIONS) {
    if (normDigits(text).includes(r)) {
      region = r;
      break;
    }
  }

  return { property_type, offer_type, area_sqm, bedrooms, bathrooms, region };
}

/**
 * Re-checks the auto-detected category. If a price was found but the category is
 * still "other" while the text shows strong car / real-estate signals, it
 * reclassifies to the correct section so the ad never lands in "general" by mistake.
 */
export function refineCategory(text: string, current: FbCategorySlug): FbCategorySlug {
  const lower = normDigits(text).toLowerCase();

  const carSignal =
    Object.keys(CAR_BRANDS).some((b) => lower.includes(b)) ||
    /موديل|سيارة|مركبة|\bcar\b|\bcars\b|scooter|bicycle|\bbike\b|gear|engine|odometer|mileage|كيلومتر|\bkm\b|أوتوماتيك|بنزين|ديزل/i.test(lower);
  const realEstateSignal =
    /شقة|فيلا|عقار|للايجار|للإيجار|غرفة|غرف نوم|bedroom|apartment|villa|استوديو|ستوديو|محل تجاري|studio flat|\bflat\b|\broom\b|warehouse|مستودع|مخزن/i.test(lower);

  // strong signals for the remaining sections — keeps ads out of "general/other"
  const electronicsSignal =
    /جوال|ايفون|آيفون|موبايل|هاتف|لابتوب|كمبيوتر|تلفزيون|شاشة|بلايستيشن|سماعة|كاميرا|تابلت|ايباد|iphone|laptop|dell|\bhp\b|lenovo|acer|asus|macbook|desktop|computer|powerbank|charger|samsung|galaxy|سامسونج|tablet|ipad|printer|hard disk|core i\d/i.test(lower);
  const equipmentSignal =
    /مطعم|مطبخ صناعي|ثلاجة عرض|فرن|ماكينة|معدات مطاعم|كوفي|باريستا|قهوة|عجان|شواية/i.test(lower);
  const furnitureSignal =
    /أثاث|اثاث|كنب|كنبة|سرير|دولاب|طاولة|كرسي|مجلس|خزانة|ديكور|sofa|trolley|jewellery|jewelry|ring|stone/i.test(lower);
  const servicesSignal =
    /صيانة|تنظيف|نقل عفش|تركيب|توصيل|سباك|كهربائي|نجار|دهان|خدمة تنظيف|repair|maintenance|shifting|movers|packers|pick and drop|document clearance|cpr|scrap|recycling|course|diploma/i.test(lower);
  const jobsSignal =
    /مطلوب موظف|مطلوب عامل|مطلوب عاملة|توظيف|وظيفة شاغرة|راتب شهري|سيرة ذاتية|hiring/i.test(lower);

  const strongServiceSignal = /shifting|movers|packers|house shift|office shift|flat shifting|villa shifting|pick and drop|document clearance|cpr services|scrap|recycling|course|diploma/i.test(lower);
  if (strongServiceSignal) return "services";
  if (current === "cars" || current === "real_estate") return current;
  if (servicesSignal && !carSignal) return "services";
  if (realEstateSignal) return "real_estate";
  if (carSignal) return "cars";
  if (current !== "other") return current;
  if (equipmentSignal) return "equipment";
  if (electronicsSignal) return "electronics";
  if (furnitureSignal) return "furniture";
  if (jobsSignal) return "jobs";
  return current;
}

/** Strips noise from a candidate ad name and returns "" when nothing usable remains. */
export function cleanAdName(s: string | null | undefined): string {
  return cleanTitlePart((s ?? "").toString());
}

/** True when the bot supplied a real, human ad name (not empty / not noise). */
export function hasMeaningfulTitle(rawTitle: string | null | undefined): boolean {
  const title = cleanAdName(rawTitle).toLowerCase();
  if (title.length < 3) return false;
  return !/^(عام|أخرى|اخرى|عام وأخرى|general|other|misc|for sale|item for sale|good|available)$/.test(title);
}

/** Generic, non-descriptive words that must never stand alone as an ad title. */
const GENERIC_TITLE_WORDS =
  /^(عام|أخرى|اخرى|عام وأخرى|للبيع|للايجار|للإيجار|سيارات?|عقار|عقارات|اعلان|إعلان|متوفر|available|for sale|item for sale|sale|new|used|general|other|misc)$/i;

/** Derives a descriptive title from the first meaningful line of the body. */
export function firstMeaningfulLine(text: string | null | undefined): string {
  const lines = (text ?? "").toString().replace(/\r/g, "").split("\n");
  for (const line of lines) {
    const cleaned = cleanTitlePart(line);
    if (cleaned.length >= 3 && !GENERIC_TITLE_WORDS.test(cleaned)) return cleaned.slice(0, 80).trim();
  }
  return "";
}


// ───────────────────────── Subcategory detection ─────────────────────────

export interface SubCategoryResult {
  /** Top-level group name as stored on the category (maps to listings.group_name). */
  group_name: string | null;
  /** Leaf item name (maps to listings.item_name). */
  item_name: string | null;
}

/**
 * Detects the most appropriate subcategory (group + item) for an ad based on its
 * detected main category and free text. Returns the group/item *names* exactly as
 * stored in the site category tree so the ad files under the right subcategory page.
 */
export function detectSubcategory(slug: FbCategorySlug, text: string): SubCategoryResult {
  const t = normDigits(text).toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => t.includes(k.toLowerCase()));

  if (slug === "cars") {
    // Vehicle type first (trucks/buses/motorcycles/boats/heavy equipment)
    if (has("شاحنة", "شاحنات", "truck", "تريلا", "قلاب", "lorry"))
      return { group_name: "شاحنات", item_name: "شاحنات" };
    if (has("باص", "باصات", "حافلة", "bus", "ميني باص"))
      return { group_name: "باصات", item_name: "باصات" };
    if (has("دباب", "دراجة نارية", "دراجة ناريه", "موتور", "motorcycle", "bike", "هارلي"))
      return { group_name: "دراجات نارية", item_name: "دراجات نارية" };
    if (has("قارب", "قوارب", "boat", "جيتسكي", "يخت", "لنش"))
      return { group_name: "قوارب", item_name: "قوارب" };
    if (has("معدات ثقيلة", "حفار", "بوكلين", "شيول", "رافعة", "كرين", "excavator", "forklift", "رافعة شوكية"))
      return { group_name: "معدات ثقيلة", item_name: "معدات ثقيلة" };
    if (has("خدمة", "خدمات", "صيانة", "ورشة", "بنشر", "ميكانيكي", "غسيل سيارات", "service"))
      return { group_name: "خدمات السيارات", item_name: "خدمات السيارات" };
    // Spare parts & accessories
    if (has("قطع غيار", "قطعة غيار", "spare", "spare parts")) {
      if (has("إطار", "اطار", "اطارات", "tyre", "tire", "كفر")) return { group_name: "قطع غيار", item_name: "إطارات" };
      if (has("بطارية", "battery", "بطاريات")) return { group_name: "قطع غيار", item_name: "بطاريات" };
      if (has("زيت", "زيوت", "oil")) return { group_name: "قطع غيار", item_name: "زيوت" };
      return { group_name: "قطع غيار", item_name: "إكسسوارات" };
    }
    if (has("إطار", "اطارات", "tyre", "tire")) return { group_name: "قطع غيار", item_name: "إطارات" };
    if (has("بطارية", "battery")) return { group_name: "قطع غيار", item_name: "بطاريات" };
    if (has("زيت محرك", "زيوت", "engine oil")) return { group_name: "قطع غيار", item_name: "زيوت" };
    if (has("إكسسوار", "اكسسوار", "accessory", "accessories")) return { group_name: "قطع غيار", item_name: "إكسسوارات" };
    // Cars
    if (has("للايجار", "للإيجار", "إيجار", "ايجار", "for rent", "rent", "rental"))
      return { group_name: "سيارات", item_name: "سيارات للإيجار" };
    if (has("جديدة", "جديد", "زيرو", "brand new", "0km", "صفر"))
      return { group_name: "سيارات", item_name: "سيارات جديدة" };
    if (has("مستعملة", "مستعمل", "used", "ماشية", "ممشى"))
      return { group_name: "سيارات", item_name: "سيارات مستعملة" };
    return { group_name: "سيارات", item_name: "سيارات للبيع" };
  }

  if (slug === "services") {
    if (has("air conditioner", "ac repair", "a/c", "مكيف", "مكيفات"))
      return { group_name: "صيانة وتركيب", item_name: "صيانة مكيفات" };
    if (has("appliance", "washing machine", "غسالة", "أجهزة"))
      return { group_name: "صيانة وتركيب", item_name: "صيانة أجهزة" };
    if (has("movers", "packers", "shifting", "house shift", "نقل عفش"))
      return { group_name: "نقل وتوصيل", item_name: "نقل عفش" };
    if (has("delivery", "pick and drop", "توصيل"))
      return { group_name: "نقل وتوصيل", item_name: "توصيل طلبات" };
    if (has("design", "printing", "تصميم", "طباعة"))
      return { group_name: "خدمات تجارية", item_name: "تصميم وطباعة" };
    return { group_name: "خدمات تجارية", item_name: null };
  }

  if (slug === "electronics") {
    if (has("laptop", "لابتوب", "notebook", "macbook", "latitude")) return { group_name: "كمبيوتر وألعاب", item_name: "لابتوبات" };
    if (has("desktop", "optiplex", "computer set", "كمبيوتر مكتبي")) return { group_name: "كمبيوتر وألعاب", item_name: "أجهزة مكتبية" };
    if (has("monitor", "شاشة كمبيوتر")) return { group_name: "كمبيوتر وألعاب", item_name: "شاشات كمبيوتر" };
    if (has("playstation", "ps4", "ps5", "xbox", "nintendo", "ألعاب")) return { group_name: "كمبيوتر وألعاب", item_name: "أجهزة ألعاب" };
    if (has("printer", "طابعة")) return { group_name: "كمبيوتر وألعاب", item_name: "طابعات" };
    if (has("powerbank", "charger", "hard disk", "ram", "keyboard", "mouse", "ملحقات")) return { group_name: "كمبيوتر وألعاب", item_name: "ملحقات كمبيوتر" };
    if (has("iphone", "samsung", "galaxy", "mobile", "phone", "هاتف", "جوال", "موبايل")) return { group_name: "موبايلات وأجهزة لوحية", item_name: "هواتف ذكية" };
    if (has("tablet", "ipad", "tab", "تابلت", "ايباد")) return { group_name: "موبايلات وأجهزة لوحية", item_name: "أجهزة لوحية" };
    if (has("tv", "television", "تلفزيون")) return { group_name: "تلفزيونات وشاشات", item_name: "تلفزيونات" };
    if (has("projector", "بروجكتر")) return { group_name: "تلفزيونات وشاشات", item_name: "بروجكتر" };
    if (has("ac", "a/c", "air conditioner", "مكيف")) return { group_name: "مكيفات وتبريد", item_name: "مكيفات سبليت" };
    if (has("washing machine", "dryer", "غسالة", "مجفف")) return { group_name: "أجهزة منزلية", item_name: "غسالات ومجففات" };
    if (has("cooking range", "oven", "microwave", "فرن")) return { group_name: "أجهزة منزلية", item_name: "أفران ومايكروويف" };
    if (has("camera", "كاميرا")) return { group_name: "صوتيات وكاميرات", item_name: "كاميرات" };
    if (has("speaker", "headphone", "سماعة", "سماعات")) return { group_name: "صوتيات وكاميرات", item_name: "سماعات" };
    return { group_name: "كمبيوتر وألعاب", item_name: null };
  }

  if (slug === "furniture") {
    if (has("sofa", "كنب", "كنبة")) return { group_name: "أثاث", item_name: "غرف معيشة" };
    if (has("bed", "bedroom", "سرير", "غرفة نوم")) return { group_name: "أثاث", item_name: "غرف نوم" };
    if (has("table", "chair", "كرسي", "طاولة")) return { group_name: "أثاث", item_name: "غرف طعام" };
    if (has("trolley", "gas cylinder", "أواني", "مطبخ")) return { group_name: "أدوات منزلية", item_name: "أواني طبخ" };
    if (has("jewellery", "jewelry", "ring", "stone", "مجوهرات", "خاتم")) return { group_name: "إكسسوارات", item_name: "مجوهرات" };
    return { group_name: "أثاث", item_name: null };
  }

  if (slug === "jobs") {
    return has("job", "work", "مطلوب", "عامل", "موظف")
      ? { group_name: "باحث عن عمل", item_name: null }
      : { group_name: "مطلوب موظفين", item_name: null };
  }

  if (slug === "equipment") {
    if (has("oven", "cooking range", "فرن", "طباخ")) return { group_name: "معدات طهي", item_name: "طباخات" };
    if (has("grill", "شواية")) return { group_name: "معدات طهي", item_name: "شوايات" };
    if (has("coffee", "espresso", "قهوة")) return { group_name: "قهوة ومشروبات", item_name: "مكائن قهوة" };
    if (has("fridge", "freezer", "ثلاجة", "فريزر")) return { group_name: "معدات تبريد", item_name: "ثلاجات" };
    return { group_name: "معدات متنوعة (أخرى)", item_name: null };
  }

  if (slug === "real_estate") {
    const re = extractRealEstateSpecs(text);
    const group = re.offer_type === "rent" ? "للإيجار" : "للبيع";
    const typeAr: Record<string, string> = {
      villa: "فلل", apartment: "شقق", studio: "استوديو", office: "مكاتب", shop: "محلات", land: "أراضٍ",
    };
    let item = re.property_type ? typeAr[re.property_type] ?? null : null;
    // 'أراضٍ' only exists under 'للبيع'
    if (item === "أراضٍ" && group === "للإيجار") item = null;
    if (!item) {
      if (has("منزل", "بيت", "house")) item = "منازل";
      else if (has("عمارة", "بناية", "building")) item = "عمارات";
      else if (has("مستودع", "مخزن", "warehouse", "store")) item = "مستودعات";
    }
    return { group_name: group, item_name: item };
  }

  return { group_name: null, item_name: null };
}

// ───────────────────────── Professional title builder ─────────────────────────

/** Strips emojis, hashtags, phone numbers, repeated punctuation and excess whitespace. */
function cleanTitlePart(s: string): string {
  return normDigits(s)
    .replace(/[#﹟＃][^\s#]+/g, " ") // hashtags
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}]/gu, " ") // emojis/symbols
    .replace(/(\+?\d[\d\s\-]{6,})/g, " ") // phone-like numbers
    .replace(/[^\p{L}\p{N}\s\-]/gu, " ") // keep letters/numbers/space/dash
    .replace(/\s+/g, " ")
    .trim();
}

export interface BuildTitleArgs {
  slug: FbCategorySlug;
  /** Resolved subcategory item name (most specific product type). */
  itemName?: string | null;
  /** Resolved group name (fallback product type). */
  groupName?: string | null;
  /** Arabic category label fallback. */
  categoryName: string;
  /** Detected/declared brand. */
  brand?: string | null;
  /** Raw post text — used to derive model/year for vehicles. */
  text: string;
  /** A human-written title from the bot, if any. */
  rawTitle?: string | null;
}

/**
 * Composes a clean, ordered ad title following the house rule:
 *   نوع الصنف/المنتج  ←  الماركة (←  الموديل/السنة للسيارات)
 * Specs and free description are kept OUT of the title (they belong in the body).
 */
export function buildAdTitle(args: BuildTitleArgs): string {
  const productType = (args.itemName || args.groupName || args.categoryName || "").trim();
  const parts: string[] = [];
  if (productType) parts.push(productType);

  if (args.slug === "cars") {
    const specs = extractCarSpecs(args.text);
    const brand = (args.brand || specs.brand || "").toString().trim();
    if (brand && !parts.join(" ").includes(brand)) parts.push(brand);
    if (specs.year) parts.push(String(specs.year));
  } else if (args.slug === "real_estate") {
    // type already includes offer (شقق/فلل) — append the offer group + region for clarity
    if (args.groupName && !parts.join(" ").includes(args.groupName)) parts.push(args.groupName);
    const re = extractRealEstateSpecs(args.text);
    if (re.region && !parts.join(" ").includes(re.region)) parts.push(re.region);
  } else {
    const brand = (args.brand || "").toString().trim();
    if (brand && brand !== "أخرى" && !parts.join(" ").includes(brand)) parts.push(brand);
  }

  let title = cleanTitlePart(parts.join(" "));

  // Fallback to a cleaned raw title or category label if we produced nothing usable.
  if (title.length < 3) {
    const raw = cleanTitlePart(args.rawTitle ?? "");
    title = raw.length >= 3 ? raw : (productType || args.categoryName || "إعلان");
  }
  return title.slice(0, 80).trim() || "إعلان";
}

