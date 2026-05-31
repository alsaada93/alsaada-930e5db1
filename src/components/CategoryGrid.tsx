import { Link } from "@tanstack/react-router";
import { categories } from "@/data/marketplace";

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">التصنيفات الرئيسية</h2>
          <p className="text-sm text-muted-foreground">تصفّح حسب نوع المعدات والمنتجات</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <button
            key={c.id}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-right shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-2xl transition-transform group-hover:scale-110">
              {c.icon}
            </span>
            <h3 className="font-bold text-card-foreground">{c.name}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            <span className="mt-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {c.count.toLocaleString("ar")} إعلان
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
