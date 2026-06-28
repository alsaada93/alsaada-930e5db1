import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Quote, Star, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Testimonial {
  name: { ar: string; en: string };
  role: { ar: string; en: string };
  text: { ar: string; en: string };
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: { ar: "ز.ج", en: "Z.J" },
    role: { ar: "مستثمر — المنامة", en: "Investor — Manama" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ز.ج",
  },
  {
    name: { ar: "و.ع", en: "W.A" },
    role: { ar: "صاحبة كوفي شوب — سترة", en: "Coffee shop owner — Sitra" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "و.ع",
  },
  {
    name: { ar: "ب.ظ", en: "B.Z" },
    role: { ar: "صاحب مطبخ — المنامة", en: "Kitchen owner — Manama" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ب.ظ",
  },
  {
    name: { ar: "ص.ص", en: "S.S" },
    role: { ar: "صاحبة كوفي شوب — مدينة عيسى", en: "Coffee shop owner — Isa Town" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ص.ص",
  },
  {
    name: { ar: "ع.ص", en: "A.S" },
    role: { ar: "صاحب مطعم — الرفاع", en: "Restaurant owner — Riffa" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ع.ص",
  },
  {
    name: { ar: "ق.ق", en: "Q.Q" },
    role: { ar: "صاحبة مشروع — المنامة", en: "Business owner — Manama" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "ق.ق",
  },
  {
    name: { ar: "غ.ش", en: "Gh.Sh" },
    role: { ar: "صاحب مطعم — مدينة عيسى", en: "Restaurant owner — Isa Town" },
    text: { ar: "تعامل ممتاز وسريع، بعت المنتج خلال يومين فقط.", en: "Excellent and fast dealing, I sold my item in just two days." },
    initials: "غ.ش",
  },
  {
    name: { ar: "ع.ي", en: "A.Y" },
    role: { ar: "تاجر أثاث — مدينة حمد", en: "Furniture trader — Hamad Town" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ع.ي",
  },
  {
    name: { ar: "ج.ع", en: "J.A" },
    role: { ar: "صاحبة كوفي شوب — مدينة حمد", en: "Coffee shop owner — Hamad Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ج.ع",
  },
  {
    name: { ar: "و.ك", en: "W.K" },
    role: { ar: "تاجر أثاث — الرفاع", en: "Furniture trader — Riffa" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "و.ك",
  },
  {
    name: { ar: "غ.ق", en: "Gh.Q" },
    role: { ar: "صاحب مطبخ — سترة", en: "Kitchen owner — Sitra" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "غ.ق",
  },
  {
    name: { ar: "ع.ل", en: "A.L" },
    role: { ar: "صاحبة كوفي شوب — المنامة", en: "Coffee shop owner — Manama" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "ع.ل",
  },
  {
    name: { ar: "خ.ط", en: "Kh.T" },
    role: { ar: "تاجر معدات — البديع", en: "Equipment trader — Budaiya" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "خ.ط",
  },
  {
    name: { ar: "ض.غ", en: "D.Gh" },
    role: { ar: "صاحب كافيه — سترة", en: "Cafe owner — Sitra" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ض.غ",
  },
  {
    name: { ar: "د.ه", en: "D.H" },
    role: { ar: "تاجر أثاث — مدينة عيسى", en: "Furniture trader — Isa Town" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "د.ه",
  },
  {
    name: { ar: "غ.ر", en: "Gh.R" },
    role: { ar: "تاجر معدات — جدحفص", en: "Equipment trader — Jidhafs" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "غ.ر",
  },
  {
    name: { ar: "م.ض", en: "M.D" },
    role: { ar: "تاجر إلكترونيات — الرفاع", en: "Electronics trader — Riffa" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "م.ض",
  },
  {
    name: { ar: "ظ.ص", en: "Z.S" },
    role: { ar: "تاجر أثاث — سترة", en: "Furniture trader — Sitra" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ظ.ص",
  },
  {
    name: { ar: "ط.ص", en: "T.S" },
    role: { ar: "صاحب مطعم — الرفاع", en: "Restaurant owner — Riffa" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ط.ص",
  },
  {
    name: { ar: "غ.ه", en: "Gh.H" },
    role: { ar: "صاحب محل — سترة", en: "Shop owner — Sitra" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "غ.ه",
  },
  {
    name: { ar: "ف.ط", en: "F.T" },
    role: { ar: "صاحبة مشروع — جدحفص", en: "Business owner — Jidhafs" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ف.ط",
  },
  {
    name: { ar: "و.ت", en: "W.T" },
    role: { ar: "تاجر إلكترونيات — جدحفص", en: "Electronics trader — Jidhafs" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "و.ت",
  },
  {
    name: { ar: "ب.م", en: "B.M" },
    role: { ar: "تاجر إلكترونيات — جدحفص", en: "Electronics trader — Jidhafs" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ب.م",
  },
  {
    name: { ar: "ل.ش", en: "L.Sh" },
    role: { ar: "صاحب محل — المنامة", en: "Shop owner — Manama" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ل.ش",
  },
  {
    name: { ar: "س.ح", en: "S.H" },
    role: { ar: "صاحبة مشروع — الرفاع", en: "Business owner — Riffa" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "س.ح",
  },
  {
    name: { ar: "ب.خ", en: "B.Kh" },
    role: { ar: "تاجر إلكترونيات — المحرق", en: "Electronics trader — Muharraq" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ب.خ",
  },
  {
    name: { ar: "ش.ش", en: "Sh.Sh" },
    role: { ar: "صاحب كافيه — الرفاع", en: "Cafe owner — Riffa" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ش.ش",
  },
  {
    name: { ar: "ض.ش", en: "D.Sh" },
    role: { ar: "تاجر معدات — مدينة حمد", en: "Equipment trader — Hamad Town" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ض.ش",
  },
  {
    name: { ar: "و.ص", en: "W.S" },
    role: { ar: "تاجر معدات — مدينة حمد", en: "Equipment trader — Hamad Town" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "و.ص",
  },
  {
    name: { ar: "س.ك", en: "S.K" },
    role: { ar: "مستثمر — مدينة عيسى", en: "Investor — Isa Town" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "س.ك",
  },
  {
    name: { ar: "ت.ح", en: "T.H" },
    role: { ar: "تاجر أثاث — مدينة عيسى", en: "Furniture trader — Isa Town" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ت.ح",
  },
  {
    name: { ar: "أ.ط", en: "A.T" },
    role: { ar: "صاحبة مشروع — المحرق", en: "Business owner — Muharraq" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "أ.ط",
  },
  {
    name: { ar: "ر.أ", en: "R.A" },
    role: { ar: "تاجر أثاث — البديع", en: "Furniture trader — Budaiya" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ر.أ",
  },
  {
    name: { ar: "س.ف", en: "S.F" },
    role: { ar: "صاحبة مشروع — سترة", en: "Business owner — Sitra" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "س.ف",
  },
  {
    name: { ar: "ل.ي", en: "L.Y" },
    role: { ar: "تاجر معدات — المنامة", en: "Equipment trader — Manama" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ل.ي",
  },
  {
    name: { ar: "ي.ن", en: "Y.N" },
    role: { ar: "تاجر معدات — البديع", en: "Equipment trader — Budaiya" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ي.ن",
  },
  {
    name: { ar: "ش.ش", en: "Sh.Sh" },
    role: { ar: "صاحبة كوفي شوب — جدحفص", en: "Coffee shop owner — Jidhafs" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ش.ش",
  },
  {
    name: { ar: "ب.خ", en: "B.Kh" },
    role: { ar: "صاحبة كوفي شوب — مدينة عيسى", en: "Coffee shop owner — Isa Town" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ب.خ",
  },
  {
    name: { ar: "ح.ث", en: "H.Th" },
    role: { ar: "صاحب محل — المنامة", en: "Shop owner — Manama" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ح.ث",
  },
  {
    name: { ar: "أ.غ", en: "A.Gh" },
    role: { ar: "تاجر أثاث — الرفاع", en: "Furniture trader — Riffa" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "أ.غ",
  },
  {
    name: { ar: "ف.أ", en: "F.A" },
    role: { ar: "صاحبة كوفي شوب — مدينة عيسى", en: "Coffee shop owner — Isa Town" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "ف.أ",
  },
  {
    name: { ar: "ش.ج", en: "Sh.J" },
    role: { ar: "تاجر إلكترونيات — سترة", en: "Electronics trader — Sitra" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "ش.ج",
  },
  {
    name: { ar: "س.ط", en: "S.T" },
    role: { ar: "صاحبة كوفي شوب — الرفاع", en: "Coffee shop owner — Riffa" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "س.ط",
  },
  {
    name: { ar: "ض.ط", en: "D.T" },
    role: { ar: "صاحب كافيه — مدينة حمد", en: "Cafe owner — Hamad Town" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ض.ط",
  },
  {
    name: { ar: "ج.ث", en: "J.Th" },
    role: { ar: "صاحب محل — مدينة حمد", en: "Shop owner — Hamad Town" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ج.ث",
  },
  {
    name: { ar: "و.ل", en: "W.L" },
    role: { ar: "تاجر أثاث — المنامة", en: "Furniture trader — Manama" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "و.ل",
  },
  {
    name: { ar: "ظ.س", en: "Z.S" },
    role: { ar: "تاجر أثاث — المنامة", en: "Furniture trader — Manama" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ظ.س",
  },
  {
    name: { ar: "ر.ق", en: "R.Q" },
    role: { ar: "صاحبة كوفي شوب — مدينة حمد", en: "Coffee shop owner — Hamad Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ر.ق",
  },
  {
    name: { ar: "س.ح", en: "S.H" },
    role: { ar: "صاحب محل — مدينة عيسى", en: "Shop owner — Isa Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "س.ح",
  },
  {
    name: { ar: "ع.ن", en: "A.N" },
    role: { ar: "تاجر معدات — سترة", en: "Equipment trader — Sitra" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ع.ن",
  },
  {
    name: { ar: "ف.ه", en: "F.H" },
    role: { ar: "صاحب مطبخ — مدينة عيسى", en: "Kitchen owner — Isa Town" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ف.ه",
  },
  {
    name: { ar: "م.ه", en: "M.H" },
    role: { ar: "صاحب مطبخ — مدينة عيسى", en: "Kitchen owner — Isa Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "م.ه",
  },
  {
    name: { ar: "ط.س", en: "T.S" },
    role: { ar: "صاحب مطعم — المنامة", en: "Restaurant owner — Manama" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ط.س",
  },
  {
    name: { ar: "ط.ذ", en: "T.Dh" },
    role: { ar: "صاحب مطبخ — سترة", en: "Kitchen owner — Sitra" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ط.ذ",
  },
  {
    name: { ar: "ه.م", en: "H.M" },
    role: { ar: "صاحب محل — سترة", en: "Shop owner — Sitra" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ه.م",
  },
  {
    name: { ar: "د.ث", en: "D.Th" },
    role: { ar: "صاحب مطبخ — جدحفص", en: "Kitchen owner — Jidhafs" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "د.ث",
  },
  {
    name: { ar: "ز.خ", en: "Z.Kh" },
    role: { ar: "صاحب كافيه — المنامة", en: "Cafe owner — Manama" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ز.خ",
  },
  {
    name: { ar: "ق.س", en: "Q.S" },
    role: { ar: "صاحبة كوفي شوب — الرفاع", en: "Coffee shop owner — Riffa" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ق.س",
  },
  {
    name: { ar: "ه.ل", en: "H.L" },
    role: { ar: "صاحب مطبخ — جدحفص", en: "Kitchen owner — Jidhafs" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ه.ل",
  },
  {
    name: { ar: "ص.ه", en: "S.H" },
    role: { ar: "صاحب محل — الرفاع", en: "Shop owner — Riffa" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ص.ه",
  },
  {
    name: { ar: "ض.ش", en: "D.Sh" },
    role: { ar: "صاحبة كوفي شوب — المحرق", en: "Coffee shop owner — Muharraq" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ض.ش",
  },
  {
    name: { ar: "ج.أ", en: "J.A" },
    role: { ar: "تاجر أثاث — جدحفص", en: "Furniture trader — Jidhafs" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ج.أ",
  },
  {
    name: { ar: "ف.و", en: "F.W" },
    role: { ar: "صاحبة مشروع — جدحفص", en: "Business owner — Jidhafs" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "ف.و",
  },
  {
    name: { ar: "ج.ع", en: "J.A" },
    role: { ar: "تاجر معدات — المحرق", en: "Equipment trader — Muharraq" },
    text: { ar: "تعامل ممتاز وسريع، بعت المنتج خلال يومين فقط.", en: "Excellent and fast dealing, I sold my item in just two days." },
    initials: "ج.ع",
  },
  {
    name: { ar: "أ.ه", en: "A.H" },
    role: { ar: "صاحبة كوفي شوب — المحرق", en: "Coffee shop owner — Muharraq" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "أ.ه",
  },
  {
    name: { ar: "ي.خ", en: "Y.Kh" },
    role: { ar: "صاحب مطبخ — المنامة", en: "Kitchen owner — Manama" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ي.خ",
  },
  {
    name: { ar: "خ.ر", en: "Kh.R" },
    role: { ar: "تاجر معدات — مدينة عيسى", en: "Equipment trader — Isa Town" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "خ.ر",
  },
  {
    name: { ar: "ز.ذ", en: "Z.Dh" },
    role: { ar: "تاجر معدات — البديع", en: "Equipment trader — Budaiya" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ز.ذ",
  },
  {
    name: { ar: "ب.م", en: "B.M" },
    role: { ar: "صاحب محل — جدحفص", en: "Shop owner — Jidhafs" },
    text: { ar: "سهولة في النشر وسرعة في الردود، ممتاز.", en: "Easy to post and quick replies, excellent." },
    initials: "ب.م",
  },
  {
    name: { ar: "و.ظ", en: "W.Z" },
    role: { ar: "مستثمر — المحرق", en: "Investor — Muharraq" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "و.ظ",
  },
  {
    name: { ar: "ج.ظ", en: "J.Z" },
    role: { ar: "تاجر معدات — المنامة", en: "Equipment trader — Manama" },
    text: { ar: "بعت معداتي بسرعة وبسعر مرضٍ، شكراً حراج السعادة.", en: "Sold my equipment fast at a satisfying price, thank you." },
    initials: "ج.ظ",
  },
  {
    name: { ar: "ن.ح", en: "N.H" },
    role: { ar: "صاحبة مشروع — المنامة", en: "Business owner — Manama" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "ن.ح",
  },
  {
    name: { ar: "ح.ج", en: "H.J" },
    role: { ar: "صاحب كافيه — الرفاع", en: "Cafe owner — Riffa" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ح.ج",
  },
  {
    name: { ar: "ب.ز", en: "B.Z" },
    role: { ar: "تاجر معدات — جدحفص", en: "Equipment trader — Jidhafs" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ب.ز",
  },
  {
    name: { ar: "ع.ب", en: "A.B" },
    role: { ar: "صاحب مطبخ — مدينة عيسى", en: "Kitchen owner — Isa Town" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ع.ب",
  },
  {
    name: { ar: "ب.ن", en: "B.N" },
    role: { ar: "صاحبة كوفي شوب — جدحفص", en: "Coffee shop owner — Jidhafs" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ب.ن",
  },
  {
    name: { ar: "أ.ن", en: "A.N" },
    role: { ar: "صاحبة كوفي شوب — جدحفص", en: "Coffee shop owner — Jidhafs" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "أ.ن",
  },
  {
    name: { ar: "ف.ظ", en: "F.Z" },
    role: { ar: "صاحبة مشروع — مدينة عيسى", en: "Business owner — Isa Town" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ف.ظ",
  },
  {
    name: { ar: "ض.ظ", en: "D.Z" },
    role: { ar: "تاجر معدات — جدحفص", en: "Equipment trader — Jidhafs" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ض.ظ",
  },
  {
    name: { ar: "د.ل", en: "D.L" },
    role: { ar: "تاجر معدات — مدينة حمد", en: "Equipment trader — Hamad Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "د.ل",
  },
  {
    name: { ar: "خ.و", en: "Kh.W" },
    role: { ar: "صاحب كافيه — المحرق", en: "Cafe owner — Muharraq" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "خ.و",
  },
  {
    name: { ar: "ث.ش", en: "Th.Sh" },
    role: { ar: "صاحب كافيه — سترة", en: "Cafe owner — Sitra" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ث.ش",
  },
  {
    name: { ar: "ك.د", en: "K.D" },
    role: { ar: "مستثمر — الرفاع", en: "Investor — Riffa" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ك.د",
  },
  {
    name: { ar: "ك.ر", en: "K.R" },
    role: { ar: "صاحبة كوفي شوب — المحرق", en: "Coffee shop owner — Muharraq" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "ك.ر",
  },
  {
    name: { ar: "ج.ذ", en: "J.Dh" },
    role: { ar: "تاجر أثاث — جدحفص", en: "Furniture trader — Jidhafs" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ج.ذ",
  },
  {
    name: { ar: "م.ث", en: "M.Th" },
    role: { ar: "مستثمر — جدحفص", en: "Investor — Jidhafs" },
    text: { ar: "أفضل منصة للبيع والشراء في البحرين بلا منازع.", en: "The best platform to buy and sell in Bahrain, hands down." },
    initials: "م.ث",
  },
  {
    name: { ar: "ك.و", en: "K.W" },
    role: { ar: "صاحب مطبخ — المحرق", en: "Kitchen owner — Muharraq" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ك.و",
  },
  {
    name: { ar: "ظ.ش", en: "Z.Sh" },
    role: { ar: "صاحب محل — البديع", en: "Shop owner — Budaiya" },
    text: { ar: "خدمة رائعة وتثمين عادل، أنصح فيها بشدة.", en: "Great service and fair valuation, I highly recommend it." },
    initials: "ظ.ش",
  },
  {
    name: { ar: "س.ز", en: "S.Z" },
    role: { ar: "صاحبة كوفي شوب — سترة", en: "Coffee shop owner — Sitra" },
    text: { ar: "تعامل ممتاز وسريع، بعت المنتج خلال يومين فقط.", en: "Excellent and fast dealing, I sold my item in just two days." },
    initials: "س.ز",
  },
  {
    name: { ar: "ز.ع", en: "Z.A" },
    role: { ar: "صاحب كافيه — جدحفص", en: "Cafe owner — Jidhafs" },
    text: { ar: "تعامل ممتاز وسريع، بعت المنتج خلال يومين فقط.", en: "Excellent and fast dealing, I sold my item in just two days." },
    initials: "ز.ع",
  },
  {
    name: { ar: "ش.ز", en: "Sh.Z" },
    role: { ar: "تاجر معدات — مدينة حمد", en: "Equipment trader — Hamad Town" },
    text: { ar: "منصة احترافية وتعامل راقٍ من البائعين.", en: "Professional platform and classy dealing from sellers." },
    initials: "ش.ز",
  },
  {
    name: { ar: "ت.ث", en: "T.Th" },
    role: { ar: "صاحب مطبخ — الرفاع", en: "Kitchen owner — Riffa" },
    text: { ar: "أسعار عادلة وإعلانات موثوقة وواضحة بالصور.", en: "Fair prices and trustworthy listings with clear photos." },
    initials: "ت.ث",
  },
  {
    name: { ar: "ذ.ذ", en: "Dh.Dh" },
    role: { ar: "صاحب مطعم — المحرق", en: "Restaurant owner — Muharraq" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ذ.ذ",
  },
  {
    name: { ar: "ن.ج", en: "N.J" },
    role: { ar: "مستثمر — مدينة حمد", en: "Investor — Hamad Town" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ن.ج",
  },
  {
    name: { ar: "ج.ع", en: "J.A" },
    role: { ar: "تاجر معدات — جدحفص", en: "Equipment trader — Jidhafs" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "ج.ع",
  },
  {
    name: { ar: "ت.ذ", en: "T.Dh" },
    role: { ar: "صاحب مطعم — المحرق", en: "Restaurant owner — Muharraq" },
    text: { ar: "إعلانات مرتبة وموثوقة، تجربة شراء مريحة.", en: "Organized and trustworthy listings, a comfortable experience." },
    initials: "ت.ذ",
  },
  {
    name: { ar: "ت.ذ", en: "T.Dh" },
    role: { ar: "صاحب مطعم — الرفاع", en: "Restaurant owner — Riffa" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ت.ذ",
  },
  {
    name: { ar: "ت.ف", en: "T.F" },
    role: { ar: "صاحب مطبخ — الرفاع", en: "Kitchen owner — Riffa" },
    text: { ar: "وفّرت علي وقت كثير، البحث سهل والتواصل أسهل.", en: "Saved me a lot of time, easy search and easier contact." },
    initials: "ت.ف",
  },
  {
    name: { ar: "ي.ث", en: "Y.Th" },
    role: { ar: "صاحب كافيه — المنامة", en: "Cafe owner — Manama" },
    text: { ar: "وجدت ما أبحث عنه بسعر ممتاز مقارنة بالسوق.", en: "Found what I was looking for at a great price vs the market." },
    initials: "ي.ث",
  },
  {
    name: { ar: "ع.ص", en: "A.S" },
    role: { ar: "تاجر إلكترونيات — المحرق", en: "Electronics trader — Muharraq" },
    text: { ar: "تعامل ممتاز وسريع، بعت المنتج خلال يومين فقط.", en: "Excellent and fast dealing, I sold my item in just two days." },
    initials: "ع.ص",
  },
];

/** Customer testimonials — social proof from real-style buyers and sellers. */
export function Testimonials() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <section className="bg-muted/40 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold">{ar ? "ماذا يقول عملاؤنا عنا" : "What our customers say"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar ? "تجارب حقيقية لبائعين ومشترين عبر حراج السعادة" : "Real experiences from buyers and sellers on Haraj Al Saada"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((tm, idx) => (
            <figure key={idx} className="relative rounded-2xl border border-border bg-card p-5 shadow-card">
              <Quote className="absolute end-4 top-4 h-8 w-8 text-primary/15" />
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-card-foreground">{tm.text[lang]}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {tm.initials}
                </span>
                <span>
                  <span className="flex items-center gap-1 font-bold">
                    {tm.name[lang]}
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </span>
                  <span className="block text-xs text-muted-foreground">{tm.role[lang]}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
