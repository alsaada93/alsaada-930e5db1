import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { categories as initial, type Category } from "@/data/marketplace";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>(initial);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...cats];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCats(next);
  };

  const remove = (id: string) => setCats((p) => p.filter((c) => c.id !== id));

  const add = () => {
    const name = prompt("اسم التصنيف الجديد");
    if (!name) return;
    setCats((p) => [
      ...p,
      { id: crypto.randomUUID(), name, icon: "📦", count: 0, description: "تصنيف جديد", sub: [], groups: [] },
    ]);
  };

  const rename = (id: string) => {
    const c = cats.find((x) => x.id === id);
    const name = prompt("تعديل اسم التصنيف", c?.name);
    if (!name) return;
    setCats((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  return (
    <div>
      <AdminHeader title="إدارة التصنيفات" subtitle="أضف، عدّل، احذف وأعد ترتيب التصنيفات" />
      <div className="space-y-4 p-6">
        <div className="flex justify-end">
          <button
            onClick={add}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> إضافة تصنيف
          </button>
        </div>

        <ul className="space-y-2">
          {cats.map((c, idx) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
            >
              <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-card-foreground">{c.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{c.description}</p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold sm:block">
                {c.count.toLocaleString("ar")} إعلان
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => move(idx, -1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="أعلى">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(idx, 1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="أسفل">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button onClick={() => rename(c.id)} className="rounded-lg p-1.5 text-primary hover:bg-accent" aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
