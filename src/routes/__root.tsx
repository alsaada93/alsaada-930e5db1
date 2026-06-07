import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
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
import { Toaster } from "@/components/ui/sonner";

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
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/site-logo.png",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "حراج السعادة",
          url: "https://www.alsaada.sale",

        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "حراج السعادة",
          url: "https://www.alsaada.sale",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('alsaada_theme');if(!t)return;var d=JSON.parse(t);var r=document.documentElement;if(d&&d.colors){for(var k in d.colors){if(d.colors[k])r.style.setProperty('--'+k,d.colors[k]);}}if(d&&d.font){var s='"'+d.font+'", system-ui, sans-serif';r.style.setProperty('--font-sans',s);r.style.setProperty('--font-display',s);}}catch(e){}})();`;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("visit_recorded")) return;
    sessionStorage.setItem("visit_recorded", "1");
    recordVisit({ data: { path: window.location.pathname } }).catch(() => {});
  }, []);



  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <SiteIdentityProvider>
            <HomeBannersProvider>
              <AuthProvider>
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
                <Toaster />
              </AuthProvider>
            </HomeBannersProvider>
          </SiteIdentityProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
