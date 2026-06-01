import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Rocket, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "الباقات والأسعار | حراج السعادة Haraj Al Saada" },
      {
        name: "description",
        content: "اختر باقة الاشتراك المناسبة لعرض إعلاناتك على حراج السعادة — مجاني، احترافي وتاجر.",
      },
      { property: "og:title", content: "الباقات والأسعار | حراج السعادة Haraj Al Saada" },
      { property: "og:description", content: "باقات اشتراك مرنة لبيع معدات المطاعم والأثاث والإلكترونيات." },
      { property: "og:url", content: "https://alsaada-market.lovable.app/packages" },
    ],
    links: [{ rel: "canonical", href: "https://alsaada-market.lovable.app/packages" }],
  }),
  component: PackagesPage,
});

interface Plan {
  id: string;
  icon: typeof Star;
  name: { ar: string; en: string };
  price: number;
  period: { ar: string; en: string };
  highlight?: boolean;
  features: { ar: string; en: string }[];
}

const plans: Plan[] = [
  {
    id: "free",
    icon: Star,
    name: { ar: "مجاني", en: "Free" },
    price: 0,
    period: { ar: "شهرياً", en: "/month" },
    features: [
      { ar: "حتى 3 إعلانات نشطة", en: "Up to 3 active listings" },
      { ar: "حتى 30 صورة لكل إعلان", en: "Up to 30 images per listing" },
      { ar: "تواصل واتساب واتصال مباشر", en: "WhatsApp & direct call" },
      { ar: "تسعير ذكي بالذكاء الاصطناعي", en: "AI smart pricing" },
    ],
  },
  {
    id: "pro",
    icon: Rocket,
    name: { ar: "احترافي", en: "Pro" },
    price: 9,
    period: { ar: "شهرياً", en: "/month" },
    highlight: true,
    features: [
      { ar: "حتى 25 إعلان نشط", en: "Up to 25 active listings" },
      { ar: "تمييز 3 إعلانات شهرياً", en: "Feature 3 listings monthly" },
      { ar: "ظهور أعلى في نتائج البحث", en: "Higher search ranking" },
      { ar: "شارة بائع موثوق", en: "Verified seller badge" },
      { ar: "إحصائيات مشاهدات الإعلان", en: "Listing view analytics" },
    ],
  },
  {
    id: "merchant",
    icon: Crown,
    name: { ar: "تاجر", en: "Merchant" },
    price: 29,
    period: { ar: "شهرياً", en: "/month" },
    features: [
      { ar: "إعلانات غير محدودة", en: "Unlimited listings" },
      { ar: "تمييز 15 إعلان شهرياً", en: "Feature 15 listings monthly" },
      { ar: "متجر باسم نشاطك التجاري", en: "Branded business storefront" },
      { ar: "أولوية الدعم والمزادات", en: "Priority support & auctions" },
      { ar: "إدارة فريق متعدد المستخدمين", en: "Multi-user team management" },
    ],
  },
];

function PackagesPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{ar ? "الباقات والأسعار" : "Plans & pricing"}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {ar
              ? "اختر الباقة التي تناسب نشاطك. بدّل أو ألغِ في أي وقت بدون التزام."
              : "Choose the plan that fits your business. Switch or cancel anytime, no commitment."}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 text-start shadow-card transition-all hover:-translate-y-1 ${
                  p.highlight ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-bold text-primary-foreground shadow-glow">
                    {ar ? "الأكثر شيوعاً" : "Most popular"}
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <p.icon className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-extrabold">{p.name[lang]}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-primary">
                    {p.price === 0 ? (ar ? "مجاني" : "Free") : `${p.price} ${ar ? "د.ب" : "BHD"}`}
                  </span>
                  {p.price > 0 && <span className="text-sm text-muted-foreground">{p.period[lang]}</span>}
                </div>

                <ul className="mt-5 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f.en} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f[lang]}</span>
                    </li>
                  ))}
                </ul>

                {p.price === 0 ? (
                  <Link
                    to="/add-listing"
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02] hover:bg-muted"
                  >
                    {ar ? "ابدأ مجاناً" : "Start free"}
                  </Link>
                ) : (
                  <a
                    href={`https://wa.me/97336818153?text=${encodeURIComponent(
                      ar
                        ? `مرحباً، أرغب في الاشتراك في باقة ${p.name.ar} على حراج السعادة.`
                        : `Hello, I'd like to subscribe to the ${p.name.en} plan on Haraj Al Saada.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02] ${
                      p.highlight
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {ar ? "اشترك الآن" : "Subscribe now"}
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            {ar
              ? "جميع الأسعار بالدينار البحريني (د.ب) وتشمل الضرائب المطبقة."
              : "All prices in Bahraini Dinar (BHD), applicable taxes included."}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
