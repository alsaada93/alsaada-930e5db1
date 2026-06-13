import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardCheck, FolderTree, Tags, Gavel, Images, ImageDown, Palette, ExternalLink, ShoppingCart, MonitorPlay, Search, Users, KeyRound, Calculator, Newspaper } from "lucide-react";
import { useAdminLayout } from "./AdminLayoutContext";

const items = [
  { title: "الإحصائيات", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "مراجعة الإعلانات", url: "/admin/listings", icon: ClipboardCheck },
  { title: "الأعضاء والصلاحيات", url: "/admin/members", icon: Users },
  { title: "طرق التسجيل", url: "/admin/access", icon: KeyRound },
  { title: "التصنيفات", url: "/admin/categories", icon: FolderTree },
  { title: "الماركات", url: "/admin/brands", icon: Tags },
  { title: "المزادات", url: "/admin/auctions", icon: Gavel },
  { title: "معدات المطاعم", url: "/admin/restaurant", icon: Calculator },
  { title: "أسعار الحاسبة", url: "/admin/calculator", icon: Calculator },
  { title: "المدونة", url: "/admin/blog", icon: Newspaper },
  { title: "واجهة الرئيسية", url: "/admin/hero", icon: MonitorPlay },
  { title: "صور العرض", url: "/admin/slides", icon: Images },
  { title: "مظهر الموقع", url: "/admin/appearance", icon: Palette },
  { title: "تحسين SEO", url: "/admin/seo", icon: Search },
  { title: "ضغط الصور", url: "/admin/images", icon: ImageDown },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed } = useAdminLayout();
  const isActive = (url: string, exact?: boolean) => (exact ? path === url : path.startsWith(url));

  return (
    <aside
      className={`sticky top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-16 md:w-60"
      }`}
    >
      {/* WordPress-style brand block */}
      <div className="flex h-14 items-center gap-2 bg-sidebar-primary px-3 text-sidebar-primary-foreground">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15">
          <ShoppingCart className="h-5 w-5" />
        </span>
        {!collapsed && (
          <span className="hidden whitespace-nowrap text-sm font-extrabold md:block">
            حراج السعادة
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
        {items.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              title={item.title}
              className={`group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              {active && (
                <span className="absolute inset-y-0 start-0 w-1 bg-sidebar-primary" aria-hidden />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="hidden whitespace-nowrap md:block">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border py-2">
        <Link
          to="/"
          title="زيارة الموقع"
          className="flex items-center gap-3 px-4 py-3 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="hidden whitespace-nowrap md:block">زيارة الموقع</span>}
        </Link>
      </div>
    </aside>
  );
}
