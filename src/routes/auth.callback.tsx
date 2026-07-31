import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildNativeCallbackUrl } from "@/lib/auth-redirects";
import { isNativePlatform } from "@/lib/capacitor";
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

/** يترجم أخطاء Supabase/Google إلى رسالة عربية مفهومة للمستخدم. */
function describeAuthError(raw: string | null | undefined) {
  const msg = (raw ?? "").toLowerCase();
  if (!msg) return "تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.";
  if (
    msg.includes("expired") ||
    msg.includes("invalid request") ||
    msg.includes("code verifier") ||
    msg.includes("invalid grant") ||
    msg.includes("bad_code_verifier") ||
    msg.includes("already used") ||
    msg.includes("pkce")
  ) {
    return "انتهت صلاحية رابط تسجيل الدخول أو تم استخدامه من قبل. رجاءً ابدأ تسجيل الدخول من جديد.";
  }
  if (msg.includes("access_denied") || msg.includes("denied") || msg.includes("cancel")) {
    return "تم إلغاء تسجيل الدخول من صفحة جوجل. يمكنك المحاولة مرة أخرى.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "تعذّر الاتصال بالخادم أثناء تسجيل الدخول. تحقق من الإنترنت وحاول مجدداً.";
  }
  return "تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.";
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري إكمال تسجيل الدخول...");
  const [failed, setFailed] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const isNativeBridge = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("native") === "1";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fail = (message: string, detail?: string | null) => {
      setStatus(message);
      setDetails(detail ?? null);
      setFailed(true);
    };

    const complete = async () => {
      const currentUrl = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const pick = (name: string) => params.get(name) ?? hashParams.get(name);
      const error = pick("error_description") ?? pick("error");

      if (error) {
        console.error("[HARAJ_AUTH_DEBUG] callback error", error);
        fail(describeAuthError(error), error);
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

      if (!accessToken && !refreshToken && !code) {
        // لا يوجد رمز ولا توكن — قد يكون المستخدم فتح الصفحة مباشرة.
        const existing = (await supabase.auth.getSession()).data.session;
        if (existing) {
          navigate({ to: "/account", replace: true });
          return;
        }
        fail("رابط تسجيل الدخول غير مكتمل أو منتهي الصلاحية. ابدأ تسجيل الدخول من جديد.");
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          console.error("[HARAJ_AUTH_DEBUG] setSession failed", sessionError.message);
          const stored = (await supabase.auth.getSession()).data.session;
          if (!stored) {
            fail(describeAuthError(sessionError.message), sessionError.message);
            return;
          }
        }
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[HARAJ_AUTH_DEBUG] exchangeCodeForSession failed", exchangeError.message);
          // قد يكون الوسيط خزّن الجلسة مسبقاً؛ لا نُعلن الفشل إلا بعد التأكد.
          const stored = (await supabase.auth.getSession()).data.session;
          if (!stored) {
            fail(describeAuthError(exchangeError.message), exchangeError.message);
            return;
          }
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
        fail("لم يتم العثور على جلسة دخول صالحة. حاول تسجيل الدخول مرة أخرى.");
        return;
      }

      navigate({ to: "/account", replace: true });
    };

    complete().catch((e) => {
      console.error("[HARAJ_AUTH_DEBUG] callback crashed", e);
      fail(describeAuthError(e instanceof Error ? e.message : String(e)));
    });
  }, [isNativeBridge, navigate]);



  const [showAppReturn, setShowAppReturn] = useState(false);

  // إن كنا في متصفح خارجي على أندرويد، افتح التطبيق تلقائياً بعد لحظة قصيرة
  // بدل انتظار ضغط المستخدم على الزر، مع إبقاء الزر كخيار احتياطي.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativePlatform()) return;
    if (!/Android/i.test(navigator.userAgent)) return;

    setShowAppReturn(true);
    if (failed) return;

    setStatus("جاري إعادتك إلى التطبيق...");
    const t = window.setTimeout(() => {
      try {
        window.location.href = buildNativeCallbackUrl(window.location.href);
      } catch {
        /* ignore */
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [failed]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
          {failed ? <ShieldCheck className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">إكمال تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-muted-foreground">{status}</p>
        {showAppReturn && (

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = buildNativeCallbackUrl(window.location.href);
              }}
            >
              العودة إلى التطبيق
            </Button>
          </div>
        )}
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
