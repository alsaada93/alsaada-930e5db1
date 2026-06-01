import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/marketplace";

export interface AdminStatsData {
  totalViews: number;
  pending: number;
  users: number;
  listings: number;
  auctions: number;
  businesses: number;
  favorites: number;
  requests: number;
}

export interface TrendPoint {
  day: string;
  listings: number;
  views: number;
}

export interface MonthPoint {
  month: string;
  listings: number;
  views: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
}

const WEEK_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function categoryName(id: string | null): string {
  if (!id) return "أخرى";
  return categories.find((c) => c.id === id)?.name ?? id;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [weekTrend, setWeekTrend] = useState<TrendPoint[]>([]);
  const [monthTrend, setMonthTrend] = useState<MonthPoint[]>([]);
  const [categoryActivity, setCategoryActivity] = useState<CategoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const [{ data: listings }, profilesRes, favoritesRes, requestsRes] = await Promise.all([
        supabase.from("listings").select("listing_type,status,views,category_id,created_at"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("favorites").select("id", { count: "exact", head: true }),
        supabase.from("equipment_requests").select("id", { count: "exact", head: true }),
      ]);

      if (!active) return;

      const rows = listings ?? [];
      const totalViews = rows.reduce((s, r) => s + (Number(r.views) || 0), 0);

      setStats({
        totalViews,
        pending: rows.filter((r) => r.status === "pending").length,
        users: profilesRes.count ?? 0,
        listings: rows.length,
        auctions: rows.filter((r) => r.listing_type === "auction").length,
        businesses: rows.filter((r) => r.listing_type === "business").length,
        favorites: favoritesRes.count ?? 0,
        requests: requestsRes.count ?? 0,
      });

      // Last 7 days trend
      const now = new Date();
      const week: TrendPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayRows = rows.filter((r) => {
          const c = new Date(r.created_at as string);
          return c.toDateString() === d.toDateString();
        });
        week.push({
          day: WEEK_DAYS[d.getDay()],
          listings: dayRows.length,
          views: dayRows.reduce((s, r) => s + (Number(r.views) || 0), 0),
        });
      }
      setWeekTrend(week);

      // Last 6 months trend
      const months: MonthPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthRows = rows.filter((r) => {
          const c = new Date(r.created_at as string);
          return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
        });
        months.push({
          month: MONTHS[d.getMonth()],
          listings: monthRows.length,
          views: monthRows.reduce((s, r) => s + (Number(r.views) || 0), 0),
        });
      }
      setMonthTrend(months);

      // Category activity
      const catMap: Record<string, number> = {};
      rows.forEach((r) => {
        const name = categoryName((r.category_id as string | null) ?? null);
        catMap[name] = (catMap[name] ?? 0) + 1;
      });
      setCategoryActivity(
        Object.entries(catMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      );

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { stats, weekTrend, monthTrend, categoryActivity, loading };
}
