import { Link } from "@tanstack/react-router";
import { Gavel, Clock, MapPin } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";

function hoursLeft(endsAt?: string): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 3_600_000);
}

export function AuctionsSection() {
  const { lang } = useLanguage();
  const { listings } = useListings();
  const auctions = listings.filter((l) => l.listingType === "auction");

  return (
    <section id="auctions" className="scroll-mt-20 bg-navy py-12 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-extrabold">{lang === "ar" ? "أحدث المزادات" : "Latest auctions"}</h2>
            <p className="text-sm text-navy-foreground/60">
              {lang === "ar" ? "زايد الآن واربح أفضل الصفقات" : "Bid now and win the best deals"}
            </p>
          </div>
        </div>

        {auctions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-sidebar-accent/40 p-10 text-center text-sm text-navy-foreground/60">
            {lang === "ar" ? "لا توجد مزادات نشطة حالياً." : "No active auctions right now."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((a) => {
              const hrs = hoursLeft(a.auctionEndsAt);
              return (
                <Link
                  key={a.id}
                  to="/listing/$id"
                  params={{ id: a.id }}
                  className="block overflow-hidden rounded-2xl bg-sidebar-accent transition-transform hover:-translate-y-1"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={a.image} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
                    {hrs != null && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                        <Clock className="h-3 w-3" />{" "}
                        {lang === "ar" ? `ينتهي خلال ${hrs.toLocaleString("ar")} ساعة` : `Ends in ${hrs}h`}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-bold">{a.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-navy-foreground/60">
                      <MapPin className="h-3.5 w-3.5" /> {a.city}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-navy-foreground/60">
                          {lang === "ar" ? "السعر الحالي" : "Current bid"}
                        </div>
                        <div className="text-lg font-extrabold text-primary">
                          {(a.startPrice ?? a.price).toLocaleString(lang)} {lang === "ar" ? "د.ب" : "BHD"}
                        </div>
                      </div>
                      <span className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                        {lang === "ar" ? "زايد الآن" : "Bid now"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
