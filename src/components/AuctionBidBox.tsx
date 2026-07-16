import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Gavel, Clock, Users, TrendingUp, Loader2, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RecentBid {
  id: string;
  amount: number;
  created_at: string;
  is_self: boolean;
}

interface Stats {
  highest: number;
  bids: number;
  bidders: number;
}

interface Props {
  listingId: string;
  startPrice: number;
  auctionEndsAt: string | null;
}

function timeLeft(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى المزاد";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d} يوم و ${h} ساعة`;
  if (h > 0) return `${h} ساعة و ${m} دقيقة`;
  return `${m} دقيقة`;
}

export function AuctionBidBox({ listingId, startPrice, auctionEndsAt }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ highest: 0, bids: 0, bidders: 0 });
  const [recent, setRecent] = useState<RecentBid[]>([]);
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [online, setOnline] = useState(0);
  const [, force] = useState(0);

  const ended = !!auctionEndsAt && new Date(auctionEndsAt).getTime() <= Date.now();

  const currentPrice = Math.max(stats.highest, startPrice);
  const minNext = currentPrice + 1;

  const refresh = useCallback(async () => {
    const [statsRes, recentRes] = await Promise.all([
      (supabase as any).rpc("get_auction_stats", { _listing_ids: [listingId] }),
      (supabase as any).rpc("get_auction_recent_bids", { _listing_id: listingId, _limit: 5 }),
    ]);
    const row = (statsRes.data as { highest: number; bids: number; bidders: number }[] | null)?.[0];
    setStats({
      highest: Number(row?.highest) || 0,
      bids: Number(row?.bids) || 0,
      bidders: Number(row?.bidders) || 0,
    });
    setRecent(
      ((recentRes.data as RecentBid[] | null) ?? []).map((b) => ({
        ...b,
        amount: Number(b.amount),
      })),
    );
  }, [listingId]);

  useEffect(() => {
    refresh();
    // React to new bids via realtime signal only (payload not readable without permissions)
    const channel = supabase
      .channel(`auction-${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_bids", filter: `listing_id=eq.${listingId}` },
        () => refresh(),
      )
      .subscribe();
    const poll = setInterval(refresh, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [listingId, refresh]);

  useEffect(() => {
    const key = user?.id ?? `guest-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(`auction-presence-${listingId}`, {
      config: { presence: { key } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnline(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId, user?.id]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const placeBid = async () => {
    if (!user) return;
    const value = Number(amount);
    if (!value || value < minNext) {
      toast.error(`يجب أن تكون المزايدة ${minNext.toLocaleString("ar")} د.ب أو أعلى`);
      return;
    }
    setPlacing(true);
    const { error } = await supabase
      .from("auction_bids")
      .insert({ listing_id: listingId, user_id: user.id, amount: value });
    setPlacing(false);
    if (error) {
      toast.error("تعذّرت المزايدة، حدّث الصفحة وحاول مرة أخرى.");
      return;
    }
    setAmount("");
    toast.success("تمت المزايدة بنجاح!");
    refresh();
  };

  const left = timeLeft(auctionEndsAt);
  const displayRecent = useMemo(() => recent.slice(0, 5), [recent]);

  return (
    <div className="mt-5 rounded-2xl border border-primary/30 bg-accent/30 p-4">
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-extrabold text-primary">مزاد مباشر</h2>
        {left && (
          <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive">
            <Clock className="h-3.5 w-3.5" /> {left}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="سعر البداية" value={`${startPrice.toLocaleString("ar")} د.ب`} />
        <Stat label="السعر الحالي" value={`${currentPrice.toLocaleString("ar")} د.ب`} highlight />
        <Stat label="عدد المزايدات" value={stats.bids.toLocaleString("ar")} icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="عدد المزايدين" value={stats.bidders.toLocaleString("ar")} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <Radio className="h-3.5 w-3.5 animate-pulse" /> {online.toLocaleString("ar")} متصل الآن بالمزاد
      </div>

      {ended ? (
        <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground">
          انتهى هذا المزاد
        </div>
      ) : user ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min={minNext}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`${minNext.toLocaleString("ar")} د.ب أو أعلى`}
            className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={placeBid}
            disabled={placing}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-6 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />} زايد الآن
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="mt-4 block rounded-xl bg-gradient-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-glow"
        >
          سجّل الدخول للمزايدة
        </Link>
      )}

      {displayRecent.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold">آخر المزايدات</h3>
          <ul className="space-y-1.5">
            {displayRecent.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                <span className="font-semibold text-primary">{b.amount.toLocaleString("ar")} د.ب</span>
                <span className="text-xs text-muted-foreground">{b.is_self ? "أنت" : "مزايد"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, icon }: { label: string; value: string; highlight?: boolean; icon?: ReactNode }) {
  return (
    <div className="rounded-xl bg-background p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-0.5 font-extrabold ${highlight ? "text-lg text-primary" : "text-sm"}`}>{value}</div>
    </div>
  );
}
