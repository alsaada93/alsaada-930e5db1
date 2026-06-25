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

import { useSeller, useSellerPhone } from "@/hooks/useSellers";
import { useAuth } from "@/hooks/useAuth";
import { AuctionBidBox } from "@/components/AuctionBidBox";
import { SellerReviews } from "@/components/SellerReviews";
import { categories } from "@/data/marketplace";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logContactAttempt, whatsappLink, telLink } from "@/lib/contact";
import { PriceOfferDialog } from "@/components/PriceOfferDialog";
import { ListingHashtags } from "@/components/ListingHashtags";
import { ShareButtons } from "@/components/ShareButtons";
import { useListingTranslations } from "@/hooks/useListingTranslations";
import { Tag, Truck, Tag as TagIcon, Globe, Package } from "lucide-react";
import { useViewBoost, boostViews } from "@/hooks/useViewBoost";
import { countryByName } from "@/data/countries";
import { cityCenter, displayCity } from "@/data/bahrainCities";
import { brandInfo } from "@/data/brandsCatalog";
import { showsCondition } from "@/lib/category-kind";

const EXPIRY_DAYS = 60;

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("listings").select("*").eq("id", params.id).maybeSingle();
    if (!data) throw notFound();

    // تقييم حقيقي للبائع المرتبط بالإعلان (لا تُختلق التقييمات لمحركات البحث)
    let rating: { value: number; count: number } | null = null;
    const sellerKey = ((data.user_id as string | null) ?? data.id) || null;
    if (sellerKey) {
      const { data: revs } = await supabase
        .from("seller_reviews")
        .select("rating")
        .eq("seller_id", sellerKey);
      if (revs && revs.length > 0) {
        const sum = revs.reduce((a, r) => a + Number((r as { rating: number }).rating), 0);
        rating = { value: Math.round((sum / revs.length) * 10) / 10, count: revs.length };
      }
    }

    return {
      rating,
      item: {
        id: data.id,
        title: data.title,
        price: Number(data.price),
        oldPrice: data.old_price != null ? Number(data.old_price) : null,
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
        status: (data.status as string | null) ?? "approved",
        listingType: (data.listing_type as string | null) ?? "normal",
        startPrice: data.start_price != null ? Number(data.start_price) : null,
        auctionEndsAt: (data.auction_ends_at as string | null) ?? null,
        userId: (data.user_id as string | null) ?? null,
        createdAt: (data.created_at as string | null) ?? null,
        publishedAt: (data.published_at as string | null) ?? null,
        expiresAt: (data.expires_at as string | null) ?? null,
        sellerId: undefined as string | undefined,
        sellerName: ((data.contact_name as string | null) ?? null) as string | null,
        phone: data.contact_phone ?? undefined,
        description: data.description as string | null,
        brand: (data.brand as string | null) ?? null,
        countryOfOrigin: (data.country_of_origin as string | null) ?? null,
        deliveryAvailable: Boolean(data.delivery_available),
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
    const city = loaderData?.item.city || "البحرين";
    const url = `https://www.alsaada.sale/listing/${params.id}`;
    const image = loaderData?.item.images?.[0] ?? "";
    const metaTitle = `${t} للبيع في ${city} | حراج السعادة`;
    const rawDesc = (loaderData?.item.description || "").replace(/\s+/g, " ").trim();
    const metaDesc =
      (rawDesc ? rawDesc.slice(0, 150) : `${t} للبيع في ${city}`) +
      ` — حراج السعادة لبيع وشراء معدات المطاعم والأثاث في البحرين.`;
    return {
      meta: [
        { title: metaTitle },
        { name: "description", content: metaDesc.slice(0, 160) },
        { property: "og:title", content: metaTitle },
        { property: "og:description", content: metaDesc.slice(0, 200) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: metaTitle },
        { name: "twitter:description", content: metaDesc.slice(0, 200) },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: t,
            ...(image ? { image: loaderData?.item.images ?? [image] } : {}),
            ...(loaderData?.item.description ? { description: loaderData.item.description } : {}),
            ...(loaderData?.item.brand
              ? { brand: { "@type": "Brand", name: loaderData.item.brand } }
              : { brand: { "@type": "Brand", name: "حراج السعادة" } }),
            sku: params.id,
            mpn: params.id,
            itemCondition:
              loaderData?.item.condition === "جديد"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            offers: {
              "@type": "Offer",
              price: String(
                loaderData?.item.listingType === "auction"
                  ? (loaderData?.item.startPrice ?? loaderData?.item.price ?? 0)
                  : (loaderData?.item.price ?? 0),
              ),
              priceCurrency: "BHD",
              url,
              ...(loaderData?.item.oldPrice && loaderData.item.oldPrice > (loaderData.item.price ?? 0)
                ? {
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      priceType: "https://schema.org/ListPrice",
                      price: String(loaderData.item.oldPrice),
                      priceCurrency: "BHD",
                    },
                  }
                : {}),
              itemCondition:
                loaderData?.item.condition === "جديد"
                  ? "https://schema.org/NewCondition"
                  : "https://schema.org/UsedCondition",
              availability:
                loaderData?.item.status === "approved"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/SoldOut",
              priceValidUntil: loaderData?.item.expiresAt
                ? String(loaderData.item.expiresAt).slice(0, 10)
                : new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
              seller: {
                "@type": "Organization",
                name: "حراج السعادة",
                telephone: "+97333982383",
              },
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "BH",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnInStore",
                returnFees: "https://schema.org/FreeReturn",
              },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: loaderData?.item.deliveryAvailable ? "2" : "0",
                  currency: "BHD",
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: "BH",
                },
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: 0,
                    maxValue: 1,
                    unitCode: "DAY",
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: 1,
                    maxValue: 3,
                    unitCode: "DAY",
                  },
                },
              },
            },
            ...(loaderData?.rating
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: String(loaderData.rating.value),
                    reviewCount: String(loaderData.rating.count),
                    bestRating: "5",
                    worstRating: "1",
                  },
                  review: {
                    "@type": "Review",
                    reviewRating: {
                      "@type": "Rating",
                      ratingValue: String(loaderData.rating.value),
                      bestRating: "5",
                      worstRating: "1",
                    },
                    author: { "@type": "Organization", name: "عملاء حراج السعادة" },
                  },
                }
              : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "الرئيسية",
                item: "https://www.alsaada.sale/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: loaderData?.item.groupName || "الإعلانات",
                item: loaderData?.item.categoryId
                  ? `https://www.alsaada.sale/category/${loaderData.item.categoryId}`
                  : "https://www.alsaada.sale/search",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: t,
                item: url,
              },
            ],
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
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/3] w-full cursor-zoom-in object-cover"
          />
        ) : (
          <video src={active.url} controls className="aspect-[4/3] w-full bg-black object-contain" />
        )}
        {active.type === "image" && (
          <span className="pointer-events-none absolute bottom-2 right-2 select-none text-xs font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            حراج السعادة
          </span>
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
                <img src={s.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
          <img src={active.url} alt={title} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function ListingPage() {
  const { item, rating: ratingData } = Route.useLoaderData();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { boost } = useViewBoost();
  const { categories: dynCategories } = useCategories();
  const { data: seller } = useSeller(item.sellerId);
  const { data: sellerPhone } = useSellerPhone(item.sellerId);
  const [reposting, setReposting] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  // لتفادي اختلاف وقت العرض بين الخادم والمتصفّح (hydration)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ترجمة العنوان والوصف حسب اللغة المختارة
  const { map: trMap, lang } = useListingTranslations([
    { id: item.id, title: item.title, description: item.description ?? "" },
  ]);
  const displayTitle = trMap[item.id]?.title || item.title;
  const displayDescription = trMap[item.id]?.description || item.description || "";

  // زيادة عدّاد المشاهدات الفعلي مرة واحدة لكل جلسة عرض
  useEffect(() => {
    const key = `viewed_${item.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    (supabase as any).rpc("increment_listing_views", { _id: item.id }).then(() => {});
  }, [item.id]);

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


  // رقم التواصل: رقم المعلن إن وُجد. لا يُستخدم رقم الموقع العام إلا في قسم المطاعم.
  const isRestaurant = item.categoryId === "restaurant";
  const phone = sellerPhone ?? item.phone ?? (isRestaurant ? "33982383" : null);
  const sellerName = item.sellerName?.trim() || seller?.name || "المعلن";
  const rating = ratingData?.value ?? seller?.rating ?? 0;
  const reviews = ratingData?.count ?? seller?.reviews_count ?? 0;
  const deals = seller?.deals_count ?? 0;
  const verified = seller?.verified ?? false;

  const isOwner = (!!user && !!item.userId && user.id === item.userId) || isAdmin;
  const expiresAt = item.expiresAt
    ? new Date(item.expiresAt).getTime()
    : item.createdAt
      ? new Date(item.createdAt).getTime() + EXPIRY_DAYS * 86400_000
      : null;
  const publishedAt = item.publishedAt ?? item.createdAt;
  const expired = expiresAt != null && expiresAt < Date.now();

  const cat =
    dynCategories.find((c) => c.id === item.categoryId) ??
    categories.find((c) => c.id === item.categoryId);

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

  const waLink = phone ? whatsappLink({ phone, listingTitle: item.title, listingId: item.id }) : null;

  // نقطة الخريطة: إحداثيات المعلن إن وُجدت، وإلا مركز المدينة المختارة
  const exactPoint = item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null;
  const mapPoint = exactPoint ?? cityCenter(item.city);
  const approxLocation = !exactPoint && !!mapPoint;
  const mapSrc = mapPoint ? `https://www.google.com/maps?q=${mapPoint.lat},${mapPoint.lng}&z=15&hl=ar&output=embed` : null;

  // معلومات الماركة (الوصف وبلد المنشأ والتخصص) تُعرض تلقائياً
  const bInfo = brandInfo(item.brand);

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

        {isOwner && (
          <SchemaCheckBar item={item} hasRating={!!ratingData} />
        )}


        <div className="grid gap-6 lg:grid-cols-2">
          <Gallery images={item.images} video={item.video} title={item.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {showsCondition(cat?.name, cat?.nameEn) && (
                <span className="rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
                  {item.condition}
                </span>
              )}
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

            {/* عنوان الإعلان */}
            <div className="mt-3 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold">{displayTitle}</h1>
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

            {/* وصف الإعلان مباشرة تحت العنوان */}
            {displayDescription && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {displayDescription}
              </p>
            )}

            {/* خانات بقرب الوصف: التوصيل، التفاوض، بلد الصنع، الماركة */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-sm">
                <Truck className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {item.deliveryAvailable ? "يوجد توصيل" : "لا يوجد توصيل"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-sm">
                <TagIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {item.negotiable ? "قابل للتفاوض" : "السعر ثابت"}
                </span>
              </div>
              {item.countryOfOrigin && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-sm">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {countryByName(item.countryOfOrigin)?.flag ?? ""} بلد الصنع:{" "}
                    {countryByName(item.countryOfOrigin)?.ar ?? item.countryOfOrigin}
                  </span>
                </div>
              )}
              {item.brand && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-sm">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold">الماركة: {item.brand}</span>
                </div>
              )}
            </div>

            {/* وصف الماركة التلقائي: بلد المنشأ، النوع، مستوى السوق والتخصص */}
            {bInfo && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-accent/30 p-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <h2 className="font-extrabold text-primary">
                    {bInfo.name} <span className="text-foreground">— {bInfo.country}</span>
                  </h2>
                </div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{bInfo.type}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{bInfo.description}</p>
              </div>
            )}

            {/* السعر */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              {item.price > 0 ? (
                <>
                  <span className="text-3xl font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
                  <span className="text-sm font-semibold text-muted-foreground">د.ب</span>
                  {item.oldPrice != null && item.oldPrice > item.price && (
                    <>
                      <span className="text-lg font-semibold text-muted-foreground line-through">
                        {item.oldPrice.toLocaleString("ar")}
                      </span>
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
                        خصم {Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%
                      </span>
                    </>
                  )}
                  {item.negotiable && <span className="text-xs text-muted-foreground">• قابل للتفاوض</span>}
                </>
              ) : (
                <span className="text-2xl font-extrabold text-muted-foreground">بدون سعر</span>
              )}
            </div>


            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" /> {boostViews(item.views, boost).toLocaleString("ar")} مشاهدة
            </div>

            {/* مزاد مباشر */}
            {item.listingType === "auction" && (
              <AuctionBidBox
                listingId={item.id}
                startPrice={item.startPrice ?? item.price}
                auctionEndsAt={item.auctionEndsAt}
              />
            )}

            {/* أيقونات التواصل */}
            <div className={`mt-4 grid gap-2 ${phone ? "grid-cols-3" : "grid-cols-1"}`}>
              {phone && waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    logContactAttempt({
                      recipientId: item.userId,
                      listingId: item.id,
                      method: "whatsapp",
                      listingTitle: item.title,
                    })
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> {lang === "ar" ? "واتساب" : "WhatsApp"}
                </a>
              )}
              {phone && (
                <a
                  href={telLink(phone)}
                  onClick={() =>
                    logContactAttempt({
                      recipientId: item.userId,
                      listingId: item.id,
                      method: "call",
                      listingTitle: item.title,
                    })
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Phone className="h-4 w-4" /> {lang === "ar" ? "اتصال" : "Call"}
                </a>
              )}
              <button
                type="button"
                onClick={() => setOfferOpen(true)}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
              >
                <Tag className="h-4 w-4" /> {lang === "ar" ? "عرض سعر" : "Offer"}
              </button>
            </div>

            {/* تقييمات المعلن — أسفل أزرار التواصل مباشرة */}
            <div className="mt-5">
              <SellerReviews sellerId={item.userId ?? item.id} sellerName={sellerName} />
            </div>

            {/* بيانات البائع ووقت النشر أسفل الصورة المعروضة */}
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
                {reviews > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" /> {rating.toLocaleString("ar")}
                    </span>
                    <span className="text-muted-foreground">({reviews.toLocaleString("ar")} تقييم)</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">لا توجد تقييمات بعد</span>
                )}
                {deals > 0 && <span className="text-muted-foreground">• {deals.toLocaleString("ar")} صفقة ناجحة</span>}
              </div>
              {publishedAt && mounted && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> نُشر {timeAgo(publishedAt)}
                </p>
              )}
              {seller?.member_since && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> عضو منذ{" "}
                  {new Date(seller.member_since).toLocaleDateString("ar", { year: "numeric", month: "long" })}
                </p>
              )}
            </div>

            {/* مشاركة الإعلان على منصات التواصل */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-3">
              <ShareButtons
                url={`https://www.alsaada.sale/listing/${item.id}`}
                title={displayTitle}
                compact
              />
            </div>
          </div>
        </div>




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

        {/* اسم المنطقة فوق الخريطة */}
        {item.city && (
          <div className="mt-6 flex items-center gap-1.5 text-lg font-extrabold">
            <MapPin className="h-5 w-5 text-primary" /> {displayCity(item.city)}
          </div>
        )}

        {/* خريطة الموقع */}
        {mapSrc && mapPoint && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <iframe
              title="خريطة قوقل لموقع الإعلان"
              src={mapSrc}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {approxLocation && (
              <p className="px-3 pt-2 text-center text-xs text-muted-foreground">
                الموقع تقريبي حسب المدينة المختارة
              </p>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapPoint.lat},${mapPoint.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 text-center text-sm font-semibold text-primary hover:underline"
            >
              فتح في خرائط قوقل
            </a>
          </div>
        )}

        {/* هاشتاقات تلقائية أسفل الخريطة */}
        <ListingHashtags
          tags={[cat?.name, item.groupName, item.itemName, item.city, showsCondition(cat?.name, cat?.nameEn) ? item.condition : undefined]}
          className="mt-4"
        />
      </main>
      <Footer />
      {offerOpen && (
        <PriceOfferDialog
          listingId={item.id}
          recipientId={item.userId}
          listingTitle={item.title}
          currentPrice={item.price}
          onClose={() => setOfferOpen(false)}
        />
      )}
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

/** شريط تحقق سريع يعرض اكتمال حقول Schema (offers / aggregateRating / review) لصاحب الإعلان. */
function SchemaCheckBar({
  item,
  hasRating,
}: {
  item: { price?: number; images?: string[]; description?: string; brand?: string };
  hasRating: boolean;
}) {
  const checks: { label: string; ok: boolean }[] = [
    { label: "السعر والعملة (offers.price + BHD)", ok: (item.price ?? 0) > 0 },
    { label: "توفر المنتج (availability: InStock)", ok: true },
    { label: "سياسة الإرجاع (hasMerchantReturnPolicy)", ok: true },
    { label: "تفاصيل الشحن (shippingDetails)", ok: true },
    { label: "صورة المنتج (image)", ok: (item.images?.length ?? 0) > 0 },
    { label: "الوصف (description)", ok: !!item.description?.trim() },
    { label: "الماركة (brand)", ok: !!item.brand?.trim() },
    { label: "التقييم (aggregateRating + review)", ok: hasRating },
  ];
  const passed = checks.filter((c) => c.ok).length;
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-card-foreground">
          فحص Schema للإعلان (متطلبات Google)
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            passed === checks.length
              ? "bg-green-600/15 text-green-700"
              : "bg-amber-500/15 text-amber-700"
          }`}
        >
          {passed}/{checks.length} مكتمل
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-xs">
            <span className={c.ok ? "text-green-600" : "text-amber-600"}>
              {c.ok ? "✓" : "⚠"}
            </span>
            <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
      {!hasRating && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          ملاحظة: تظهر حقول التقييم (aggregateRating/review) في الكود البنيوي تلقائياً عند توفر تقييم واحد على الأقل لصاحب الإعلان.
        </p>
      )}
    </div>
  );
}
