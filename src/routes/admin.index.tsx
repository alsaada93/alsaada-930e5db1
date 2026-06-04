import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
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
  Globe,
  MonitorSmartphone,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DELETE_REASONS } from "@/components/DeleteListingDialog";
import { useAdminStats } from "@/hooks/useAdminStats";
import { getVisitorStats } from "@/lib/visits.functions";

const COUNTRY_NAMES: Record<string, string> = {
  BH: "البحرين",
  SA: "السعودية",
  AE: "الإمارات",
  KW: "الكويت",
  QA: "قطر",
  OM: "عُمان",
  EG: "مصر",
  JO: "الأردن",
  IQ: "العراق",
  YE: "اليمن",
  LB: "لبنان",
  SY: "سوريا",
  US: "أمريكا",
  GB: "بريطانيا",
  IN: "الهند",
  PK: "باكستان",
  PH: "الفلبين",
  BD: "بنغلاديش",
};

function countryLabel(code: string): string {
  if (code === "غير معروف") return code;
  return COUNTRY_NAMES[code] ?? code;
}


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

function AdminDashboard() {
  const { stats, weekTrend, monthTrend, categoryActivity, loading } = useAdminStats();

  const cards = [
    { label: "إجمالي المشاهدات", value: stats?.totalViews ?? 0, icon: Eye, suffix: "" },
    { label: "قيد المراجعة", value: stats?.pending ?? 0, icon: Clock, suffix: "" },
    { label: "المستخدمون", value: stats?.users ?? 0, icon: Users, suffix: "" },
    { label: "الإعلانات", value: stats?.listings ?? 0, icon: FileText, suffix: "" },
    { label: "المزادات", value: stats?.auctions ?? 0, icon: Gavel, suffix: "" },
    { label: "أنشطة للبيع", value: stats?.businesses ?? 0, icon: Store, suffix: "" },
    { label: "المفضلة", value: stats?.favorites ?? 0, icon: Heart, suffix: "" },
    { label: "طلبات المعدات", value: stats?.requests ?? 0, icon: ClipboardList, suffix: "" },
  ];

  return (
    <div>
      <AdminHeader title="لوحة الإحصائيات" subtitle="نظرة عامة مباشرة على أداء المنصة" />
      <div className="space-y-6 p-6">
        {loading && <p className="text-sm text-muted-foreground">جارٍ تحميل الإحصائيات...</p>}
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

        <VisitorAnalytics />

        <DeletionStats />



        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-bold text-card-foreground">الإعلانات الجديدة (آخر 7 أيام)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weekTrend}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.19 41.5)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.7 0.19 41.5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} reversed />
                <YAxis tick={{ fontSize: 12 }} orientation="right" allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="listings" stroke="oklch(0.7 0.19 41.5)" fill="url(#gv)" strokeWidth={2} name="إعلانات" />
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
          <h3 className="mb-4 font-bold text-card-foreground">الإعلانات والمشاهدات (آخر 6 أشهر)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} reversed />
              <YAxis tick={{ fontSize: 12 }} orientation="right" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="listings" fill="oklch(0.7 0.19 41.5)" radius={[6, 6, 0, 0]} name="الإعلانات" />
              <Bar dataKey="views" fill="oklch(0.55 0.12 230)" radius={[6, 6, 0, 0]} name="المشاهدات" />
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

function VisitorAnalytics() {
  const fetchStats = useServerFn(getVisitorStats);
  const { data, isLoading } = useQuery({
    queryKey: ["visitor-stats"],
    queryFn: () => fetchStats(),
    staleTime: 1000 * 60 * 5,
  });

  const totalVisits = data?.totalVisits ?? 0;
  const countries = data?.countries ?? [];
  const browsers = data?.browsers ?? [];
  const maxCountry = countries[0]?.value ?? 1;
  const maxBrowser = browsers[0]?.value ?? 1;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-card-foreground">
          <Globe className="h-4 w-4 text-primary" />
          الزوار حسب الدولة ({totalVisits.toLocaleString("ar")} زيارة)
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : countries.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد بيانات زيارات بعد.</p>
        ) : (
          <div className="space-y-2">
            {countries.slice(0, 10).map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{countryLabel(c.name)}</span>
                  <span className="text-primary">{c.value.toLocaleString("ar")}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${Math.round((c.value / maxCountry) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-card-foreground">
          <MonitorSmartphone className="h-4 w-4 text-primary" />
          الزوار حسب المتصفح
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : browsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد بيانات زيارات بعد.</p>
        ) : (
          <div className="space-y-2">
            {browsers.map((b) => (
              <div key={b.name}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{b.name}</span>
                  <span className="text-primary">{b.value.toLocaleString("ar")}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${Math.round((b.value / maxBrowser) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


