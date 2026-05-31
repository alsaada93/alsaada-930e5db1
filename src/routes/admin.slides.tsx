import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ImagePlus, ChevronUp, ChevronDown, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import type { HeroSlide } from "@/hooks/useHeroSlides";

export const Route = createFileRoute("/admin/slides")({
  component: AdminSlidesPage,
});

function AdminSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [intervalSec, setIntervalSec] = useState(4);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data: rows }, { data: setting }] = await Promise.all([
      supabase.from("hero_slides").select("*").order("sort_order"),
      supabase.from("site_settings").select("value").eq("key", "hero").maybeSingle(),
    ]);
    setSlides((rows as HeroSlide[]) ?? []);
    const v = setting?.value as { intervalMs?: number } | undefined;
    if (v?.intervalMs) setIntervalSec(Math.round(v.intervalMs / 1000));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `hero/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const url = supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
      const { error: insErr } = await supabase.from("hero_slides").insert({
        image_url: url,
        sort_order: slides.length,
        active: true,
      });
      if (insErr) throw insErr;
      toast.success("تمت إضافة الصورة");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const updateSlide = async (id: string, patch: Partial<HeroSlide>) => {
    setSlides((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await supabase.from("hero_slides").update(patch).eq("id", id);
    if (error) toast.error("تعذّر الحفظ");
  };

  const removeSlide = async (id: string) => {
    setSlides((p) => p.filter((s) => s.id !== id));
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else toast.success("تم الحذف");
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
    await Promise.all(next.map((s, i) => supabase.from("hero_slides").update({ sort_order: i }).eq("id", s.id)));
  };

  const saveInterval = async () => {
    const ms = Math.max(1, intervalSec) * 1000;
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "hero", value: { intervalMs: ms } }, { onConflict: "key" });
    if (error) toast.error("تعذّر حفظ المدة");
    else toast.success("تم حفظ مدة التبديل");
  };

  return (
    <div>
      <AdminHeader title="صور العرض المتحركة" subtitle="أضف صورًا تتبدل تلقائيًا في أعلى الصفحة وتحكّم بمدة التبديل" />
      <div className="space-y-6 p-6">
        {/* Interval control */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div>
            <label className="mb-1 block text-sm font-semibold">مدة تبديل الصورة (بالثواني)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              className="h-11 w-40 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={saveInterval}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
          >
            <Save className="h-4 w-4" /> حفظ المدة
          </button>
        </div>

        {/* Add image */}
        <div className="flex justify-end">
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files)} />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} إضافة صورة
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : slides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <ImagePlus className="mx-auto mb-2 h-8 w-8" />
            لا توجد صور بعد. اضغط «إضافة صورة» للبدء.
          </div>
        ) : (
          <ul className="space-y-3">
            {slides.map((s, idx) => (
              <li key={s.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center">
                <img src={s.image_url} alt="" className="h-24 w-40 shrink-0 rounded-lg object-cover" />
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    defaultValue={s.title ?? ""}
                    placeholder="العنوان (اختياري)"
                    onBlur={(e) => updateSlide(s.id, { title: e.target.value || null })}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    defaultValue={s.subtitle ?? ""}
                    placeholder="الوصف الفرعي (اختياري)"
                    onBlur={(e) => updateSlide(s.id, { subtitle: e.target.value || null })}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => move(idx, -1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="أعلى">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(idx, 1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="أسفل">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateSlide(s.id, { active: !s.active })}
                    className={`rounded-lg p-1.5 hover:bg-accent ${s.active ? "text-primary" : "text-muted-foreground"}`}
                    aria-label="إظهار/إخفاء"
                  >
                    {s.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => removeSlide(s.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
