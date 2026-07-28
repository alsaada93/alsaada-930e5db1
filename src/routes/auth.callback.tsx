import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildNativeCallbackUrl } from "@/lib/auth-redirects";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "إكمال تسجيل الدخول | حراج السعادة" },
      { name: "description", content: "إكمال تسجيل الدخول الآمن إلى حراج السعادة." },
      { property: "og:title", content: "إكمال تسجيل الدخول | حراج السعادة" },
      { property: "og:description", content: "إكمال تسجيل الدخول الآمن إلى حراج السعادة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري إكمال تسجيل الدخول...");
  const [failed, setFailed] = useState(false);
  const isNativeBridge = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("native") === "1";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const complete = async () => {
      const currentUrl = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const pick = (name: string) => params.get(name) ?? hashParams.get(name);
      const error = pick("error_description") ?? pick("error");

      if (error) {
        console.error("[HARAJ_AUTH_DEBUG] callback error", error);
        setStatus("تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.");
        setFailed(true);
        return;
      }

      // Deep-link bridge: only needed when this page was opened in an EXTERNAL
      // browser (Chrome Custom Tab). Inside the Capacitor WebView we are already
      // in the app, so we finish the session here instead of bouncing out.
      const insideNativeApp = isNativePlatform();
      if (isNativeBridge && !insideNativeApp) {
        window.location.href = buildNativeCallbackUrl(currentUrl);
        setStatus("جاري إعادتك إلى التطبيق...");
        return;
      }

      const accessToken = pick("access_token");
      const refreshToken = pick("refresh_token");
      const code = pick("code");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          console.error("[HARAJ_AUTH_DEBUG] setSession failed", sessionError.message);
        }
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[HARAJ_AUTH_DEBUG] exchangeCodeForSession failed", exchangeError.message);
        }
      }

      // The Lovable broker may have already stored the session before redirecting,
      // so re-check before declaring failure. Retry briefly for slow storage writes.
      let session = (await supabase.auth.getSession()).data.session;
      for (let i = 0; !session && i < 5; i++) {
        await new Promise((r) => setTimeout(r, 300));
        session = (await supabase.auth.getSession()).data.session;
      }

      if (!session) {
        setStatus("لم يتم العثور على جلسة دخول صالحة. حاول تسجيل الدخول مرة أخرى.");
        setFailed(true);
        return;
      }

      navigate({ to: "/account", replace: true });
    };

    complete().catch((e) => {
      console.error("[HARAJ_AUTH_DEBUG] callback crashed", e);
      setStatus("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
      setFailed(true);
    });
  }, [isNativeBridge, navigate]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
          {failed ? <ShieldCheck className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">إكمال تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-muted-foreground">{status}</p>
        {failed && (
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link to="/login">العودة لتسجيل الدخول</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}