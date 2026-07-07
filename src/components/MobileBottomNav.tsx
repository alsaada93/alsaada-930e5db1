import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Flame, PlusCircle, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCapacitor } from "@/hooks/useCapacitor";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { lang, t } = useLanguage();
  const { isNative } = useCapacitor();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Only show inside the native app. On the mobile web we keep the existing header.
  if (!isNative) return null;

  const items = [
    { to: "/", label: lang === "ar" ? "الرئيسية" : "Home", icon: Home },
    { to: "/offers", label: lang === "ar" ? "العروض" : "Offers", icon: Flame },
    { to: "/add-listing", label: lang === "ar" ? "أضف" : "Add", icon: PlusCircle },
    { to: "/account", label: lang === "ar" ? "حسابي" : "Account", icon: User },
  ];

  return (
    <nav
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-navy pb-safe"
      aria-label={lang === "ar" ? "التنقل السفلي" : "Bottom navigation"}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-navy-foreground/70 hover:text-navy-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-current")} />
              <span className="max-w-[4rem] truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
