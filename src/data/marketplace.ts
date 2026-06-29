import { bahrainCityCoords } from "./bahrainCities";
import { brandsCatalog } from "./brandsCatalog";

export interface SubCategory {
  name: string;
  items: string[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  /** Optional cover image URL shown on the category card. */
  image?: string;
  count: number;
  description: string;
  descriptionEn: string;
  groups: SubCategory[];
  brands: string[];
  sub?: string[];
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  negotiable: boolean;
  condition: "جديد" | "مستعمل";
  city: string;
  category: string;
  categoryId?: string;
  categoryId?: string;
  sub?: string;
  image: string;
  featured: boolean;
  views: number;
  phone?: string;
  userId?: string;
  description?: string;
  seller?: string;
  sellerId?: string;
  sellerRating?: number;
  sellerReviews?: number;
  sellerDeals?: number;
  sellerVerified?: boolean;
  listingType?: "normal" | "auction" | "business" | "wanted" | string;
  startPrice?: number;
  auctionEndsAt?: string;
  monthlyRevenue?: number;
  area?: number;
  staff?: number;
}

export interface Seller {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
  rating: number;
  reviews_count: number;
  deals_count: number;
  city: string;
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

export const categories: Category[] = [
  {
    "id": "restaurant",
    "name": "مطاعم وكافيهات",
    "nameEn": "Restaurants & Cafes",
    "icon": "🍽️",
    "image": "/__l5e/assets-v1/462ccc6d-15c3-4dd1-8a82-53bc986c79b0/cat-restaurant.jpg",
    "count": 0,
    "description": "كل ما يخص المطاعم والكافيهات: معدات طهي، تبريد، قهوة، تحضير، أثاث وخدمة.",
    "descriptionEn": "Everything for restaurants and cafes: cooking, cooling, coffee, prep, furniture and service equipment.",
    "brands": [
      "Adler",
      "Angelo Po",
      "Apach",
      "Ascaso",
      "Bartscher",
      "Berto's",
      "Brema",
      "Carpigiani",
      "Comenda",
      "Convotherm",
      "Dihr",
      "Electrolux",
      "Elframo",
      "Fagor",
      "Fimar",
      "Friulinox",
      "Gaggia",
      "Gelmatic",
      "GGM Gastro",
      "Hobart",
      "Hoshizaki",
      "Inomak",
      "Jura",
      "Kitchenaid",
      "La Cimbali",
      "La Marzocco",
      "Lainox",
      "Mareno",
      "Metos",
      "Midea",
      "Modular",
      "Nuova Simonelli",
      "Pavoni",
      "Rational",
      "Robot Coupe",
      "Sammic",
      "Sanremo",
      "Silko",
      "Sinmag",
      "Sirman",
      "Smeg",
      "Unox",
      "Victoria Arduino",
      "Welbon",
      "Winterhalter",
      "Zanussi",
      "أخرى"
    ],
    "groups": [
      {
        "name": "معدات طهي",
        "items": [
          "أفران",
          "أفران بيتزا",
          "شوايات",
          "قلايات",
          "طباخات",
          "مايكروويف",
          "سلمندر",
          "ستيمر بخار",
          "حمام مائي (بان ماري)",
          "شوايات فحم وغاز"
        ]
      },
      {
        "name": "معدات تحضير",
        "items": [
          "عجانات",
          "طاولات تحضير",
          "خلاطات صناعية",
          "مفرمات لحم",
          "فرّامات خضار",
          "شرائح لحم",
          "موازين مطبخ",
          "خلاطات عمودية"
        ]
      },
      {
        "name": "معدات تبريد",
        "items": [
          "ثلاجات",
          "فريزرات",
          "ثلاجات عرض",
          "غرف تبريد",
          "مجمدات أفقية",
          "ثلاجات تحت الطاولة",
          "ثلاجات تحضير",
          "ثلاجات سلطة وبيتزا"
        ]
      },
      {
        "name": "قهوة ومشروبات",
        "items": [
          "مكائن قهوة",
          "مطاحن قهوة",
          "ثلاجات عرض مشروبات",
          "صانعات عصير",
          "غلايات",
          "بلندرات",
          "صانعات ثلج",
          "موزعات مشروبات",
          "آلات شوكولاتة ساخنة"
        ]
      },
      {
        "name": "نظافة وخدمة",
        "items": [
          "غسالات صحون",
          "مغاسل ستانلس",
          "أرفف ستانلس",
          "عربات نقل",
          "أدوات مطبخ",
          "شفاطات ومداخن",
          "سخانات مياه",
          "حاويات حفظ طعام"
        ]
      },
      {
        "name": "أثاث وتجهيز المطعم",
        "items": [
          "طاولات مطاعم",
          "كراسي",
          "بوفيهات عرض",
          "كاونترات",
          "ديكور وإضاءة",
          "لوحات ومنيو",
          "سخانات طعام (تشيفنج)"
        ]
      },
      {
        "name": "كاشير ونقاط بيع",
        "items": [
          "أجهزة كاشير",
          "طابعات فواتير",
          "شاشات طلبات",
          "أدراج نقود",
          "ماسحات باركود"
        ]
      },
      {
        "name": "معدات متنوعة (أخرى)",
        "items": []
      }
    ]
  },
  {
    "id": "electronics",
    "name": "إلكترونيات وأجهزة",
    "nameEn": "Electronics & Appliances",
    "icon": "📱",
    "image": "/__l5e/assets-v1/bc86fba9-ad85-4e19-98fe-6d14159ce24f/cat-electronics.jpg",
    "count": 0,
    "description": "تلفزيونات، موبايلات، كمبيوترات، مكيفات وأجهزة منزلية.",
    "descriptionEn": "TVs, mobiles, computers, ACs and home appliances.",
    "brands": [
      "Acer",
      "Apple",
      "Asus",
      "Beko",
      "Bosch",
      "Bose",
      "Canon",
      "Daikin",
      "Dell",
      "Dyson",
      "Gree",
      "Haier",
      "Hisense",
      "Hitachi",
      "HP",
      "Huawei",
      "JBL",
      "Kenwood",
      "Lenovo",
      "LG",
      "Microsoft",
      "Midea",
      "Nikai",
      "Nintendo",
      "Nokia",
      "Oppo",
      "Panasonic",
      "Philips",
      "Samsung",
      "Sharp",
      "Siemens",
      "Sony",
      "TCL",
      "Toshiba",
      "TP-Link",
      "Whirlpool",
      "Xiaomi",
      "أخرى"
    ],
    "groups": [
      {
        "name": "تلفزيونات وشاشات",
        "items": [
          "تلفزيونات",
          "شاشات عرض",
          "بروجكتر",
          "ملحقات شاشات"
        ]
      },
      {
        "name": "موبايلات وأجهزة لوحية",
        "items": [
          "هواتف ذكية",
          "أجهزة لوحية",
          "ساعات ذكية",
          "إكسسوارات هواتف"
        ]
      },
      {
        "name": "كمبيوتر وألعاب",
        "items": [
          "لابتوبات",
          "أجهزة مكتبية",
          "شاشات كمبيوتر",
          "أجهزة ألعاب",
          "طابعات",
          "ملحقات كمبيوتر"
        ]
      },
      {
        "name": "مكيفات وتبريد",
        "items": [
          "مكيفات سبليت",
          "مكيفات شباك",
          "مكيفات مركزية",
          "مراوح"
        ]
      },
      {
        "name": "أجهزة منزلية",
        "items": [
          "ثلاجات",
          "غسالات ومجففات",
          "أفران ومايكروويف",
          "مكانس كهربائية",
          "أجهزة مطبخ صغيرة"
        ]
      },
      {
        "name": "صوتيات وكاميرات",
        "items": [
          "سماعات",
          "مكبرات صوت",
          "كاميرات",
          "كاميرات مراقبة"
        ]
      }
    ]
  },
  {
    "id": "furniture",
    "name": "المنزل والأثاث",
    "nameEn": "Home & Furniture",
    "icon": "🛋️",
    "count": 0,
    "description": "أثاث، ملابس، ألعاب أطفال، إكسسوارات، أدوات منزلية وديكور.",
    "descriptionEn": "Furniture, clothing, kids toys, accessories, household goods and decor.",
    "brands": [
      "Ashley",
      "Crate & Barrel",
      "Danube Home",
      "Home Box",
      "Home Centre",
      "Homes r Us",
      "IKEA",
      "Midas",
      "Pan Emirates",
      "PAN Home",
      "Pottery Barn",
      "Royal Furniture",
      "Safat Home",
      "The One",
      "West Elm",
      "أخرى"
    ],
    "groups": [
      {
        "name": "أثاث",
        "items": [
          "غرف نوم",
          "غرف معيشة",
          "أثاث مكتبي",
          "غرف طعام",
          "أثاث خارجي",
          "ستائر وسجاد",
          "أثاث أطفال"
        ]
      },
      {
        "name": "ملابس",
        "items": [
          "ملابس رجالية",
          "ملابس نسائية",
          "ملابس أطفال",
          "أحذية",
          "حقائب"
        ]
      },
      {
        "name": "ألعاب أطفال",
        "items": [
          "ألعاب تعليمية",
          "دراجات أطفال",
          "عربات أطفال",
          "ألعاب خارجية",
          "ألعاب إلكترونية"
        ]
      },
      {
        "name": "إكسسوارات",
        "items": [
          "ساعات",
          "نظارات",
          "مجوهرات",
          "عطور"
        ]
      },
      {
        "name": "أدوات منزلية",
        "items": [
          "أواني طبخ",
          "أدوات مائدة",
          "أدوات تنظيف",
          "تخزين وتنظيم"
        ]
      },
      {
        "name": "ديكور وإضاءة",
        "items": [
          "لوحات",
          "إضاءة",
          "نباتات صناعية",
          "تحف"
        ]
      }
    ]
  },
  {
    "id": "ea7fe359-6b22-49e8-8249-2db1d1610913",
    "name": "مركبات",
    "nameEn": "Vehicles",
    "icon": "🚗",
    "count": 0,
    "description": "سيارات، شاحنات، دراجات، قطع غيار وخدمات السيارات.",
    "descriptionEn": "Cars, trucks, bikes, spare parts and auto services.",
    "brands": [],
    "groups": [
      {
        "name": "سيارات",
        "items": []
      },
      {
        "name": "شاحنات",
        "items": []
      },
      {
        "name": "باصات",
        "items": []
      },
      {
        "name": "دراجات نارية",
        "items": []
      },
      {
        "name": "قوارب وجت سكي",
        "items": []
      },
      {
        "name": "معدات ثقيلة",
        "items": []
      },
      {
        "name": "قطع غيار",
        "items": []
      },
      {
        "name": "خدمات السيارات",
        "items": []
      }
    ]
  },
  {
    "id": "b7e8cb10-8df5-489e-829d-3ca28e71487f",
    "name": "عقارات",
    "nameEn": "Real Estate",
    "icon": "🏠",
    "count": 0,
    "description": "شقق، فلل، أراضٍ ومحلات للبيع والإيجار.",
    "descriptionEn": "Apartments, villas, land and shops for sale and rent.",
    "brands": [],
    "groups": [
      {
        "name": "للبيع",
        "items": [
          "شقق",
          "فلل",
          "أراضٍ",
          "محلات ومكاتب",
          "عمارات"
        ]
      },
      {
        "name": "للإيجار",
        "items": [
          "شقق",
          "فلل",
          "غرف",
          "محلات ومكاتب",
          "مستودعات"
        ]
      }
    ]
  },
  {
    "id": "5cbdb034-bd93-4aae-813c-5fb9987c4c1b",
    "name": "خدمات",
    "nameEn": "Services",
    "icon": "🧰",
    "count": 0,
    "description": "صيانة، تنظيف، نقل، تركيب وكل الخدمات المنزلية والتجارية.",
    "descriptionEn": "Maintenance, cleaning, moving, installation and all home & business services.",
    "brands": [],
    "groups": [
      {
        "name": "صيانة وتركيب",
        "items": [
          "صيانة مكيفات",
          "صيانة أجهزة",
          "سباكة",
          "كهرباء",
          "نجارة",
          "دهان وديكور"
        ]
      },
      {
        "name": "تنظيف",
        "items": [
          "تنظيف منازل",
          "تنظيف مطاعم",
          "تنظيف خزانات",
          "مكافحة حشرات"
        ]
      },
      {
        "name": "نقل وتوصيل",
        "items": [
          "نقل عفش",
          "توصيل طلبات",
          "شحن"
        ]
      },
      {
        "name": "خدمات تجارية",
        "items": [
          "تصميم وطباعة",
          "تسويق",
          "محاسبة",
          "استشارات مطاعم"
        ]
      },
      {
        "name": "خدمات مناسبات",
        "items": [
          "ضيافة وكوش",
          "تصوير",
          "تنظيم حفلات"
        ]
      }
    ]
  },
  {
    "id": "72eca8dc-d743-4f8f-ab67-77a5d91f94da",
    "name": "وظائف",
    "nameEn": "Jobs",
    "icon": "💼",
    "count": 0,
    "description": "وظائف شاغرة وباحثون عن عمل في مختلف المجالات.",
    "descriptionEn": "Job vacancies and job seekers across all fields.",
    "brands": [],
    "groups": [
      {
        "name": "مطلوب موظفين",
        "items": [
          "مطاعم وكافيهات",
          "مبيعات",
          "إداري",
          "فني وحرفي",
          "سائقين",
          "عمالة"
        ]
      },
      {
        "name": "باحث عن عمل",
        "items": []
      }
    ]
  },
  {
    "id": "0f9ea3d0-c9bd-4e9f-9e70-c082f4f3e2cd",
    "name": "عام وأخرى",
    "nameEn": "General & Other",
    "icon": "📦",
    "count": 0,
    "description": "إعلانات متنوعة لا تندرج تحت تصنيف محدد.",
    "descriptionEn": "Miscellaneous ads that don't fit a specific category.",
    "brands": [],
    "groups": [
      {
        "name": "متنوعة",
        "items": []
      }
    ]
  }
];

/** قائمة مناطق ومحافظات البحرين (مشتقة من إحداثيات المدن) */
export const bahrainRegions: string[] = Object.keys(bahrainCityCoords);

/** إعلانات تجريبية ثابتة — تُستخدم كقيمة افتراضية فارغة (البيانات الحقيقية من قاعدة البيانات) */
export const listings: Listing[] = [];

/** يرجع أسماء الماركات المناسبة لتصنيف/صنف معيّن */
export function brandsFor(_categoryId: string, itemName?: string): string[] {
  if (itemName) {
    const matches = brandsCatalog.filter(
      (b) => b.type.includes(itemName) || itemName.includes(b.type),
    );
    if (matches.length > 0) return matches.map((b) => b.name);
  }
  return brandsCatalog.map((b) => b.name);
}

/** يرتّب أسماء الماركات أبجدياً */
export function sortBrands(names: string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, "ar"));
}
