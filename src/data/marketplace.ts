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

// تعريف المجموعات بناءً على الأصناف
const restaurantGroups: SubCategory[] = [
  { name: "معدات طهي", items: ["أفران", "شوايات", "قلايات", "طباخات", "مايكروويف"] },
  { name: "معدات تحضير", items: ["عجانات", "طاولات تحضير", "أدوات مطبخ"] },
  {
    name: "معدات تبريد",
    items: ["ثلاجات", "فريزرات", "ثلاجات عرض", "غرف تبريد", "مجمدات أفقية", "ثلاجات تحت الطاولة"],
  },
  {
    name: "معدات مشروبات",
    items: ["مكائن قهوة", "مطاحن قهوة", "ثلاجات عرض مشروبات", "صانعات عصير", "غلايات", "بلندرات"],
  },
  {
    name: "معدات نظافة وخدمة",
    items: ["غسالات صحون", "مغاسل ستانلس", "أرفف ستانلس", "عربات نقل", "معدات متنوعة (اخرى)"],
  },
];

export const categories: Category[] = [
  {
    id: "restaurant",
    name: "مطاعم",
    nameEn: "Restaurants",
    icon: "🍽️",
    count: 0,
    description: "معدات وأجهزة المطاعم والمقاهي الجديدة والمستعملة.",
    descriptionEn: "New and used restaurant and cafe equipment.",
    groups: restaurantGroups,
    brands: [],
  },
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
