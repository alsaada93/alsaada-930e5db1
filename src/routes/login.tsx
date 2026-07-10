import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Apple, MessageCircle, Mail } from "lucide-react";
import googleLogo from "@/assets/google-logo.png";
import { isNativePlatform } from "@/lib/capacitor";

// Deep link used by the native Android/iOS app to return from Google OAuth.
const NATIVE_OAUTH_REDIRECT = "harajalsaada://login-callback";

const COUNTRY_CODES = [
  { code: "973", label: "البحرين +973" },
  { code: "966", label: "السعودية +966" },
  { code: "971", label: "الإمارات +971" },
  { code: "965", label: "الكويت +965" },
  { code: "974", label: "قطر +974" },
  { code: "968", label: "عُمان +968" },
];


export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | حراج السعادة Haraj Al Saada" },
      { name: "description", content: "سجّل الدخول أو أنشئ حسابًا لإدارة إعلاناتك على حراج السعادة." },
      { property: "og:title", content: "تسجيل الدخول | حراج السعادة Haraj Al Saada" },
      { property: "og:description", content: "سجّل الدخول أو أنشئ حسابًا على حراج السعادة." },
      { property: "og:url", content: "https://www.alsaada.sale/login" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { methods } = useAuthMethods();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");

  // Keep the selected tab on an enabled method.
  useEffect(() => {
    if (authMethod === "phone" && !methods.whatsapp && methods.email) setAuthMethod("email");
    if (authMethod === "email" && !methods.email && methods.whatsapp) setAuthMethod("phone");
  }, [methods, authMethod]);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Phone (WhatsApp) OTP state
  const requestOtpFn = useServerFn(requestPhoneOtp);
  const verifyOtpFn = useServerFn(verifyPhoneOtp);
  const [dialCode, setDialCode] = useState("973");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);

  const fullPhone = `${dialCode}${phoneLocal.replace(/\D/g, "")}`;

  const handleSendOtp = async () => {
    if (phoneLocal.replace(/\D/g, "").length < 6) {
      toast.error("أدخل رقم هاتف صحيح");
      return;
    }
    setPhoneSubmitting(true);
    try {
      await requestOtpFn({ data: { phone: fullPhone } });
      setOtpSent(true);
      toast.success("تم إرسال رمز التحقق عبر واتساب");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إرسال الرمز");
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("الرمز يجب أن يكون 6 أرقام");
      return;
    }
    setPhoneSubmitting(true);
    try {
      const creds = await verifyOtpFn({ data: { phone: fullPhone, code: otpCode } });
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      toast.success("تم تسجيل الدخول بنجاح");
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التحقق من الرمز");
    } finally {
      setPhoneSubmitting(false);
    }
  };


  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/account" });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    // داخل تطبيق Capacitor نعيد التوجيه إلى deep link التطبيق بدلاً من الموقع.
    if (isNativePlatform()) {
      console.log("[HARAJ_AUTH_DEBUG] native platform: using redirect", NATIVE_OAUTH_REDIRECT);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        console.error("[HARAJ_AUTH_DEBUG] signInWithOAuth error", error);
        toast.error("تعذّر تسجيل الدخول عبر جوجل");
        return;
      }
      console.log("[HARAJ_AUTH_DEBUG] opening OAuth url:", data.url);
      // فتح المتصفح الخارجي للنظام لإكمال تسجيل الدخول ثم العودة عبر deep link.
      window.open(data.url, "_system");
      return;
    }

    console.log("[HARAJ_AUTH_DEBUG] web platform: using redirect", `${window.location.origin}/account`);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/account`,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر جوجل");
    }
  };

  const handleApple = async () => {
    if (isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        toast.error("تعذّر تسجيل الدخول عبر آبل");
        return;
      }
      window.open(data.url, "_system");
      return;
    }
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: `${window.location.origin}/account`,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر آبل");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-xl font-black text-primary-foreground">
            S
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">
            حراج السعادة <span className="text-primary">Haraj Al Saada</span>
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            {mode === "login"
              ? "تسجيل دخول الأعضاء"
              : mode === "signup"
                ? "إنشاء حساب عضو جديد"
                : "استعادة كلمة المرور"}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setAuthMethod("phone")}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
              authMethod === "phone"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            واتساب
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
              authMethod === "email"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            البريد
          </button>
        </div>

        {authMethod === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الهاتف (واتساب)</Label>
              <div className="flex gap-2">
                <Select value={dialCode} onValueChange={setDialCode}>
                  <SelectTrigger className="w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="3300 0000"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  disabled={otpSent}
                />
              </div>
            </div>

            {!otpSent ? (
              <Button
                type="button"
                className="w-full"
                disabled={phoneSubmitting}
                onClick={handleSendOtp}
              >
                {phoneSubmitting ? "جاري الإرسال..." : "إرسال رمز التحقق"}
              </Button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">رمز التحقق (6 أرقام)</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    placeholder="------"
                    className="text-center text-lg tracking-[0.5em]"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={phoneSubmitting}>
                  {phoneSubmitting ? "جاري التحقق..." : "تأكيد الدخول"}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="font-semibold text-muted-foreground hover:underline"
                  >
                    تغيير الرقم
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneSubmitting}
                    className="font-semibold text-primary hover:underline"
                  >
                    إعادة إرسال الرمز
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? "جاري المعالجة..."
              : mode === "login"
                ? "تسجيل الدخول"
                : mode === "signup"
                  ? "إنشاء الحساب"
                  : "إرسال رابط الاستعادة"}
          </Button>
        </form>
        )}



        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">أو</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
                <img src={googleLogo} alt="" width={20} height={20} className="h-5 w-5" loading="lazy" />
                المتابعة عبر جوجل
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleApple}>
                <Apple className="h-5 w-5" />
                المتابعة عبر آبل
              </Button>
            </div>
          </>
        )}

        {authMethod === "email" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-primary hover:underline"
              >
                العودة لتسجيل الدخول
              </button>
            ) : (
              <>
                {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-primary hover:underline"
                >
                  {mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}
                </button>
              </>
            )}
          </p>
        )}


        <p className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            العودة للموقع
          </Link>
        </p>
      </Card>
    </div>
  );
}
