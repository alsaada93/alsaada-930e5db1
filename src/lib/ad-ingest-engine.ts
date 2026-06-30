/**
 * BULLETPROOF, 100% DETERMINISTIC ad ingestion engine.
 *
 * No AI / LLM. Pure Regex + text sanitization + "Blacklist Isolation".
 * Implements the exact pipeline:
 *   STEP 1 — phone & non-price number isolation (Blacklist)
 *   STEP 2 — strict, currency-bound price engine
 *   STEP 3 — keyword categorization (never "عام وأخرى" by accident)
 *   STEP 4 — smart, anti-trash title generation
 *
 * Safe to import on both client and server (pure functions only).
 */

import type { FbCategorySlug } from "./facebook-parse";

// ───────────────────────── helpers ─────────────────────────

/** Arabic-Indic digits → ASCII. */
function normDigits(t: string): string {
  return (t ?? "").replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Strips emojis & pictographic symbols. */
function stripEmojis(t: string): string {
  return (t ?? "")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{2122}\u{2139}\u{20E3}]/gu,
      " ",
    )
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, " ");
}

// Arabic display names for the deterministic category set.
export const DET_CATEGORIES = {
  cars: "سيارات",
  realEstate: "عقارات",
  furniture: "أثاث",
  electronics: "إلكترونيات",
  equipment: "معدات مطاعم",
  services: "خدمات",
  jobs: "وظائف",
  general: "بضائع عامة",
} as const;

export type DetCategory = (typeof DET_CATEGORIES)[keyof typeof DET_CATEGORIES];

/** Maps the deterministic Arabic category to the site FbCategorySlug. */
export function categoryToSlug(cat: DetCategory): FbCategorySlug {
  switch (cat) {
    case "سيارات":
      return "cars";
    case "عقارات":
      return "real_estate";
    case "أثاث":
      return "furniture";
    case "إلكترونيات":
      return "electronics";
    case "معدات مطاعم":
      return "equipment";
    case "خدمات":
      return "services";
    case "وظائف":
      return "jobs";
    default:
      return "other";
  }
}

// ───────────────────────── car brand map (Arabic display) ─────────────────────────

const CAR_MAKE_MAP: Array<[RegExp, string]> = [
  [/تويوتا|toyota/i, "تويوتا"],
  [/نيسان|nissan/i, "نيسان"],
  [/هوندا|honda/i, "هوندا"],
  [/لكزس|lexus/i, "لكزس"],
  [/مرسيدس|mercedes|بنز|benz/i, "مرسيدس"],
  [/بي\s*ام|بي\s*إم|\bbmw\b/i, "بي إم دبليو"],
  [/هونداي|هيونداي|hyundai/i, "هيونداي"],
  [/كيا|\bkia\b/i, "كيا"],
  [/فورد|ford/i, "فورد"],
  [/شفروليه|شيفروليه|chevrolet|chevy/i, "شيفروليه"],
  [/جمس|جي\s*ام\s*سي|\bgmc\b/i, "جي إم سي"],
  [/ميتسوبيشي|mitsubishi/i, "ميتسوبيشي"],
  [/مازدا|mazda/i, "مازدا"],
  [/جيب|jeep/i, "جيب"],
  [/دودج|dodge/i, "دودج"],
  [/اودي|أودي|audi/i, "أودي"],
  [/فولكس|volkswagen/i, "فولكس واجن"],
  [/بورش|بورشه|porsche/i, "بورش"],
  [/لاند\s*روفر|land\s*rover/i, "لاند روفر"],
  [/رنج\s*روفر|range\s*rover/i, "رنج روفر"],
  [/سوزوكي|suzuki/i, "سوزوكي"],
  [/سوبارو|subaru/i, "سوبارو"],
  [/بيجو|peugeot/i, "بيجو"],
  [/رينو|renault/i, "رينو"],
  [/انفنيتي|إنفينيتي|infiniti/i, "إنفينيتي"],
  [/كاديلاك|cadillac/i, "كاديلاك"],
  [/جاكوار|jaguar/i, "جاكوار"],
  [/\bmg\b|ام\s*جي/i, "إم جي"],
  [/شانجان|تشانجان|changan/i, "شانجان"],
  [/جيلي|geely/i, "جيلي"],
  [/شيري|chery/i, "شيري"],
  [/هافال|haval/i, "هافال"],
  [/فولفو|volvo/i, "فولفو"],
  [/تسلا|tesla/i, "تسلا"],
];

function detectCarMake(text: string): string | null {
  for (const [re, name] of CAR_MAKE_MAP) {
    if (re.test(text)) return name;
  }
  return null;
}

// ───────────────────────── STEP 1 — Blacklist isolation ─────────────────────────

export interface IsolationResult {
  contact_phone: string | null;
  model_year: number | null;
  mileage: number | null;
  engine_capacity: string | null;
  blacklist: Set<string>;
}

const PHONE_RE = /(?:\+|00)?(?:973)?[\s-]*([36](?:[\s-]*\d){7})\b/g;
const YEAR_RE = /\b(19[8-9][0-9]|20[0-2][0-9])\b/g;
// number THEN unit (e.g. "150,000 كم")
const KM_AFTER_RE = /(\d{1,3}(?:,\d{3})*|\d{3,7})\s*(km\b|kms\b|كم|كيلو|كيلومتر)/i;
// indicator THEN number (e.g. "ممشى 150000", "عداد 80,000")
const KM_BEFORE_RE = /(ممشى|ماشية|عداد|mileage|odometer)\s*[:：]?\s*(\d{1,3}(?:,\d{3})*|\d{3,7})/i;
const ENGINE_L_RE = /\b([1-8]\.[0-9])\s*(l|لتر|cc)?\b/i;
const ENGINE_V_RE = /\b(v4|v6|v8|v10|v12)\b/i;

/** Adds an integer's full form + 4-digit halves + 2-digit pairs to the blacklist. */
function blacklistPhoneParts(eightDigits: string, set: Set<string>): void {
  set.add(eightDigits);
  if (eightDigits.length === 8) {
    set.add(eightDigits.slice(0, 4));
    set.add(eightDigits.slice(4, 8));
    for (let i = 0; i + 2 <= 8; i += 2) set.add(eightDigits.slice(i, i + 2));
  }
}

/**
 * STEP 1: isolate every non-price number BEFORE the price engine runs.
 * Operates on digit-normalised text.
 */
export function isolateNumbers(rawText: string, isCarContext: boolean): IsolationResult {
  const text = normDigits(rawText ?? "");
  const blacklist = new Set<string>();
  let contact_phone: string | null = null;

  // A. Phone numbers (extreme spacing / prefixes)
  PHONE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE_RE.exec(text)) !== null) {
    const clean = m[1].replace(/[\s-]/g, "");
    if (clean.length !== 8) continue;
    if (!contact_phone) contact_phone = clean;
    blacklistPhoneParts(clean, blacklist);
  }

  let model_year: number | null = null;
  let mileage: number | null = null;
  let engine_capacity: string | null = null;

  // B. Automotive specs (only when the ad is a car ad)
  if (isCarContext) {
    YEAR_RE.lastIndex = 0;
    let ym: RegExpExecArray | null;
    while ((ym = YEAR_RE.exec(text)) !== null) {
      const y = Number(ym[1]);
      if (model_year === null) model_year = y;
      blacklist.add(String(y));
    }

    const kmA = text.match(KM_AFTER_RE);
    const kmB = text.match(KM_BEFORE_RE);
    const kmRaw = kmA?.[1] ?? kmB?.[2] ?? null;
    if (kmRaw) {
      const numeric = kmRaw.replace(/,/g, "");
      const val = Number(numeric);
      if (Number.isFinite(val)) {
        mileage = val;
        blacklist.add(numeric);
        blacklist.add(kmRaw);
      }
    }

    const eng = text.match(ENGINE_L_RE);
    if (eng) {
      engine_capacity = `${eng[1]}L`;
      blacklist.add(eng[1].replace(".", ""));
      blacklist.add(eng[1]);
    } else {
      const engV = text.match(ENGINE_V_RE);
      if (engV) engine_capacity = engV[1].toUpperCase();
    }
  }

  return { contact_phone, model_year, mileage, engine_capacity, blacklist };
}

// ───────────────────────── STEP 2 — strict price engine ─────────────────────────

const FREE_RE = /(?:^|[^\p{L}])(مجانا|مجاناً|بلاش|free)(?:[^\p{L}]|$)/iu;
const CURRENCY_BIND = "(?:bd|bhd|د\\.?\\s?ب|دينار|بحريني|السعر|مطلوب|بسعر)";
// number followed by currency, OR currency/keyword followed by number
const PRICE_AFTER = new RegExp(`(\\d[\\d.,]*)\\s*${CURRENCY_BIND}`, "giu");
const PRICE_BEFORE = new RegExp(`${CURRENCY_BIND}\\s*[:：]?\\s*(\\d[\\d.,]*)`, "giu");

/** "4,500"→4500 ; "4500.000"→4500 ; "4.500"→4.5 */
function parsePriceNum(tok: string): number | null {
  let s = tok.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  s = s.replace(/,/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.join(""); // many dots → thousand separators
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

export interface PriceResult {
  price: number;
  detected: boolean;
  free: boolean;
}

/**
 * STEP 2: strict, currency-bound price extraction.
 *  - explicit "free" words → 0
 *  - number must be bound to a Bahraini currency / price keyword
 *  - blacklisted numbers (phone/year/mileage parts) are ignored
 *  - numbers > 50000 are ignored
 *  - nothing found → 0 (i.e. "000", no price)
 */
export function extractStrictPrice(rawText: string, blacklist: Set<string>): PriceResult {
  const text = normDigits(rawText ?? "");
  if (FREE_RE.test(text)) return { price: 0, detected: true, free: true };

  const candidates: number[] = [];
  for (const re of [PRICE_AFTER, PRICE_BEFORE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[1];
      const digitsOnly = tok.replace(/[^\d]/g, "");
      if (!digitsOnly) continue;
      if (blacklist.has(digitsOnly) || blacklist.has(tok)) continue; // blacklisted
      const n = parsePriceNum(tok);
      if (n === null || n <= 0) continue;
      if (n > 50000) continue; // implausible price
      candidates.push(n);
    }
  }

  if (candidates.length) return { price: candidates[0], detected: true, free: false };
  return { price: 0, detected: false, free: false };
}

// ───────────────────────── STEP 3 — categorization ─────────────────────────

const CAT_KEYWORDS: Array<[DetCategory, RegExp]> = [
  // Restaurant / industrial equipment FIRST (wins over generic car/furniture words)
  [
    DET_CATEGORIES.equipment,
    /مكينة\s*قهوة|مكينه\s*قهوة|آلة\s*القهوة|اسبريسو|إسبريسو|espresso|فرن|oven|عجان[ةه]|proofer|طاولات?\s*ستيل|ستانلس|ستيل|مقلاة|قلاية|fryer|nuova\s*simonelli|ثلاجة\s*عرض|فريزر|صانعة\s*ثلج|ice\s*maker|مطعم|مطاعم|كافيه|كوفي|كافتيريا|شواية|قريل|grill|مطبخ\s*صناعي|عصارة|juice\s*machine|prep\s*table|كاشير|\bpos\b/i,
  ],
  [
    DET_CATEGORIES.cars,
    /\bسيارة\b|سيارات|تويوتا|هوندا|نيسان|لكزس|مرسيدس|بي\s*ام|هونداي|هيونداي|كيا|جيب|للبيع\s*سيارة|صالون|سيدان|\btoyota\b|\bnissan\b|\bhonda\b|\blexus\b|\bmercedes\b|\bbmw\b|\bkia\b|\bhyundai\b/i,
  ],
  // Real estate BEFORE furniture so "غرفة/طاولة" inside a property ad don't pull it to furniture
  [
    DET_CATEGORIES.realEstate,
    /عقار|عقارات|شق[ةه]|شقق|فيلا|فلل|فل[ةه]|بيت\s*للبيع|بيت\s*للايجار|منزل|أرض|ارض|للايجار|للإيجار|للبيع\s*أرض|للبيع\s*ارض|عمار[ةه]|ستوديو|استوديو|مستودع|مخزن|دور\s*أرضي|دور\s*علوي|سكني|تجاري\s*للايجار|\bapartment\b|\bvilla\b|\bstudio\b|\bflat\b|\bwarehouse\b|real\s*estate|\bproperty\b/i,
  ],
  [
    DET_CATEGORIES.furniture,
    /أثاث|اثاث|سرير|كبت|دولاب|كراسي|كرسي|طاولة|صوفا|كنب|كنبة|مجلس|خزانة|\bbed\b|\bsofa\b|\bdining\b|\bwardrobe\b|\bcouch\b/i,
  ],
  [
    DET_CATEGORIES.electronics,
    /شاشة|تلفزيون|ايفون|آيفون|لابتوب|مكيف|ثلاجة(?!\s*عرض)|غسالة|جوال|موبايل|سماعة|كاميرا|تابلت|ايباد|بلايستيشن|\btv\b|\bmonitor\b|\biphone\b|\blaptop\b|\bsamsung\b|\bipad\b|\bplaystation\b|\bmacbook\b|\bdell\b|\bhp\b|\blenovo\b/i,
  ],
  [
    DET_CATEGORIES.services,
    /خدم[ةه]|خدمات|صيانة|تنظيف|نقل\s*عفش|تركيب|توصيل|سباك|كهربائي|نجار|دهان|\bservice\b|\bservices\b|repair|maintenance|movers|delivery/i,
  ],
  [
    DET_CATEGORIES.jobs,
    /وظيف[ةه]|وظائف|مطلوب\s*موظف|مطلوب\s*عامل|مطلوب\s*عامل[ةه]|توظيف|سيرة\s*ذاتية|\bjob\b|\bjobs\b|hiring|vacancy/i,
  ],
];

/**
 * STEP 3: returns the Arabic category. Falls back to "بضائع عامة" — never to
 * "عام وأخرى" or "سيارات" by default.
 */
export function classifyAd(rawText: string, explicit?: string | null): DetCategory {
  const text = normDigits(`${explicit ?? ""} ${rawText ?? ""}`).toLowerCase();

  // explicit category mapping (only when it matches a known Arabic name)
  if (explicit) {
    const e = explicit.toLowerCase();
    if (/مطاع|معدات/.test(e)) return DET_CATEGORIES.equipment;
    if (/سيار|مركب/.test(e)) return DET_CATEGORIES.cars;
    if (/عقار/.test(e)) return DET_CATEGORIES.realEstate;
    if (/أثاث|اثاث/.test(e)) return DET_CATEGORIES.furniture;
    if (/الكترون|إلكترون|كهرب/.test(e)) return DET_CATEGORIES.electronics;
    if (/خدمات|خدمة/.test(e)) return DET_CATEGORIES.services;
    if (/وظائف|وظيفة/.test(e)) return DET_CATEGORIES.jobs;
  }

  for (const [cat, re] of CAT_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return DET_CATEGORIES.general; // bullet-proof fallback
}

// ───────────────────────── STEP 4 — title generation ─────────────────────────

const BANNED_TITLES = [
  "عام وأخرى",
  "عام واخرى",
  "عام",
  "أخرى",
  "اخرى",
  "سيارات",
  "سيارة",
  "أثاث",
  "اثاث",
  "للبيع",
  "إعلان",
  "اعلان",
  "general",
  "cars",
  "بضائع عامة",
  "إلكترونيات",
  "معدات مطاعم",
];

const NOISE_WORDS_RE =
  /^(للبيع|للايجار|للإيجار|عاجل|message|msg|call|اتصال|واتساب|whatsapp|تواصل|للتواصل|بسعر|السعر|مطلوب|سعر|new|used|جديد|مستعمل|available|متوفر|عرض|عروض|تخفيض|sale|for)$/i;

export function isBanned(s: string): boolean {
  const t = s.trim().toLowerCase();
  return BANNED_TITLES.some((b) => b.toLowerCase() === t);
}

/** Removes numbers, prices, phones, currency and noise from a text fragment. */
function cleanWords(rawText: string): string[] {
  let t = stripEmojis(normDigits(rawText ?? ""));
  // remove urls
  t = t.replace(/https?:\/\/\S+/gi, " ").replace(/www\.\S+/gi, " ");
  // remove currency-bound prices & standalone numbers
  t = t.replace(/\d[\d.,\s-]*/g, " ");
  t = t.replace(/(bd|bhd|د\.?\s?ب|دينار|بحريني)/gi, " ");
  // split into words, drop noise tokens and very short tokens
  return t
    .split(/[^\p{L}]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !NOISE_WORDS_RE.test(w));
}

export interface TitleArgs {
  category: DetCategory;
  car_make: string | null;
  model_year: number | null;
  rawText: string;
}

/**
 * STEP 4: smart, dynamic, anti-trash title.
 *  - cars with brand/year → "سيارة للبيع - <make> <year>"
 *  - otherwise the first 5–8 clean meaningful words (never a banned category word)
 */
export function buildTitle({ category, car_make, model_year, rawText }: TitleArgs): string {
  // Automotive override
  if (category === DET_CATEGORIES.cars && (car_make || model_year)) {
    const parts = ["سيارة للبيع -"];
    if (car_make) parts.push(car_make);
    if (model_year) parts.push(String(model_year));
    return parts.join(" ").trim();
  }

  const words = cleanWords(rawText);
  // slide a 5-8 word window; skip windows that reduce to a banned phrase
  for (let start = 0; start < Math.max(1, words.length); start += 5) {
    const window = words.slice(start, start + 8);
    if (window.length === 0) break;
    const candidate = window.join(" ").trim();
    if (!candidate) continue;
    if (isBanned(candidate)) continue;
    // require at least 2 meaningful words, or a single long word
    if (window.length === 1 && candidate.length < 4) continue;
    return candidate.slice(0, 80);
  }
  return "";
}

// ───────────────────────── full pipeline ─────────────────────────

export interface EngineResult {
  contact_phone: string | null;
  price: number;
  priceDetected: boolean;
  free: boolean;
  category: DetCategory;
  slug: FbCategorySlug;
  car_make: string | null;
  model_year: number | null;
  mileage: number | null;
  engine_capacity: string | null;
  title: string;
}

/** Runs the complete deterministic pipeline over a raw ad text. */
export function runIngestEngine(rawText: string, explicitCategory?: string | null): EngineResult {
  const text = rawText ?? "";

  // Pre-classify to know whether car-spec isolation should run.
  const category = classifyAd(text, explicitCategory);
  const isCar = category === DET_CATEGORIES.cars;

  const iso = isolateNumbers(text, isCar);
  const priceRes = extractStrictPrice(text, iso.blacklist);
  const car_make = isCar ? detectCarMake(normDigits(text)) : null;
  const title = buildTitle({ category, car_make, model_year: iso.model_year, rawText: text });

  return {
    contact_phone: iso.contact_phone,
    price: priceRes.price,
    priceDetected: priceRes.detected,
    free: priceRes.free,
    category,
    slug: categoryToSlug(category),
    car_make,
    model_year: iso.model_year,
    mileage: iso.mileage,
    engine_capacity: iso.engine_capacity,
    title,
  };
}
