import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Search, MapPin, Trash2, Pause, Star, Loader2, Pencil, FolderSync } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  adminListListings,
  adminSetListingStatus,
  adminUpdateListing,
  adminDeleteListing,
  adminReclassifyListings,
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
  const setStatusFn = useServerFn(adminSetListingStatus);
  const updateFn = useServerFn(adminUpdateListing);
  const deleteFn = useServerFn(adminDeleteListing);
  const reclassifyFn = useServerFn(adminReclassifyListings);
  const { categories } = useCategories();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => list(),
  });

  const [tab, setTab] = useState<Status | "all">("pending");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminListingRow | null>(null);
  const [reclassifying, setReclassifying] = useState(false);

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

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (tab === "all" || i.status === tab) &&
          (query === "" ||
            i.title.includes(query) ||
            (i.contact_name ?? "").includes(query)),
      ),
    [items, tab, query],
  );

  const counts = (k: Status | "all") =>
    k === "all" ? items.length : items.filter((i) => i.status === k).length;

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
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">لا توجد إعلانات في هذا القسم</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((i) => (
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
      </div>

      {editing && (
        <EditDialog
          item={editing}
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

function EditDialog({
  item,
  onClose,
  onSave,
}: {
  item: AdminListingRow;
  onClose: () => void;
  onSave: (patch: { title?: string; price?: number; old_price?: number | null }) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [price, setPrice] = useState(String(item.price));
  const [oldPrice, setOldPrice] = useState(item.old_price != null ? String(item.old_price) : "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-card-foreground">تعديل الإعلان</h3>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-card-foreground">
            العنوان
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            السعر الحالي (د.ب)
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block text-sm font-semibold text-card-foreground">
            السعر السابق (اختياري — للخصم)
            <input
              type="number"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            disabled={saving}
            onClick={() => {
              setSaving(true);
              onSave({
                title: title.trim(),
                price: Number(price) || 0,
                old_price: oldPrice.trim() === "" ? null : Number(oldPrice),
              });
            }}
            className="flex items-center gap-1 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
