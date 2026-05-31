import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Eye, Star, BadgeCheck, MessageCircle, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/data/marketplace";
import { useSellers } from "@/hooks/useSellers";

const DEFAULT_PHONE = "97333000000"; // E.164 without +

export function ListingCard({ item }: { item: Listing }) {
  const { byId } = useSellers();
  const seller = item.sellerId ? byId.get(item.sellerId) : undefined;

  const phone = seller?.phone ?? item.phone ?? DEFAULT_PHONE;
  const sellerName = seller?.name ?? item.seller ?? "بائع موثوق";
  const rating = seller?.rating ?? item.sellerRating ?? 4.8;
  const reviews = seller?.reviews_count ?? item.sellerReviews ?? 0;
  const deals = seller?.deals_count ?? item.sellerDeals ?? 0;
  const verified = seller?.verified ?? item.sellerVerified ?? false;

  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(
    `مرحباً، أنا مهتم بإعلان "${item.title}" المعروض على سوقو.`,
  )}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1">
      <Link to="/listing/$id" params={{ id: item.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {item.featured && (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-glow">
              مميّز
            </span>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
            {item.condition}
          </span>
        </div>
      </Link>
      <button
        className="absolute hidden"
        aria-hidden
        tabIndex={-1}
      >
        <Heart className="h-4 w-4" />
      </button>
      <div className="p-3">
        <Link to="/listing/$id" params={{ id: item.id }}>
          <h3 className="line-clamp-1 font-bold text-card-foreground hover:text-primary">{item.title}</h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
          <span className="text-xs font-semibold text-muted-foreground">د.ب</span>
          {item.negotiable && <span className="text-[11px] text-muted-foreground">• قابل للتفاوض</span>}
        </div>

        {/* تقييم البائع الحقيقي */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {verified && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" /> موثق
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" /> {rating.toLocaleString("ar")}
          </span>
          <span className="text-muted-foreground">({reviews.toLocaleString("ar")} تقييم)</span>
          {deals > 0 && <span className="text-muted-foreground">• {deals.toLocaleString("ar")} صفقة</span>}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {item.city}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString("ar")}
          </span>
        </div>

        {/* أزرار التواصل */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
            aria-label={`تواصل عبر واتساب مع ${sellerName}`}
          >
            <MessageCircle className="h-3.5 w-3.5" /> واتساب
          </a>
          <a
            href={`tel:+${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            aria-label={`اتصل بـ ${sellerName}`}
          >
            <Phone className="h-3.5 w-3.5" /> اتصال
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.info("الرسائل الداخلية", {
                description: "سيتم فتح المحادثة بعد تسجيل الدخول.",
              });
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
          >
            <MessageSquare className="h-3.5 w-3.5" /> رسالة
          </button>
        </div>
      </div>
    </article>
  );
}
