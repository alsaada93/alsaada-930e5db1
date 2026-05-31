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
    name: { ar: "أبو محمد", en: "Abu Mohammed" },
    role: { ar: "صاحب مطعم — المنامة", en: "Restaurant owner — Manama" },
    text: {
      ar: "بعت معدات مطبخ مطعمي كاملة خلال يومين فقط، التثمين كان عادل والتعامل ممتاز. شكراً السعادة ماركت.",
      en: "I sold my entire restaurant kitchen equipment in just two days, fair valuation and great service.",
    },
    initials: "أ.م",
  },
  {
    name: { ar: "سارة الخليفي", en: "Sara Al Khalifi" },
    role: { ar: "صاحبة كوفي شوب — الرفاع", en: "Coffee shop owner — Riffa" },
    text: {
      ar: "اشتريت ماكينة قهوة احترافية بسعر ممتاز مقارنة بالسوق، والإعلانات موثوقة وواضحة بالصور.",
      en: "Bought a professional coffee machine at a great price, the listings are trustworthy and clear.",
    },
    initials: "س.خ",
  },
  {
    name: { ar: "خالد العامر", en: "Khalid Al Amer" },
    role: { ar: "تاجر أثاث — المحرق", en: "Furniture trader — Muharraq" },
    text: {
      ar: "أفضل منصة لبيع وشراء المعدات في البحرين، البحث بالصور وفّر علي وقت كثير. أنصح فيها بشدة.",
      en: "The best platform to buy and sell equipment in Bahrain, image search saved me a lot of time.",
    },
    initials: "خ.ع",
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
          <h2 className="text-2xl font-extrabold">{ar ? "ماذا يقول عملاؤنا" : "What our customers say"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar ? "تجارب حقيقية لبائعين ومشترين عبر السعادة ماركت" : "Real experiences from buyers and sellers on Al Saada Market"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((tm) => (
            <figure key={tm.initials} className="relative rounded-2xl border border-border bg-card p-5 shadow-card">
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
