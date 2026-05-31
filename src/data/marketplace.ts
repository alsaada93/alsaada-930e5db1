export interface SubCategory {
  name: string;
  items: string[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  count: number;
  description: string;
  descriptionEn: string;
  sub: string[];
  groups: SubCategory[];
}

/** مناطق ومحافظات البحرين للبحث عند إضافة إعلان */
export const bahrainRegions: string[] = [
  "المنامة", "المحرق", "الرفاع", "الرفاع الشرقي", "الرفاع الغربي", "مدينة عيسى",
  "مدينة حمد", "سترة", "البديع", "جدحفص", "سار", "الزلاق", "عالي", "توبلي",
  "الدراز", "بني جمرة", "كرباباد", "السنابس", "النعيم", "القفول", "الجفير",
  "السيف", "العدلية", "أم الحصم", "الحورة", "القضيبية", "الماحوز", "السقية",
  "البلاد القديم", "أبو صيبع", "الدير", "سماهيج", "عراد", "قلالي", "الحد",
  "البسيتين", "حالة بوماهر", "الحجر", "كرزكان", "المالكية", "دمستان", "صدد",
  "الهملة", "جنوسان", "بوري", "النويدرات", "المعامير", "عسكر", "جو", "الدور",
];

export interface Listing {
  id: string;
  title: string;
  price: number;
  negotiable?: boolean;
  condition: "جديد" | "مستعمل";
  city: string;
  category: string;
  sub?: string;
  image: string;
  featured?: boolean;
  views: number;
  sellerId?: string; // FK to sellers table in Supabase
  seller?: string;
  sellerRating?: number;
  sellerReviews?: number;
  sellerVerified?: boolean;
  sellerDeals?: number;
  phone?: string; // E.164 without + for wa.me / tel
}

export interface Seller {
  id: string;
  name: string;
  phone: string | null;
  verified: boolean;
  rating: number;
  reviews_count: number;
  deals_count: number;
  city: string | null;
  member_since: string;
}

export interface Auction {
  id: string;
  title: string;
  currentBid: number;
  bids: number;
  endsInHours: number;
  city: string;
  image: string;
}

export interface Business {
  id: string;
  title: string;
  value: number;
  monthlyRevenue: number;
  area: number;
  staff: number;
  city: string;
  image: string;
}

const electricEquip: SubCategory = {
  name: "معدات كهربائية",
  items: ["أفران كهربائية", "ثلاجات", "فريزرات", "خلاطات", "مكائن قهوة", "غسالات صحون", "مايكروويف"],
};
const gasEquip: SubCategory = {
  name: "معدات غاز",
  items: ["أفران غاز", "شوايات غاز", "طباخات غاز", "قلايات غاز", "صفائح غاز"],
};
const prepEquip: SubCategory = {
  name: "معدات تحضير",
  items: ["طاولات تحضير", "خلاطات تحضير", "فرّامات", "عجانات", "موازين", "أدوات تقطيع"],
};
const tablesSinks: SubCategory = {
  name: "طاولات ومغاسل",
  items: ["طاولات تجهيز ستانلس", "طاولات تقديم", "مغاسل ستانلس", "أرفف", "عربات نقل"],
};

export const categories: Category[] = [
  {
    id: "restaurant",
    name: "مطاعم",
    nameEn: "Restaurants",
    icon: "🍽️",
    count: 1284,
    description: "مخابز، كوفي شوب ومعدات المطاعم الكاملة",
    descriptionEn: "Bakeries, coffee shops and full restaurant equipment",
    sub: ["مخابز", "كوفي شوب", "معدات كهربائية", "معدات غاز", "معدات تحضير", "طاولات ومغاسل"],
    groups: [
      {
        name: "نوع النشاط",
        items: ["مطعم", "مخبز", "كوفي شوب", "آيس كريم", "عصائر ومشروبات", "وجبات سريعة"],
      },
      electricEquip,
      gasEquip,
      prepEquip,
      tablesSinks,
    ],
  },
  {
    id: "hotels",
    name: "فنادق",
    nameEn: "Hotels",
    icon: "🏨",
    count: 312,
    description: "أثاث ومعدات الفنادق والشقق المفروشة",
    descriptionEn: "Furniture and equipment for hotels and serviced apartments",
    sub: ["أثاث فنادق", "معدات كهربائية", "معدات تحضير", "غسيل وتنظيف"],
    groups: [
      {
        name: "أثاث الفنادق",
        items: ["غرف نوم", "أثاث استقبال", "أثاث مطاعم الفندق", "ستائر وسجاد"],
      },
      electricEquip,
      prepEquip,
      {
        name: "غسيل وتنظيف",
        items: ["غسالات صناعية", "مجففات", "معدات تنظيف"],
      },
    ],
  },
  {
    id: "other",
    name: "غير ذلك",
    nameEn: "Other",
    icon: "📦",
    count: 1976,
    description: "إلكترونيات وأثاث وكل ما لا يندرج تحت التصنيفات الأخرى",
    descriptionEn: "Electronics, furniture and everything else",
    sub: ["إلكترونيات", "أثاث منزلي", "أثاث مكتبي", "أخرى"],
    groups: [
      {
        name: "إلكترونيات",
        items: ["أجهزة كمبيوتر", "لابتوبات", "شاشات", "طابعات", "كاميرات مراقبة", "أجهزة نقاط بيع POS"],
      },
      {
        name: "أثاث",
        items: ["أثاث منزلي", "أثاث مكتبي", "كراسي", "طاولات", "خزائن"],
      },
      {
        name: "أخرى",
        items: ["متفرقات"],
      },
    ],
  },
];

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=600&q=70`;

/* ----------------------------------------------------------------------------
 * Realistic listing generator (~100 per category)
 * Deterministic so SSR and client render identical data.
 * Prices are realistic BHD market values for used/new business equipment.
 * -------------------------------------------------------------------------- */

interface ProductSeed {
  title: string;
  sub: string;
  base: number; // base price in BHD
  img: string;
}

const P = (title: string, sub: string, base: number, img: string): ProductSeed => ({ title, sub, base, img });

const catalogs: Record<string, ProductSeed[]> = {
  مطاعم: [
    P("عجانة مخبز صناعية 20 كجم", "مخابز", 740, "photo-1509440159596-0249088772ff"),
    P("فرن مخبز دوّار 3 رفوف", "مخابز", 1650, "photo-1568254183919-78a4f43a2877"),
    P("فرّادة عجين أوتوماتيك", "مخابز", 480, "photo-1509440159596-0249088772ff"),
    P("خلاط مخبز عمودي 30 لتر", "مخابز", 520, "photo-1509440159596-0249088772ff"),
    P("مكينة إسبرسو احترافية مزدوجة", "كوفي شوب", 2300, "photo-1510972527921-ce03766a1cf1"),
    P("مطحنة قهوة تجارية", "كوفي شوب", 380, "photo-1510972527921-ce03766a1cf1"),
    P("ثلاجة عرض مشروبات زجاجية", "كوفي شوب", 620, "photo-1571175443880-49e1d25b2bc5"),
    P("بلندر مشروبات احترافي", "كوفي شوب", 145, "photo-1442512595331-e89e73853f31"),
    P("فرن بيتزا احترافي ستانلس ستيل", "معدات كهربائية", 850, "photo-1556910103-1c02745aae4d"),
    P("ثلاجة باب زجاجي عمودية", "معدات كهربائية", 540, "photo-1571175443880-49e1d25b2bc5"),
    P("فريزر صدر أفقي كبير", "معدات كهربائية", 320, "photo-1571175443880-49e1d25b2bc5"),
    P("غسالة صحون صناعية", "معدات كهربائية", 690, "photo-1581622558663-b2e33377dfb2"),
    P("مايكروويف صناعي عالي الطاقة", "معدات كهربائية", 210, "photo-1556910103-1c02745aae4d"),
    P("فرن غاز أربع عيون مع شواية", "معدات غاز", 470, "photo-1556910103-1c02745aae4d"),
    P("شواية غاز فحمية تجارية", "معدات غاز", 360, "photo-1556910103-1c02745aae4d"),
    P("قلاية غاز مزدوجة الأحواض", "معدات غاز", 290, "photo-1556910103-1c02745aae4d"),
    P("صاج غاز مسطح للتحضير", "معدات غاز", 250, "photo-1556910103-1c02745aae4d"),
    P("طاولة تحضير مبردة ستانلس", "معدات تحضير", 580, "photo-1581622558663-b2e33377dfb2"),
    P("فرّامة لحم كهربائية", "معدات تحضير", 230, "photo-1581622558663-b2e33377dfb2"),
    P("آلة تقطيع خضار متعددة", "معدات تحضير", 180, "photo-1581622558663-b2e33377dfb2"),
    P("ميزان رقمي تجاري دقيق", "معدات تحضير", 75, "photo-1581622558663-b2e33377dfb2"),
    P("طاولة تجهيز ستانلس ستيل", "طاولات ومغاسل", 160, "photo-1517248135467-4c7edcad34c4"),
    P("مغسلة ستانلس مزدوجة الحوض", "طاولات ومغاسل", 195, "photo-1517248135467-4c7edcad34c4"),
    P("رف تخزين ستانلس 4 طبقات", "طاولات ومغاسل", 110, "photo-1517248135467-4c7edcad34c4"),
    P("عربة نقل مطبخ ستانلس", "طاولات ومغاسل", 95, "photo-1517248135467-4c7edcad34c4"),
  ],
  فنادق: [
    P("سرير فندقي مزدوج بمرتبة فاخرة", "أثاث فنادق", 240, "photo-1582719478250-c89cae4dc85b"),
    P("كنبة استقبال جلد للوبي", "أثاث فنادق", 380, "photo-1631049307264-da0ec9d70304"),
    P("طقم كراسي لوبي عصري", "أثاث فنادق", 320, "photo-1540518614846-7eded433c457"),
    P("خزانة ملابس غرفة فندقية", "أثاث فنادق", 210, "photo-1611892440504-42a792e24d32"),
    P("طاولة جانبية خشبية للغرف", "أثاث فنادق", 65, "photo-1505693416388-ac5ce068fe85"),
    P("ثلاجة ميني بار للغرف", "معدات كهربائية", 85, "photo-1571175443880-49e1d25b2bc5"),
    P("سخان مياه كهربائي للغرف", "معدات كهربائية", 70, "photo-1571175443880-49e1d25b2bc5"),
    P("مكيف سبليت غرفة فندقية", "معدات كهربائية", 180, "photo-1581622558663-b2e33377dfb2"),
    P("مكواة بخار عمودية", "معدات كهربائية", 55, "photo-1581622558663-b2e33377dfb2"),
    P("عربة تقديم طعام للغرف", "معدات تحضير", 140, "photo-1517248135467-4c7edcad34c4"),
    P("بوفيه حافظ حرارة للأطعمة", "معدات تحضير", 420, "photo-1581622558663-b2e33377dfb2"),
    P("طاولة بوفيه ستانلس قابلة للطي", "معدات تحضير", 160, "photo-1517248135467-4c7edcad34c4"),
    P("غسالة ملابس صناعية كبيرة", "غسيل وتنظيف", 780, "photo-1581622558663-b2e33377dfb2"),
    P("مجفف ملابس صناعي", "غسيل وتنظيف", 650, "photo-1581622558663-b2e33377dfb2"),
    P("مكوى مسطح بخاري للبياضات", "غسيل وتنظيف", 540, "photo-1581622558663-b2e33377dfb2"),
    P("عربة تنظيف وتدبير منزلي", "غسيل وتنظيف", 120, "photo-1517248135467-4c7edcad34c4"),
  ],
  "غير ذلك": [
    P("لابتوب MacBook Pro M2", "إلكترونيات", 480, "photo-1517336714731-489689fd1ca8"),
    P("شاشة كمبيوتر 27 بوصة 4K", "إلكترونيات", 130, "photo-1518770660439-4636190af475"),
    P("طابعة ليزر متعددة الوظائف", "إلكترونيات", 95, "photo-1556742044-3c52d6e88c62"),
    P("كاميرا مراقبة طقم 8 قنوات", "إلكترونيات", 160, "photo-1518770660439-4636190af475"),
    P("جهاز نقاط بيع POS كامل", "إلكترونيات", 290, "photo-1556742044-3c52d6e88c62"),
    P("راوتر شبكة احترافي", "إلكترونيات", 45, "photo-1518770660439-4636190af475"),
    P("كنبة زاوية مودرن 5 مقاعد", "أثاث منزلي", 280, "photo-1555041469-a586c61ea9bc"),
    P("طاولة طعام خشب مع 6 كراسي", "أثاث منزلي", 220, "photo-1517248135467-4c7edcad34c4"),
    P("سرير كينج مع تسريحة", "أثاث منزلي", 260, "photo-1505693416388-ac5ce068fe85"),
    P("خزانة ملابس 4 أبواب", "أثاث منزلي", 190, "photo-1505693416388-ac5ce068fe85"),
    P("مكتب عمل خشبي كبير", "أثاث مكتبي", 110, "photo-1517336714731-489689fd1ca8"),
    P("كرسي مكتب طبي دوّار", "أثاث مكتبي", 65, "photo-1540518614846-7eded433c457"),
    P("خزانة ملفات معدنية", "أثاث مكتبي", 80, "photo-1505693416388-ac5ce068fe85"),
    P("طاولة اجتماعات 8 أشخاص", "أثاث مكتبي", 240, "photo-1517248135467-4c7edcad34c4"),
    P("مكيف سبليت 1.5 طن", "أخرى", 150, "photo-1518770660439-4636190af475"),
    P("دراجة كهربائية للتوصيل", "أخرى", 320, "photo-1518770660439-4636190af475"),
  ],
};

const descriptors = [
  "بحالة ممتازة",
  "شبه جديد",
  "استعمال خفيف",
  "موديل حديث",
  "نظيف جداً",
  "بالكرتون",
  "استيراد أوروبي",
  "اقتصادي",
  "فاخر",
  "ضمان متبقٍ",
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateListings(): Listing[] {
  const out: Listing[] = [];
  const sellerIds = ["s1", "s2", "s3", "s4", "s5", "s6"];
  categories.forEach((cat, ci) => {
    const catalog = catalogs[cat.name] ?? [];
    const rnd = mulberry32(1000 + ci * 97);
    const prefix = cat.id[0];
    for (let i = 0; i < 100; i++) {
      const product = catalog[i % catalog.length];
      const desc = descriptors[Math.floor(rnd() * descriptors.length)];
      const condition: Listing["condition"] = rnd() > 0.7 ? "جديد" : "مستعمل";
      const jitter = 0.7 + rnd() * 0.6; // ±30%
      const condFactor = condition === "جديد" ? 1.25 : 1;
      const price = Math.max(15, Math.round((product.base * jitter * condFactor) / 5) * 5);
      const city = bahrainRegions[Math.floor(rnd() * bahrainRegions.length)];
      out.push({
        id: `${prefix}${i + 1}`,
        sellerId: sellerIds[Math.floor(rnd() * sellerIds.length)],
        title: `${product.title} — ${desc}`,
        price,
        negotiable: rnd() > 0.5,
        condition,
        city,
        category: cat.name,
        sub: product.sub,
        image: img(product.img),
        featured: i < 4 || rnd() > 0.9,
        views: Math.floor(50 + rnd() * 2500),
      });
    }
  });
  return out;
}

export const listings: Listing[] = generateListings();

// Keep category counts accurate based on generated data.
categories.forEach((c) => {
  c.count = listings.filter((l) => l.category === c.name).length;
});


export const auctions: Auction[] = [
  { id: "a1", title: "خط إنتاج مخبز متكامل", currentBid: 4200, bids: 23, endsInHours: 5, city: "الرفاع", image: img("photo-1568254183919-78a4f43a2877") },
  { id: "a2", title: "ثلاجة تحضير 4 أبواب ستانلس", currentBid: 980, bids: 14, endsInHours: 12, city: "المنامة", image: img("photo-1581622558663-b2e33377dfb2") },
  { id: "a3", title: "مجموعة مكائن كوفي شوب كاملة", currentBid: 3100, bids: 31, endsInHours: 2, city: "المحرق", image: img("photo-1442512595331-e89e73853f31") },
];

export const businesses: Business[] = [
  { id: "b1", title: "كوفي شوب كامل في موقع حيوي", value: 28000, monthlyRevenue: 6500, area: 85, staff: 4, city: "المنامة", image: img("photo-1554118811-1e0d58224f24") },
  { id: "b2", title: "مطعم مأكولات سريعة جاهز للتشغيل", value: 45000, monthlyRevenue: 12000, area: 140, staff: 8, city: "الرفاع", image: img("photo-1517248135467-4c7edcad34c4") },
];
