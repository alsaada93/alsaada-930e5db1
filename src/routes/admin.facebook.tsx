import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Facebook,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getFbDashboard,
  manualImport,
  regenerateSecret,
} from "@/lib/facebook-sync.functions";

export const Route = createFileRoute("/admin/facebook")({
  component: FacebookSyncPage,
});

function origin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function FacebookSyncPage() {
  const qc = useQueryClient();
  const fetchDashboard = useServerFn(getFbDashboard);
  const importFn = useServerFn(manualImport);
  const regenFn = useServerFn(regenerateSecret);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fb-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 30000,
  });

  const [copied, setCopied] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [imageUrls, setImageUrls] = useState("");

  const webhookUrl = `${origin()}/api/public/facebook-sync`;
  const secret = data?.webhookSecret ?? "";

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const importMutation = useMutation({
    mutationFn: () =>
      importFn({
        data: {
          text: pasteText,
          images: imageUrls
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter((s) => /^https?:\/\//.test(s)),
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("تم نشر الإعلان من المنشور");
        setPasteText("");
        setImageUrls("");
        qc.invalidateQueries({ queryKey: ["fb-dashboard"] });
      } else {
        toast.error(`فشل الاستيراد: ${res.error ?? ""}`);
      }
    },
    onError: () => toast.error("تعذّر استيراد المنشور"),
  });

  const regenMutation = useMutation({
    mutationFn: () => regenFn(),
    onSuccess: () => {
      toast.success("تم توليد مفتاح جديد");
      qc.invalidateQueries({ queryKey: ["fb-dashboard"] });
    },
    onError: () => toast.error("تعذّر توليد المفتاح"),
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="مزامنة فيسبوك"
        subtitle="استيراد إعلانات مجموعة فيسبوك تلقائياً إلى الموقع"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Facebook className="h-4 w-4" />} label="إجمالي الإعلانات" value={data?.totalAds ?? 0} tone="text-blue-600" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="إعلانات نشطة" value={data?.activeAds ?? 0} tone="text-emerald-600" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="محذوفة / مخفية" value={data?.deletedAds ?? 0} tone="text-muted-foreground" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="استيرادات فاشلة" value={data?.failedImports ?? 0} tone="text-destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">حالة المزامنة</h2>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
              {isRefetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              تحديث
            </Button>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="حالة الواجهة (API)">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                data?.apiStatus === "ok" ? "bg-emerald-500/10 text-emerald-600"
                : data?.apiStatus === "error" ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"}`}>
                {data?.apiStatus === "ok" ? "تعمل" : data?.apiStatus === "error" ? "خطأ" : "في الانتظار"}
              </span>
            </Row>
            <Row label="آخر مزامنة">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {data?.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString("ar") : "—"}
              </span>
            </Row>
          </dl>
        </div>

        {/* Webhook config */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold">رابط الاستقبال (Webhook)</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            استخدم هذا الرابط والمفتاح في أداة الأتمتة (Zapier / Make) لإرسال منشورات المجموعة تلقائياً.
          </p>
          <Field label="عنوان الـ Webhook" value={webhookUrl} copied={copied === "url"} onCopy={() => copy(webhookUrl, "url")} />
          <Field
            label="المفتاح السري (header: x-sync-secret)"
            value={secret}
            copied={copied === "secret"}
            onCopy={() => copy(secret, "secret")}
            mono
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1.5"
            disabled={regenMutation.isPending}
            onClick={() => regenMutation.mutate()}
          >
            {regenMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            توليد مفتاح جديد
          </Button>
        </div>
      </div>

      {/* Manual paste */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-bold">استيراد يدوي من منشور</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          الصق نص المنشور بالتنسيق: الاسم / رقم الهاتف / التصنيف / الوصف — وسيتم اكتشاف التصنيف ونشر الإعلان فوراً.
        </p>
        <Textarea
          dir="rtl"
          rows={6}
          placeholder={"الاسم: محمد\nرقم الهاتف: 33000000\nالتصنيف: سيارات\nالوصف: تويوتا كامري 2018 بحالة ممتازة"}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <Textarea
          dir="ltr"
          rows={2}
          className="mt-2"
          placeholder="روابط الصور (اختياري) — رابط في كل سطر"
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
        />
        <Button
          className="mt-3 gap-1.5"
          disabled={!pasteText.trim() || importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          استيراد ونشر
        </Button>
      </div>

      {/* Logs */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3 text-sm font-semibold">سجل المزامنة</div>
        <div className="max-h-[420px] divide-y overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (data?.recentLogs.length ?? 0) === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">لا يوجد سجل بعد</p>
          )}
          {data?.recentLogs.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {eventLabel(l.event)} {l.fb_post_id ? `· ${l.fb_post_id}` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{l.message ?? ""}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("ar")}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  l.status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                  {l.status === "success" ? "نجح" : "فشل"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function eventLabel(e: string): string {
  return e === "create" ? "إنشاء" : e === "update" ? "تحديث" : e === "delete" ? "حذف" : e === "image" ? "صورة" : e;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Field({
  label, value, copied, onCopy, mono,
}: { label: string; value: string; copied: boolean; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <Input readOnly value={value} dir="ltr" className={mono ? "font-mono text-xs" : "text-xs"} />
        <Button size="icon" variant="outline" onClick={onCopy} className="shrink-0">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className={`flex items-center gap-1.5 text-xs ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
