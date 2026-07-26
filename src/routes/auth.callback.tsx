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
      const error = params.get("error_description") ?? params.get("error") ?? hashParams.get("error_description") ?? hashParams.get("error");

      if (error) {
        setStatus("تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.");
        setFailed(true);
        return;
      }

      if (isNativeBridge) {
        window.location.href = buildNativeCallbackUrl(currentUrl);
        setStatus("جاري إعادتك إلى التطبيق...");
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setStatus("تعذّر تأكيد جلسة الدخول. حاول مرة أخرى.");
          setFailed(true);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("لم يتم العثور على جلسة دخول صالحة. حاول تسجيل الدخول مرة أخرى.");
        setFailed(true);
        return;
      }

      navigate({ to: "/account", replace: true });
    };

    complete().catch(() => {
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