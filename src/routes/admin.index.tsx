import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  FileText,
  Gavel,
  Store,
  Heart,
  ClipboardList,
  Clock,
  Eye,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DELETE_REASONS } from "@/components/DeleteListingDialog";
import { useAdminStats } from "@/hooks/useAdminStats";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const PIE_COLORS = [
  "oklch(0.7 0.19 41.5)",
  "oklch(0.55 0.12 230)",
  "oklch(0.6 0.13 162)",
  "oklch(0.7 0.15 300)",
  "oklch(0.65 0.2 16)",
  "oklch(0.6 0.03 257)",
];

const cards = [
  { label: "زوار اليوم", value: adminStats.visitorsToday, icon: Eye, suffix: "" },
  { label: "زوار الشهر", value: adminStats.visitorsMonth, icon: TrendingUp, suffix: "" },
  { label: "المستخدمون", value: adminStats.users, icon: Users, suffix: "" },
  { label: "الإعلانات", value: adminStats.listings, icon: FileText, suffix: "" },
  { label: "المزادات", value: adminStats.auctions, icon: Gavel, suffix: "" },
  { label: "أنشطة للبيع", value: adminStats.businesses, icon: Store, suffix: "" },
  { label: "الإيرادات", value: adminStats.revenue, icon: Wallet, suffix: "د.ب" },
  { label: "العمولات", value: adminStats.commissions, icon: Percent, suffix: "د.ب" },
];

function AdminDashboard() {
  return (
    <div>
      <AdminHeader title="لوحة الإحصائيات" subtitle="نظرة عامة مباشرة على أداء المنصة" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-card-foreground">
                {c.value.toLocaleString("ar")}
                {c.suffix && <span className="text-sm font-semibold text-muted-foreground"> {c.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        <DeletionStats />



        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-bold text-card-foreground">الزوار والإعلانات (آخر 7 أيام)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={visitorsTrend}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.19 41.5)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.7 0.19 41.5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} reversed />
                <YAxis tick={{ fontSize: 12 }} orientation="right" />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="oklch(0.7 0.19 41.5)" fill="url(#gv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-card-foreground">النشاط حسب التصنيف</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryActivity} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {categoryActivity.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {categoryActivity.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {c.name}
                  </span>
                  <span className="font-semibold">{c.value.toLocaleString("ar")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">الإيرادات والعمولات (شهري)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} reversed />
              <YAxis tick={{ fontSize: 12 }} orientation="right" />
              <Tooltip />
              <Bar dataKey="revenue" fill="oklch(0.7 0.19 41.5)" radius={[6, 6, 0, 0]} name="الإيرادات" />
              <Bar dataKey="commissions" fill="oklch(0.55 0.12 230)" radius={[6, 6, 0, 0]} name="العمولات" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DeletionStats() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sites, setSites] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("listing_deletions")
      .select("reason,other_site")
      .then(({ data }) => {
        if (!active) return;
        const c: Record<string, number> = {};
        const s: string[] = [];
        (data ?? []).forEach((r: { reason: string; other_site: string | null }) => {
          c[r.reason] = (c[r.reason] ?? 0) + 1;
          if (r.other_site) s.push(r.other_site);
        });
        setCounts(c);
        setSites(Array.from(new Set(s)));
        setTotal((data ?? []).length);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 font-bold text-card-foreground">أسباب حذف الإعلانات ({total.toLocaleString("ar")})</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DELETE_REASONS.map((r) => {
            const value = counts[r.key] ?? 0;
            const pct = total ? Math.round((value / total) * 100) : 0;
            return (
              <div key={r.key} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{r.label}</span>
                  <span className="text-primary">{value.toLocaleString("ar")}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sites.length > 0 && (
        <div className="mt-4 text-sm">
          <span className="font-semibold">مواقع البيع الأخرى المذكورة: </span>
          <span className="text-muted-foreground">{sites.join("، ")}</span>
        </div>
      )}
    </div>
  );
}

