import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck, Shield, UserCog, BadgeCheck } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  adminListMembers,
  adminSetMemberRole,
  type AdminMemberRow,
  type AppRole,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/members")({
  head: () => ({ meta: [{ title: "إدارة الأعضاء | لوحة التحكم" }] }),
  component: MembersAdminPage,
});

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "مشرف عام",
  moderator: "مشرف محتوى",
  user: "عضو",
};

function MembersAdminPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListMembers);
  const setRoleFn = useServerFn(adminSetMemberRole);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: () => listFn(),
  });

  const members = useMemo<AdminMemberRow[]>(() => {
    const all = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (m) =>
        (m.full_name ?? "").toLowerCase().includes(term) ||
        (m.email ?? "").toLowerCase().includes(term) ||
        (m.phone ?? "").toLowerCase().includes(term),
    );
  }, [data, q]);

  const toggleRole = async (m: AdminMemberRow, role: AppRole) => {
    const grant = !m.roles.includes(role);
    setBusy(`${m.id}:${role}`);
    try {
      await setRoleFn({ data: { userId: m.id, role, grant } });
      toast.success(grant ? `تم منح صلاحية ${ROLE_LABELS[role]}` : `تم سحب صلاحية ${ROLE_LABELS[role]}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحديث الصلاحية");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminHeader title="إدارة الأعضاء والصلاحيات" subtitle="منح أو سحب صلاحيات المشرفين وإدارة الأعضاء" />
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الهاتف"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            لا يوجد أعضاء مطابقون.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-bold text-card-foreground">
                      {m.full_name || "بدون اسم"}
                    </span>
                    {m.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {m.email || m.phone || m.id}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.roles.length ? (
                      m.roles.map((r) => (
                        <span
                          key={r}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                        >
                          {ROLE_LABELS[r]}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        عضو
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["admin", "moderator"] as AppRole[]).map((role) => {
                    const active = m.roles.includes(role);
                    const isBusy = busy === `${m.id}:${role}`;
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        disabled={isBusy}
                        onClick={() => toggleRole(m, role)}
                        className="gap-1"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : role === "admin" ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        {active ? `سحب ${ROLE_LABELS[role]}` : `منح ${ROLE_LABELS[role]}`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
