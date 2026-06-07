import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Mail, MessageCircle, Apple } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { adminSetAuthMethods } from "@/lib/admin.functions";
import {
  AUTH_METHODS_KEY,
  DEFAULT_AUTH_METHODS,
  type AuthMethods,
} from "@/hooks/useAuthMethods";
import googleLogo from "@/assets/google-logo.png";

export const Route = createFileRoute("/admin/access")({
  head: () => ({ meta: [{ title: "طرق التسجيل | لوحة التحكم" }] }),
  component: AccessAdminPage,
});

const ROWS: { key: keyof AuthMethods; label: string; desc: string; icon: "wa" | "google" | "apple" | "mail" }[] = [
  { key: "whatsapp", label: "التسجيل عبر واتساب", desc: "إرسال رمز تحقق عبر واتساب للدخول", icon: "wa" },
  { key: "google", label: "التسجيل عبر جوجل (Gmail)", desc: "الدخول بحساب جوجل", icon: "google" },
  { key: "apple", label: "التسجيل عبر آبل", desc: "الدخول بحساب آبل", icon: "apple" },
  { key: "email", label: "التسجيل بالبريد الإلكتروني", desc: "إنشاء حساب ببريد وكلمة مرور", icon: "mail" },
];

function MethodIcon({ icon }: { icon: "wa" | "google" | "apple" | "mail" }) {
  if (icon === "wa") return <MessageCircle className="h-5 w-5 text-[#25D366]" />;
  if (icon === "google") return <img src={googleLogo} alt="" className="h-5 w-5" />;
  if (icon === "apple") return <Apple className="h-5 w-5" />;
  return <Mail className="h-5 w-5" />;
}

function AccessAdminPage() {
  const queryClient = useQueryClient();
  const saveFn = useServerFn(adminSetAuthMethods);
  const [draft, setDraft] = useState<AuthMethods>(DEFAULT_AUTH_METHODS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", AUTH_METHODS_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const v = (data?.value ?? {}) as Partial<AuthMethods>;
        setDraft({ ...DEFAULT_AUTH_METHODS, ...v });
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveFn({ data: draft });
      await queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
      toast.success("تم حفظ طرق التسجيل");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="طرق التسجيل والدخول"
        subtitle="تفعيل أو تعطيل طرق تسجيل الأعضاء في الموقع"
      />
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {ROWS.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <MethodIcon icon={row.icon} />
                  <div>
                    <p className="font-bold text-card-foreground">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={draft[row.key]}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, [row.key]: v }))}
                />
              </div>
            ))}

            <p className="px-1 text-xs text-muted-foreground">
              عند تعطيل جميع الطرق سيظل بإمكان المشرفين الدخول عبر صفحة دخول الإدارة.
            </p>

            <Button onClick={onSave} disabled={saving} className="w-full gap-2 sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التغييرات
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
