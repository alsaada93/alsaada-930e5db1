import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetDashboardStats } from "@/lib/admin.functions";

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

export function useAdminStats() {
  const fetchStats = useServerFn(adminGetDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => fetchStats(),
    staleTime: 1000 * 30,
  });

  return {
    stats: (data?.stats as AdminStatsData | undefined) ?? null,
    weekTrend: (data?.weekTrend as TrendPoint[] | undefined) ?? [],
    monthTrend: (data?.monthTrend as MonthPoint[] | undefined) ?? [],
    categoryActivity: (data?.categoryActivity as CategoryPoint[] | undefined) ?? [],
    loading: isLoading,
  };
}
