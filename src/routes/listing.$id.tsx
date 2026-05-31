import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Eye,
  Star,
  BadgeCheck,
  MessageCircle,
  Phone,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { listings } from "@/data/marketplace";
import { useSeller } from "@/hooks/useSellers";
import { SellerReviews } from "@/components/SellerReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        category: data.item_name ?? data.category_id ?? "",
        image: data.images?.[0] ?? "/placeholder.svg",
        featured: data.featured,
        views: data.views,
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
    const url = `https://soogo-hub.lovable.app/listing/${params.id}`;
    const image = loaderData?.item.image ?? "";
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

function ListingPage() {
  const { item } = Route.useLoaderData();
  const { data: seller } = useSeller(item.sellerId);

  const phone = seller?.phone ?? item.phone ?? "97333000000";
  const sellerName = seller?.name ?? "بائع موثوق";
  const rating = seller?.rating ?? 4.8;
  const reviews = seller?.reviews_count ?? 0;
  const deals = seller?.deals_count ?? 0;
  const verified = seller?.verified ?? false;

  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(
    `مرحباً، أنا مهتم بإعلان "${item.title}" المعروض على السعادة ماركت.`,
  )}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowRight className="h-4 w-4" /> العودة للرئيسية
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
          </div>

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
            </div>
            <h1 className="mt-3 text-2xl font-extrabold">{item.title}</h1>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
              <span className="text-sm font-semibold text-muted-foreground">د.ب</span>
              {item.negotiable && <span className="text-xs text-muted-foreground">• قابل للتفاوض</span>}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {item.city}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {item.views.toLocaleString("ar")} مشاهدة
              </span>
            </div>

            {/* بطاقة البائع */}
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
