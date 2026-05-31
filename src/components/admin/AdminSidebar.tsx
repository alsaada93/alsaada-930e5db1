import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardCheck, FolderTree, Tags, Gavel, Images, ArrowRight } from "lucide-react";

const items = [
  { title: "الإحصائيات", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "مراجعة الإعلانات", url: "/admin/listings", icon: ClipboardCheck },
  { title: "التصنيفات", url: "/admin/categories", icon: FolderTree },
  { title: "الماركات", url: "/admin/brands", icon: Tags },
  { title: "المزادات", url: "/admin/auctions", icon: Gavel },
  { title: "صور العرض", url: "/admin/slides", icon: Images },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string, exact?: boolean) => (exact ? path === url : path.startsWith(url));

  return (
    <aside className="sticky top-0 flex h-screen w-16 flex-col bg-sidebar text-sidebar-foreground md:w-60">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary font-black text-primary-foreground">
          S
        </span>
        <span className="hidden font-extrabold md:block">
          سوقو <span className="text-primary">الإدارة</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:block">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ArrowRight className="h-5 w-5 shrink-0" />
          <span className="hidden md:block">العودة للموقع</span>
        </Link>
      </div>
    </aside>
  );
}
