import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Search, AlertTriangle, CheckCircle2, Tag } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminListListings, type AdminListingRow } from "@/lib/admin.functions";
import { explainIngest, DET_CATEGORIES, type IngestExplain } from "@/lib/ad-ingest-engine";
import { useCategories } from "@/hooks/useCategories";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

/** لوحة شرح لعملية التصنيف واستنتاج السعر لإعلان واحد. */
function ExplainCard({ ex }: { ex: IngestExplain }) {
  const topScores = ex.category.scores.filter((s) => s.score > 0).slice(0, 5);
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4 text-sm">
      {/* التصنيف */}
      <div>
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Tag className="h-4 w-4" /> سبب التصنيف
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div>
            التصنيف المختار: <span className="font-bold text-foreground">{ex.category.winner}</span>{" "}
            (النقاط: {ex.category.winnerScore})
          </div>
          {ex.category.explicitOverride && (
            <div className="flex items-center gap-1 text-chart-3">
              <CheckCircle2 className="h-3.5 w-3.5" /> تجاوز صريح من المصدر: «{ex.category.explicitOverride}»
            </div>
          )}
          {ex.category.tieBreak && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> حُسم بالتعادل عبر الأولوية (نفس النقاط لأكثر من تصنيف)
            </div>
          )}
          {ex.category.runnerUp && (
            <div>
              المنافس التالي: {ex.category.runnerUp.category} ({ex.category.runnerUp.score})
            </div>
          )}
          {ex.category.winnerScore === 0 && !ex.category.explicitOverride && (
            <div className="text-amber-600">لا توجد كلمات دالة → «{DET_CATEGORIES.general}» افتراضياً</div>
          )}
        </div>
        {topScores.length > 0 && (
          <div className="mt-3 space-y-1">
            {topScores.map((s) => (
              <div key={s.category} className="flex items-start gap-2">
                <span className="w-24 shrink-0 font-medium">{s.category}</span>
                <span className="w-10 shrink-0 tabular-nums">{s.score}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {s.matchedKeywords.slice(0, 8).join("، ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* السعر */}
      <div className="border-t pt-3">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Search className="h-4 w-4" /> سبب السعر
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div>
            القيمة المستنتجة:{" "}
            <span className="font-bold text-foreground">
              {ex.price.detected || ex.price.free ? `${ex.price.price} د.ب` : "بدون سعر"}
            </span>
          </div>
          <div>{ex.price.reason}</div>
          {ex.price.candidates.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 font-medium text-foreground">مرشحو السعر (بالنقاط):</div>
              <div className="space-y-1">
                {ex.price.candidates.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-16 shrink-0 font-mono">{c.token}</span>
                    <span className="w-10 shrink-0 tabular-nums">{c.score}</span>
                    <span className="text-xs">{c.reasons.join("، ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ex.price.currencyMatches.length > 0 && (
            <div>مطابقات العملة: {ex.price.currencyMatches.slice(0, 5).join(" | ")}</div>
          )}
          {ex.price.ignored.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 font-medium text-foreground">أرقام مستبعدة:</div>
              <ul className="space-y-0.5">
                {ex.price.ignored.slice(0, 8).map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono">{b.value}</span>
                    <span className="text-xs">— {b.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingAuditRow({ row }: { row: AdminListingRow }) {
  const [open, setOpen] = useState(false);
  const ex = useMemo(
    () => explainIngest(`${row.title ?? ""}\n${row.description ?? ""}`),
    [row.title, row.description],
  );
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-right"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{row.title || "بدون عنوان"}</span>
          <span className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5">التصنيف: {ex.category.winner}</span>
            <span className="rounded bg-muted px-1.5 py-0.5">
              السعر: {ex.price.detected || ex.price.free ? `${ex.price.price} د.ب` : "بدون"}
            </span>
            {ex.category.tieBreak && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">تعادل</span>
            )}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="border-t p-3">
          <ExplainCard ex={ex} />
        </div>
      )}
    </div>
  );
}

function AuditPage() {
  useCategories();
  const list = useServerFn(adminListListings);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-listings-all"],
    queryFn: async () => {
      const all: AdminListingRow[] = [];
      let offset = 0;
      for (;;) {
        const page = await list({ data: { limit: 100, offset } });
        all.push(...page.items);
        if (!page.hasMore || page.nextOffset == null) break;
        offset = page.nextOffset;
      }
      return all;
    },
  });

  const [query, setQuery] = useState("");
  const [tester, setTester] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (i) =>
            (i.title ?? "").toLowerCase().includes(q) ||
            (i.description ?? "").toLowerCase().includes(q),
        )
      : items;
    return base.slice(0, 200);
  }, [items, query]);

  const testerEx = useMemo(
    () => (tester.trim() ? explainIngest(tester) : null),
    [tester],
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="سجل التدقيق"
        subtitle="يوضح لكل إعلان سبب تصنيفه (النقاط وحسم التعادل) وسبب اعتبار السعر بدون قيمة أو كيفية استنتاج رقمه."
      />

      {/* مُختبِر نصي مباشر */}
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">اختبار نص إعلان مباشرةً</div>
        <Textarea
          value={tester}
          onChange={(e) => setTester(e.target.value)}
          placeholder="الصق نص أي منشور هنا لمعرفة تصنيفه وسبب سعره فوراً..."
          rows={4}
        />
        {testerEx && <ExplainCard ex={testerEx} />}
      </div>

      {/* قائمة الإعلانات */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في عناوين ووصف الإعلانات..."
          className="pr-9"
        />
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">جارٍ التحميل...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <ListingAuditRow key={row.id} row={row} />
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">لا توجد إعلانات مطابقة.</div>
          )}
        </div>
      )}
    </div>
  );
}
