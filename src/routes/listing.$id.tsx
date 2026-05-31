import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Star,
  BadgeCheck,
  MessageCircle,
  Phone,
  MessageSquare,
  CalendarDays,
  Clock,
  Play,
  Pencil,
  RotateCw,
  Home,
  Heart,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { useSeller } from "@/hooks/useSellers";
import { useAuth } from "@/hooks/useAuth";
import { AuctionBidBox } from "@/components/AuctionBidBox";
import { SellerReviews } from "@/components/SellerReviews";
import { categories } from "@/data/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logContactAttempt } from "@/lib/contact";
import { PriceOfferDialog } from "@/components/PriceOfferDialog";
import { ListingHashtags } from "@/components/ListingHashtags";
import { ShareButtons } from "@/components/ShareButtons";
import { useListingTranslations } from "@/hooks/useListingTranslations";
import { Tag } from "lucide-react";

const EXPIRY_DAYS = 60;

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("listings").select("*").eq("id", params.id).maybeSingle();
    if (!data) throw notFound();
    return {
      item: {
        id: data.id,
        title: data.title,
        price: Number(data.price),
        negotiable: data.negotiable,
        condition: data.condition,
        city: data.city ?? "",
        categoryId: (data.category_id as string | null) ?? null,
        groupName: (data.group_name as string | null) ?? null,
        itemName: (data.item_name as string | null) ?? null,
        images: (data.images as string[] | null)?.length ? (data.images as string[]) : ["/placeholder.svg"],
        video: (data.video as string | null) ?? null,
        lat: data.lat != null ? Number(data.lat) : null,
        lng: data.lng != null ? Number(data.lng) : null,
        featured: data.featured,
        views: data.views,
        listingType: (data.listing_type as string | null) ?? "normal",
        startPrice: data.start_price != null ? Number(data.start_price) : null,
        auctionEndsAt: (data.auction_ends_at as string | null) ?? null,
        userId: (data.user_id as string | null) ?? null,
        createdAt: (data.created_at as string | null) ?? null,
        publishedAt: (data.published_at as string | null) ?? null,
        expiresAt: (data.expires_at as string | null) ?? null,
        sellerId: undefined as string | undefined,
        phone: data.contact_phone ?? undefined,
        description: data.description as string | null,
        business:
          data.listing_type === "business"
            ? {
                rent: data.rent,
                area_sqm: data.area_sqm,
                outlets: data.outlets,
                staff_count: data.staff_count,
                monthly_revenue: data.monthly_revenue,
                operating_cost: data.operating_cost,
                has_license: data.has_license,
                sale_reason: data.sale_reason,
              }
            : null,
      },
    };
  },
  head: ({ loaderData, params }) => {
    const t = loaderData?.item.title ?? "إعلان";
    const url = `https://alsaada-market.lovable.app/listing/${params.id}`;
    const image = loaderData?.item.images?.[0] ?? "";
    return {
      meta: [
        { title: `${t} | السعادة ماركت Al Saada Market` },
        { name: "description", content: `${t} — ${loaderData?.item.city ?? ""} على السعادة ماركت` },
        { property: "og:title", content: `${t} | السعادة ماركت Al Saada Market` },
        { property: "og:description", content: `${t} للبيع في ${loaderData?.item.city ?? "البحرين"}` },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: t,
            ...(image ? { image } : {}),
            ...(loaderData?.item.description ? { description: loaderData.item.description } : {}),
            offers: {
              "@type": "Offer",
              price: loaderData?.item.price ?? 0,
              priceCurrency: "BHD",
              url,
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">الإعلان غير موجود</h1>
        <p className="mt-2 text-muted-foreground">عذراً، لم نتمكن من العثور على هذا الإعلان.</p>
        <Link to="/" className="mt-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">
          العودة للرئيسية
        </Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">حدث خطأ</h1>
        <Link to="/" className="mt-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">
          العودة للرئيسية
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: ListingPage,
});

/** صياغة المدة المنقضية منذ النشر بالدقائق/الساعات/الأيام */
function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return secs <= 1 ? "قبل ثانية" : `قبل ${secs} ثانية`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins === 1 ? "قبل دقيقة" : `قبل ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "قبل ساعة" : `قبل ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return days === 1 ? "قبل يوم" : `قبل ${days} يوم`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? "قبل أسبوع" : `قبل ${weeks} أسابيع`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "قبل شهر" : `قبل ${months} أشهر`;
  const years = Math.floor(days / 365);
  return years === 1 ? "قبل سنة" : `قبل ${years} سنوات`;
}

/** نوع الوسائط في المعرض */
type MediaSlide = { type: "image" | "video"; url: string };

function Gallery({ images, video, title }: { images: string[]; video: string | null; title: string }) {
  const slides: MediaSlide[] = [
    ...images.map((url) => ({ type: "image" as const, url })),
    ...(video ? [{ type: "video" as const, url: video }] : []),
  ];
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const active = slides[idx];
  const go = (d: number) => setIdx((i) => (i + d + slides.length) % slides.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        {active.type === "image" ? (
          <img
            src={active.url}
            alt={title}
            onClick={() => setLightbox(true)}
            className="aspect-[4/3] w-full cursor-zoom-in object-cover"
          />
        ) : (
          <video src={active.url} controls className="aspect-[4/3] w-full bg-black object-contain" />
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="السابق"
              className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="التالي"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 end-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              {idx + 1} / {slides.length}
            </span>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <button
              key={s.url + i}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {s.type === "image" ? (
                <img src={s.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-black text-white">
                  <Play className="h-5 w-5" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && active.type === "image" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <img src={active.url} alt={title} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function ListingPage() {
  const { item } = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: seller } = useSeller(item.sellerId);
  const [reposting, setReposting] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // سجل آخر الإعلانات المشاهدة
  useEffect(() => {
    try {
      const entry = {
        id: item.id,
        title: item.title,
        price: item.price,
        status: "approved",
        views: item.views ?? 0,
        images: item.images ?? [],
        published_at: item.publishedAt ?? null,
        expires_at: item.expiresAt ?? null,
      };
      const prev = JSON.parse(localStorage.getItem("recent_views") || "[]");
      const next = [entry, ...(Array.isArray(prev) ? prev.filter((x: any) => x.id !== item.id) : [])].slice(0, 15);
      localStorage.setItem("recent_views", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [item.id]);

  // حالة المفضلة
  useEffect(() => {
    if (!user) {
      setIsFav(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", item.id)
        .maybeSingle();
      if (active) setIsFav(!!data);
    })();
    return () => {
      active = false;
    };
  }, [user, item.id]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.info("سجّل الدخول لإضافة الإعلان إلى المفضلة");
      navigate({ to: "/login" });
      return;
    }
    if (isFav) {
      await (supabase as any).from("favorites").delete().eq("user_id", user.id).eq("listing_id", item.id);
      setIsFav(false);
      toast.success("تمت الإزالة من المفضلة");
    } else {
      await (supabase as any).from("favorites").insert({ user_id: user.id, listing_id: item.id });
      setIsFav(true);
      toast.success("تمت الإضافة إلى المفضلة");
    }
  };


  const phone = seller?.phone ?? item.phone ?? "97333000000";
  const sellerName = seller?.name ?? "بائع موثوق";
  const rating = seller?.rating ?? 4.8;
  const reviews = seller?.reviews_count ?? 0;
  const deals = seller?.deals_count ?? 0;
  const verified = seller?.verified ?? false;

  const isOwner = !!user && !!item.userId && user.id === item.userId;
  const expiresAt = item.expiresAt
    ? new Date(item.expiresAt).getTime()
    : item.createdAt
      ? new Date(item.createdAt).getTime() + EXPIRY_DAYS * 86400_000
      : null;
  const publishedAt = item.publishedAt ?? item.createdAt;
  const expired = expiresAt != null && expiresAt < Date.now();
  const daysLeft = expiresAt != null ? Math.ceil((expiresAt - Date.now()) / 86400_000) : null;

  const cat = categories.find((c) => c.id === item.categoryId);

  const handleRepost = async () => {
    setReposting(true);
    const { error } = await supabase
      .from("listings")
      .update({ published_at: new Date().toISOString(), status: "approved" })
      .eq("id", item.id);
    setReposting(false);
    if (error) {
      toast.error("تعذّرت إعادة النشر، تأكد من تسجيل الدخول.");
      return;
    }
    toast.success("تمت إعادة نشر الإعلان لمدة 60 يوماً إضافية.");
    navigate({ to: "/listing/$id", params: { id: item.id } });
  };

  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(
    `مرحباً، أنا مهتم بإعلان "${item.title}" المعروض على السعادة ماركت.`,
  )}`;

  const mapSrc = item.lat != null && item.lng != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${item.lng - 0.01}%2C${item.lat - 0.01}%2C${item.lng + 0.01}%2C${item.lat + 0.01}&layer=mapnik&marker=${item.lat}%2C${item.lng}`
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* مسار التنقّل: الرئيسية ← التصنيف ← المجموعة ← الإعلان */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label="مسار التنقّل">
          <Link to="/" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <Home className="h-3.5 w-3.5" /> الرئيسية
          </Link>
          {cat && (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <Link
                to="/category/$id"
                params={{ id: cat.id }}
                className="font-semibold text-primary hover:underline"
              >
                {cat.name}
              </Link>
            </>
          )}
          {cat && item.groupName && (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <Link
                to="/category/$id"
                params={{ id: cat.id }}
                search={{ sub: item.groupName }}
                className="font-semibold text-primary hover:underline"
              >
                {item.groupName}
              </Link>
            </>
          )}
          {item.itemName && (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="truncate">{item.itemName}</span>
            </>
          )}
        </nav>

        {/* تحكّم المالك: تعديل وإعادة نشر */}
        {isOwner && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-accent/30 p-3">
            <span className="text-sm font-bold text-primary">إدارة إعلانك</span>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <Link
                to="/add-listing"
                search={{ edit: item.id }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Pencil className="h-4 w-4" /> تعديل الإعلان
              </Link>
              <button
                type="button"
                disabled={reposting}
                onClick={handleRepost}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-background px-3 py-2 text-sm font-bold hover:bg-accent disabled:opacity-60"
              >
                <RotateCw className="h-4 w-4" /> {reposting ? "جارٍ..." : "إعادة النشر (60 يوم)"}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Gallery images={item.images} video={item.video} title={item.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
                {item.condition}
              </span>
              {item.featured && (
                <span className="rounded-full bg-gradient-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                  مميّز
                </span>
              )}
              {expired && (
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-bold text-destructive">
                  منتهي
                </span>
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold">{item.title}</h1>
              <button
                onClick={toggleFavorite}
                aria-label="إضافة إلى المفضلة"
                className={`shrink-0 rounded-full border p-2 transition-colors ${
                  isFav
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
              <span className="text-sm font-semibold text-muted-foreground">د.ب</span>
              {item.negotiable && <span className="text-xs text-muted-foreground">• قابل للتفاوض</span>}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {item.city}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {item.views.toLocaleString("ar")} مشاهدة
              </span>
            </div>

            {/* سجل تاريخ ووقت النشر والانتهاء */}
            {publishedAt && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> نُشر {timeAgo(publishedAt)} —{" "}
                  {new Date(publishedAt).toLocaleString("ar", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {expiresAt != null && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {expired ? "انتهى في" : "ينتهي في"}{" "}
                    {new Date(expiresAt).toLocaleString("ar", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {!expired && daysLeft != null ? ` (خلال ${daysLeft} يوم)` : ""}
                  </span>
                )}
              </div>
            )}

            {/* مزاد مباشر */}
            {item.listingType === "auction" && (
              <AuctionBidBox
                listingId={item.id}
                startPrice={item.startPrice ?? item.price}
                auctionEndsAt={item.auctionEndsAt}
              />
            )}


            <div className="mt-5 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{sellerName}</h2>
                {verified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> موثق
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500" /> {rating.toLocaleString("ar")}
                </span>
                <span className="text-muted-foreground">({reviews.toLocaleString("ar")} تقييم)</span>
                <span className="text-muted-foreground">• {deals.toLocaleString("ar")} صفقة ناجحة</span>
              </div>
              {seller?.member_since && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> عضو منذ{" "}
                  {new Date(seller.member_since).toLocaleDateString("ar", { year: "numeric", month: "long" })}
                </p>
              )}
            </div>

            {/* أزرار التواصل */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> واتساب
              </a>
              <a
                href={`tel:+${phone}`}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Phone className="h-4 w-4" /> اتصال
              </a>
              <button
                type="button"
                onClick={() =>
                  toast.info("الرسائل الداخلية", { description: "سيتم فتح المحادثة بعد تسجيل الدخول." })
                }
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
              >
                <MessageSquare className="h-4 w-4" /> رسالة
              </button>
            </div>
          </div>
        </div>

        {item.description && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-2 text-lg font-extrabold">الوصف</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        )}

        {item.business && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-accent/30 p-5">
            <h2 className="mb-3 text-lg font-extrabold text-primary">تفاصيل النشاط التجاري</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {item.business.rent != null && <Detail label="الإيجار الشهري" value={`${item.business.rent} د.ب`} />}
              {item.business.area_sqm != null && <Detail label="المساحة" value={`${item.business.area_sqm} م²`} />}
              {item.business.outlets != null && <Detail label="عدد الفتحات" value={String(item.business.outlets)} />}
              {item.business.staff_count != null && <Detail label="عدد الموظفين" value={String(item.business.staff_count)} />}
              {item.business.monthly_revenue != null && <Detail label="المدخول الشهري" value={`${item.business.monthly_revenue} د.ب`} />}
              {item.business.operating_cost != null && <Detail label="مصاريف التشغيل" value={`${item.business.operating_cost} د.ب`} />}
              {item.business.has_license != null && <Detail label="السجل التجاري" value={item.business.has_license ? "مع سجل" : "بدون سجل"} />}
              {item.business.sale_reason && <Detail label="سبب البيع" value={String(item.business.sale_reason)} />}
            </div>
          </div>
        )}

        {/* خريطة الموقع */}
        {mapSrc && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <h2 className="flex items-center gap-1.5 p-4 pb-2 text-lg font-extrabold">
              <MapPin className="h-5 w-5 text-primary" /> الموقع على الخريطة
            </h2>
            <iframe
              title="خريطة موقع الإعلان"
              src={mapSrc}
              className="h-72 w-full border-0"
              loading="lazy"
            />
            <a
              href={`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=16/${item.lat}/${item.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 text-center text-sm font-semibold text-primary hover:underline"
            >
              فتح في الخريطة الكاملة
            </a>
          </div>
        )}

        {/* تقييمات البائع */}
        {item.sellerId && (
          <div className="mt-10">
            <SellerReviews sellerId={item.sellerId} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-card-foreground">{value}</p>
    </div>
  );
}
