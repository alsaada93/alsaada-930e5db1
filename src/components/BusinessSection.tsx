import { Link } from "@tanstack/react-router";
import { Store, TrendingUp, Users, Ruler } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";

export function BusinessSection() {
  const { lang } = useLanguage();
  const { listings } = useListings();
  const businesses = listings.filter((l) => l.listingType === "business");

  return (
    <section id="businesses" className="mx-auto max-w-7xl px-4 py-12 scroll-mt-24">
      <div className="mb-6 flex items-center gap-2">
        <Store className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-extrabold">
            {lang === "ar" ? "مطاعم وأنشطة جاهزة للبيع" : "Restaurants & businesses for sale"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === "ar"
              ? "استثمر في نشاط تجاري كامل وجاهز للتشغيل"
              : "Invest in a complete business ready to operate"}
          </p>
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "لا توجد أنشطة معروضة للبيع حالياً." : "No businesses for sale yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((b) => (
            <Link
              key={b.id}
              to="/listing/$id"
              params={{ id: b.id }}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-1 sm:flex-row"
            >
              <div className="aspect-video sm:aspect-auto sm:w-2/5">
                <img src={b.image} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-card-foreground">{b.title}</h3>
                <div className="mt-1 text-xl font-extrabold text-primary">
                  {b.price.toLocaleString(lang)}{" "}
                  <span className="text-sm font-semibold">{lang === "ar" ? "د.ب" : "BHD"}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary p-2 text-center">
                    <TrendingUp className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <div className="font-bold">{(b.monthlyRevenue ?? 0).toLocaleString(lang)}</div>
                    <div className="text-muted-foreground">{lang === "ar" ? "إيراد شهري" : "Revenue"}</div>
                  </div>
                  <div className="rounded-lg bg-secondary p-2 text-center">
                    <Ruler className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <div className="font-bold">
                      {(b.area ?? 0).toLocaleString(lang)} {lang === "ar" ? "م²" : "m²"}
                    </div>
                    <div className="text-muted-foreground">{lang === "ar" ? "المساحة" : "Area"}</div>
                  </div>
                  <div className="rounded-lg bg-secondary p-2 text-center">
                    <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <div className="font-bold">{(b.staff ?? 0).toLocaleString(lang)}</div>
                    <div className="text-muted-foreground">{lang === "ar" ? "موظفين" : "Staff"}</div>
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary">
                  {lang === "ar" ? "عرض التفاصيل" : "View details"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
