import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

async function fetchReviews(sellerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("seller_reviews")
    .select("id, rating, comment, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
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

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-authenticated");
      const { error } = await supabase.from("seller_reviews").insert({
        seller_id: sellerId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["seller_reviews", sellerId] });
      toast.success("تم إرسال تقييمك بنجاح");
    },
    onError: () => toast.error("تعذّر إرسال التقييم، حاول مرة أخرى"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-extrabold">
        تقييمات {sellerName?.trim() || "المعلن"} ({reviews.length.toLocaleString("ar")})
      </h2>

      {/* نموذج إضافة تقييم */}
      {isOwnListing ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          لا يمكنك تقييم إعلانك الخاص.
        </p>
      ) : user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addReview.mutate();
          }}
          className="mt-4 rounded-xl border border-border bg-background p-4"
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`تقييم ${n}`}
              >
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
            disabled={addReview.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {addReview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            إرسال التقييم
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

      {/* قائمة التقييمات */}
      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ تحميل التقييمات...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد. كن أول من يقيّم هذا البائع.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                  />
                ))}
                <span className="ms-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("ar")}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-card-foreground">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
