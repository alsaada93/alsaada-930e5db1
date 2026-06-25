import { Link, useNavigate } from "@tanstack/react-router";
import { Globe, Heart, Bell, User, Camera, LogOut, LayoutDashboard, UserCircle, Menu, Calculator } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useSiteIdentity } from "@/hooks/useSiteIdentity";
import { optimizedImage } from "@/lib/image-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const { t, lang, toggle } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const { identity } = useSiteIdentity();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    (lang === "ar" ? "حسابي" : "Account");

  const logoSize = Math.round(Math.min(identity.logoBoxWidth, identity.logoBoxHeight) * 0.8);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span
            className="flex items-center justify-center rounded-xl bg-white p-1 shadow-md"
            style={{ width: identity.logoBoxWidth, height: identity.logoBoxHeight }}
          >
            {identity.logoUrl ? (
              <img src={identity.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <BrandLogo size={logoSize} />
            )}
          </span>

          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span
              className="truncate font-extrabold tracking-tight text-white"
              style={{ fontSize: identity.logoFontSize }}
            >
              {lang === "ar" ? identity.nameAr : identity.nameEn}
              <span className="hidden text-white/80 lg:inline"> | {lang === "ar" ? identity.nameEn : identity.nameAr}</span>
            </span>

            <span
              className="hidden truncate text-white/70 lg:block"
              style={{ fontSize: Math.max(10, Math.round(identity.logoFontSize * 0.7)) }}
            >
              {lang === "ar" ? identity.taglineAr : identity.taglineEn}
            </span>
          </span>
        </Link>

        <div className="flex-1" />


        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={toggle}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold hover:bg-white/10 sm:px-3"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === "ar" ? "EN" : "ع"}</span>
          </button>

          {/* قائمة الجوال — تُظهر الروابط المخفية على الشاشات الصغيرة */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={lang === "ar" ? "القائمة" : "Menu"}
              className="flex items-center rounded-lg p-2 hover:bg-white/10 focus:outline-none sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link to="/restaurant" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {lang === "ar" ? "حاسبة المطاعم" : "Restaurant Cost"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/account" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {lang === "ar" ? "المفضلة" : "Favorites"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/account" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {lang === "ar" ? "الإشعارات" : "Notifications"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/restaurant"
            className="hidden rounded-lg px-3 py-2 text-sm font-bold hover:bg-white/10 sm:block"
          >
            {lang === "ar" ? "حاسبة المطاعم" : "Restaurant Cost"}
          </Link>


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
              <DropdownMenuTrigger aria-label={displayName || (lang === "ar" ? "حساب المستخدم" : "User account")} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-white/10 focus:outline-none sm:px-3">
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
            className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-glow ring-2 ring-white/30 transition-transform hover:scale-[1.05] sm:px-5"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
              <Camera className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="relative hidden sm:inline">{t("header.addListing")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
