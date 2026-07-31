import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { recordVisit } from "@/lib/visits.functions";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { SiteIdentityProvider } from "@/hooks/useSiteIdentity";
import { HomeBannersProvider } from "@/hooks/useHomeBanners";
import { HomeLayoutProvider } from "@/hooks/useHomeLayout";
import { CardConfigProvider } from "@/hooks/useCardConfig";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { isNativePlatform } from "@/lib/capacitor";
import { supabase } from "@/integrations/supabase/client";
import { isNativeCallbackUrl } from "@/lib/auth-redirects";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "حراج السعادة — بيع وشراء معدات المطاعم والأثاث" },
      { name: "description", content: "حراج السعادة منصة بيع وشراء ومزاد معدات المطاعم والأثاث والإلكترونيات في مملكة البحرين." },
      { name: "author", content: "حراج السعادة" },
      { property: "og:title", content: "حراج السعادة — بيع وشراء معدات المطاعم والأثاث في البحرين" },
      { property: "og:description", content: "حراج السعادة منصة بيع وشراء ومزاد معدات المطاعم والأثاث والإلكترونيات في مملكة البحرين." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "حراج السعادة" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "حراج السعادة — بيع وشراء معدات المطاعم والأثاث" },
      { name: "twitter:description", content: "حراج السعادة منصة بيع وشراء ومزاد معدات المطاعم والأثاث والإلكترونيات في مملكة البحرين." },
      { name: "google-site-verification", content: "LcFK1WJ9S9-zthpcsGa5rr26P1h1pehsKPPjp0CosAo" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "حراج السعادة",
          alternateName: "Haraj Al Saada",
          url: "https://www.alsaada.sale",
          logo: "https://www.alsaada.sale/site-logo.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+97333982383",
            contactType: "customer service",
            areaServed: "BH",
            availableLanguage: ["Arabic", "English"],
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "حراج السعادة",
          image: "https://www.alsaada.sale/site-logo.png",
          url: "https://www.alsaada.sale",
          telephone: "+97333982383",
          priceRange: "BHD",
          address: {
            "@type": "PostalAddress",
            addressCountry: "BH",
            addressLocality: "البحرين",
          },
          areaServed: { "@type": "Country", name: "Bahrain" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "حراج السعادة",
          url: "https://www.alsaada.sale",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.alsaada.sale/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_BOOT_SCRIPT = `(function(){try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i),v=localStorage.getItem(k)||'';if(/araba|عربه|عربة/i.test(k+' '+v))localStorage.removeItem(k);}var t=localStorage.getItem('alsaada_theme');if(!t)return;var d=JSON.parse(t);var r=document.documentElement;if(d&&d.colors){for(var k2 in d.colors){if(d.colors[k2])r.style.setProperty('--'+k2,d.colors[k2]);}}if(d&&d.font){var s='"'+d.font+'", system-ui, sans-serif';r.style.setProperty('--font-sans',s);r.style.setProperty('--font-display',s);}}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Apply the saved theme before first paint to prevent a design flicker */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />

        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const locationKey = useRouterState({
    select: (s) => s.location.href,
  });

  // Initialize native Capacitor plugins when running inside the mobile app.
  useEffect(() => {
    if (typeof window === "undefined" || !isNativePlatform()) return;

    let cleanup = () => {};

    (async () => {
      const [{ StatusBar, StatusBarStyle }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      await StatusBar.setStyle({ style: StatusBarStyle.Dark }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: "#1C3A40" }).catch(() => {});
      await SplashScreen.hide().catch(() => {});

      // Handle Android hardware back button gracefully.
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp().catch(() => {});
        }
      });

      // استقبال deep link العائد من OAuth: harajalsaada://login-callback?code=...
      const urlListener = await App.addListener("appUrlOpen", async ({ url }) => {
        console.log("[HARAJ_AUTH_DEBUG] appUrlOpen received:", url);
        if (!url || !isNativeCallbackUrl(url)) return;
        try {
          const parsed = new URL(url);
          const errorDescription = parsed.searchParams.get("error_description") ?? parsed.searchParams.get("error");
          if (errorDescription) {
            console.error("[HARAJ_AUTH_DEBUG] OAuth returned error", errorDescription);
            return;
          }
          const accessToken = parsed.searchParams.get("access_token");
          const refreshToken = parsed.searchParams.get("refresh_token");
          const code = parsed.searchParams.get("code");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            console.log("[HARAJ_AUTH_DEBUG] setSession:", error ? `error: ${error.message}` : "success");
            if (!error) window.location.href = "/";
            return;
          }

          if (!code) return;
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          console.log(
            "[HARAJ_AUTH_DEBUG] exchangeCodeForSession:",
            error ? `error: ${error.message}` : "success",
          );
          if (!error) {
            window.location.href = "/";
          }
        } catch (e) {
          console.error("[HARAJ_AUTH_DEBUG] deep link parse/exchange failed", e);
        }
      });

      cleanup = () => {
        listener.remove();
        urlListener.remove();
      };
    })();

    return cleanup;
  }, []);

  // بعض تدفقات Google تعيد المستخدم إلى الصفحة الرئيسية مع ?code=... بدلاً من
  // صفحة الـ callback. نلتقط ذلك عالمياً ونكمل الجلسة داخل التطبيق/الموقع.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    if (pathname.startsWith("/auth/callback")) return;
    const params = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const hasCode = params.has("code") || hashParams.has("code");
    const hasTokens = params.has("access_token") || hashParams.has("access_token");
    if (!hasCode && !hasTokens) return;
    const merged = new URLSearchParams(params);
    hashParams.forEach((v, k) => merged.set(k, v));
    window.location.replace(`/auth/callback?${merged.toString()}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("visit_recorded")) return;
    sessionStorage.setItem("visit_recorded", "1");
    recordVisit({ data: { path: window.location.pathname } }).catch(() => {});
  }, []);


  // حفظ موضع التمرير لكل صفحة، واستعادته عند الرجوع (يعمل حتى مع القوائم
  // التي تُحمَّل بشكل غير متزامن عبر إعادة المحاولة لفترة قصيرة).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storeKey = `scrollpos:${locationKey}`;
    const onScroll = () => {
      try {
        sessionStorage.setItem(storeKey, String(window.scrollY));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    let tries = 0;
    const saved = Number(sessionStorage.getItem(storeKey) || "0");
    if (saved > 0) {
      const restore = () => {
        window.scrollTo(0, saved);
        tries += 1;
        if (Math.abs(window.scrollY - saved) > 2 && tries < 60) {
          raf = requestAnimationFrame(restore);
        }
      };
      raf = requestAnimationFrame(restore);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [locationKey]);


  // Load Google AdSense on the client only, after hydration, to avoid SSR
  // hydration mismatches caused by AdSense auto-ads injecting markup.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("adsbygoogle-js")) return;
    const s = document.createElement("script");
    s.id = "adsbygoogle-js";
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8756700125021106";
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <SiteIdentityProvider>
            <HomeBannersProvider>
              <HomeLayoutProvider>
                <CardConfigProvider>
                  <AuthProvider>
                    {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                    <Outlet />
                    <Toaster />
                    <MobileBottomNav />
                  </AuthProvider>
                </CardConfigProvider>
              </HomeLayoutProvider>
            </HomeBannersProvider>
          </SiteIdentityProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
