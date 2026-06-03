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
  brands: string[];
}

/** ماركات شائعة لكل تصنيف، مرتبة أبجدياً وتشمل الماركات العالمية والصينية */
export const sortBrands = (arr: string[]) =>
  [...new Set(arr)].sort((a, b) => (a === "أخرى" ? 1 : b === "أخرى" ? -1 : a.localeCompare(b)));

/** ماركات مرتبطة بنوع المنتج نفسه (أعلى دقة من ماركات التصنيف) */
export const brandsByItem: Record<string, string[]> = {
  // تلفزيونات وشاشات
  "تلفزيونات LED": ["Hisense", "LG", "Nikai", "Samsung", "Sony", "TCL", "Toshiba", "أخرى"],
  "تلفزيونات سمارت": ["Hisense", "LG", "Samsung", "Sony", "TCL", "Toshiba", "Xiaomi", "أخرى"],
  "شاشات منحنية": ["LG", "Samsung", "Sony", "TCL", "أخرى"],
  بروجكتر: ["BenQ", "Epson", "Sony", "Xiaomi", "أخرى"],
  // موبايلات
  "هواتف ذكية": ["Apple", "Honor", "Huawei", "Nokia", "Oppo", "Realme", "Samsung", "Vivo", "Xiaomi", "أخرى"],
  "أجهزة لوحية": ["Apple", "Huawei", "Lenovo", "Samsung", "Xiaomi", "أخرى"],
  "ساعات ذكية": ["Apple", "Garmin", "Huawei", "Samsung", "Xiaomi", "أخرى"],
  "إكسسوارات هواتف": ["Anker", "Apple", "Baseus", "Samsung", "أخرى"],
  // مكيفات وتبريد
  "مكيفات سبليت": ["Carrier", "Daikin", "Gree", "Hisense", "LG", "Midea", "Samsung", "TCL", "أخرى"],
  "مكيفات شباك": ["Carrier", "Gree", "Hisense", "Midea", "TCL", "أخرى"],
  "مكيفات مركزية": ["Carrier", "Daikin", "LG", "Trane", "York", "أخرى"],
  مراوح: ["Geepas", "Midea", "Nikai", "Panasonic", "أخرى"],
  // أجهزة منزلية
  ثلاجات: ["Bosch", "Haier", "Hisense", "LG", "Midea", "Samsung", "Toshiba", "Whirlpool", "أخرى"],
  غسالات: ["Bosch", "Haier", "LG", "Midea", "Samsung", "Toshiba", "Whirlpool", "أخرى"],
  أفران: ["Ariston", "Bosch", "Electrolux", "LG", "Samsung", "أخرى"],
  مايكروويف: ["LG", "Midea", "Panasonic", "Samsung", "Toshiba", "أخرى"],
  "مكانس كهربائية": ["Bosch", "Dyson", "LG", "Philips", "Samsung", "أخرى"],
  // كمبيوتر وألعاب
  لابتوبات: ["Acer", "Apple", "Asus", "Dell", "HP", "Lenovo", "MSI", "أخرى"],
  "أجهزة مكتبية": ["Acer", "Apple", "Asus", "Dell", "HP", "Lenovo", "أخرى"],
  "شاشات كمبيوتر": ["Acer", "AOC", "Asus", "Dell", "LG", "MSI", "Samsung", "أخرى"],
  "أجهزة ألعاب": ["Microsoft", "Nintendo", "Sony", "أخرى"],
  طابعات: ["Brother", "Canon", "Epson", "HP", "أخرى"],
  // صوتيات وكاميرات
  سماعات: ["Anker", "Apple", "Bose", "JBL", "Samsung", "Sony", "أخرى"],
  "مكبرات صوت": ["Bose", "Harman Kardon", "JBL", "Sony", "أخرى"],
  كاميرات: ["Canon", "Fujifilm", "Nikon", "Panasonic", "Sony", "أخرى"],
  "كاميرات مراقبة": ["Dahua", "Hikvision", "TP-Link", "أخرى"],
  // أثاث
  أسرّة: ["Danube Home", "Home Centre", "IKEA", "Pan Emirates", "أخرى"],
  دواليب: ["Danube Home", "Home Centre", "IKEA", "Pan Emirates", "أخرى"],
  كنب: ["Danube Home", "Home Box", "Home Centre", "IKEA", "Pan Emirates", "أخرى"],
  مكاتب: ["Home Centre", "IKEA", "Steelcase", "أخرى"],
  "كراسي مكتب": ["Herman Miller", "Home Centre", "IKEA", "Steelcase", "أخرى"],
  "طاولات طعام": ["Danube Home", "Home Centre", "IKEA", "Pan Emirates", "أخرى"],
};

export const commonBrands: Record<string, string[]> = {
  restaurant: sortBrands([
    "Berto's", "Brema", "Comenda", "Convotherm", "Dihr", "Electrolux", "Fagor",
    "Fimar", "Gelmatic", "Hobart", "Hoshizaki", "Inomak", "Kitchenaid",
    "La Marzocco", "Lainox", "Mareno", "Midea", "Nuova Simonelli", "Rational",
    "Robot Coupe", "Sanremo", "Sinmag", "Smeg", "Unox", "Welbon",
    "Winterhalter", "Zanussi", "أخرى",
  ]),
  hotels: sortBrands([
    "Ariston", "Beko", "Bosch", "Candy", "Carrier", "Daikin", "Electrolux",
    "Gree", "Haier", "Hisense", "Hitachi", "LG", "Midea", "Miele", "Panasonic",
    "Primus", "Samsung", "Siemens", "Speed Queen", "TCL", "Whirlpool", "أخرى",
  ]),
  electronics: sortBrands([
    "Acer", "Anker", "AOC", "Apple", "Asus", "Beko", "BenQ", "Black+Decker",
    "Bose", "Bosch", "Braun", "Brother", "Candy", "Canon", "Carrier", "Daikin",
    "Dell", "Dyson", "Epson", "Fujifilm", "Garmin", "Geepas", "Google", "Gree",
    "Haier", "Harman Kardon", "Hisense", "Hitachi", "Honor", "HP", "Huawei",
    "Infinix", "JBL", "Kenwood", "Lenovo", "LG", "Microsoft", "Midea",
    "Motorola", "MSI", "Nikai", "Nikon", "Nintendo", "Nokia", "Nothing", "OnePlus",
    "Oppo", "Panasonic", "Philips", "Realme", "Samsung", "Sharp", "Siemens",
    "Sony", "TCL", "Tecno", "Toshiba", "TP-Link", "Vivo", "Whirlpool",
    "Xiaomi", "ZTE", "أخرى",
  ]),
  furniture: sortBrands([
    "Ashley", "Danube Home", "Herman Miller", "Home Box", "Home Centre",
    "IKEA", "Midas", "Pan Emirates", "Pottery Barn", "Royal Furniture",
    "Steelcase", "The One", "أخرى",
  ]),
};


/** يرجّع ماركات نوع المنتج إن وُجدت، وإلا ماركات التصنيف */
export function brandsFor(categoryId: string, itemName?: string): string[] {
  if (itemName && brandsByItem[itemName]) return sortBrands(brandsByItem[itemName]);
  return commonBrands[categoryId] ?? sortBrands(["أخرى"]);
}

/** مناطق ومحافظات البحرين للبحث عند إضافة إعلان */
export const bahrainRegions: string[] = [
  "المنامة",
  "المحرق",
  "الرفاع",
  "الرفاع الشرقي",
  "الرفاع الغربي",
  "مدينة عيسى",
  "مدينة حمد",
  "سترة",
  "البديع",
  "جدحفص",
  "سار",
  "الزلاق",
  "عالي",
  "توبلي",
  "الدراز",
  "بني جمرة",
  "كرباباد",
  "السنابس",
  "النعيم",
  "القفول",
  "الجفير",
  "السيف",
  "العدلية",
  "أم الحصم",
  "الحورة",
  "القضيبية",
  "الماحوز",
  "السقية",
  "البلاد القديم",
  "أبو صيبع",
  "الدير",
  "سماهيج",
  "عراد",
  "قلالي",
  "الحد",
  "البسيتين",
  "حالة بوماهر",
  "الحجر",
  "كرزكان",
  "المالكية",
  "دمستان",
  "صدد",
  "الهملة",
  "جنوسان",
  "بوري",
  "النويدرات",
  "المعامير",
  "عسكر",
  "جو",
  "الدور",
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
  sellerId?: string;
  seller?: string;
  sellerRating?: number;
  sellerReviews?: number;
  sellerVerified?: boolean;
  sellerDeals?: number;
  phone?: string;
  userId?: string;
  description?: string;
  listingType?: "normal" | "auction" | "business";
  // حقول المزاد
  startPrice?: number;
  auctionEndsAt?: string;
  // حقول الأنشطة التجارية
  monthlyRevenue?: number;
  area?: number;
  staff?: number;
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

const restaurantEquip: SubCategory = {
  name: "معدات مطاعم",
  items: ["أفران", "شوايات", "قلايات", "طباخات", "طاولات تحضير", "ثلاجات تحضير", "مغاسل ستانلس"],
};
const cafeEquip: SubCategory = {
  name: "معدات كافيهات ومشروبات",
  items: ["مكائن قهوة", "مطاحن قهوة", "ثلاجات عرض مشروبات", "صانعات عصير", "غلايات", "بلندرات"],
};
const coolingEquip: SubCategory = {
  name: "معدات تبريد وتجميد",
  items: ["ثلاجات", "فريزرات", "ثلاجات عرض", "غرف تبريد", "مجمدات أفقية", "ثلاجات تحت الطاولة"],
};
const otherEquip: SubCategory = {
  name: "معدات أخرى",
  items: ["غسالات صحون", "أرفف ستانلس", "عربات نقل", "أدوات مطبخ", "معدات متنوعة"],
};

export const categories: Category[] = [
  {
    id: "restaurant",
    name: "مطاعم",
    nameEn: "Restaurants",
    icon: "🍽️",
    count: 0,
    description: "معدات المطاعم والكافيهات والتبريد",
    descriptionEn: "Restaurant, cafe and cooling equipment",
    sub: ["معدات مطاعم", "معدات كافيهات ومشروبات", "معدات تبريد وتجميد", "معدات أخرى"],
    groups: [restaurantEquip, cafeEquip, coolingEquip, otherEquip],
    brands: commonBrands.restaurant,
  },
  {
    id: "hotels",
    name: "فنادق",
    nameEn: "Hotels",
    icon: "🏨",
    count: 0,
    description: "أثاث ومعدات الفنادق والشقق المفروشة",
    descriptionEn: "Furniture and equipment for hotels and serviced apartments",
    sub: ["أثاث فنادق", "معدات كهربائية", "معدات تحضير", "غسيل وتنظيف"],
    groups: [
      { name: "أثاث الفنادق", items: ["غرف نوم", "أثاث استقبال", "أثاث مطاعم الفندق", "ستائر وسجاد"] },
      electricEquip,
      prepEquip,
      { name: "غسيل وتنظيف", items: ["غسالات صناعية", "مجففات", "معدات تنظيف"] },
    ],
    brands: commonBrands.hotels,
  },
  {
    id: "electronics",
    name: "إلكترونيات",
    nameEn: "Electronics",
    icon: "📱",
    count: 0,
    description: "تلفزيونات، موبايلات، مكيفات وأجهزة منزلية",
    descriptionEn: "TVs, mobiles, air conditioners and home appliances",
    sub: [
      "تلفزيونات وشاشات",
      "موبايلات وأجهزة لوحية",
      "مكيفات وتبريد",
      "أجهزة منزلية",
      "كمبيوتر وألعاب",
      "صوتيات وكاميرات",
    ],
    groups: [
      { name: "تلفزيونات وشاشات", items: ["تلفزيونات LED", "تلفزيونات سمارت", "شاشات منحنية", "بروجكتر"] },
      { name: "موبايلات وأجهزة لوحية", items: ["هواتف ذكية", "أجهزة لوحية", "ساعات ذكية", "إكسسوارات هواتف"] },
      { name: "مكيفات وتبريد", items: ["مكيفات سبليت", "مكيفات شباك", "مكيفات مركزية", "مراوح"] },
      { name: "أجهزة منزلية", items: ["ثلاجات", "غسالات", "أفران", "مايكروويف", "مكانس كهربائية"] },
      { name: "كمبيوتر وألعاب", items: ["لابتوبات", "أجهزة مكتبية", "شاشات كمبيوتر", "أجهزة ألعاب", "طابعات"] },
      { name: "صوتيات وكاميرات", items: ["سماعات", "مكبرات صوت", "كاميرات", "كاميرات مراقبة"] },
    ],
    brands: commonBrands.electronics,
  },
  {
    id: "furniture",
    name: "أثاث",
    nameEn: "Furniture",
    icon: "🛋️",
    count: 0,
    description: "غرف نوم، أثاث مكتبي وغرف معيشة وطعام",
    descriptionEn: "Bedrooms, office furniture, living and dining rooms",
    sub: ["غرف نوم", "غرف معيشة", "أثاث مكتبي", "غرف طعام", "أثاث خارجي"],
    groups: [
      { name: "غرف نوم", items: ["أسرّة", "دواليب", "تسريحات", "كومدينات"] },
      { name: "غرف معيشة", items: ["كنب", "طاولات قهوة", "مكتبات", "وحدات تلفاز"] },
      { name: "أثاث مكتبي", items: ["مكاتب", "كراسي مكتب", "خزائن ملفات", "طاولات اجتماعات"] },
      { name: "غرف طعام", items: ["طاولات طعام", "كراسي طعام", "بوفيهات"] },
      { name: "أثاث خارجي", items: ["جلسات خارجية", "مظلات", "كراسي حديقة"] },
    ],
    brands: commonBrands.furniture,
  },
];

const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=600&q=70`;

interface ProductSeed {
  title: string;
  sub: string;
  base: number;
  img: string;
}

const P = (title: string, sub: string, base: number, img: string): ProductSeed => ({ title, sub, base, img });

const catalogs: Record<string, ProductSeed[]> = {
  مطاعم: [
    P("عجانة مخبز صناعية 20 كجم", "معدات تحضير", 740, "photo-1509440159596-0249088772ff"),
    P("فرن مخبز دوّار 3 رفوف", "معدات كهربائية", 1650, "photo-1568254183919-78a4f43a2877"),
    P("مكينة إسبرسو احترافية مزدوجة", "معدات كهربائية", 2300, "photo-1510972527921-ce03766a1cf1"),
    P("مطحنة قهوة تجارية", "معدات تحضير", 380, "photo-1510972527921-ce03766a1cf1"),
    P("ثلاجة عرض مشروبات زجاجية", "معدات كهربائية", 620, "photo-1571175443880-49e1d25b2bc5"),
    P("فرن بيتزا احترافي ستانلس ستيل", "معدات كهربائية", 850, "photo-1556910103-1c02745aae4d"),
    P("فريزر صدر أفقي كبير", "معدات كهربائية", 320, "photo-1571175443880-49e1d25b2bc5"),
    P("غسالة صحون صناعية", "معدات كهربائية", 690, "photo-1581622558663-b2e33377dfb2"),
    P("فرن غاز أربع عيون مع شواية", "معدات غاز", 470, "photo-1556910103-1c02745aae4d"),
    P("شواية غاز فحمية تجارية", "معدات غاز", 360, "photo-1556910103-1c02745aae4d"),
    P("قلاية غاز مزدوجة الأحواض", "معدات غاز", 290, "photo-1556910103-1c02745aae4d"),
    P("طاولة تحضير مبردة ستانلس", "معدات تحضير", 580, "photo-1581622558663-b2e33377dfb2"),
    P("فرّامة لحم كهربائية", "معدات تحضير", 230, "photo-1581622558663-b2e33377dfb2"),
    P("ميزان رقمي تجاري دقيق", "معدات تحضير", 75, "photo-1581622558663-b2e33377dfb2"),
    P("طاولة تجهيز ستانلس ستيل", "طاولات ومغاسل", 160, "photo-1517248135467-4c7edcad34c4"),
    P("مغسلة ستانلس مزدوجة الحوض", "طاولات ومغاسل", 195, "photo-1517248135467-4c7edcad34c4"),
    P("رف تخزين ستانلس 4 طبقات", "طاولات ومغاسل", 110, "photo-1517248135467-4c7edcad34c4"),
  ],
  فنادق: [
    P("سرير فندقي مزدوج بمرتبة فاخرة", "أثاث الفنادق", 240, "photo-1582719478250-c89cae4dc85b"),
    P("كنبة استقبال جلد للوبي", "أثاث الفنادق", 380, "photo-1631049307264-da0ec9d70304"),
    P("طقم كراسي لوبي عصري", "أثاث الفنادق", 320, "photo-1540518614846-7eded433c457"),
    P("خزانة ملابس غرفة فندقية", "أثاث الفنادق", 210, "photo-1611892440504-42a792e24d32"),
    P("ثلاجة ميني بار للغرف", "معدات كهربائية", 85, "photo-1571175443880-49e1d25b2bc5"),
    P("مكيف سبليت غرفة فندقية", "معدات كهربائية", 180, "photo-1581622558663-b2e33377dfb2"),
    P("عربة تقديم طعام للغرف", "معدات تحضير", 140, "photo-1517248135467-4c7edcad34c4"),
    P("بوفيه حافظ حرارة للأطعمة", "معدات تحضير", 420, "photo-1581622558663-b2e33377dfb2"),
    P("غسالة ملابس صناعية كبيرة", "غسيل وتنظيف", 780, "photo-1581622558663-b2e33377dfb2"),
    P("مجفف ملابس صناعي", "غسيل وتنظيف", 650, "photo-1581622558663-b2e33377dfb2"),
    P("مكوى مسطح بخاري للبياضات", "غسيل وتنظيف", 540, "photo-1581622558663-b2e33377dfb2"),
  ],
  إلكترونيات: [
    P("تلفزيون سمارت 55 بوصة 4K", "تلفزيونات وشاشات", 180, "photo-1593359677879-a4bb92f829d1"),
    P("تلفزيون LED 43 بوصة", "تلفزيونات وشاشات", 95, "photo-1593359677879-a4bb92f829d1"),
    P("شاشة منحنية 65 بوصة", "تلفزيونات وشاشات", 320, "photo-1461151304267-38535e780c79"),
    P("بروجكتر منزلي Full HD", "تلفزيونات وشاشات", 110, "photo-1478720568477-152d9b164e26"),
    P("آيفون 14 برو 256 جيجا", "موبايلات وأجهزة لوحية", 320, "photo-1511707171634-5f897ff02aa9"),
    P("سامسونج جالكسي S23", "موبايلات وأجهزة لوحية", 220, "photo-1610945265064-0e34e5519bbf"),
    P("آيباد الجيل العاشر", "موبايلات وأجهزة لوحية", 180, "photo-1544244015-0df4b3ffc6b0"),
    P("ساعة آبل ووتش SE", "موبايلات وأجهزة لوحية", 90, "photo-1546868871-7041f2a55e12"),
    P("مكيف سبليت 1.5 طن انفرتر", "مكيفات وتبريد", 150, "photo-1631545806609-cb1a7c0a3e90"),
    P("مكيف شباك 2 طن", "مكيفات وتبريد", 120, "photo-1631545806609-cb1a7c0a3e90"),
    P("مروحة عمودية ستاند", "مكيفات وتبريد", 25, "photo-1565374395542-0ce18882c857"),
    P("ثلاجة بابين نوفروست", "أجهزة منزلية", 180, "photo-1571175443880-49e1d25b2bc5"),
    P("غسالة أوتوماتيك 8 كجم", "أجهزة منزلية", 130, "photo-1626806787461-102c1bfaaea1"),
    P("مايكروويف 30 لتر", "أجهزة منزلية", 45, "photo-1574269909862-7e1d70bb8078"),
    P("مكنسة كهربائية لاسلكية", "أجهزة منزلية", 60, "photo-1558317374-067fb5f30001"),
    P("لابتوب ماك بوك برو M2", "كمبيوتر وألعاب", 480, "photo-1517336714731-489689fd1ca8"),
    P("لابتوب ديل XPS 13", "كمبيوتر وألعاب", 280, "photo-1593642632823-8f785ba67e45"),
    P("شاشة كمبيوتر 27 بوصة 4K", "كمبيوتر وألعاب", 130, "photo-1527443224154-c4a3942d3acf"),
    P("بلايستيشن 5 مع يدين", "كمبيوتر وألعاب", 200, "photo-1606813907291-d86efa9b94db"),
    P("طابعة ليزر متعددة الوظائف", "كمبيوتر وألعاب", 95, "photo-1612815154858-60aa4c59eaa6"),
    P("سماعة سوني لاسلكية", "صوتيات وكاميرات", 70, "photo-1505740420928-5e560c06d30e"),
    P("مكبر صوت JBL محمول", "صوتيات وكاميرات", 45, "photo-1608043152269-423dbba4e7e1"),
    P("كاميرا كانون احترافية", "صوتيات وكاميرات", 350, "photo-1502920917128-1aa500764cbd"),
    P("كاميرا مراقبة طقم 8 قنوات", "صوتيات وكاميرات", 160, "photo-1557324232-b8917d3c3dcb"),
  ],
  أثاث: [
    P("سرير كينج خشب مع تسريحة", "غرف نوم", 260, "photo-1505693416388-ac5ce068fe85"),
    P("دولاب ملابس 4 أبواب", "غرف نوم", 190, "photo-1505693416388-ac5ce068fe85"),
    P("تسريحة مع مرآة LED", "غرف نوم", 110, "photo-1522771739844-6a9f6d5f14af"),
    P("كومدينة جانبية خشبية", "غرف نوم", 35, "photo-1611892440504-42a792e24d32"),
    P("كنبة زاوية مودرن 5 مقاعد", "غرف معيشة", 280, "photo-1555041469-a586c61ea9bc"),
    P("طاولة قهوة رخامية", "غرف معيشة", 85, "photo-1567016432779-094069958ea5"),
    P("مكتبة كتب خشبية كبيرة", "غرف معيشة", 120, "photo-1594620302200-9a762244a156"),
    P("وحدة تلفاز عصرية", "غرف معيشة", 95, "photo-1593359677879-a4bb92f829d1"),
    P("مكتب عمل خشبي كبير", "أثاث مكتبي", 110, "photo-1518455027359-f3f8164ba6bd"),
    P("كرسي مكتب طبي دوّار", "أثاث مكتبي", 65, "photo-1580480055273-228ff5388ef8"),
    P("خزانة ملفات معدنية", "أثاث مكتبي", 80, "photo-1505873242700-f289a29e1e0f"),
    P("طاولة اجتماعات 8 أشخاص", "أثاث مكتبي", 240, "photo-1517248135467-4c7edcad34c4"),
    P("طاولة طعام مع 6 كراسي", "غرف طعام", 220, "photo-1617806118233-18e1de247200"),
    P("بوفيه طعام خشبي", "غرف طعام", 160, "photo-1567016432779-094069958ea5"),
    P("جلسة خارجية روطان 7 قطع", "أثاث خارجي", 240, "photo-1600210492493-0946911123ea"),
    P("مظلة حديقة كبيرة", "أثاث خارجي", 65, "photo-1600585154340-be6161a56a0c"),
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
    if (!catalog.length) return;
    const rnd = mulberry32(1000 + ci * 97);
    const prefix = cat.id[0];
    for (let i = 0; i < 100; i++) {
      const product = catalog[i % catalog.length];
      const desc = descriptors[Math.floor(rnd() * descriptors.length)];
      const condition: Listing["condition"] = rnd() > 0.7 ? "جديد" : "مستعمل";
      const jitter = 0.7 + rnd() * 0.6;
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

/** بيانات مرجعية لاقتراح السعر فقط (لا تُعرض كإعلانات) */
export const listings: Listing[] = generateListings();

// عدّاد الإعلانات يعتمد على الإعلانات الحقيقية ويُحدّث من قاعدة البيانات لاحقاً
categories.forEach((c) => {
  c.count = 0;
});

export const auctions: Auction[] = [
  {
    id: "a1",
    title: "خط إنتاج مخبز متكامل",
    currentBid: 4200,
    bids: 23,
    endsInHours: 5,
    city: "الرفاع",
    image: img("photo-1568254183919-78a4f43a2877"),
  },
  {
    id: "a2",
    title: "ثلاجة تحضير 4 أبواب ستانلس",
    currentBid: 980,
    bids: 14,
    endsInHours: 12,
    city: "المنامة",
    image: img("photo-1581622558663-b2e33377dfb2"),
  },
  {
    id: "a3",
    title: "مجموعة مكائن كوفي شوب كاملة",
    currentBid: 3100,
    bids: 31,
    endsInHours: 2,
    city: "المحرق",
    image: img("photo-1442512595331-e89e73853f31"),
  },
];

export const businesses: Business[] = [
  {
    id: "b1",
    title: "كوفي شوب كامل في موقع حيوي",
    value: 28000,
    monthlyRevenue: 6500,
    area: 85,
    staff: 4,
    city: "المنامة",
    image: img("photo-1554118811-1e0d58224f24"),
  },
  {
    id: "b2",
    title: "مطعم مأكولات سريعة جاهز للتشغيل",
    value: 45000,
    monthlyRevenue: 12000,
    area: 140,
    staff: 8,
    city: "الرفاع",
    image: img("photo-1517248135467-4c7edcad34c4"),
  },
];
