import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Save,
  Loader2,
  ImagePlus,
  X,
  Smile,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { categories as initial, type Category, type SubCategory } from "@/data/marketplace";
import { saveCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { deleteStorageImage } from "@/lib/storage";

async function uploadCategoryIcon(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("listings")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
}

function isImageIcon(icon: string | undefined): boolean {
  return !!icon && (icon.startsWith("http") || icon.startsWith("/") || icon.startsWith("data:"));
}

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

function reorder<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const target = index + dir;
  if (target < 0 || target >= next.length) return arr;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>(initial);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [iconUploading, setIconUploading] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const iconInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const imageInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "categories")
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value as Category[] | null | undefined;
        if (Array.isArray(value) && value.length > 0) setCats(value);
        setLoaded(true);
      });
  }, []);

  const persist = async () => {
    setSaving(true);
    try {
      await saveCategories(cats);
      toast.success("تم حفظ التصنيفات");
    } catch {
      toast.error("تعذّر الحفظ. تأكد من صلاحيات المدير.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Category level ----
  const moveCat = (i: number, d: -1 | 1) => setCats((p) => reorder(p, i, d));
  const removeCat = (id: string) => setCats((p) => p.filter((c) => c.id !== id));
  const addCat = () => {
    const name = prompt("اسم التصنيف الجديد");
    if (!name) return;
    setCats((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        name,
        nameEn: name,
        icon: "📦",
        count: 0,
        description: "تصنيف جديد",
        descriptionEn: "New category",
        sub: [],
        groups: [],
        brands: [],
      },
    ]);
  };
  const renameCat = (id: string) => {
    const c = cats.find((x) => x.id === id);
    const name = prompt("تعديل اسم التصنيف", c?.name);
    if (!name) return;
    setCats((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
  };
  const setCatIcon = (id: string, icon: string) =>
    setCats((p) => p.map((x) => (x.id === id ? { ...x, icon } : x)));
  const setEmojiIcon = (id: string) => {
    const c = cats.find((x) => x.id === id);
    const emoji = prompt("ضع رمز/إيموجي للتصنيف", isImageIcon(c?.icon) ? "📦" : c?.icon);
    if (emoji === null) return;
    setCatIcon(id, emoji.trim() || "📦");
  };
  const uploadIcon = async (id: string, file: File) => {
    setIconUploading(id);
    try {
      const url = await uploadCategoryIcon(file);
      setCatIcon(id, url);
      toast.success("تم تحديث صورة التصنيف");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setIconUploading(null);
    }
  };
  const clearIcon = (id: string) => setCatIcon(id, "📦");
  const setCatImage = (id: string, image: string | undefined) =>
    setCats((p) => p.map((x) => (x.id === id ? { ...x, image } : x)));
  const uploadImage = async (id: string, file: File) => {
    setImageUploading(id);
    try {
      const prev = cats.find((x) => x.id === id)?.image;
      const url = await uploadCategoryIcon(file);
      setCatImage(id, url);
      await deleteStorageImage(prev);
      toast.success("تم تحديث صورة القسم");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setImageUploading(null);
    }
  };
  const clearImage = async (id: string) => {
    const prev = cats.find((x) => x.id === id)?.image;
    setCatImage(id, undefined);
    await deleteStorageImage(prev);
  };
  const toggleHidden = (id: string) =>
    setCats((p) => p.map((x) => (x.id === id ? { ...x, hidden: !x.hidden } : x)));

  // ---- Group (sub-category) level ----
  const updateGroups = (catId: string, fn: (g: SubCategory[]) => SubCategory[]) =>
    setCats((p) =>
      p.map((c) =>
        c.id === catId ? { ...c, groups: fn(c.groups), sub: fn(c.groups).map((x) => x.name) } : c,
      ),
    );

  const addGroup = (catId: string) => {
    const name = prompt("اسم التصنيف الفرعي");
    if (!name) return;
    updateGroups(catId, (g) => [...g, { name, items: [] }]);
  };
  const renameGroup = (catId: string, name: string) => {
    const next = prompt("تعديل اسم التصنيف الفرعي", name);
    if (!next) return;
    updateGroups(catId, (g) => g.map((x) => (x.name === name ? { ...x, name: next } : x)));
  };
  const removeGroup = (catId: string, name: string) =>
    updateGroups(catId, (g) => g.filter((x) => x.name !== name));
  const moveGroup = (catId: string, i: number, d: -1 | 1) =>
    updateGroups(catId, (g) => reorder(g, i, d));

  // ---- Item level ----
  const updateItems = (catId: string, groupName: string, fn: (items: string[]) => string[]) =>
    updateGroups(catId, (g) =>
      g.map((x) => (x.name === groupName ? { ...x, items: fn(x.items) } : x)),
    );

  const addItem = (catId: string, groupName: string) => {
    const name = prompt("اسم النوع");
    if (!name) return;
    updateItems(catId, groupName, (it) => [...it, name]);
  };
  const renameItem = (catId: string, groupName: string, name: string) => {
    const next = prompt("تعديل النوع", name);
    if (!next) return;
    updateItems(catId, groupName, (it) => it.map((x) => (x === name ? next : x)));
  };
  const removeItem = (catId: string, groupName: string, name: string) =>
    updateItems(catId, groupName, (it) => it.filter((x) => x !== name));
  const moveItem = (catId: string, groupName: string, i: number, d: -1 | 1) =>
    updateItems(catId, groupName, (it) => reorder(it, i, d));

  return (
    <div>
      <AdminHeader
        title="إدارة التصنيفات"
        subtitle="عدّل التصنيفات والتصنيفات الفرعية والأنواع وأعد ترتيبها"
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={addCat}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> إضافة تصنيف
          </button>
          <button
            onClick={persist}
            disabled={saving || !loaded}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            حفظ التغييرات
          </button>
        </div>

        <ul className="space-y-2">
          {cats.map((c, idx) => {
            const expanded = openCat === c.id;
            return (
              <li
                key={c.id}
                className={`rounded-2xl border border-border bg-card shadow-card ${c.hidden ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => setOpenCat(expanded ? null : c.id)}
                    className="rounded-lg p-1.5 hover:bg-muted"
                    aria-label="فتح"
                  >
                    <ChevronLeft
                      className={`h-4 w-4 transition-transform ${expanded ? "-rotate-90" : ""}`}
                    />
                  </button>
                  <div className="relative shrink-0">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-accent text-lg">
                      {iconUploading === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isImageIcon(c.icon) ? (
                        <img src={c.icon} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.icon
                      )}
                    </span>
                    <input
                      ref={(el) => {
                        iconInputs.current[c.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadIcon(c.id, f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-bold text-card-foreground">
                      {c.name}
                      {c.hidden && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          مخفي
                        </span>
                      )}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.groups.length} تصنيف فرعي
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => iconInputs.current[c.id]?.click()}
                      className="rounded-lg p-1.5 text-primary hover:bg-accent"
                      aria-label="تغيير الصورة"
                      title="رفع صورة للتصنيف"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEmojiIcon(c.id)}
                      className="rounded-lg p-1.5 text-primary hover:bg-accent"
                      aria-label="إيموجي"
                      title="استخدام رمز/إيموجي"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    {isImageIcon(c.icon) && (
                      <button
                        onClick={() => clearIcon(c.id)}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label="حذف الصورة"
                        title="حذف الصورة"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => moveCat(idx, -1)}
                      className="rounded-lg p-1.5 hover:bg-muted"
                      aria-label="أعلى"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveCat(idx, 1)}
                      className="rounded-lg p-1.5 hover:bg-muted"
                      aria-label="أسفل"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleHidden(c.id)}
                      className={`rounded-lg p-1.5 hover:bg-accent ${c.hidden ? "text-muted-foreground" : "text-primary"}`}
                      aria-label={c.hidden ? "إظهار" : "إخفاء"}
                      title={c.hidden ? "إظهار التصنيف في الصفحة الرئيسية" : "إخفاء التصنيف من الصفحة الرئيسية"}
                    >
                      {c.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => renameCat(c.id)}
                      className="rounded-lg p-1.5 text-primary hover:bg-accent"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeCat(c.id)}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-2 border-t border-border p-3 ps-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => addGroup(c.id)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-bold"
                      >
                        <Plus className="h-3.5 w-3.5" /> تصنيف فرعي
                      </button>
                    </div>
                    {c.groups.map((g, gi) => {
                      const gOpen = openGroup === `${c.id}:${g.name}`;
                      return (
                        <div key={g.name} className="rounded-xl border border-border">
                          <div className="flex items-center gap-2 p-2">
                            <button
                              onClick={() => setOpenGroup(gOpen ? null : `${c.id}:${g.name}`)}
                              className="rounded p-1 hover:bg-muted"
                              aria-label="فتح"
                            >
                              <ChevronLeft
                                className={`h-3.5 w-3.5 transition-transform ${gOpen ? "-rotate-90" : ""}`}
                              />
                            </button>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                              {g.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {g.items.length} نوع
                            </span>
                            <button
                              onClick={() => moveGroup(c.id, gi, -1)}
                              className="rounded p-1 hover:bg-muted"
                              aria-label="أعلى"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveGroup(c.id, gi, 1)}
                              className="rounded p-1 hover:bg-muted"
                              aria-label="أسفل"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => renameGroup(c.id, g.name)}
                              className="rounded p-1 text-primary hover:bg-accent"
                              aria-label="تعديل"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeGroup(c.id, g.name)}
                              className="rounded p-1 text-destructive hover:bg-destructive/10"
                              aria-label="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {gOpen && (
                            <div className="space-y-1 border-t border-border p-2 ps-5">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => addItem(c.id, g.name)}
                                  className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-bold"
                                >
                                  <Plus className="h-3 w-3" /> نوع
                                </button>
                              </div>
                              {g.items.map((it, ii) => (
                                <div
                                  key={it}
                                  className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1"
                                >
                                  <span className="min-w-0 flex-1 truncate text-xs">{it}</span>
                                  <button
                                    onClick={() => moveItem(c.id, g.name, ii, -1)}
                                    className="rounded p-0.5 hover:bg-muted"
                                    aria-label="أعلى"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => moveItem(c.id, g.name, ii, 1)}
                                    className="rounded p-0.5 hover:bg-muted"
                                    aria-label="أسفل"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => renameItem(c.id, g.name, it)}
                                    className="rounded p-0.5 text-primary hover:bg-accent"
                                    aria-label="تعديل"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => removeItem(c.id, g.name, it)}
                                    className="rounded p-0.5 text-destructive hover:bg-destructive/10"
                                    aria-label="حذف"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
