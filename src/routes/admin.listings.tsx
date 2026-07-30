import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, MapPin, Trash2, Pause, Star, Loader2, Pencil, FolderSync } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  adminListListings,
  adminListingsCounts,
  adminSetListingStatus,
  adminUpdateListing,
  adminDeleteListing,
  adminReclassifyListings,
  adminReprocessListings,
  type AdminListingRow,
} from "@/lib/admin.functions";
import { useCategories } from "@/hooks/useCategories";
import type { Category } from "@/data/marketplace";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
});

type Status = "pending" | "approved" | "rejected" | "suspended";

const tabs: { key: Status | "all"; label: string }[] = [
  { key: "pending", label: "بانتظار المراجعة" },
  { key: "approved", label: "مقبولة" },
  { key: "rejected", label: "مرفوضة" },
  { key: "suspended", label: "موقوفة" },
  { key: "all", label: "الكل" },
];

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-accent text-accent-foreground" },
  approved: { label: "مقبول", cls: "bg-chart-3/15 text-chart-3" },
  rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive" },
  suspended: { label: "موقوف", cls: "bg-muted text-muted-foreground" },
};

function AdminListingsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListListings);
  const countsFn = useServerFn(adminListingsCounts);
  const setStatusFn = useServerFn(adminSetListingStatus);
  const updateFn = useServerFn(adminUpdateListing);
  const deleteFn = useServerFn(adminDeleteListing);
  const reclassifyFn = useServerFn(adminReclassifyListings);
  const reprocessFn = useServerFn(adminReprocessListings);
  const { categories } = useCategories();

  const [tab, setTab] = useState<Status | "all">("pending");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminListingRow | null>(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const {
    data: pagesData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["admin-listings", tab, debounced],
    queryFn: ({ pageParam }) =>
      list({
        data: {
          status: tab,
          query: debounced || undefined,
          limit: 20,
          offset: pageParam ?? 0,
        },
      }),
    initialPageParam: 0 as number,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });

  const { data: countsData } = useQuery({
    queryKey: ["admin-listings-counts"],
    queryFn: () => countsFn(),
  });

  const items = pagesData?.pages.flatMap((p) => p.items) ?? [];

  const doReprocess = async () => {
    if (!confirm("معالجة عميقة لجميع الإعلانات: إصلاح العناوين والأسعار والتصنيف ومواصفات السيارات تلقائياً؟")) return;
    setReprocessing(true);
    try {
      const res = await reprocessFn({ data: { onlyBot: false } });
      toast.success(`تمت معالجة ${res.updated.toLocaleString("ar")} إعلان من ${res.scanned.toLocaleString("ar")}`);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch {
      toast.error("تعذّرت المعالجة العميقة");
    } finally {
      setReprocessing(false);
    }
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-listings"] });

  const doReclassify = async () => {
    if (!confirm("إعادة تصنيف جميع الإعلانات تلقائياً ووضع كل إعلان في قسمه الصحيح؟")) return;
    setReclassifying(true);
    try {
      const res = await reclassifyFn({ data: { onlyUncategorized: false } });
      toast.success(`تمت إعادة تصنيف ${res.updated.toLocaleString("ar")} إعلان من ${res.scanned.toLocaleString("ar")}`);
      refresh();
    } catch {
      toast.error("تعذّرت إعادة التصنيف");
    } finally {
      setReclassifying(false);
    }
  };

  const counts = (k: Status | "all") =>
    countsData ? (k === "all" ? countsData.all : countsData[k]) : 0;

  const doStatus = async (id: string, status: Status) => {
    let reason: string | undefined;
    if (status === "rejected") {
      const r = prompt("سبب الرفض (سيصل للمعلن):", "");
      if (r === null) return;
      reason = r.trim() || undefined;
    }
    setBusy(id);
    try {
      await setStatusFn({ data: { id, status, reason } });
      toast.success("تم تحديث حالة الإعلان");
      refresh();
    } catch {
      toast.error("تعذّر التحديث");
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("تم حذف الإعلان");
      refresh();
    } catch {
      toast.error("تعذّر الحذف");
    } finally {
      setBusy(null);
    }
  };

  const toggleFeatured = async (i: AdminListingRow) => {
    setBusy(i.id);
    try {
      await updateFn({ data: { id: i.id, featured: !i.featured } });
      refresh();
    } catch {
      toast.error("تعذّر التحديث");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHeader title="إدارة الإعلانات" subtitle="راجع، عدّل، أوقف أو احذف أي إعلان" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {t.label} ({counts(t.key).toLocaleString("ar")})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={doReclassify}
              disabled={reclassifying}
              title="إعادة تصنيف جميع الإعلانات تلقائياً"
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {reclassifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
              إعادة التصنيف التلقائي
            </button>
            <button
              onClick={doReprocess}
              disabled={reprocessing}
              title="معالجة عميقة: إصلاح العناوين والأسعار والمواصفات والتصنيف"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {reprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
              معالجة عميقة
            </button>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث بالعنوان أو البائع..."
                className="h-9 w-64 rounded-lg border border-input bg-card pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {isLoading ? (
            <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
            </p>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">لا توجد إعلانات في هذا القسم</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((i: AdminListingRow) => (
                <li key={i.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img
                    src={i.image ?? "/placeholder.svg"}
                    alt={i.title}
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-[180px] flex-1">
                    <h3 className="font-bold text-card-foreground">{i.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{i.price.toLocaleString("ar")} د.ب</span>
                      {i.old_price != null && (
                        <span className="text-muted-foreground line-through">{i.old_price.toLocaleString("ar")}</span>
                      )}
                      {i.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {i.city}
                        </span>
                      )}
                      {i.contact_name && <span>• {i.contact_name}</span>}
                      {i.listing_type === "auction" && <span>• مزاد</span>}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[i.status]?.cls ?? "bg-muted"}`}>
                    {statusBadge[i.status]?.label ?? i.status}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => doStatus(i.id, "approved")}
                      disabled={busy === i.id || i.status === "approved"}
                      className="flex items-center gap-1 rounded-lg bg-chart-3/15 px-3 py-1.5 text-sm font-semibold text-chart-3 transition-colors hover:bg-chart-3/25 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" /> قبول
                    </button>
                    <button
                      onClick={() => doStatus(i.id, "rejected")}
                      disabled={busy === i.id || i.status === "rejected"}
                      className="flex items-center gap-1 rounded-lg bg-destructive/15 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-40"
                    >
                      <X className="h-4 w-4" /> رفض
                    </button>
                    <button
                      onClick={() => doStatus(i.id, "suspended")}
                      disabled={busy === i.id || i.status === "suspended"}
                      className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/70 disabled:opacity-40"
                    >
                      <Pause className="h-4 w-4" /> إيقاف
                    </button>
                    <button
                      onClick={() => toggleFeatured(i)}
                      disabled={busy === i.id}
                      title="مميز"
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
                        i.featured ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(i)}
                      disabled={busy === i.id}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <Pencil className="h-4 w-4" /> تعديل
                    </button>
                    <button
                      onClick={() => doDelete(i.id)}
                      disabled={busy === i.id}
                      className="flex items-center gap-1 rounded-lg bg-destructive/15 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" /> حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasNextPage && (
          <div className="flex justify-center pt-3">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isFetchingNextPage ? "جاري التحميل..." : "عرض 20 إعلان آخر"}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditDialog
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await updateFn({ data: { id: editing.id, ...patch } });
              toast.success("تم حفظ التعديلات");
              setEditing(null);
              refresh();
            } catch {
              toast.error("تعذّر الحفظ");
            }
          }}
        />
      )}
    </div>
  );
}

interface EditPatch {
  title?: string;
  description?: string | null;
  price?: number;
  old_price?: number | null;
  condition?: string | null;
  city?: string | null;
  category_id?: string | null;
  group_name?: string | null;
  item_name?: string | null;
  brand?: string | null;
  status?: "approved" | "rejected" | "suspended" | "pending";
  negotiable_flag?: boolean;
  delivery_available?: boolean;
  images?: string[];
}

function EditDialog({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: AdminListingRow;
  categories: Category[];
  onClose: () => void;
  onSave: (patch: EditPatch) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [oldPrice, setOldPrice] = useState(item.old_price != null ? String(item.old_price) : "");
  const [condition, setCondition] = useState(item.condition ?? "مستعمل");
  const [city, setCity] = useState(item.city ?? "");
  const [brand, setBrand] = useState(item.brand ?? "");
  const [categoryId, setCategoryId] = useState(item.category_id ?? "");
  const [groupName, setGroupName] = useState(item.group_name ?? "");
  const [itemName, setItemName] = useState(item.item_name ?? "");
  const [status, setStatus] = useState(item.status);
  const [negotiable, setNegotiable] = useState(item.negotiable_flag);
  const [delivery, setDelivery] = useState(item.delivery_available);
  const [images, setImages] = useState<string[]>(item.images ?? []);
  const [saving, setSaving] = useState(false);

  const activeCat = categories.find((c) => c.id === categoryId);
  const activeGroup = activeCat?.groups.find((g) => g.name === groupName);

  const field =
    "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-card-foreground">تعديل شامل للإعلان</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-card-foreground sm:col-span-2">
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-card-foreground sm:col-span-2">
            الوصف
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            السعر الحالي (د.ب)
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            السعر السابق (اختياري)
            <input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className={field} />
          </label>

          <label className="block text-sm font-semibold text-card-foreground">
            القسم الرئيسي (نقل)
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setGroupName("");
                setItemName("");
              }}
              className={field}
            >
              <option value="">— بدون قسم —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            القسم الفرعي
            <select
              value={groupName}
              disabled={!activeCat}
              onChange={(e) => {
                setGroupName(e.target.value);
                setItemName("");
              }}
              className={`${field} disabled:opacity-50`}
            >
              <option value="">— بدون —</option>
              {activeCat?.groups.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            النوع
            <select
              value={itemName}
              disabled={!activeGroup}
              onChange={(e) => setItemName(e.target.value)}
              className={`${field} disabled:opacity-50`}
            >
              <option value="">— بدون —</option>
              {activeGroup?.items.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            الماركة
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            الموقع / المدينة
            <input value={city} onChange={(e) => setCity(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            الحالة (جديد/مستعمل)
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>
              <option value="جديد">جديد</option>
              <option value="مستعمل">مستعمل</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            حالة النشر
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
              <option value="suspended">موقوف</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold">
            قابل للتفاوض
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold">
            التوصيل متاح
            <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="h-4 w-4 accent-primary" />
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-card-foreground">الصور</span>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {images.map((url, i) => (
                <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={url} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 right-1 rounded bg-primary/90 px-1 text-[9px] font-bold text-primary-foreground">
                      الغلاف
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute left-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                    aria-label="حذف الصورة"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setImages((p) => {
                          const arr = [...p];
                          const [m] = arr.splice(i, 1);
                          arr.unshift(m);
                          return arr;
                        })
                      }
                      className="absolute bottom-1 left-1 rounded bg-primary/90 px-1 text-[9px] font-bold text-primary-foreground"
                    >
                      للغلاف
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-muted">
            إلغاء
          </button>
          <button
            disabled={saving}
            onClick={() => {
              setSaving(true);
              onSave({
                title: title.trim(),
                description: description.trim() || null,
                price: Number(price) || 0,
                old_price: oldPrice.trim() === "" ? null : Number(oldPrice),
                condition,
                city: city.trim() || null,
                brand: brand.trim() || null,
                category_id: categoryId || null,
                group_name: groupName || null,
                item_name: itemName || null,
                status: status as EditPatch["status"],
                negotiable_flag: negotiable,
                delivery_available: delivery,
                images,
              });
            }}
            className="flex items-center gap-1 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} حفظ كل التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}
