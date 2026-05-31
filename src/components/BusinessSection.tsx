import { Store, TrendingUp, Users, Ruler } from "lucide-react";
import { businesses } from "@/data/marketplace";

export function BusinessSection() {
  return (
    <section id="businesses" className="mx-auto max-w-7xl px-4 py-12 scroll-mt-24">

      <div className="mb-6 flex items-center gap-2">
        <Store className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-extrabold">مطاعم وأنشطة جاهزة للبيع</h2>
          <p className="text-sm text-muted-foreground">استثمر في نشاط تجاري كامل وجاهز للتشغيل</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {businesses.map((b) => (
          <article key={b.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:flex-row">
            <div className="aspect-video sm:aspect-auto sm:w-2/5">
              <img src={b.image} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-bold text-card-foreground">{b.title}</h3>
              <div className="mt-1 text-xl font-extrabold text-primary">
                {b.value.toLocaleString("ar")} <span className="text-sm font-semibold">د.ب</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-secondary p-2 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <div className="font-bold">{b.monthlyRevenue.toLocaleString("ar")}</div>
                  <div className="text-muted-foreground">إيراد شهري</div>
                </div>
                <div className="rounded-lg bg-secondary p-2 text-center">
                  <Ruler className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <div className="font-bold">{b.area.toLocaleString("ar")} م²</div>
                  <div className="text-muted-foreground">المساحة</div>
                </div>
                <div className="rounded-lg bg-secondary p-2 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <div className="font-bold">{b.staff.toLocaleString("ar")}</div>
                  <div className="text-muted-foreground">موظفين</div>
                </div>
              </div>
              <button className="mt-3 rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                عرض التفاصيل
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
