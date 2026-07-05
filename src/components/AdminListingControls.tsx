import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FolderInput, Pause, Play, Trash2, Tag, Type, Loader2, Phone, BadgeCheck, Flame, CheckCircle2 } from "lucide-react";
import {
  adminUpdateListing,
  adminSetListingStatus,
  adminDeleteListing,
} from "@/lib/admin.functions";
import { useCategories } from "@/hooks/useCategories";

/**
 * لوحة تحكم الأدمن داخل صفحة الإعلان: نقل التصنيف، إيقاف/تفعيل، حذف،
 * تعديل السعر، الاسم، الماركة، رقم الهاتف، الحالة (مستعمل/جديد)،
 * تعليم "تم البيع" و"عرض خاص" — تعمل عبر دوال الأدمن المحمية على الخادم.
 */
export function AdminListingControls({
  item,
}: {
  item: {
    id: string;
    title: string;
    price: number;
    categoryId: string | null;
    status: string;
    brand?: string;
    phone?: string;
    condition?: string;
    isOffer?: boolean;
    sold?: boolean;
  };
}) {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const update = useServerFn(adminUpdateListing);
  const setStatus = useServerFn(adminSetListingStatus);
  const remove = useServerFn(adminDeleteListing);

  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [price, setPrice] = useState(String(item.price ?? 0));
  const [category, setCategory] = useState(item.categoryId ?? "");
  const [brand, setBrand] = useState(item.brand ?? "");
  const [phone, setPhone] = useState(item.phone ?? "");
  const [condition, setCondition] = useState(item.condition === "جديد" ? "جديد" : "مستعمل");
  const suspended = item.status === "suspended";
  const isOffer = Boolean(item.isOffer);
  const sold = Boolean(item.sold);

  const refresh = () =>
    navigate({ to: "/listing/$id", params: { id: item.id } });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error("تعذّر تنفيذ العملية — تأكد من صلاحياتك.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="mb-4 rounded-2xl border border-amber-400/50 bg-amber-50/60 p-3 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
        <Tag className="h-4 w-4" /> أدوات الإدارة
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* تعديل اسم الإعلان */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">اسم الإعلان</label>
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
            />
            <button
              type="button"
              disabled={busy || !title.trim() || title === item.title}
              onClick={() => run(() => update({ data: { id: item.id, title: title.trim() } }), "تم تعديل الاسم")}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <Type className="h-4 w-4" /> حفظ
            </button>
          </div>
        </div>

        {/* تعديل السعر */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">السعر (د.ب)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
            />
            <button
              type="button"
              disabled={busy || price === "" || Number(price) === item.price}
              onClick={() => run(() => update({ data: { id: item.id, price: Math.max(0, Number(price)) } }), "تم تعديل السعر")}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <Tag className="h-4 w-4" /> حفظ
            </button>
          </div>
        </div>

        {/* نقل التصنيف */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">نقل إلى تصنيف</label>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">— اختر تصنيفاً —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !category || category === item.categoryId}
              onClick={() => run(() => update({ data: { id: item.id, category_id: category } }), "تم نقل الإعلان")}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <FolderInput className="h-4 w-4" /> نقل
            </button>
          </div>
        </div>

        {/* إيقاف / تفعيل + حذف */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">إجراءات</label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => setStatus({ data: { id: item.id, status: suspended ? "approved" : "suspended" } }),
                  suspended ? "تم تفعيل الإعلان" : "تم إيقاف الإعلان",
                )
              }
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold hover:bg-accent disabled:opacity-50"
            >
              {suspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {suspended ? "تفعيل" : "إيقاف"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!confirm("هل تريد حذف هذا الإعلان نهائياً؟")) return;
                run(async () => {
                  await remove({ data: { id: item.id } });
                  navigate({ to: "/" });
                }, "تم حذف الإعلان");
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
