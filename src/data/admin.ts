import type { Auction } from "./marketplace";

export type ListingStatus = "pending" | "approved" | "rejected";

export interface AdminListing {
  id: string;
  title: string;
  price: number;
  category: string;
  city: string;
  seller: string;
  image: string;
  status: ListingStatus;
  createdAt: string;
}

const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=300&q=70`;

export const adminListings: AdminListing[] = [
  { id: "p1", title: "فرن بيتزا احترافي ستانلس ستيل", price: 850, category: "معدات المطاعم", city: "المنامة", seller: "أحمد الكوهجي", image: img("photo-1556910103-1c02745aae4d"), status: "pending", createdAt: "2026-05-31" },
  { id: "p2", title: "مكينة إسبرسو La Marzocco", price: 2300, category: "الكوفي شوب", city: "المحرق", seller: "خالد البحر", image: img("photo-1510972527921-ce03766a1cf1"), status: "pending", createdAt: "2026-05-31" },
  { id: "p3", title: "لابتوب MacBook Pro M2", price: 480, category: "الإلكترونيات", city: "المنامة", seller: "سارة يوسف", image: img("photo-1517336714731-489689fd1ca8"), status: "pending", createdAt: "2026-05-30" },
  { id: "p4", title: "طاولات وكراسي مطعم خشب", price: 350, category: "الأثاث", city: "عيسى", seller: "محمد علي", image: img("photo-1517248135467-4c7edcad34c4"), status: "approved", createdAt: "2026-05-29" },
  { id: "p5", title: "ماكينة آيس كريم سوفت", price: 1100, category: "الآيس كريم", city: "سترة", seller: "فاطمة حسن", image: img("photo-1497034825429-c343d7c6a68f"), status: "approved", createdAt: "2026-05-28" },
  { id: "p6", title: "جهاز نقاط بيع POS كامل", price: 290, category: "الإلكترونيات", city: "المنامة", seller: "علي راشد", image: img("photo-1556742044-3c52d6e88c62"), status: "rejected", createdAt: "2026-05-27" },
  { id: "p7", title: "عجانة مخبز صناعية 20 كجم", price: 740, category: "المخابز", city: "المحرق", seller: "يوسف عبدالله", image: img("photo-1509440159596-0249088772ff"), status: "pending", createdAt: "2026-05-31" },
];

export const adminStats = {
  visitorsToday: 3240,
  visitorsMonth: 86500,
  users: 12480,
  listings: 4742,
  auctions: 218,
  businesses: 96,
  revenue: 18420,
  commissions: 4310,
  profit: 14110,
};

export const visitorsTrend = [
  { day: "السبت", visitors: 2800, listings: 42 },
  { day: "الأحد", visitors: 3100, listings: 55 },
  { day: "الإثنين", visitors: 2950, listings: 48 },
  { day: "الثلاثاء", visitors: 3600, listings: 61 },
  { day: "الأربعاء", visitors: 3400, listings: 58 },
  { day: "الخميس", visitors: 3900, listings: 72 },
  { day: "الجمعة", visitors: 3240, listings: 49 },
];

export const revenueTrend = [
  { month: "يناير", revenue: 12000, commissions: 2800 },
  { month: "فبراير", revenue: 13500, commissions: 3100 },
  { month: "مارس", revenue: 15200, commissions: 3600 },
  { month: "أبريل", revenue: 16800, commissions: 3900 },
  { month: "مايو", revenue: 18420, commissions: 4310 },
];

export const categoryActivity = [
  { name: "معدات المطاعم", value: 1284 },
  { name: "الإلكترونيات", value: 1102 },
  { name: "الأثاث", value: 874 },
  { name: "الكوفي شوب", value: 521 },
  { name: "المخابز", value: 342 },
  { name: "أخرى", value: 619 },
];

export const adminAuctions: (Auction & { status: "active" | "ended"; commission: number })[] = [
  { id: "a1", title: "خط إنتاج مخبز متكامل", currentBid: 4200, bids: 23, endsInHours: 5, city: "الرفاع", image: img("photo-1568254183919-78a4f43a2877"), status: "active", commission: 5 },
  { id: "a2", title: "ثلاجة تحضير 4 أبواب ستانلس", currentBid: 980, bids: 14, endsInHours: 12, city: "المنامة", image: img("photo-1581622558663-b2e33377dfb2"), status: "active", commission: 5 },
  { id: "a3", title: "مجموعة مكائن كوفي شوب", currentBid: 3100, bids: 31, endsInHours: 0, city: "المحرق", image: img("photo-1442512595331-e89e73853f31"), status: "ended", commission: 7 },
];
