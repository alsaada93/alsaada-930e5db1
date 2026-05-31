import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Pencil, Upload, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { categories, sortBrands } from "@/data/marketplace";

export const Route = createFileRoute("/admin/brands")({
  component: AdminBrandsPage,
});

interface Brand {
  id: string;
  name: string;
  category_id: string;
  item_name: string | null;
}

function catName(id: string) {
  return categories.find((c) => c.id === id)?.name ?? id;
}

function resolveCategoryId(raw: string): string | null {
  const v = raw.trim();
  const byId = categories.find((c) => c.id === v);
  if (byId) return byId.id;
  const byName = categories.find((c) => c.name === v || c.nameEn.toLowerCase() === v.toLowerCase());
  return byName ? byName.id : null;
}

function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("brands")
      .select("id, name, category_id, item_name")
      .order("name");
    setBrands((data as Brand[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return brands
      .filter((b) => (filterCat ? b.category_id === filterCat : true))
      .filter((b) => (q ? b.name.includes(q) || (b.item_name ?? "").includes(q) : true))
      .sort((a, b) => sortBrands([a.name, b.name]).indexOf(a.name) - sortBrands([a.name, b.name]).indexOf(b.name) || a.name.localeCompare(b.name));
  }, [brands, query, filterCat]);

  const addBrand = async () => {
    const name = prompt("اسم الماركة")?.trim();
    if (!name) return;
    const catRaw = prompt(`التصنيف (${categories.map((c) => c.name).join(" / ")})`)?.trim() ?? "";
    const category_id = resolveCategoryId(catRaw);
    if (!category_id) {
      toast.error("تصنيف غير معروف");
      return;
    }
    const item_name = prompt("نوع المنتج (اختياري)")?.trim() || null;
    const { error } = await supabase.from("brands").insert({ name, category_id, item_name });
    if (error) {
      toast.error("تعذّر الإضافة");
      return;
    }
    toast.success("تمت إضافة الماركة");
    load();
  };

  const editBrand = async (b: Brand) => {
    const name = prompt("تعديل اسم الماركة", b.name)?.trim();
    if (!name) return;
    const item_name = prompt("نوع المنتج (اختياري)", b.item_name ?? "")?.trim() || null;
    const { error } = await supabase.from("brands").update({ name, item_name }).eq("id", b.id);
    if (error) {
      toast.error("تعذّر التعديل");
      return;
    }
    toast.success("تم التعديل");
    load();
  };

  const removeBrand = async (id: string) => {
    if (!confirm("حذف هذه الماركة؟")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر الحذف");
      return;
    }
    setBrands((p) => p.filter((b) => b.id !== id));
  };

  const importCsv = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const rows: { name: string; category_id: string; item_name: string | null }[] = [];
      let skipped = 0;
      for (const line of lines) {
        const cols = line.split(",").map((c) => c.trim());
        // skip header row
        if (/^(name|اسم|الماركة|brand)$/i.test(cols[0])) continue;
        const name = cols[0];
        const category_id = resolveCategoryId(cols[1] ?? "");
        const item_name = cols[2] || null;
        if (!name || !category_id) {
          skipped++;
          continue;
        }
        rows.push({ name, category_id, item_name });
      }
      if (!rows.length) {
        toast.error("لا توجد صفوف صالحة في الملف");
        return;
      }
      const { error } = await supabase.from("brands").insert(rows);
      if (error) throw error;
      toast.success(`تم استيراد ${rows.length} ماركة${skipped ? ` (تم تجاهل ${skipped})` : ""}`);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("تعذّر استيراد الملف");
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div>
      <AdminHeader title="إدارة الماركات" subtitle="أضف، عدّل، احذف الماركات واربطها بنوع المنتج، مع استيراد CSV" />
      <div className="space-y-4 p-6">
        <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(e) => importCsv(e.target.files)} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن ماركة أو نوع منتج"
              className="h-10 w-full rounded-lg border border-border bg-background pe-9 ps-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold hover:bg-accent disabled:opacity-60"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} استيراد CSV
          </button>
          <button
            onClick={addBrand}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> إضافة ماركة
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          صيغة ملف CSV: <code className="rounded bg-muted px-1">name,category_id,item_name</code> — مثال:{" "}
          <code className="rounded bg-muted px-1">Samsung,electronics,هواتف ذكية</code>. يمكن استخدام اسم التصنيف بالعربية أيضاً.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا توجد ماركات بعد. أضف ماركة أو استورد ملف CSV.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-card-foreground">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {catName(b.category_id)}{b.item_name ? ` • ${b.item_name}` : ""}
                  </p>
                </div>
                <button onClick={() => editBrand(b)} className="rounded-lg p-1.5 text-primary hover:bg-accent" aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => removeBrand(b.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">إجمالي: {filtered.length} ماركة</p>
      </div>
    </div>
  );
}
