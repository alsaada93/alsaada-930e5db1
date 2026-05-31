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

export const listings: Listing[] = [
  { id: "l1", sellerId: "s1", title: "فرن بيتزا احترافي ستانلس ستيل", price: 850, negotiable: true, condition: "مستعمل", city: "المنامة", category: "معدات المطاعم", image: img("photo-1556910103-1c02745aae4d"), featured: true, views: 1240 },
  { id: "l2", sellerId: "s2", title: "مكينة إسبرسو La Marzocco", price: 2300, condition: "مستعمل", city: "المحرق", category: "الكوفي شوب", image: img("photo-1510972527921-ce03766a1cf1"), featured: true, views: 980 },
  { id: "l3", sellerId: "s3", title: "ثلاجة عرض زجاجية كبيرة", price: 620, negotiable: true, condition: "مستعمل", city: "الرفاع", category: "معدات المطاعم", image: img("photo-1571175443880-49e1d25b2bc5"), views: 540 },
  { id: "l4", sellerId: "s4", title: "لابتوب MacBook Pro M2", price: 480, condition: "مستعمل", city: "المنامة", category: "الإلكترونيات", image: img("photo-1517336714731-489689fd1ca8"), featured: true, views: 2100 },
  { id: "l5", sellerId: "s5", title: "طاولات وكراسي مطعم خشب فاخر", price: 350, negotiable: true, condition: "مستعمل", city: "عيسى", category: "الأثاث", image: img("photo-1517248135467-4c7edcad34c4"), views: 730 },
  { id: "l6", sellerId: "s6", title: "ماكينة آيس كريم سوفت 3 نكهات", price: 1100, condition: "جديد", city: "سترة", category: "الآيس كريم", image: img("photo-1497034825429-c343d7c6a68f"), views: 410 },
  { id: "l7", sellerId: "s4", title: "جهاز نقاط بيع POS كامل", price: 290, condition: "جديد", city: "المنامة", category: "الإلكترونيات", image: img("photo-1556742044-3c52d6e88c62"), views: 860 },
  { id: "l8", sellerId: "s2", title: "عجانة مخبز صناعية 20 كجم", price: 740, negotiable: true, condition: "مستعمل", city: "المحرق", category: "المخابز", image: img("photo-1509440159596-0249088772ff"), views: 320 },

];

export const auctions: Auction[] = [
  { id: "a1", title: "خط إنتاج مخبز متكامل", currentBid: 4200, bids: 23, endsInHours: 5, city: "الرفاع", image: img("photo-1568254183919-78a4f43a2877") },
  { id: "a2", title: "ثلاجة تحضير 4 أبواب ستانلس", currentBid: 980, bids: 14, endsInHours: 12, city: "المنامة", image: img("photo-1581622558663-b2e33377dfb2") },
  { id: "a3", title: "مجموعة مكائن كوفي شوب كاملة", currentBid: 3100, bids: 31, endsInHours: 2, city: "المحرق", image: img("photo-1442512595331-e89e73853f31") },
];

export const businesses: Business[] = [
  { id: "b1", title: "كوفي شوب كامل في موقع حيوي", value: 28000, monthlyRevenue: 6500, area: 85, staff: 4, city: "المنامة", image: img("photo-1554118811-1e0d58224f24") },
  { id: "b2", title: "مطعم مأكولات سريعة جاهز للتشغيل", value: 45000, monthlyRevenue: 12000, area: 140, staff: 8, city: "الرفاع", image: img("photo-1517248135467-4c7edcad34c4") },
];
