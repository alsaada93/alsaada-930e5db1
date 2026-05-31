export interface Country {
  code: string;
  flag: string;
  ar: string;
  en: string;
  popular?: boolean;
}

/** الدول المصنّعة المشهورة تظهر أولاً ثم بقية الدول أبجدياً */
const popular: Country[] = [
  { code: "BH", flag: "🇧🇭", ar: "البحرين", en: "Bahrain", popular: true },
  { code: "IT", flag: "🇮🇹", ar: "إيطاليا", en: "Italy", popular: true },
  { code: "CN", flag: "🇨🇳", ar: "الصين", en: "China", popular: true },
  { code: "JP", flag: "🇯🇵", ar: "اليابان", en: "Japan", popular: true },
  { code: "US", flag: "🇺🇸", ar: "الولايات المتحدة", en: "United States", popular: true },
  { code: "DE", flag: "🇩🇪", ar: "ألمانيا", en: "Germany", popular: true },
  { code: "KR", flag: "🇰🇷", ar: "كوريا الجنوبية", en: "South Korea", popular: true },
  { code: "TR", flag: "🇹🇷", ar: "تركيا", en: "Turkey", popular: true },
  { code: "FR", flag: "🇫🇷", ar: "فرنسا", en: "France", popular: true },
  { code: "GB", flag: "🇬🇧", ar: "المملكة المتحدة", en: "United Kingdom", popular: true },
  { code: "TW", flag: "🇹🇼", ar: "تايوان", en: "Taiwan", popular: true },
  { code: "IN", flag: "🇮🇳", ar: "الهند", en: "India", popular: true },
];

const rest: Country[] = [
  { code: "AE", flag: "🇦🇪", ar: "الإمارات", en: "United Arab Emirates" },
  { code: "SA", flag: "🇸🇦", ar: "السعودية", en: "Saudi Arabia" },
  { code: "KW", flag: "🇰🇼", ar: "الكويت", en: "Kuwait" },
  { code: "QA", flag: "🇶🇦", ar: "قطر", en: "Qatar" },
  { code: "OM", flag: "🇴🇲", ar: "عُمان", en: "Oman" },
  { code: "EG", flag: "🇪🇬", ar: "مصر", en: "Egypt" },
  { code: "JO", flag: "🇯🇴", ar: "الأردن", en: "Jordan" },
  { code: "LB", flag: "🇱🇧", ar: "لبنان", en: "Lebanon" },
  { code: "IQ", flag: "🇮🇶", ar: "العراق", en: "Iraq" },
  { code: "SY", flag: "🇸🇾", ar: "سوريا", en: "Syria" },
  { code: "YE", flag: "🇾🇪", ar: "اليمن", en: "Yemen" },
  { code: "MA", flag: "🇲🇦", ar: "المغرب", en: "Morocco" },
  { code: "TN", flag: "🇹🇳", ar: "تونس", en: "Tunisia" },
  { code: "DZ", flag: "🇩🇿", ar: "الجزائر", en: "Algeria" },
  { code: "LY", flag: "🇱🇾", ar: "ليبيا", en: "Libya" },
  { code: "SD", flag: "🇸🇩", ar: "السودان", en: "Sudan" },
  { code: "ES", flag: "🇪🇸", ar: "إسبانيا", en: "Spain" },
  { code: "PT", flag: "🇵🇹", ar: "البرتغال", en: "Portugal" },
  { code: "NL", flag: "🇳🇱", ar: "هولندا", en: "Netherlands" },
  { code: "BE", flag: "🇧🇪", ar: "بلجيكا", en: "Belgium" },
  { code: "CH", flag: "🇨🇭", ar: "سويسرا", en: "Switzerland" },
  { code: "AT", flag: "🇦🇹", ar: "النمسا", en: "Austria" },
  { code: "SE", flag: "🇸🇪", ar: "السويد", en: "Sweden" },
  { code: "NO", flag: "🇳🇴", ar: "النرويج", en: "Norway" },
  { code: "DK", flag: "🇩🇰", ar: "الدنمارك", en: "Denmark" },
  { code: "FI", flag: "🇫🇮", ar: "فنلندا", en: "Finland" },
  { code: "PL", flag: "🇵🇱", ar: "بولندا", en: "Poland" },
  { code: "CZ", flag: "🇨🇿", ar: "التشيك", en: "Czechia" },
  { code: "RU", flag: "🇷🇺", ar: "روسيا", en: "Russia" },
  { code: "UA", flag: "🇺🇦", ar: "أوكرانيا", en: "Ukraine" },
  { code: "GR", flag: "🇬🇷", ar: "اليونان", en: "Greece" },
  { code: "IE", flag: "🇮🇪", ar: "أيرلندا", en: "Ireland" },
  { code: "CA", flag: "🇨🇦", ar: "كندا", en: "Canada" },
  { code: "MX", flag: "🇲🇽", ar: "المكسيك", en: "Mexico" },
  { code: "BR", flag: "🇧🇷", ar: "البرازيل", en: "Brazil" },
  { code: "AR", flag: "🇦🇷", ar: "الأرجنتين", en: "Argentina" },
  { code: "AU", flag: "🇦🇺", ar: "أستراليا", en: "Australia" },
  { code: "NZ", flag: "🇳🇿", ar: "نيوزيلندا", en: "New Zealand" },
  { code: "ID", flag: "🇮🇩", ar: "إندونيسيا", en: "Indonesia" },
  { code: "MY", flag: "🇲🇾", ar: "ماليزيا", en: "Malaysia" },
  { code: "SG", flag: "🇸🇬", ar: "سنغافورة", en: "Singapore" },
  { code: "TH", flag: "🇹🇭", ar: "تايلاند", en: "Thailand" },
  { code: "VN", flag: "🇻🇳", ar: "فيتنام", en: "Vietnam" },
  { code: "PH", flag: "🇵🇭", ar: "الفلبين", en: "Philippines" },
  { code: "PK", flag: "🇵🇰", ar: "باكستان", en: "Pakistan" },
  { code: "BD", flag: "🇧🇩", ar: "بنغلاديش", en: "Bangladesh" },
  { code: "IR", flag: "🇮🇷", ar: "إيران", en: "Iran" },
  { code: "ZA", flag: "🇿🇦", ar: "جنوب أفريقيا", en: "South Africa" },
];

export const countries: Country[] = [
  ...popular,
  ...rest.sort((a, b) => a.en.localeCompare(b.en)),
];

export function countryByName(name?: string | null): Country | undefined {
  if (!name) return undefined;
  return countries.find((c) => c.ar === name || c.en === name || c.code === name);
}
