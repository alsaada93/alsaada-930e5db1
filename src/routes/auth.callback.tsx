import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildNativeCallbackUrl } from "@/lib/auth-redirects";
import { isNativePlatform } from "@/lib/capacitor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

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
  const [showAppReturn, setShowAppReturn] = useState(false);
  const [nativeReturnUrl, setNativeReturnUrl] = useState<string | null>(null);
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
      const insideNativeApp = isNativePlatform();
      const androidUserAgent = /Android/i.test(navigator.userAgent);
      const shouldReturnToAndroid = isNativeBridge || insideNativeApp;

      console.log("[HARAJ_AUTH_DEBUG] callback reached", {
        pathname: window.location.pathname,
        native_parameter: isNativeBridge,
        inside_native_app: insideNativeApp,
        android_user_agent: androidUserAgent,
        has_code: Boolean(pick("code")),
        has_tokens: Boolean(pick("access_token") && pick("refresh_token")),
      });

      if (error) {
        console.error("[HARAJ_AUTH_DEBUG] callback error", error);
        if (shouldReturnToAndroid) {
          const errorDeepLink = buildNativeCallbackUrl(currentUrl);
          setStatus("جاري إعادتك إلى التطبيق...");
          setNativeReturnUrl(errorDeepLink);
          window.setTimeout(() => {
            console.warn("[HARAJ_AUTH_DEBUG] error deep link did not open the app; showing fallback");
            setShowAppReturn(true);
          }, 2000);
          console.log("[HARAJ_AUTH_DEBUG] forwarding OAuth error to Android app");
          window.location.replace(errorDeepLink);
          return;
        }
        fail(describeAuthError(error), error);
        return;
      }

      const accessToken = pick("access_token");
      const refreshToken = pick("refresh_token");
      const code = pick("code");
      let callbackSession: Session | null = null;

      if (!accessToken && !refreshToken && !code) {
        // The managed broker can store the session before redirecting and then
        // return without exposing a code or tokens in the URL.
        callbackSession = (await supabase.auth.getSession()).data.session;
        if (!callbackSession) {
          fail("رابط تسجيل الدخول غير مكتمل أو منتهي الصلاحية. ابدأ تسجيل الدخول من جديد.");
          return;
        }
        console.log("[HARAJ_AUTH_DEBUG] callback reused broker-created session");
      }

      if (accessToken && refreshToken) {
        console.log("[HARAJ_AUTH_DEBUG] creating session from callback tokens");
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
        console.log("[HARAJ_AUTH_DEBUG] exchanging PKCE authorization code");
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
      let session = callbackSession ?? (await supabase.auth.getSession()).data.session;
      for (let i = 0; !session && i < 5; i++) {
        await new Promise((r) => setTimeout(r, 300));
        session = (await supabase.auth.getSession()).data.session;
      }

      if (!session) {
        fail("لم يتم العثور على جلسة دخول صالحة. حاول تسجيل الدخول مرة أخرى.");
        return;
      }

      console.log("[HARAJ_AUTH_DEBUG] session created", {
        should_return_to_android: shouldReturnToAndroid,
      });

      if (shouldReturnToAndroid) {
        const expiresIn = session.expires_at
          ? Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
          : undefined;
        const deepLink = buildNativeCallbackUrl(currentUrl, {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn,
          tokenType: session.token_type,
        });
        console.log("[HARAJ_AUTH_DEBUG] calling buildNativeCallbackUrl", {
          scheme: "harajalsaada",
          has_code: Boolean(code),
          has_session: true,
        });
        setStatus("جاري إعادتك إلى التطبيق...");
        setNativeReturnUrl(deepLink);
        setShowAppReturn(false);
        window.setTimeout(() => {
          console.warn("[HARAJ_AUTH_DEBUG] deep link did not leave the callback page; showing fallback");
          setShowAppReturn(true);
        }, 2000);
        console.log("[HARAJ_AUTH_DEBUG] attempting Android deep link");
        window.location.replace(deepLink);
        return;
      }

      console.log("[HARAJ_AUTH_DEBUG] web authentication complete; opening account");
      navigate({ to: "/account", replace: true });
    };

    complete().catch((e) => {
      console.error("[HARAJ_AUTH_DEBUG] callback crashed", e);
      fail(describeAuthError(e instanceof Error ? e.message : String(e)));
    });
  }, [isNativeBridge, navigate]);



  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            failed ? "bg-destructive/10 text-destructive" : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {failed ? <AlertTriangle className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {failed ? "تعذّر تسجيل الدخول" : "إكمال تسجيل الدخول"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{status}</p>
        {failed && details && (
          <p className="mt-2 break-words text-xs text-muted-foreground/70">تفاصيل تقنية: {details}</p>
        )}
        {showAppReturn && !failed && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log("[HARAJ_AUTH_DEBUG] retrying Android deep link from fallback button");
                if (nativeReturnUrl) window.location.replace(nativeReturnUrl);
              }}
            >
              العودة إلى التطبيق
            </Button>
          </div>
        )}
        {failed && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/login">إعادة تسجيل الدخول</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">الصفحة الرئيسية</Link>
            </Button>

          </div>
        )}
      </Card>
    </div>
  );
}
