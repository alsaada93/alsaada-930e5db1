import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_id: string | null;
  created_at: string;
}

async function fetchReviews(sellerId: string, userId: string | undefined): Promise<Review[]> {
  // Public list: reviewer_id excluded via the safe view
  const { data, error } = await (supabase as any)
    .from("seller_reviews_public")
    .select("id, rating, comment, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const list = ((data ?? []) as Omit<Review, "reviewer_id">[]).map((r) => ({
    ...r,
    reviewer_id: null as string | null,
  }));
  // If signed in, fetch the caller's own review to allow editing (RLS lets reviewer read their row)
  if (userId) {
    const { data: mine } = await supabase
      .from("seller_reviews")
      .select("id, rating, comment, reviewer_id, created_at")
      .eq("seller_id", sellerId)
      .eq("reviewer_id", userId)
      .maybeSingle();
    if (mine) {
      const idx = list.findIndex((r) => r.id === (mine as Review).id);
      if (idx >= 0) list[idx] = mine as Review;
      else list.unshift(mine as Review);
    }
  }
  return list;
}

export function SellerReviews({ sellerId, sellerName }: { sellerId: string; sellerName?: string }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const isOwnListing = !!user && user.id === sellerId && !isAdmin;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["seller_reviews", sellerId],
    queryFn: () => fetchReviews(sellerId),
  });

  // ملخص التقييمات: المتوسط، العدد، والنسبة المئوية
  const summary = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const pct = Math.round((avg / 5) * 100);
    const dist = [5, 4, 3, 2, 1].map((n) => ({
      star: n,
      pct: count ? Math.round((reviews.filter((r) => r.rating === n).length / count) * 100) : 0,
    }));
    return { count, avg, pct, dist };
  }, [reviews]);

  // تقييم المستخدم الحالي (تقييم واحد فقط لكل شخص — قابل للتعديل)
  const myReview = useMemo(
    () => reviews.find((r) => r.reviewer_id === user?.id),
    [reviews, user?.id],
  );

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    }
  }, [myReview]);

  const saveReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-authenticated");
      const { error } = await supabase.from("seller_reviews").upsert(
        {
          seller_id: sellerId,
          reviewer_id: user.id,
          rating,
          comment: comment.trim() || null,
        },
        { onConflict: "seller_id,reviewer_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller_reviews", sellerId] });
      toast.success(myReview ? "تم تحديث تقييمك" : "تم إرسال تقييمك بنجاح");
    },
    onError: () => toast.error("تعذّر إرسال التقييم، حاول مرة أخرى"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-extrabold">تقييمات {sellerName?.trim() || "المعلن"}</h2>

      {/* ملخص النسبة المئوية للتقييمات (بدون عرض قائمة التقييمات) */}
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">جارٍ تحميل التقييمات...</p>
      ) : summary.count === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">لا توجد تقييمات بعد. كن أول من يقيّم هذا البائع.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center justify-center rounded-xl bg-background px-5 py-3">
            <span className="text-3xl font-extrabold text-foreground">{summary.pct}%</span>
            <span className="text-xs text-muted-foreground">نسبة الرضا</span>
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${
                    n <= Math.round(summary.avg) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              {summary.avg.toFixed(1)} من 5 ({summary.count.toLocaleString("ar")})
            </span>
          </div>
          <div className="flex-1 space-y-1.5">
            {summary.dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="flex w-8 items-center gap-0.5 text-muted-foreground">
                  {d.star} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-9 text-end text-muted-foreground">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نموذج إضافة/تعديل تقييم — تقييم واحد فقط لكل مستخدم */}
      {isOwnListing ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          لا يمكنك تقييم إعلانك الخاص.
        </p>
      ) : user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveReview.mutate();
          }}
          className="mt-4 rounded-xl border border-border bg-background p-4"
        >
          {myReview && (
            <p className="mb-2 text-xs font-semibold text-primary">لديك تقييم سابق — يمكنك تعديله.</p>
          )}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`تقييم ${n}`}>
                <Star
                  className={`h-6 w-6 ${n <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب تجربتك مع هذا البائع..."
            maxLength={500}
            rows={3}
            className="mt-3 w-full rounded-lg border border-border bg-card p-2 text-sm"
          />
          <button
            type="submit"
            disabled={saveReview.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saveReview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {myReview ? "تحديث التقييم" : "إرسال التقييم"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          يجب{" "}
          <a href="/login" className="font-bold text-primary hover:underline">
            تسجيل الدخول
          </a>{" "}
          لإضافة تقييم.
        </p>
      )}
    </section>
  );
}
