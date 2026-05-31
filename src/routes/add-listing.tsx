import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { categories } from "@/data/marketplace";

export const Route = createFileRoute("/add-listing")({
  head: () => ({
    meta: [
      { title: "أضف إعلان | سوقو SOOGO" },
      { name: "description", content: "أضف إعلانك لبيع معدات المطاعم والأثاث والإلكترونيات على سوقو." },
    ],
  }),
  component: AddListingPage,
});

const cities = ["المنامة", "المحرق", "الرفاع", "عيسى", "سترة", "حمد", "البديع"];

function AddListingPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="h-4 w-4" /> العودة للرئيسية
        </Link>

        {submitted ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-4 text-2xl font-extrabold">تم استلام إعلانك</h1>
            <p className="mt-2 text-muted-foreground">
              سيتم مراجعة الإعلان من قبل الإدارة قبل نشره. شكراً لاستخدامك سوقو.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">أضف إعلان جديد</h1>
            <p className="text-sm text-muted-foreground">
              املأ تفاصيل المنتج لعرضه على آلاف المشترين في البحرين والخليج.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">عنوان الإعلان</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: فرن بيتزا احترافي ستانلس ستيل"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">التصنيف</label>
                  <select
                    required
                    defaultValue=""
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>اختر التصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">المدينة</label>
                  <select
                    required
                    defaultValue=""
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>اختر المدينة</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">السعر (د.ب)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="0"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">الحالة</label>
                  <select
                    required
                    defaultValue="مستعمل"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="جديد">جديد</option>
                    <option value="مستعمل">مستعمل</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">الوصف</label>
                <textarea
                  required
                  rows={5}
                  placeholder="اكتب وصفاً تفصيلياً للمنتج..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" />
                السعر قابل للتفاوض
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
              >
                نشر الإعلان
              </button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
