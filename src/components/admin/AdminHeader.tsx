import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ExternalLink, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLayout } from "./AdminLayoutContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toggleCollapsed } = useAdminLayout();

  return (
    <div className="sticky top-0 z-30">
      {/* WordPress-style admin bar */}
      <div className="flex h-12 items-center justify-between gap-3 bg-navy px-3 text-navy-foreground sm:px-5">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapsed}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="طي القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">زيارة الموقع</span>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/10 focus:outline-none">
            <UserCircle className="h-5 w-5" />
            <span className="hidden max-w-[160px] truncate sm:inline">{user?.email ?? "المشرف"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{user?.email ?? "المشرف"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                زيارة الموقع
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate({ to: "/login/admin" });
              }}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Page title bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-5 sm:px-6">
        <div>
          <h1 className="text-xl font-extrabold text-card-foreground md:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login/admin" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>خروج</span>
        </Button>
      </header>
    </div>
  );
}
