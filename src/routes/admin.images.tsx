import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageDown, Play, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";

export const Route = createFileRoute("/admin/images")({
  component: ImageOptimizerPage,
});

type LogStatus = "compressed" | "skipped" | "failed";
type LogItem = {
  listingId: string;
  title: string;
  url: string;
  status: LogStatus;
  before?: number;
  after?: number;
  error?: string;
};

type Counters = { compressed: number; skipped: number; failed: number; saved: number };

const BUCKET = "listings";

/** يستخرج المسار داخل الـ bucket من رابط عام للتخزين */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function ImageOptimizerPage() {
  const [running, setRunning] = useState(false);
  const [retryOnly, setRetryOnly] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState("");
  const [log, setLog] = useState<LogItem[]>([]);
  const [counts, setCounts] = useState<Counters>({ compressed: 0, skipped: 0, failed: 0, saved: 0 });
  const cancelRef = useRef(false);

  const addLog = (item: LogItem) => setLog((l) => [item, ...l].slice(0, 400));

  async function processImage(
    listingId: string,
    title: string,
    url: string,
  ): Promise<{ url: string; status: LogStatus; before?: number; after?: number; error?: string }> {
    const path = pathFromPublicUrl(url);
    if (!path) {
      return { url, status: "skipped" };
    }
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const before = blob.size;
      const name = path.split("/").pop() || "image.jpg";
      const original = new File([blob], name, { type: blob.type || "image/jpeg" });

      const compressed = await compressImage(original);
      // لم يتغيّر الحجم → الصورة مضغوطة مسبقاً
      if (compressed === original || compressed.size >= before) {
        return { url, status: "skipped", before, after: before };
      }

      const newPath = `${path.replace(/\.[^./]+$/, "")}-opt.jpg`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, compressed, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const newUrl = supabase.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;
      // حذف الأصل القديم (تجاهل الفشل)
      await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);

      return { url: newUrl, status: "compressed", before, after: compressed.size };
    } catch (e) {
      return { url, status: "failed", error: e instanceof Error ? e.message : "خطأ" };
    }
  }

  async function run(onlyFailed: boolean) {
    setRunning(true);
    setRetryOnly(onlyFailed);
    cancelRef.current = false;
    if (!onlyFailed) {
      setLog([]);
      setCounts({ compressed: 0, skipped: 0, failed: 0, saved: 0 });
    }
    setProgress(0);

    // عند إعادة المحاولة: عالج فقط الإعلانات التي بها صور فشلت سابقاً
    const failedIds = onlyFailed ? new Set(log.filter((l) => l.status === "failed").map((l) => l.listingId)) : null;

    const { data, error } = await supabase
      .from("listings")
      .select("id,title,images")
      .not("images", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("تعذّر جلب الإعلانات");
      setRunning(false);
      return;
    }

    let rows = (data ?? []).filter((r) => Array.isArray(r.images) && (r.images as string[]).length > 0);
    if (failedIds) rows = rows.filter((r) => failedIds.has(String(r.id)));

    const total = rows.length;
    if (total === 0) {
      toast.info(onlyFailed ? "لا توجد صور فاشلة لإعادة رفعها" : "لا توجد صور للمعالجة");
      setRunning(false);
      setProgress(100);
      return;
    }

    let acc: Counters = onlyFailed ? counts : { compressed: 0, skipped: 0, failed: 0, saved: 0 };

    for (let i = 0; i < rows.length; i++) {
      if (cancelRef.current) break;
      const row = rows[i];
      const id = String(row.id);
      const title = String(row.title ?? "إعلان");
      const images = (row.images as string[]) ?? [];
      setCurrent(title);

      const newImages: string[] = [];
      let changed = false;

      for (const url of images) {
        if (cancelRef.current) {
          newImages.push(url);
          continue;
        }
        const r = await processImage(id, title, url);
        newImages.push(r.url);
        if (r.url !== url) changed = true;
        if (r.status === "compressed") {
          acc = {
            ...acc,
            compressed: acc.compressed + 1,
            saved: acc.saved + ((r.before ?? 0) - (r.after ?? 0)),
          };
        } else if (r.status === "skipped") {
          acc = { ...acc, skipped: acc.skipped + 1 };
        } else {
          acc = { ...acc, failed: acc.failed + 1 };
        }
        setCounts({ ...acc });
        addLog({ listingId: id, title, url, status: r.status, before: r.before, after: r.after, error: r.error });
      }

      if (changed) {
        await supabase.from("listings").update({ images: newImages }).eq("id", id);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setCurrent("");
    setRunning(false);
    toast.success(`اكتمل: ${acc.compressed} مضغوطة · ${acc.failed} فاشلة · توفير ${fmt(acc.saved)}`);
  }

  const hasFailed = log.some((l) => l.status === "failed");

  return (
    <div className="space-y-6">
      <AdminHeader title="ضغط الصور" subtitle="ضغط جميع الصور القديمة وإعادة رفعها لتحسين السرعة والفهرسة" />

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => run(false)} disabled={running} className="gap-2">
            {running && !retryOnly ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            بدء ضغط جميع الصور
          </Button>
          <Button
            variant="outline"
            onClick={() => run(true)}
            disabled={running || !hasFailed}
            className="gap-2"
          >
            {running && retryOnly ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            إعادة رفع الصور الفاشلة
          </Button>
          {running && (
            <Button variant="ghost" onClick={() => (cancelRef.current = true)}>
              إيقاف
            </Button>
          )}
        </div>

        {(running || progress > 0) && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              {running ? `جارٍ المعالجة: ${current || "…"} (${progress}%)` : `اكتملت المعالجة (${progress}%)`}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<ImageDown className="h-4 w-4" />} label="مضغوطة" value={counts.compressed} tone="text-emerald-600" />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="متجاوزة" value={counts.skipped} tone="text-muted-foreground" />
          <Stat icon={<AlertTriangle className="h-4 w-4" />} label="فاشلة" value={counts.failed} tone="text-destructive" />
          <Stat icon={<ImageDown className="h-4 w-4" />} label="التوفير" value={fmt(counts.saved)} tone="text-primary" />
        </div>
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">سجل التنفيذ</div>
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {log.map((l, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.status === "compressed" && `${fmt(l.before ?? 0)} ← ${fmt(l.after ?? 0)}`}
                    {l.status === "skipped" && "مضغوطة مسبقاً"}
                    {l.status === "failed" && (l.error ?? "فشل")}
                  </p>
                </div>
                <Badge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <div className={`flex items-center gap-1.5 text-xs ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function Badge({ status }: { status: LogStatus }) {
  const map: Record<LogStatus, { txt: string; cls: string }> = {
    compressed: { txt: "تم الضغط", cls: "bg-emerald-500/10 text-emerald-600" },
    skipped: { txt: "متجاوزة", cls: "bg-muted text-muted-foreground" },
    failed: { txt: "فشل", cls: "bg-destructive/10 text-destructive" },
  };
  const s = map[status];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.txt}</span>;
}
