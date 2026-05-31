import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Video,
  X,
  MapPin,
  Sparkles,
  Search,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { categories, bahrainRegions, listings } from "@/data/marketplace";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/add-listing")({
  head: () => ({
    meta: [
      { title: "أضف إعلان | سوقو SOOGO" },
      { name: "description", content: "أضف إعلانك لبيع معدات المطاعم والفنادق والإلكترونيات على سوقو." },
    ],
  }),
  component: AddListingPage,
});

const MAX_IMAGES = 30;

interface AiEstimate {
  average: number;
  suggested: number;
  speed: string;
  market: string;
}

function AddListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  // Guest contact (required if not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Category cascade
  const [categoryId, setCategoryId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [itemName, setItemName] = useState("");

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categoryId],
  );
  const activeGroup = useMemo(
    () => activeCategory?.groups.find((g) => g.name === groupName),
    [activeCategory, groupName],
  );

  // Region search
  const [region, setRegion] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim();
    if (!q) return bahrainRegions.slice(0, 12);
    return bahrainRegions.filter((r) => r.includes(q)).slice(0, 12);
  }, [regionQuery]);

  // Map location
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  // Price + AI
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("مستعمل");
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صورة`);
      return;
    }
    const next = Array.from(files).slice(0, remaining).map((f) => URL.createObjectURL(f));
    setImages((p) => [...p, ...next]);
  };

  const handleVideo = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setVideo(URL.createObjectURL(files[0]));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("تم تحديد موقعك على الخريطة");
      },
      () => {
        setLocating(false);
        toast.error("تعذّر تحديد الموقع، تأكد من السماح بالوصول");
      },
    );
  };

  const estimatePrice = () => {
    if (!activeCategory) {
      toast.error("اختر التصنيف أولاً لتقدير السعر");
      return;
    }
    setEstimating(true);
    // تقدير ذكي مبني على بيانات السوق الحالية للتصنيف
    setTimeout(() => {
      const peers = listings.filter((l) => l.category.includes(activeCategory.name.slice(0, 4)));
      const base = peers.length
        ? peers.reduce((s, l) => s + l.price, 0) / peers.length
        : 600;
      const factor = condition === "جديد" ? 1.25 : 0.9;
      const average = Math.round(base);
      const suggested = Math.round(base * factor);
      setEstimate({
        average,
        suggested,
        speed: condition === "جديد" ? "سريع (3-7 أيام)" : "متوسط (1-3 أسابيع)",
        market:
          suggested > average
            ? "أعلى قليلاً من متوسط السوق"
            : "ضمن متوسط السوق ومنافس",
      });
      if (!price) setPrice(String(suggested));
      setEstimating(false);
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && (!guestName.trim() || !guestPhone.trim())) {
      toast.error("أدخل الاسم ورقم الهاتف للنشر كزائر، أو سجّل الدخول");
      return;
    }
    if (!region) {
      toast.error("اختر المنطقة");
      return;
    }
    if (images.length === 0) {
      toast.error("أضف صورة واحدة على الأقل");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
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
        </main>
        <Footer />
      </div>
    );
  }

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

        <h1 className="text-2xl font-extrabold">أضف إعلان جديد</h1>
        <p className="text-sm text-muted-foreground">
          املأ تفاصيل المنتج لعرضه على آلاف المشترين في البحرين والخليج.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Contact / login */}
          {!user ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">بيانات التواصل (للنشر كزائر)</span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <LogIn className="h-3.5 w-3.5" /> تسجيل الدخول
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="الاسم"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  required
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="رقم الهاتف (مثال: 3xxxxxxx)"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              تنشر باسم حسابك: <span className="font-bold">{user.email}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-semibold">عنوان الإعلان</label>
            <input
              required
              type="text"
              placeholder="مثال: فرن بيتزا احترافي ستانلس ستيل"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category cascade */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">التصنيف الرئيسي</label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setGroupName("");
                  setItemName("");
                }}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>اختر التصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">التصنيف الفرعي</label>
              <select
                value={groupName}
                disabled={!activeCategory}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setItemName("");
                }}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر القسم</option>
                {activeCategory?.groups.map((g) => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">النوع</label>
              <select
                value={itemName}
                disabled={!activeGroup}
                onChange={(e) => setItemName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر النوع</option>
                {activeGroup?.items.map((it) => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Region search */}
          <div className="relative">
            <label className="mb-1 block text-sm font-semibold">المنطقة (ابحث عن مناطق البحرين)</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={region || regionQuery}
                onChange={(e) => {
                  setRegion("");
                  setRegionQuery(e.target.value);
                  setRegionOpen(true);
                }}
                onFocus={() => setRegionOpen(true)}
                placeholder="ابحث: المنامة، الرفاع، المحرق..."
                className="h-11 w-full rounded-lg border border-border bg-background pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {regionOpen && filteredRegions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-card">
                {filteredRegions.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegion(r);
                        setRegionQuery("");
                        setRegionOpen(false);
                      }}
                      className="w-full rounded-md px-3 py-2 text-right text-sm hover:bg-accent"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Map location */}
          <div>
            <label className="mb-1 block text-sm font-semibold">الموقع على الخريطة</label>
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-primary" />
              {locating ? "جارٍ التحديد..." : coords ? "تحديث الموقع" : "استخدم موقعي الحالي"}
            </button>
            {coords && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <iframe
                  title="الموقع"
                  className="h-56 w-full"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="mb-1 block text-sm font-semibold">
              الصور ({images.length}/{MAX_IMAGES})
            </label>
            <input
              ref={imgInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleImages(e.target.files)}
            />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((src, i) => (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={src} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute left-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => imgInput.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px] font-semibold">إضافة</span>
                </button>
              )}
            </div>
          </div>

          {/* Video */}
          <div>
            <label className="mb-1 block text-sm font-semibold">فيديو للإعلان (اختياري)</label>
            <input ref={vidInput} type="file" accept="video/*" hidden onChange={(e) => handleVideo(e.target.files)} />
            {video ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <video src={video} controls className="h-56 w-full bg-black object-contain" />
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  className="absolute left-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => vidInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Video className="h-5 w-5" /> إضافة فيديو
              </button>
            )}
          </div>

          {/* Price + condition + AI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">السعر (د.ب)</label>
              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">الحالة</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="جديد">جديد</option>
                <option value="مستعمل">مستعمل</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={estimatePrice}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/70"
          >
            <Sparkles className="h-4 w-4" />
            {estimating ? "جارٍ التحليل..." : "اقتراح السعر بالذكاء الاصطناعي"}
          </button>

          {estimate && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-4">
              <Stat label="متوسط السعر" value={`${estimate.average} د.ب`} />
              <Stat label="السعر المقترح" value={`${estimate.suggested} د.ب`} />
              <Stat label="سرعة البيع" value={estimate.speed} />
              <Stat label="مقارنة السوق" value={estimate.market} />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold">الوصف</label>
            <textarea
              required
              rows={5}
              placeholder="اكتب وصفاً تفصيلياً للمنتج..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
          >
            نشر الإعلان
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-card-foreground">{value}</p>
    </div>
  );
}
