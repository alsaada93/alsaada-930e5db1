import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Camera,
  Save,
  ShieldCheck,
  BadgeCheck,
  LogOut,
  RotateCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const VERIFY_WHATSAPP = "97333982383";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | السعادة ماركت" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  verified: boolean;
  verification_status: string;
};

type ListingRow = {
  id: string;
  title: string;
  price: number;
  status: string;
  images: string[] | null;
  published_at: string | null;
  expires_at: string | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  approved: { label: "منشور", cls: "bg-green-500/15 text-green-600" },
  pending: { label: "قيد المراجعة", cls: "bg-amber-500/15 text-amber-600" },
  rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive" },
  expired: { label: "منتهي / محذوف", cls: "bg-muted text-muted-foreground" },
};

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: prof }, { data: rows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("listings")
          .select("id,title,price,status,images,published_at,expires_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setProfile(
        (prof as Profile) ?? {
          id: user.id,
          full_name: "",
          avatar_url: null,
          phone: null,
          whatsapp: null,
          verified: false,
          verification_status: "none",
        },
      );
      setListings((rows as ListingRow[]) ?? []);
      setLoadingData(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const onAvatar = async (file: File | undefined) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const url = supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
    });
    setSaving(false);
    if (error) toast.error("تعذّر الحفظ");
    else toast.success("تم حفظ البيانات");
  };

  const requestVerify = async () => {
    if (!user || !profile) return;
    await supabase.from("profiles").upsert({ id: user.id, verification_status: "requested" });
    setProfile((p) => (p ? { ...p, verification_status: "requested" } : p));
    const msg = encodeURIComponent(
      `مرحباً، أريد توثيق حسابي على السعادة ماركت.\nالاسم: ${profile.full_name ?? ""}\nالبريد: ${user.email ?? ""}`,
    );
    window.open(`https://wa.me/${VERIFY_WHATSAPP}?text=${msg}`, "_blank");
  };

  const repost = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ published_at: new Date().toISOString(), status: "approved" })
      .eq("id", id);
    if (error) {
      toast.error("تعذّرت إعادة النشر");
      return;
    }
    toast.success("تمت إعادة نشر الإعلان لمدة 60 يوماً");
    setListings((p) => p.map((l) => (l.id === id ? { ...l, status: "approved" } : l)));
  };

  if (loading || (user && loadingData)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-extrabold">حسابي</h1>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
        </div>

        {/* بيانات الحساب */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onAvatar(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                تغيير صورة الحساب
              </button>
              <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            </div>
            {profile.verified && (
              <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                <BadgeCheck className="h-4 w-4" /> حساب موثّق
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-semibold">الاسم</label>
              <input
                className={field}
                value={profile.full_name ?? ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">رقم الهاتف</label>
              <input
                className={field}
                value={profile.phone ?? ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold">رقم الواتساب</label>
              <input
                className={field}
                value={profile.whatsapp ?? ""}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ البيانات
            </button>
            {!profile.verified && (
              <button
                onClick={requestVerify}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4" />
                {profile.verification_status === "requested" ? "تم إرسال طلب التوثيق" : "توثيق الحساب عبر واتساب"}
              </button>
            )}
          </div>
        </div>

        {/* إعلاناتي */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">إعلاناتي</h2>
          <Link
            to="/add-listing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> إضافة إعلان
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            لا توجد إعلانات بعد.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {listings.map((l) => {
              const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.expired;
              const canRepost = l.status === "expired" || l.status === "rejected";
              return (
                <li
                  key={l.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center"
                >
                  <img
                    src={l.images?.[0] ?? "/placeholder.svg"}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Link
                      to="/listing/$id"
                      params={{ id: l.id }}
                      className="font-bold hover:text-primary"
                    >
                      {l.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-bold text-primary">{l.price.toLocaleString("ar")} د.ب</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to="/add-listing"
                      search={{ edit: l.id }}
                      className="rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted"
                    >
                      تعديل
                    </Link>
                    {canRepost && (
                      <button
                        onClick={() => repost(l.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                      >
                        <RotateCw className="h-4 w-4" /> إعادة نشر
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
