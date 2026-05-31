import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Globe, Heart, Bell, User, Plus, Menu, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { t, lang, toggle } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    (lang === "ar" ? "حسابي" : "Account");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="flex h-[80px] w-[80px] items-center justify-center rounded-3xl bg-white p-2 shadow-md">
            <BrandLogo size={65} />
          </span>

          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
              السعادة ماركت
              <span className="hidden text-white/80 lg:inline"> | Al Saada Market</span>
            </span>

            <span className="hidden truncate text-sm text-white/70 lg:block">
              شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q: q.trim() || undefined } });
            }}
            className="relative"
          >
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("header.searchPlaceholder")}
              className="h-12 w-full rounded-xl border-0 bg-white/95 pe-10 ps-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
        </div>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={toggle}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold hover:bg-white/10 sm:px-3"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === "ar" ? "EN" : "ع"}</span>
          </button>

          <Link
            to="/account"
            className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"
            aria-label={lang === "ar" ? "المفضلة" : "Favorites"}
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            to="/account"
            className="hidden rounded-lg p-2 hover:bg-white/10 sm:block"
            aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
          >
            <Bell className="h-5 w-5" />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-white/10 focus:outline-none sm:px-3">
                <UserCircle className="h-5 w-5" />
                <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lang === "ar" ? "حسابي" : "My Account"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {lang === "ar" ? "إعلاناتي" : "My Listings"}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {lang === "ar" ? "لوحة الإدارة" : "Admin"}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium hover:bg-white/10 sm:px-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t("header.login")}</span>
            </Link>
          )}

          <Link
            to="/add-listing"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("header.addListing")}</span>
          </Link>

          <Link to="/search" className="rounded-lg p-2 hover:bg-white/10 md:hidden" aria-label="search">
            <Search className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
