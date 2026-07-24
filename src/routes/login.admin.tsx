import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, KeyRound } from "lucide-react";

const ADMIN_PIN = "36475";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "تسجيل دخول الإدارة | حراج السعادة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinVerified, setPinVerified] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin && pinVerified) {
      navigate({ to: "/admin" });
    }
  }, [user, isAdmin, loading, navigate, pinVerified]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Do not navigate yet — require PIN
      setPin("");
      setPinAttempts(0);
      setPinOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setPinVerified(true);
      setPinOpen(false);
      toast.success("تم التحقق");
      navigate({ to: "/admin" });
      return;
    }
    const next = pinAttempts + 1;
    setPinAttempts(next);
    setPin("");
    if (next >= 3) {
      await supabase.auth.signOut();
      setPinOpen(false);
      toast.error("رمز خاطئ — تم إلغاء الدخول");
    } else {
      toast.error(`رمز غير صحيح. المحاولات المتبقية: ${3 - next}`);
    }
  };

  const handlePinCancel = async () => {
    await supabase.auth.signOut();
    setPinOpen(false);
    setPin("");
    toast.info("تم إلغاء تسجيل الدخول");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-xl font-black text-primary-foreground">
            S
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">لوحة الإدارة</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            تسجيل دخول المشرفين فقط
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "جاري المعالجة..." : "دخول الإدارة"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          عضو عادي؟{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            تسجيل دخول الأعضاء
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            العودة للموقع
          </Link>
        </p>
      </Card>

      <Dialog
        open={pinOpen}
        onOpenChange={(open) => {
          if (!open) handlePinCancel();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              رمز التحقق الإضافي
            </DialogTitle>
            <DialogDescription>
              أدخل رمز الأمان الخاص بلوحة الإدارة لإكمال تسجيل الدخول.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="•••••"
              className="text-center text-lg tracking-[0.5em]"
              required
            />
            <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
              <Button type="submit" className="flex-1">
                تحقق
              </Button>
              <Button type="button" variant="outline" onClick={handlePinCancel} className="flex-1">
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
