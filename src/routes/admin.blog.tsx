import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Search, X, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminListPosts,
  adminUpsertPost,
  adminDeletePost,
  adminGenerateArticles,
  type BlogPost,
} from "@/lib/blog.functions";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlogPage,
});

interface FormState {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  published: boolean;
}

const EMPTY: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "",
  meta_title: "",
  meta_description: "",
  keywords: "",
  published: true,
};

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function AdminBlogPage() {
  const list = useServerFn(adminListPosts);
  const upsert = useServerFn(adminUpsertPost);
  const remove = useServerFn(adminDeletePost);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await list();
      setPosts(data);
    } catch {
      toast.error("تعذّر تحميل المقالات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return posts;
    return posts.filter(
      (p) => p.title.includes(q) || p.slug.includes(q) || (p.category ?? "").includes(q),
    );
  }, [posts, query]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("العنوان مطلوب");
    const slug = editing.slug.trim() || slugify(editing.title);
    setSaving(true);
    try {
      await upsert({
        data: {
          id: editing.id,
          slug,
          title: editing.title.trim(),
          excerpt: editing.excerpt.trim() || null,
          content: editing.content,
          cover_image: editing.cover_image.trim() || null,
          category: editing.category.trim() || null,
          meta_title: editing.meta_title.trim() || null,
          meta_description: editing.meta_description.trim() || null,
          keywords: editing.keywords.trim() || null,
          published: editing.published,
        },
      });
      toast.success("تم الحفظ");
      setEditing(null);
      await load();
    } catch {
      toast.error("تعذّر الحفظ — تأكد أن الرابط غير مكرر");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("حذف هذا المقال نهائياً؟")) return;
    try {
      await remove({ data: { id } });
      setPosts((p) => p.filter((x) => x.id !== id));
      toast.success("تم الحذف");
    } catch {
      toast.error("تعذّر الحذف");
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await upsert({
        data: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          cover_image: post.cover_image,
          category: post.category,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          keywords: post.keywords,
          published: !post.published,
        },
      });
      await load();
    } catch {
      toast.error("تعذّر تحديث الحالة");
    }
  };

  return (
    <>
      <AdminHeader title="إدارة المدونة" subtitle="إضافة وتعديل المقالات وتحسين SEO" />
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64 pe-9"
            />
          </div>
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="h-4 w-4" />
            مقال جديد
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">لا توجد مقالات بعد.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-start font-semibold">التصنيف</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-card-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(p)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {p.published ? "منشور" : "مسودة"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setEditing({
                              id: p.id,
                              slug: p.slug,
                              title: p.title,
                              excerpt: p.excerpt ?? "",
                              content: p.content,
                              cover_image: p.cover_image ?? "",
                              category: p.category ?? "",
                              meta_title: p.meta_title ?? "",
                              meta_description: p.meta_description ?? "",
                              keywords: p.keywords ?? "",
                              published: p.published,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => del(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                {editing.id ? "تعديل المقال" : "مقال جديد"}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing((s) =>
                      s
                        ? {
                            ...s,
                            title: e.target.value,
                            slug: s.id ? s.slug : slugify(e.target.value),
                          }
                        : s,
                    )
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>الرابط (slug)</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, slug: e.target.value } : s))
                    }
                  />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Input
                    value={editing.category}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, category: e.target.value } : s))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>المقتطف</Label>
                <Textarea
                  rows={2}
                  value={editing.excerpt}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, excerpt: e.target.value } : s))
                  }
                />
              </div>
              <div>
                <Label>المحتوى</Label>
                <Textarea
                  rows={8}
                  value={editing.content}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, content: e.target.value } : s))
                  }
                />
              </div>
              <div>
                <Label>رابط صورة الغلاف</Label>
                <Input
                  value={editing.cover_image}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, cover_image: e.target.value } : s))
                  }
                />
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 text-sm font-bold text-card-foreground">تحسين محركات البحث (SEO)</p>
                <div className="space-y-3">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={editing.meta_title}
                      onChange={(e) =>
                        setEditing((s) => (s ? { ...s, meta_title: e.target.value } : s))
                      }
                    />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      rows={2}
                      value={editing.meta_description}
                      onChange={(e) =>
                        setEditing((s) => (s ? { ...s, meta_description: e.target.value } : s))
                      }
                    />
                  </div>
                  <div>
                    <Label>الكلمات المفتاحية (مفصولة بفاصلة)</Label>
                    <Input
                      value={editing.keywords}
                      onChange={(e) =>
                        setEditing((s) => (s ? { ...s, keywords: e.target.value } : s))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.published}
                  onCheckedChange={(v) =>
                    setEditing((s) => (s ? { ...s, published: v } : s))
                  }
                />
                <Label>منشور</Label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                إلغاء
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
