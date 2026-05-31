import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Heart, Bell, Menu, Plus, User, Globe } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/hooks/useLanguage";

export function Header() {
  const { t, lang, toggle } = useLanguage();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 p-1 sm:h-9 sm:w-9">
            <BrandLogo size={20} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight sm:text-lg">
              السعادة ماركت <span className="hidden text-navy-foreground/80 sm:inline">| Al Saada Market</span>
            </span>
            <span className="hidden text-[10px] text-navy-foreground/60 sm:block">{t("header.tagline2")}</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
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
              className="h-10 w-full rounded-lg border-0 bg-white/95 pe-10 ps-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-bold hover:bg-white/10"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === "ar" ? "EN" : "ع"}</span>
          </button>
          <button className="hidden rounded-lg p-2 hover:bg-white/10 sm:block" aria-label={t("header.favorites")}>
            <Heart className="h-5 w-5" />
          </button>
          <button className="hidden rounded-lg p-2 hover:bg-white/10 sm:block" aria-label={t("header.notifications")}>
            <Bell className="h-5 w-5" />
          </button>
          <Link
            to="/login"
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("header.login")}</span>
          </Link>
          <Link
            to="/add-listing"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("header.addListing")}</span>
          </Link>
          <button className="rounded-lg p-2 hover:bg-white/10 md:hidden" aria-label={t("header.menu")}>
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
