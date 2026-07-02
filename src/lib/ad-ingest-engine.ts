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

// PART C.1 — أي تسلسل رقمي متصل طوله ≥ 7 خانات = رقم هاتف (يُتجاهل تماماً كسعر).
const LONG_DIGIT_RE = /\d{7,}/g;

// PART C.2 — واصمات مواصفات (تخزين/رام/شاشة/محرك/مساحة/موديل). أي رقم ملاصق لها ليس سعراً.
// رقم ثم واصمة: 256gb, 55 بوصة, 2000cc, 150sqm, 16 رام
const SPEC_NUM_UNIT_RE =
  /(\d[\d.,]*)\s*(gb|tb|mb|ram|جيجا|قيقا|تيرا|تيرابايت|ميجا|رام|hz|هرتز|inch|بوصه|بوصة|cm|mm|سم|ملم|متر|meter|sqm|م2|قدم|kg|كيلو|كجم|cc|سيسي|سي\s?سي|liter|لتر|سلندر|cylinder|واط|watt|w|mp|ميجابكسل|بكسل|px)\b/giu;
// واصمة محرك ثم رقم أو رقم ثم x: v8, 4x4, 2.0l
const SPEC_MARKER_RE = /\b(v)\s?(\d{1,2})\b|\b(\d)\s?x\s?(\d)\b/gi;
// موديل/سنة ثم رقم: موديل 2021, model 2015, سنة 2019
const MODEL_YEAR_RE = /(موديل|model|سنه|سنة|year)\s*[:：]?\s*(19[89]\d|20[0-2]\d)/giu;
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

  // A.1 — PART C.1: أي تسلسل رقمي ≥ 7 خانات (أرقام دولية/جوال) يُدرج بالكامل في القائمة السوداء.
  LONG_DIGIT_RE.lastIndex = 0;
  let ld: RegExpExecArray | null;
  while ((ld = LONG_DIGIT_RE.exec(text)) !== null) {
    const run = ld[0];
    blacklist.add(run);
    if (run.length === 8) {
      blacklistPhoneParts(run, blacklist);
      if (!contact_phone && /^[36]/.test(run)) contact_phone = run;
    }
  }

  // A.2 — PART C.2: أرقام المواصفات (تخزين/رام/شاشة/مساحة/محرك/موديل) — تُتجاهل كأسعار دائماً.
  SPEC_NUM_UNIT_RE.lastIndex = 0;
  let su: RegExpExecArray | null;
  while ((su = SPEC_NUM_UNIT_RE.exec(text)) !== null) {
    blacklist.add(su[1]);
    blacklist.add(su[1].replace(/[.,]/g, ""));
  }
  SPEC_MARKER_RE.lastIndex = 0;
  let sm: RegExpExecArray | null;
  while ((sm = SPEC_MARKER_RE.exec(text)) !== null) {
    for (const g of [sm[2], sm[3], sm[4]]) if (g) blacklist.add(g);
  }
  MODEL_YEAR_RE.lastIndex = 0;
  let my2: RegExpExecArray | null;
  while ((my2 = MODEL_YEAR_RE.exec(text)) !== null) {
    if (my2[2]) blacklist.add(my2[2]);
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

// ───────────────────────── STEP 2 — scored price engine ─────────────────────────

const FREE_RE = /(?:^|[^\p{L}])(مجانا|مجاناً|بلاش|free)(?:[^\p{L}]|$)/iu;
const CURRENCY_BIND = "(?:bd|bhd|د\\.?\\s?ب|دينار|بحريني|السعر|سعر|مطلوب|بسعر|price|cost|\\$)";
// number followed by currency, OR currency/keyword followed by number
const PRICE_AFTER = new RegExp(`(\\d[\\d.,]*)\\s*${CURRENCY_BIND}`, "giu");
const PRICE_BEFORE = new RegExp(`${CURRENCY_BIND}\\s*[:：]?\\s*(\\d[\\d.,]*)`, "giu");

// أنماط دلالة السعر لاحتساب النقاط
const CUR_STRONG = /(bd|bhd|د\.?\s?ب|دينار|بحريني)/i; // عملة صريحة
const CUR_WEAK = /\$|price|cost/i; // إشارة عملة أضعف/أجنبية
const PRICE_WORD = /(السعر|سعر|مطلوب|بسعر|للبيع|بـ|ب)\s*[:：]?\s*$/i; // كلمة سعر قبل الرقم مباشرة

// كل الأرقام في النص (لمسح المرشحين وتسجيل النقاط)
const ANY_NUM_RE = /\d[\d.,]*/g;

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

export interface PriceCandidate {
  value: number;
  token: string;
  score: number;
  reasons: string[];
  index: number;
}

/**
 * يُقيّم كل رقم في النص ويعطيه نقاطاً حسب دلالته على السعر (مثل محرك التصنيف):
 *  - عملة بحرينية ملاصقة بعد الرقم / قبله (أقوى إشارة)
 *  - كلمة «سعر/السعر/مطلوب/بسعر» قبله مباشرة
 *  - صيغة الفلس العشرية (مثل 4.500) — شائعة في الأسعار البحرينية
 *  - المدى المعقول للسعر
 * الأرقام المدرجة في القائمة السوداء (هاتف/موديل/ممشى/مواصفات) تُستبعد تماماً.
 * يُرجع المرشحين مرتّبين تنازلياً حسب النقاط ثم حسب القرب من بداية النص.
 */
export function scorePriceCandidates(rawText: string, blacklist: Set<string>): PriceCandidate[] {
  const text = normDigits(rawText ?? "");
  const out: PriceCandidate[] = [];

  ANY_NUM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ANY_NUM_RE.exec(text)) !== null) {
    const tok = m[0];
    const start = m.index;
    const end = start + tok.length;
    const digitsOnly = tok.replace(/[^\d]/g, "");
    if (!digitsOnly) continue;
    if (blacklist.has(digitsOnly) || blacklist.has(tok)) continue; // مستبعد

    const n = parsePriceNum(tok);
    if (n === null || n <= 0) continue;

    const before = text.slice(Math.max(0, start - 14), start);
    const after = text.slice(end, end + 10);

    let score = 0;
    const reasons: string[] = [];

    // عملة/كلمة سعر ملاصقة بعد الرقم (أقوى إشارة): "150 د.ب" / "150 bd"
    if (CUR_STRONG.test(after.trimStart().slice(0, 6))) {
      score += 6;
      reasons.push("عملة بحرينية ملاصقة بعد الرقم");
    } else if (CUR_STRONG.test(after)) {
      score += 3;
      reasons.push("عملة بحرينية قريبة بعد الرقم");
    }

    // كلمة سعر مباشرة قبل الرقم: "السعر: 150"
    if (PRICE_WORD.test(before)) {
      score += 5;
      reasons.push("كلمة سعر قبل الرقم مباشرة");
    }
    // عملة صريحة قبل الرقم: "د.ب 150"
    if (CUR_STRONG.test(before)) {
      score += 3;
      reasons.push("عملة بحرينية قبل الرقم");
    }
    // إشارة عملة أضعف/أجنبية
    if (CUR_WEAK.test(after) || CUR_WEAK.test(before)) {
      score += 2;
      reasons.push("إشارة سعر/عملة أجنبية قريبة");
    }

    // صيغة الفلس العشرية البحرينية (3 خانات بعد الفاصلة): 4.500 / 12.750
    if (/^\d+\.\d{3}$/.test(tok)) {
      score += 2;
      reasons.push("صيغة الفلس العشرية (xxx.000)");
    }

    // معقولية المدى
    if (n >= 1 && n <= 50000) {
      score += 1;
      reasons.push("ضمن المدى المعقول للسعر");
    } else if (n > 50000) {
      score -= 4;
      reasons.push("قيمة مبالغ فيها (>50000)");
    }

    out.push({ value: n, token: tok, score, reasons, index: start });
  }

  // ترتيب: الأعلى نقاطاً أولاً، ثم الأقرب لبداية النص
  out.sort((a, b) => b.score - a.score || a.index - b.index);
  return out;
}

/**
 * STEP 2: استخراج السعر بنظام النقاط.
 *  - كلمات المجانية → 0 (free)
 *  - يُختار أعلى مرشح نقاطاً، ويشترط وجود دلالة سعر فعلية (نقاط ≥ 3)
 *    أي اقتران بعملة/كلمة سعر — الأرقام المجرّدة لا تُعتبر سعراً.
 *  - لا مرشح مؤهّل → بدون سعر (تواصل لمعرفة السعر).
 */
export function extractStrictPrice(rawText: string, blacklist: Set<string>): PriceResult {
  const text = normDigits(rawText ?? "");
  if (FREE_RE.test(text)) return { price: 0, detected: true, free: true };

  const candidates = scorePriceCandidates(text, blacklist);
  const best = candidates[0];
  // نشترط دلالة سعر واضحة (اقتران بعملة أو كلمة سعر) — الحد الأدنى 3 نقاط
  if (best && best.score >= 3) return { price: best.value, detected: true, free: false };
  return { price: 0, detected: false, free: false };
}

// ───────────────────────── STEP 3 — categorization (Master Engine v4.0) ─────────────────────────

/**
 * تطبيع النص قبل المطابقة:
 *  - تحويل للحروف الصغيرة
 *  - تحويل الأرقام العربية إلى لاتينية
 *  - إزالة التشكيل (Tashkeel)
 *  - توحيد الألف (أ إ آ ٱ → ا) والتاء المربوطة (ة → ه) والياء (ى → ي)
 */
function normalizeForMatch(input: string): string {
  return normDigits(input ?? "")
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * قاموس ضخم لتصنيف الإعلانات (عربي + إنجليزي + عامية).
 * الكلمات مُطبَّعة مسبقاً عبر buildMatcher لتطابق النص المُطبَّع.
 * الترتيب = الأولوية: معدات المطاعم أولاً، ثم السيارات، ثم العقارات قبل الأثاث،
 * ثم الإلكترونيات، ثم الخدمات/الوظائف.
 */
const CAT_DICTIONARY: Array<[DetCategory, string[]]> = [
  // 1) معدات المطاعم والكافيهات (أولوية قصوى)
  [
    DET_CATEGORIES.equipment,
    [
      "كافيه", "مقهي", "مكينه اسبريسو", "ماكينه اسبريسو", "مكينه قهوه", "ماكينه قهوه", "اله قهوه",
      "طاحونه", "مطحنه قهوه", "ادوات باريستا", "باريستا", "محمصه", "قهوه مختصه", "في 60", "كميكس",
      "كاليتا", "ايروبرس", "تامبر", "موزع قهوه", "بتشر", "لامارزوكو", "نوفا سيمونيلي", "فيكتوريا اردوينو",
      "يوريكا", "مالكونيق", "باراتزا", "ديلونجي", "بريفيل", "سيج", "اسكاسو", "روكيت",
      "معدات مطاعم", "معدات مطعم", "تجهيز مطاعم", "ثلاجه عرض", "ثلاجه تجاريه", "فريزر تجاري", "فريزر ارضي",
      "صانعه ثلج", "مكينه ثلج", "غرفه تبريد", "باين ماري", "فرن بيتزا", "فرن حراري", "عجانه", "قطاعه لحم",
      "مفرمه", "خلاط تجاري", "بلندتك", "فيتاميكس", "شوايه غاز", "صاج", "قلايه بطاطس", "مكينه شاورما",
      "سخان طعام", "ستانلس ستيل", "ستانلس", "ستيل", "شفاط", "طاولات تحضير", "طاوله تحضير", "طباخ تجاري",
      "عربه طعام", "فود ترك", "مطعم", "مطاعم", "كافتيريا", "كوفي", "كاشير مطعم", "نقاط بيع", "سيستم كاشير",
      "كراسي مطعم", "طاولات مطعم", "مطبخ صناعي", "عصاره", "صانعه عصير",
      "cafe", "coffee machine", "espresso machine", "espresso", "coffee grinder", "barista", "barista tools",
      "coffee roaster", "specialty coffee", "v60", "chemex", "tamper", "pitcher", "la marzocco",
      "nuova simonelli", "victoria arduino", "mahlkonig", "eureka", "delonghi", "breville", "sage",
      "restaurant equipment", "commercial fridge", "commercial freezer", "ice maker", "cold room",
      "bain marie", "pizza oven", "convection oven", "dough mixer", "slicer", "grill", "deep fryer",
      "food warmer", "stainless steel", "hood", "prep table", "shawarma machine", "food truck",
      "pos system", "cashier", "restaurant chairs", "restaurant tables", "commercial kitchen", "showcase",
    ],
  ],
  // 2) المركبات والمعدات الثقيلة وقطع الغيار
  [
    DET_CATEGORIES.cars,
    [
      "سياره", "سيارات", "موتر", "سيايير", "جيب", "بيك اب", "شاحنه", "باص", "فان", "صالون", "سيدان",
      "دفع رباعي", "تويوتا", "نيسان", "لاندكروزر", "لاند كروزر", "باترول", "كامري", "كورولا", "صني",
      "لكزس", "مرسيدس", "بي ام دبليو", "بي ام", "فورد", "شفروليه", "شيفروليه", "جمس", "هوندا", "هونداي",
      "هيونداي", "كيا", "رنج روفر", "ميتسوبيشي", "جيلي", "ام جي", "شانجان", "تسلا", "مازدا", "دودج",
      "اودي", "فولكس", "بورش", "لاند روفر", "سوزوكي", "سوبارو", "بيجو", "رينو", "انفنيتي", "كاديلاك",
      "جاكوار", "شيري", "هافال", "فولفو",
      "دراجه ناريه", "سيكل", "دباب", "بانشي", "بقي", "ريس", "هارلي", "سكوتر", "قارب", "طراد", "يخت",
      "جت سكي", "رافعه", "بوكلين", "شيول", "رافعه شوكيه", "مقطوره",
      "قطع غيار", "تواير", "اطارات", "رنجات", "جنوط", "ماكينه سياره", "مكينه سياره", "محرك", "قير",
      "صدام", "بطاريه", "سفايف", "بلكات", "هرن", "بونيت", "دبه", "شفت", "رديتر", "سلف", "دينمو",
      "كمبريسر", "مكيف سياره", "تنجيد",
      "car", "auto", "vehicle", "suv", "sedan", "truck", "bus", "van", "pickup", "toyota", "nissan",
      "land cruiser", "patrol", "camry", "lexus", "mercedes", "bmw", "ford", "chevrolet", "gmc",
      "honda", "hyundai", "kia", "range rover", "tesla", "mazda", "dodge", "audi", "porsche",
      "land rover", "suzuki", "subaru", "peugeot", "renault", "infiniti", "cadillac", "jaguar",
      "motorcycle", "atv", "quad", "scooter", "boat", "yacht", "jet ski", "forklift", "crane",
      "excavator", "trailer", "spare parts", "tires", "wheels", "rims", "engine", "transmission",
      "gear", "bumper", "battery", "brake pads", "radiator", "alternator", "compressor",
      "suspension", "headlights",
    ],
  ],
  // 3) العقارات (قبل الأثاث حتى لا تُسحب «غرفة/طاولة» للأثاث خطأً)
  [
    DET_CATEGORIES.realEstate,
    [
      "عقار", "عقارات", "شقه", "استوديو", "ستوديو", "ملحق", "بيت", "فيلا", "قصر", "سكن عمال", "مبني",
      "عماره", "شقق", "فلل", "بيوت", "ارض", "مخطط", "محل", "متجر", "مكتب", "مساحه تجاريه", "مستودع",
      "كراج", "مبني تجاري", "شاليه", "مزرعه", "استراحه", "للايجار", "للبيع ارض", "خلو", "تقبيل",
      "مفروش", "نصف مفروش", "شامل الكهرباء", "غرفه للايجار",
      "real estate", "property", "apartment", "flat", "studio", "house", "villa", "building",
      "residential", "labor camp", "land", "plot", "shop", "retail", "office", "commercial space",
      "warehouse", "garage", "farm", "chalet", "for rent", "for lease", "lease", "furnished",
      "semi-furnished",
    ],
  ],
  // 4) المنزل والأثاث والأجهزة المنزلية
  [
    DET_CATEGORIES.furniture,
    [
      "اثاث", "عفش", "غرفه نوم", "سرير", "مرتبه", "دوشق", "كنب", "كنبه", "صوفا", "طقم جلوس", "مجلس",
      "قنفه", "زوليه", "سجاد", "ستائر", "ستاره", "كبت", "خزانه", "تسريحه", "طاوله طعام", "كرسي",
      "كراسي", "جلسه خارجيه", "اثاث حديقه", "دولاب", "ديكور", "تحف", "لوحات", "ثريا", "مرايا",
      "كبتات مطبخ", "اواني", "صحون", "دلات", "مفارش", "مكيف", "مكيفات", "سبليت", "مكيف شباك",
      "تكييف مركزي", "غساله", "نشافه", "مجفف", "ثلاجه", "طباخ", "جوله", "ميكروويف", "فرن غاز",
      "فرن كهربائي", "مكنسه", "دفايه", "كولر ماء", "براده",
      "furniture", "bed", "bedroom", "mattress", "sofa", "couch", "living room", "carpet", "rug",
      "curtains", "wardrobe", "closet", "cabinet", "dining table", "chair", "outdoor furniture",
      "decor", "chandelier", "mirrors", "cookware", "dishes", "tableware", "ac", "air conditioner",
      "split ac", "window ac", "washing machine", "dryer", "fridge", "refrigerator", "cooker",
      "stove", "oven", "microwave", "vacuum", "heater", "water dispenser",
    ],
  ],
  // 5) الإلكترونيات والحاسبات والأجهزة
  [
    DET_CATEGORIES.electronics,
    [
      "جوال", "هاتف", "موبايل", "تلفون", "ايفون", "سامسونج", "جالكسي", "هواوي", "شاومي", "ايباد",
      "تابلت", "ايربودز", "سماعات", "سماعه", "باور بانك", "شاحن", "كيبل", "واير", "كفر", "حمايه شاشه",
      "برو ماكس", "الترا", "لابتوب", "حاسب", "كمبيوتر", "بي سي", "تجميعه", "ماك بوك", "ديل", "اتش بي",
      "لينوفو", "اسوس", "ايسر", "شاشه", "ماوس", "كيبورد", "كرت شاشه", "معالج", "مذربورد", "رامات",
      "هاردسك", "اس اس دي", "باور سبلاي", "تبريد مائي", "كيس", "جيمنج", "تلفزيون", "سمارت",
      "بلايستيشن", "سوني", "اكس بوكس", "نينتندو", "يد تحكم", "كونسول", "مسرح منزلي", "كاميرا", "عدسه",
      "درون", "طابعه", "راوتر", "مقوي شبكه", "مودم", "ساعه ذكيه", "ابل واتش",
      "iphone", "smartphone", "mobile", "ipad", "tablet", "samsung", "galaxy", "huawei", "xiaomi",
      "airpods", "earbuds", "charger", "power bank", "pro max", "ultra", "laptop", "pc", "computer",
      "macbook", "desktop", "gaming pc", "monitor", "keyboard", "mouse", "gpu", "cpu", "motherboard",
      "ram", "ssd", "hdd", "power supply", "cooler", "dell", "hp", "asus", "lenovo", "acer", "msi",
      "nvidia", "amd", "intel", "playstation", "ps4", "ps5", "xbox", "nintendo", "controller",
      "speaker", "camera", "lens", "drone", "smartwatch", "apple watch", "tv", "television",
      "router", "modem", "switch",
    ],
  ],
  // 6) الخدمات والمقاولات
  [
    DET_CATEGORIES.services,
    [
      "صيانه", "تصليح", "اصلاح", "تركيب", "صيانه افران", "كهربائي", "سباك", "نجار", "صباغ", "دهان",
      "مقاولات", "بناء", "ترميم", "جبس", "عازل", "طربال", "واتر بروف", "سيراميك", "بلاط",
      "صيانه مكيفات", "غسيل مكيفات", "المنيوم", "مظلات", "حداد", "تنظيف", "غسيل", "مكافحه حشرات",
      "اباده", "نقل عفش", "فك وتركيب", "تغليف", "شحن", "ونش", "سطحه", "ريكفري", "تلميع سيارات",
      "سمكره", "صبغ سيارات", "غسيل سيارات", "تخليص معاملات", "محاسبه", "تصميم", "برمجه", "طباعه",
      "ترجمه", "دروس تقويه", "مدرس", "تدريس", "تصوير", "مصور", "تنسيق حفلات", "توصيل",
      "repair", "maintenance", "fixing", "installation", "ac repair", "electrician", "plumber",
      "carpenter", "painter", "construction", "contracting", "gypsum", "waterproofing", "tiles",
      "welding", "aluminum", "cleaning", "washing", "pest control", "moving", "movers", "packers",
      "packing", "shipping", "relocation", "towing", "recovery", "car polishing", "window tinting",
      "denting", "car wash", "accounting", "design", "programming", "printing", "translation",
      "tutoring", "photography", "events", "service", "services", "delivery", "clearance",
    ],
  ],
  // 7) الوظائف
  [
    DET_CATEGORIES.jobs,
    [
      "وظيفه", "وظائف", "مطلوب موظف", "مطلوب موظفه", "مطلوب عامل", "مطلوب عامله", "توظيف",
      "سيره ذاتيه", "راتب", "دوام", "شاغر", "فرصه عمل",
      "job", "jobs", "hiring", "vacancy", "recruitment", "cv", "salary", "full time", "part time",
    ],
  ],
];

// كلمات قصيرة قد تطابق ضمن كلمات أطول → نطابقها ككلمة مستقلة فقط لتفادي الإيجابيات الكاذبة.
// يرجع وزن المطابقة (0 = لا تطابق): العبارات متعددة الكلمات والجذور الطويلة إشارات أقوى.
function buildMatcher(haystack: string): (kw: string) => number {
  const tokens = new Set(haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  return (kw: string): number => {
    const k = normalizeForMatch(kw);
    if (!k) return 0;
    if (k.includes(" ")) return haystack.includes(k) ? 3 : 0; // عبارة متعددة الكلمات = إشارة قوية
    if (tokens.has(k)) return k.length >= 5 ? 2 : 1; // كلمة كاملة (أطول = أقوى)
    return k.length >= 5 && haystack.includes(k) ? 1 : 0; // جذر طويل ملتصق
  };
}

// أولوية حسم التعادل: التصنيفات المحددة تتفوّق على العامة/الأثاث عند تساوي النقاط.
const TIE_PRIORITY: DetCategory[] = [
  DET_CATEGORIES.cars,
  DET_CATEGORIES.realEstate,
  DET_CATEGORIES.equipment,
  DET_CATEGORIES.electronics,
  DET_CATEGORIES.jobs,
  DET_CATEGORIES.services,
  DET_CATEGORIES.furniture,
  DET_CATEGORIES.general,
];
const priorityOf = (c: DetCategory) => {
  const i = TIE_PRIORITY.indexOf(c);
  return i === -1 ? TIE_PRIORITY.length : i;
};

/**
 * STEP 3: يرجع التصنيف العربي بالاعتماد على القاموس الضخم.
 * يحسب نقاط كل تصنيف (بأوزان) ويختار الأعلى؛ عند التعادل يفوز الأعلى أولوية.
 * الافتراضي «بضائع عامة» — لا يقع أبداً في عام بالخطأ إن وُجدت كلمة دالة.
 */
export function classifyAd(rawText: string, explicit?: string | null): DetCategory {
  const haystack = normalizeForMatch(`${explicit ?? ""} ${rawText ?? ""}`);

  // التصنيف الصريح القادم من المصدر له الأولوية (عند تطابقه مع اسم معروف).
  if (explicit) {
    const e = normalizeForMatch(explicit);
    if (/مطاع|معدات/.test(e)) return DET_CATEGORIES.equipment;
    if (/سيار|مركب|مركبات/.test(e)) return DET_CATEGORIES.cars;
    if (/عقار/.test(e)) return DET_CATEGORIES.realEstate;
    if (/اثاث/.test(e)) return DET_CATEGORIES.furniture;
    if (/الكترون|كهرب|اجهزه/.test(e)) return DET_CATEGORIES.electronics;
    if (/خدمات|خدمه/.test(e)) return DET_CATEGORIES.services;
    if (/وظائف|وظيفه/.test(e)) return DET_CATEGORIES.jobs;
  }

  const matches = buildMatcher(haystack);
  let best: DetCategory = DET_CATEGORIES.general;
  let bestScore = 0;
  for (const [cat, words] of CAT_DICTIONARY) {
    let score = 0;
    for (const w of words) score += matches(w);
    if (score > bestScore || (score > 0 && score === bestScore && priorityOf(cat) < priorityOf(best))) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
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

// ───────────────────────── AUDIT / EXPLAIN ─────────────────────────

export interface CategoryScore {
  category: DetCategory;
  slug: FbCategorySlug;
  score: number;
  priority: number;
  matchedKeywords: string[];
}

export interface BlacklistItem {
  value: string;
  reason: string;
}

export interface PriceExplain {
  price: number;
  detected: boolean;
  free: boolean;
  reason: string;
  currencyMatches: string[];
  ignored: BlacklistItem[];
}

export interface CategoryExplain {
  winner: DetCategory;
  winnerSlug: FbCategorySlug;
  winnerScore: number;
  explicitOverride: string | null;
  tieBreak: boolean;
  runnerUp: { category: DetCategory; score: number } | null;
  scores: CategoryScore[];
}

export interface IngestExplain {
  result: EngineResult;
  category: CategoryExplain;
  price: PriceExplain;
  normalizedText: string;
}

/**
 * سجل تدقيق شفاف: يشرح لماذا صُنِّف الإعلان (نقاط كل تصنيف + الكلمات المطابِقة +
 * حسم التعادل) ولماذا اعتُبر السعر صفراً/مجانياً أو كيف استُنتج رقمه (اقتران بعملة
 * + الأرقام المستبعدة كهاتف/موديل/مواصفات).
 * دالة نقية آمنة على العميل والخادم — تعتمد على نفس منطق runIngestEngine بالضبط.
 */
export function explainIngest(rawText: string, explicitCategory?: string | null): IngestExplain {
  const text = rawText ?? "";
  const haystack = normalizeForMatch(`${explicitCategory ?? ""} ${text}`);

  // ── تفصيل نقاط التصنيف ──
  const scores: CategoryScore[] = [];
  const matcher = buildMatcher(haystack);
  for (const [cat, words] of CAT_DICTIONARY) {
    let score = 0;
    const matchedKeywords: string[] = [];
    for (const w of words) {
      const wt = matcher(w);
      if (wt > 0) {
        score += wt;
        matchedKeywords.push(w);
      }
    }
    scores.push({
      category: cat,
      slug: categoryToSlug(cat),
      score,
      priority: priorityOf(cat),
      matchedKeywords,
    });
  }

  // نفس منطق classifyAd للحصول على الفائز الفعلي (يشمل التجاوز الصريح).
  const winner = classifyAd(text, explicitCategory);
  const winnerScoreEntry = scores.find((s) => s.category === winner);
  const winnerScore = winnerScoreEntry?.score ?? 0;

  // هل حُسم عبر الأولوية (تعادل نقاط) أم عبر تجاوز صريح؟
  let explicitOverride: string | null = null;
  if (explicitCategory) {
    const e = normalizeForMatch(explicitCategory);
    if (/مطاع|معدات|سيار|مركب|مركبات|عقار|اثاث|الكترون|كهرب|اجهزه|خدمات|خدمه|وظائف|وظيفه/.test(e)) {
      explicitOverride = explicitCategory;
    }
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score || a.priority - b.priority);
  const topScore = sorted[0]?.score ?? 0;
  const tiedAtTop = sorted.filter((s) => s.score === topScore && topScore > 0);
  const tieBreak = !explicitOverride && tiedAtTop.length > 1;
  const runnerUp =
    sorted.length > 1 && sorted[1].score > 0
      ? { category: sorted[1].category, score: sorted[1].score }
      : null;

  // ── تفصيل السعر ──
  const isCar = winner === DET_CATEGORIES.cars;
  const iso = isolateNumbers(text, isCar);
  const priceRes = extractStrictPrice(text, iso.blacklist);
  const normText = normDigits(text);

  const ignored: BlacklistItem[] = [];
  const seen = new Set<string>();
  const addIgnored = (value: string, reason: string) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    ignored.push({ value, reason });
  };

  PHONE_RE.lastIndex = 0;
  let pm: RegExpExecArray | null;
  while ((pm = PHONE_RE.exec(normText)) !== null) {
    const clean = pm[1].replace(/[\s-]/g, "");
    if (clean.length === 8) addIgnored(clean, "رقم هاتف (8 خانات)");
  }
  LONG_DIGIT_RE.lastIndex = 0;
  let lm: RegExpExecArray | null;
  while ((lm = LONG_DIGIT_RE.exec(normText)) !== null) {
    addIgnored(lm[0], "تسلسل رقمي طويل (≥7 خانات) — يُعامل كرقم تواصل");
  }
  SPEC_NUM_UNIT_RE.lastIndex = 0;
  let sm: RegExpExecArray | null;
  while ((sm = SPEC_NUM_UNIT_RE.exec(normText)) !== null) {
    addIgnored(sm[1], `رقم مواصفات ملاصق للوحدة "${sm[2]}"`);
  }
  MODEL_YEAR_RE.lastIndex = 0;
  let mym: RegExpExecArray | null;
  while ((mym = MODEL_YEAR_RE.exec(normText)) !== null) {
    if (mym[2]) addIgnored(mym[2], `سنة موديل بعد "${mym[1]}"`);
  }
  if (isCar) {
    YEAR_RE.lastIndex = 0;
    let ym: RegExpExecArray | null;
    while ((ym = YEAR_RE.exec(normText)) !== null) {
      addIgnored(ym[1], "سنة صنع (سياق سيارة)");
    }
    const kmA = normText.match(KM_AFTER_RE);
    const kmB = normText.match(KM_BEFORE_RE);
    const kmRaw = kmA?.[1] ?? kmB?.[2];
    if (kmRaw) addIgnored(kmRaw.replace(/,/g, ""), "ممشى/عداد السيارة");
  }

  // مطابقات العملة/كلمات السعر التي أدّت لالتقاط الرقم.
  const currencyMatches: string[] = [];
  for (const re of [PRICE_AFTER, PRICE_BEFORE]) {
    re.lastIndex = 0;
    let cm: RegExpExecArray | null;
    while ((cm = re.exec(normText)) !== null) {
      const frag = cm[0].trim();
      if (frag && !currencyMatches.includes(frag)) currencyMatches.push(frag);
    }
  }

  let reason: string;
  if (priceRes.free) {
    reason = "الإعلان يحتوي كلمة تدل على المجانية (مجاناً/بلاش/free) → السعر 0.";
  } else if (priceRes.detected) {
    reason = `تم العثور على رقم مقترن بعملة/كلمة سعر: "${currencyMatches[0] ?? priceRes.price}" → السعر ${priceRes.price}.`;
  } else if (currencyMatches.length > 0) {
    reason =
      "وُجد رقم قرب كلمة سعر لكنه استُبعد (مدرج ضمن القائمة السوداء كهاتف/موديل/مواصفات أو تجاوز 50000) → بدون سعر (تواصل لمعرفة السعر).";
  } else {
    reason =
      "لا يوجد أي رقم مقترن بعملة بحرينية (bd/دينار/د.ب) أو كلمة سعر → بدون سعر (تواصل لمعرفة السعر).";
  }

  const result = runIngestEngine(text, explicitCategory);

  return {
    result,
    category: {
      winner,
      winnerSlug: categoryToSlug(winner),
      winnerScore,
      explicitOverride,
      tieBreak,
      runnerUp,
      scores: sorted,
    },
    price: {
      price: priceRes.price,
      detected: priceRes.detected,
      free: priceRes.free,
      reason,
      currencyMatches,
      ignored,
    },
    normalizedText: haystack,
  };
}
