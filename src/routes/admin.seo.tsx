import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SEO_CONFIG,
  SEO_CONFIG_KEY,
  SEO_PAGES,
  SEO_PAGE_LABELS,
  SITE_ORIGIN,
  mergeSeoConfig,
  type SeoConfig,
  type SeoPageKey,
} from "@/hooks/useSeoConfig";

export const Route = createFileRoute("/admin/seo")({
  component: SeoAdminPage,
});

function SeoAdminPage() {
  const [draft, setDraft] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", SEO_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setDraft(mergeSeoConfig(data?.value as Partial<SeoConfig> | null));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = (page: SeoPageKey, field: "title" | "description", value: string) =>
    setDraft((d) => ({ ...d, [page]: { ...d[page], [field]: value } }));

  const onSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ key: SEO_CONFIG_KEY, value: draft as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("تم حفظ إعدادات SEO");
    } catch {
      toast.error("تعذّر الحفظ، تأكد من صلاحياتك");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  if (loading) {
    return (
      <div>
        <AdminHeader title="تحسين محركات البحث (SEO)" subtitle="عناوين ووصف صفحات أسفل الموقع" />
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="تحسين محركات البحث (SEO)"
        subtitle="عدّل عنوان ووصف كل صفحة في أسفل الموقع لتظهر بشكل أفضل في نتائج قوقل"
      />
      <div className="space-y-5 p-6">
        {SEO_PAGES.map((page) => (
          <div key={page} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold text-card-foreground">{SEO_PAGE_LABELS[page]}</h3>
              <a
                href={`${SITE_ORIGIN}/${page}`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                /{page}
              </a>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold">
                  العنوان (Title) — {draft[page].title.length}/60
                </label>
                <input
                  className={field}
                  maxLength={70}
                  value={draft[page].title}
                  onChange={(e) => set(page, "title", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold">
                  الوصف (Description) — {draft[page].description.length}/160
                </label>
                <textarea
                  className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={180}
                  value={draft[page].description}
                  onChange={(e) => set(page, "description", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </button>
          <button
            onClick={() => setDraft(DEFAULT_SEO_CONFIG)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 font-bold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
}
