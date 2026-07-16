import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gavel, Clock, MapPin, Users } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

function hoursLeft(endsAt?: string): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 3_600_000);
}

interface BidAgg {
  highest: number;
  bids: number;
  bidders: number;
}

export function AuctionsSection() {
  const { lang } = useLanguage();
  const { listings } = useListings();
  const auctions = listings.filter((l) => l.listingType === "auction");
  const [agg, setAgg] = useState<Record<string, BidAgg>>({});

  const ids = auctions.map((a) => a.id).join(",");

  useEffect(() => {
    if (!ids) return;
    let active = true;
    (async () => {
      const { data } = await (supabase as any).rpc("get_auction_stats", {
        _listing_ids: ids.split(","),
      });
      if (!active || !data) return;
      const map: Record<string, BidAgg> = {};
      for (const r of data as { listing_id: string; highest: number; bids: number; bidders: number }[]) {
        map[r.listing_id] = {
          highest: Number(r.highest) || 0,
          bids: Number(r.bids) || 0,
          bidders: Number(r.bidders) || 0,
        };
      }
      setAgg(map);
    })();
    return () => {
      active = false;
    };
  }, [ids]);

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
              const info = agg[a.id];
              const currentPrice = Math.max(info?.highest ?? 0, a.startPrice ?? a.price);
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
                    <div className="mt-1 flex items-center justify-between text-xs text-navy-foreground/60">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {a.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {(info?.bidders ?? 0).toLocaleString(lang)} {lang === "ar" ? "مزايد" : "bidders"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-navy-foreground/80">
                          {lang === "ar" ? "السعر الحالي" : "Current bid"}
                        </div>
                        <div className="text-lg font-extrabold text-primary">
                          {currentPrice.toLocaleString(lang)} {lang === "ar" ? "د.ب" : "BHD"}
                        </div>
                        <div className="text-[11px] text-navy-foreground/80">
                          {(info?.bids ?? 0).toLocaleString(lang)} {lang === "ar" ? "مزايدة" : "bids"}
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
