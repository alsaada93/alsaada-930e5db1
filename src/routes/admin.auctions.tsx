import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, MapPin, Gavel, Ban } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminAuctions } from "@/data/admin";

export const Route = createFileRoute("/admin/auctions")({
  component: AdminAuctionsPage,
});

function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState(adminAuctions);

  const setCommission = (id: string, commission: number) =>
    setAuctions((p) => p.map((a) => (a.id === id ? { ...a, commission } : a)));

  const endNow = (id: string) =>
    setAuctions((p) => p.map((a) => (a.id === id ? { ...a, status: "ended", endsInHours: 0 } : a)));

  return (
    <div>
      <AdminHeader title="إدارة المزادات" subtitle="راقب المزادات وحدّد العمولات" />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {auctions.map((a) => (
          <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="relative aspect-video">
              <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
              <span
                className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  a.status === "active"
                    ? "bg-chart-3 text-white"
                    : "bg-muted-foreground text-white"
                }`}
              >
                {a.status === "active" ? (
                  <>
                    <Clock className="h-3 w-3" /> نشط • {a.endsInHours.toLocaleString("ar")} س
                  </>
                ) : (
                  "منتهٍ"
                )}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-card-foreground">{a.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {a.city}
                <Gavel className="h-3.5 w-3.5" /> {a.bids.toLocaleString("ar")} مزايدة
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">أعلى مزايدة</div>
                  <div className="text-lg font-extrabold text-primary">{a.currentBid.toLocaleString("ar")} د.ب</div>
                </div>
                <div className="text-left">
                  <label className="text-[11px] text-muted-foreground">العمولة %</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={a.commission}
                    onChange={(e) => setCommission(a.id, Number(e.target.value))}
                    className="mt-0.5 block w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={() => endNow(a.id)}
                disabled={a.status === "ended"}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40"
              >
                <Ban className="h-4 w-4" /> إنهاء المزاد الآن
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
