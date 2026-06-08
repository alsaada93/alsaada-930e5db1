/**
 * كتالوج الماركات: كل ماركة مرتبطة ببلد المنشأ، الفئة/نوع المعدة،
 * ووصف يوضّح مستوى السوق والتخصص. يُعرض الوصف تلقائياً عند اختيار الماركة.
 */
export interface BrandInfo {
  name: string;
  country: string;
  type: string;
  description: string;
}

export const brandsCatalog: BrandInfo[] = [
  {
    name: "Rational",
    country: "ألمانيا",
    type: "أفران",
    description: "الفئة الأولى (Premium) - الرقم 1 عالمياً في أفران الكومبي الذكية.",
  },
  {
    name: "Unox",
    country: "إيطاليا",
    type: "أفران",
    description: "فئة ممتازة - أفران كومبي وحرارية ذكية، واسعة الانتشار والاعتمادية.",
  },
  {
    name: "Convotherm",
    country: "ألمانيا",
    type: "أفران",
    description: "أفران كومبي ذكية متطورة جداً، وتعتبر المنافس الألماني المباشر لـ Rational.",
  },
  {
    name: "La Marzocco",
    country: "إيطاليا",
    type: "مكائن قهوة",
    description: "الأيقونة الفاخرة والأكثر طلباً عالمياً في المقاهي المختصة (Specialty Coffee).",
  },
  {
    name: "Mahlkönig",
    country: "ألمانيا",
    type: "مطاحن قهوة",
    description: "ملوك صناعة طواحين القهوة الاحترافية، دقة متناهية في الطحن.",
  },
  {
    name: "Mazzer",
    country: "إيطاليا",
    type: "مطاحن قهوة",
    description: "الطواحين الإيطالية الأكثر اعتمادية وانتشاراً في المقاهي التجارية.",
  },
  {
    name: "Ditting",
    country: "سويسرا",
    type: "مطاحن قهوة",
    description: "طواحين سويسرية فائقة الدقة للمختبرات والمحامص والمقاهي عالية الإنتاجية.",
  },
  {
    name: "Mythos (Simonelli)",
    country: "إيطاليا",
    type: "مطاحن قهوة",
    description: "المطحنة الرسمية لبطولات الباريستا العالمية، تحكم حراري ذكي.",
  },
  {
    name: "Winterhalter",
    country: "ألمانيا",
    type: "غسالات صحون",
    description: "الفئة الأفخم عالمياً في غسالات الأطباق والأكواب، كفاءة ونظافة مثالية.",
  },
  {
    name: "True Refrigeration",
    country: "أمريكا",
    type: "ثلاجات",
    description: "الفئة الأولى أمريكياً - عزل جبار، متانة استثنائية، وعمر افتراضي طويل جداً.",
  },
  {
    name: "Hobart",
    country: "أمريكا",
    type: "عجانات",
    description: "الماركة الأسطورية رقم 1 عالمياً في العجانات الصناعية وغسالات الصحون الثقيلة.",
  },
  {
    name: "Santos",
    country: "فرنسا",
    type: "صانعات عصير",
    description: "ملوك صناعة عصارات الفواكه، بلندرات العصير ومعدات البارات التجارية.",
  },
  {
    name: "Vitamix",
    country: "أمريكا",
    type: "بلندرات",
    description: "الخلاطات التجارية الأقوى والأكثر تحملاً في الكافيهات ومحلات العصائر العالمية.",
  },
  {
    name: "Wilbur Curtis",
    country: "أمريكا",
    type: "مكائن قهوة",
    description: "معدات تحضير القهوة المقطرة الأمريكية والشاي للفنادق والمقاهي الكبرى.",
  },
  {
    name: "Alfa Forni",
    country: "إيطاليا",
    type: "أفران",
    description: "أفران بيتزا احترافية إيطالية فاخرة تعمل بالحطب والغاز.",
  },
  {
    name: "Morello Forni",
    country: "إيطاليا",
    type: "أفران",
    description: "أفران بيتزا حجرية دوارة عملاقة للمطاعم ذات الإنتاجية العالية.",
  },
  {
    name: "Seewer Rondo",
    country: "سويسرا",
    type: "عجانات",
    description: "خطوط إنتاج وفرد عجين سويسرية متطورة جداً للمخابز الصناعية.",
  },
  {
    name: "Mecatherm",
    country: "فرنسا",
    type: "معدات متنوعة (اخرى)",
    description: "خطوط إنتاج خبز ومخبوزات أتوماتيكية بالكامل للمصانع الكبرى.",
  },
  {
    name: "Kaak",
    country: "هولندا",
    type: "معدات متنوعة (اخرى)",
    description: "حلول وهندسة متكاملة للمخابز الصناعية الكبرى حول العالم.",
  </td>
  {
    name: "B.PRO",
    country: "أرفف ستانلس",
    type: "طاولات تحضير",
    description: "معدات بوفيه، تقديم، وأنظمة مناولة ستانلس ستيل ألمانية فاخرة.",
  }
];

const byKey = new Map<string, BrandInfo>();
for (const b of brandsCatalog) byKey.set(b.name.toLowerCase(), b);

/**
 * يرجع معلومات الماركة بناءً على الاسم (مطابقة كاملة أو جزئية)
 */
export function brandInfo(name?: string | null): BrandInfo | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  const exact = byKey.get(key);
  if (exact) return exact;
  return brandsCatalog.find(
    (b) => b.name.toLowerCase().includes(key) || key.includes(b.name.toLowerCase())
  );
}