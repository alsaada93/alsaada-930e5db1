export interface SubCategory {
  name: string;
  items: string[];
}

export interface Category {
  id: string;
  name: string;
  groups: SubCategory[];
  brands: string[];
}

// تعريف المجموعات بناءً على الأصناف التي طلبتها
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
    groups: restaurantGroups,
    brands: [
      /* أضف هنا الماركات الخاصة بالمطاعم */
    ],
  },
];
