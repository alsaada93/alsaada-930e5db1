import { Gavel, Clock, MapPin } from "lucide-react";
import { auctions } from "@/data/marketplace";

export function AuctionsSection() {
  return (
    <section className="bg-navy py-12 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-extrabold">أحدث المزادات</h2>
            <p className="text-sm text-navy-foreground/60">زايد الآن واربح أفضل الصفقات</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((a) => (
            <article key={a.id} className="overflow-hidden rounded-2xl bg-sidebar-accent">
              <div className="relative aspect-video overflow-hidden">
                <img src={a.image} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                  <Clock className="h-3 w-3" /> ينتهي خلال {a.endsInHours.toLocaleString("ar")} ساعة
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 font-bold">{a.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-navy-foreground/60">
                  <MapPin className="h-3.5 w-3.5" /> {a.city} • {a.bids.toLocaleString("ar")} مزايدة
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-navy-foreground/60">أعلى مزايدة</div>
                    <div className="text-lg font-extrabold text-primary">{a.currentBid.toLocaleString("ar")} د.ب</div>
                  </div>
                  <button className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                    زايد الآن
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
