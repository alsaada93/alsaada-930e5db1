export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  description: string;
  sub: string[];
}

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

export const categories: Category[] = [
  {
    id: "restaurant",
    name: "معدات المطاعم",
    icon: "🍽️",
    count: 1284,
    description: "أفران، ثلاجات، معدات مطابخ ومكائن قهوة",
    sub: ["أفران", "ثلاجات", "فريزرات", "معدات مطابخ", "معدات غسيل", "طاولات تجهيز", "مكائن قهوة"],
  },
  {
    id: "bakery",
    name: "المخابز",
    icon: "🥖",
    count: 342,
    description: "أفران مخابز، عجانات وخطوط إنتاج",
    sub: ["أفران مخابز", "عجانات", "خطوط إنتاج", "معدات تعبئة"],
  },
  {
    id: "coffee",
    name: "الكوفي شوب",
    icon: "☕",
    count: 521,
    description: "مكائن إسبرسو، مطاحن ومعدات الباريستا",
    sub: ["مكائن إسبرسو", "مطاحن قهوة", "معدات الباريستا", "ثلاجات عرض"],
  },
  {
    id: "icecream",
    name: "الآيس كريم",
    icon: "🍦",
    count: 188,
    description: "مكائن آيس كريم وثلاجات عرض",
    sub: ["مكائن آيس كريم", "فريزرات", "ثلاجات عرض"],
  },
  {
    id: "juice",
    name: "العصائر والمشروبات",
    icon: "🥤",
    count: 233,
    description: "خلاطات، عصارات ومعدات تحضير",
    sub: ["خلاطات", "عصارات", "معدات تحضير"],
  },
  {
    id: "business",
    name: "مطاعم جاهزة للبيع",
    icon: "🏪",
    count: 96,
    description: "مطاعم وكوفي شوب ومخابز كاملة",
    sub: ["مطاعم كاملة", "كوفي شوب كامل", "مخبز كامل", "نشاط تجاري كامل"],
  },
  {
    id: "furniture",
    name: "الأثاث",
    icon: "🪑",
    count: 874,
    description: "أثاث منزلي، مكتبي وأثاث مطاعم",
    sub: ["أثاث منزلي", "أثاث مكتبي", "أثاث مطاعم", "كراسي", "طاولات", "خزائن"],
  },
  {
    id: "electronics",
    name: "الإلكترونيات",
    icon: "💻",
    count: 1102,
    description: "كمبيوترات، شاشات، أجهزة POS وكاميرات",
    sub: ["أجهزة كمبيوتر", "لابتوبات", "شاشات", "طابعات", "كاميرات مراقبة", "أجهزة شبكات", "أجهزة نقاط بيع POS"],
  },
];

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=600&q=70`;

export const listings: Listing[] = [
  { id: "l1", title: "فرن بيتزا احترافي ستانلس ستيل", price: 850, negotiable: true, condition: "مستعمل", city: "المنامة", category: "معدات المطاعم", image: img("photo-1556910103-1c02745aae4d"), featured: true, views: 1240 },
  { id: "l2", title: "مكينة إسبرسو La Marzocco", price: 2300, condition: "مستعمل", city: "المحرق", category: "الكوفي شوب", image: img("photo-1510972527921-ce03766a1cf1"), featured: true, views: 980 },
  { id: "l3", title: "ثلاجة عرض زجاجية كبيرة", price: 620, negotiable: true, condition: "مستعمل", city: "الرفاع", category: "معدات المطاعم", image: img("photo-1571175443880-49e1d25b2bc5"), views: 540 },
  { id: "l4", title: "لابتوب MacBook Pro M2", price: 480, condition: "مستعمل", city: "المنامة", category: "الإلكترونيات", image: img("photo-1517336714731-489689fd1ca8"), featured: true, views: 2100 },
  { id: "l5", title: "طاولات وكراسي مطعم خشب فاخر", price: 350, negotiable: true, condition: "مستعمل", city: "عيسى", category: "الأثاث", image: img("photo-1517248135467-4c7edcad34c4"), views: 730 },
  { id: "l6", title: "ماكينة آيس كريم سوفت 3 نكهات", price: 1100, condition: "جديد", city: "سترة", category: "الآيس كريم", image: img("photo-1497034825429-c343d7c6a68f"), views: 410 },
  { id: "l7", title: "جهاز نقاط بيع POS كامل", price: 290, condition: "جديد", city: "المنامة", category: "الإلكترونيات", image: img("photo-1556742044-3c52d6e88c62"), views: 860 },
  { id: "l8", title: "عجانة مخبز صناعية 20 كجم", price: 740, negotiable: true, condition: "مستعمل", city: "المحرق", category: "المخابز", image: img("photo-1509440159596-0249088772ff"), views: 320 },
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
