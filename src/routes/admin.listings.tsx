import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, Search, MapPin } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminListings, type AdminListing, type ListingStatus } from "@/data/admin";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
});

const tabs: { key: ListingStatus | "all"; label: string }[] = [
  { key: "pending", label: "بانتظار المراجعة" },
  { key: "approved", label: "مقبولة" },
  { key: "rejected", label: "مرفوضة" },
  { key: "all", label: "الكل" },
];

const statusBadge: Record<ListingStatus, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-accent text-accent-foreground" },
  approved: { label: "مقبول", cls: "bg-chart-3/15 text-chart-3" },
  rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive" },
};

function AdminListingsPage() {
  const [items, setItems] = useState<AdminListing[]>(adminListings);
  const [tab, setTab] = useState<ListingStatus | "all">("pending");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (tab === "all" || i.status === tab) &&
          (query === "" || i.title.includes(query) || i.seller.includes(query)),
      ),
    [items, tab, query],
  );

  const setStatus = (id: string, status: ListingStatus) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));

  const counts = (k: ListingStatus | "all") =>
    k === "all" ? items.length : items.filter((i) => i.status === k).length;

  return (
    <div>
      <AdminHeader title="مراجعة الإعلانات" subtitle="وافق أو ارفض الإعلانات الجديدة" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {t.label} ({counts(t.key).toLocaleString("ar")})
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالعنوان أو البائع..."
              className="h-9 w-64 rounded-lg border border-input bg-card pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">لا توجد إعلانات في هذا القسم</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img src={i.image} alt={i.title} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-[180px] flex-1">
                    <h3 className="font-bold text-card-foreground">{i.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{i.price.toLocaleString("ar")} د.ب</span>
                      <span>• {i.category}</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {i.city}
                      </span>
                      <span>• {i.seller}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[i.status].cls}`}>
                    {statusBadge[i.status].label}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(i.id, "approved")}
                      disabled={i.status === "approved"}
                      className="flex items-center gap-1 rounded-lg bg-chart-3/15 px-3 py-1.5 text-sm font-semibold text-chart-3 transition-colors hover:bg-chart-3/25 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" /> قبول
                    </button>
                    <button
                      onClick={() => setStatus(i.id, "rejected")}
                      disabled={i.status === "rejected"}
                      className="flex items-center gap-1 rounded-lg bg-destructive/15 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-40"
                    >
                      <X className="h-4 w-4" /> رفض
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
