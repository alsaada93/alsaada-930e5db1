import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Eye, Star, BadgeCheck, MessageCircle, Phone, Tag } from "lucide-react";
import { categories, type Listing } from "@/data/marketplace";
import { showsCondition } from "@/lib/category-kind";
import { displayCity } from "@/data/bahrainCities";
import { useSellers } from "@/hooks/useSellers";
import { useLanguage } from "@/hooks/useLanguage";
import { logContactAttempt, whatsappLink, telLink } from "@/lib/contact";
import { PriceOfferDialog } from "@/components/PriceOfferDialog";
import { useViewBoost, boostViews } from "@/hooks/useViewBoost";
import { detectBrand } from "@/lib/facebook-parse";
import { carBrandLogo } from "@/data/carBrandLogos";

const DEFAULT_PHONE = "33982383"; // الرقم المحلي البحريني

export function ListingCard({ item, displayTitle }: { item: Listing; displayTitle?: string }) {
  const { byId } = useSellers();
  const { t, lang } = useLanguage();
  const { boost } = useViewBoost();
  const seller = item.sellerId ? byId.get(item.sellerId) : undefined;
  const [offerOpen, setOfferOpen] = useState(false);

  const phone = seller?.phone ?? item.phone ?? DEFAULT_PHONE;
  const sellerName = seller?.name ?? item.seller ?? t("card.trustedSeller");
  const rating = seller?.rating ?? item.sellerRating ?? 4.8;
  const reviews = seller?.reviews_count ?? item.sellerReviews ?? 0;
  const deals = seller?.deals_count ?? item.sellerDeals ?? 0;
  const verified = seller?.verified ?? item.sellerVerified ?? false;
  const title = displayTitle || item.title;
  const condLabel = item.condition === "جديد" ? t("cond.new") : t("cond.used");
  const cat = categories.find((c) => c.id === item.category);
  const showCond = showsCondition(cat?.name ?? item.category, cat?.nameEn);

  const waLink = whatsappLink({ phone, listingTitle: title, listingId: item.id });

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1">
      <Link to="/listing/$id" params={{ id: item.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 select-none text-[10px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            حراج السعادة
          </span>

          {item.featured && (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-glow">
              {t("card.featured")}
            </span>
          )}
          {showCond && (
            <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
              {condLabel}
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link to="/listing/$id" params={{ id: item.id }}>
          <h3 className="line-clamp-1 font-bold text-card-foreground hover:text-primary">{title}</h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
          <span className="text-xs font-semibold text-muted-foreground">د.ب</span>
          {item.negotiable && <span className="text-[11px] text-muted-foreground">• {t("card.negotiable")}</span>}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {verified && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" /> {t("card.verified")}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" /> {rating.toLocaleString("ar")}
          </span>
          <span className="text-muted-foreground">({reviews.toLocaleString("ar")} {t("card.reviews")})</span>
          {deals > 0 && <span className="text-muted-foreground">• {deals.toLocaleString("ar")} {t("card.deal")}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {displayCity(item.city)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {boostViews(item.views, boost).toLocaleString("ar")}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              logContactAttempt({ recipientId: item.userId, listingId: item.id, method: "whatsapp", listingTitle: item.title });
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
            aria-label={t("card.whatsapp")}
          >
            <MessageCircle className="h-3.5 w-3.5" /> {t("card.whatsapp")}
          </a>
          <a
            href={telLink(phone)}
            onClick={(e) => {
              e.stopPropagation();
              logContactAttempt({ recipientId: item.userId, listingId: item.id, method: "call", listingTitle: item.title });
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            aria-label={t("card.call")}
          >
            <Phone className="h-3.5 w-3.5" /> {t("card.call")}
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOfferOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
          >
            <Tag className="h-3.5 w-3.5" /> {t("card.offer")}
          </button>
        </div>
      </div>


      {offerOpen && (
        <PriceOfferDialog
          listingId={item.id}
          recipientId={item.userId}
          listingTitle={item.title}
          currentPrice={item.price}
          onClose={() => setOfferOpen(false)}
        />
      )}
    </article>
  );
}
