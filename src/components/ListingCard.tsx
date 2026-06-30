import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Eye, Star, BadgeCheck, MessageCircle, Phone, Tag } from "lucide-react";
import { categories, type Listing } from "@/data/marketplace";
import { showsCondition } from "@/lib/category-kind";
import { displayCity } from "@/data/bahrainCities";
import { useSellers } from "@/hooks/useSellers";
import { useLanguage } from "@/hooks/useLanguage";
import { logContactAttempt, whatsappLink, telLink } from "@/lib/contact";
import { SafetyModal } from "@/components/SafetyModal";
import { ListingChatDialog } from "@/components/ListingChatDialog";
import { useViewBoost, boostViews } from "@/hooks/useViewBoost";
import { detectBrand } from "@/lib/facebook-parse";
import { carBrandLogo } from "@/data/carBrandLogos";
import { listingRating } from "@/lib/rating";
import { optimizedImage, optimizedSrcSet } from "@/lib/image-url";

const DEFAULT_PHONE = "33982383"; // الرقم المحلي البحريني (قسم المطاعم فقط)

export function ListingCard({
  item,
  displayTitle,
  hideContact = false,
}: {
  item: Listing;
  displayTitle?: string;
  /** إخفاء أزرار التواصل (واتساب/اتصال/دردشة) — مستخدم في الصفحة الرئيسية */
  hideContact?: boolean;
}) {
  const { byId } = useSellers();
  const { t, lang } = useLanguage();
  const { boost } = useViewBoost();
  const seller = item.sellerId ? byId.get(item.sellerId) : undefined;
  const [chatOpen, setChatOpen] = useState(false);
  const [safety, setSafety] = useState<null | { label: string; run: () => void }>(null);

  const isRestaurant = item.categoryId === "restaurant" || item.category === "مطاعم وكافيهات";
  const phone = seller?.phone ?? item.phone ?? (isRestaurant ? DEFAULT_PHONE : null);
  const sellerName = seller?.name ?? item.seller ?? t("card.trustedSeller");
  const rating = listingRating(item.id);
  const reviews = seller?.reviews_count ?? item.sellerReviews ?? 0;
  const deals = seller?.deals_count ?? item.sellerDeals ?? 0;
  const verified = seller?.verified ?? item.sellerVerified ?? false;
  const title = displayTitle || item.title;
  const condLabel = item.condition === "جديد" ? t("cond.new") : t("cond.used");
  const cat = categories.find((c) => c.id === item.categoryId || c.id === item.category);
  const showCond = showsCondition(cat?.name ?? item.category, cat?.nameEn);

  const waLink = phone ? whatsappLink({ phone, listingTitle: title, listingId: item.id }) : null;

  const brand = detectBrand(`${item.title} ${item.description ?? ""}`);
  const brandLogo = carBrandLogo(brand);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1">
      <Link to="/listing/$id" params={{ id: item.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={optimizedImage(item.image, 400)}
            srcSet={optimizedSrcSet(item.image, [200, 400, 600])}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            alt={title}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 select-none text-[10px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            حراج السعادة
          </span>

          {brandLogo && (
            <span className="absolute left-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 p-1 shadow-md ring-1 ring-black/5">
              <img src={brandLogo} alt={brand ?? ""} loading="lazy" className="h-full w-full object-contain" />
            </span>
          )}

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
          {item.price > 0 ? (
            <>
              <span className="text-lg font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
              <span className="text-xs font-semibold text-muted-foreground">د.ب</span>
              {item.negotiable && <span className="text-[11px] text-muted-foreground">• {t("card.negotiable")}</span>}
            </>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">بدون سعر</span>
          )}
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
          <span className="text-muted-foreground">
            ({reviews.toLocaleString("ar")} {t("card.reviews")})
          </span>
          {deals > 0 && (
            <span className="text-muted-foreground">
              • {deals.toLocaleString("ar")} {t("card.deal")}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {displayCity(item.city)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {boostViews(item.views, boost).toLocaleString("ar")}
          </span>
        </div>

        {!hideContact && (
        <div className={`mt-3 grid gap-1.5 ${phone ? "grid-cols-3" : "grid-cols-1"}`}>
          {phone && waLink && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSafety({
                  label: lang === "ar" ? "متابعة إلى واتساب" : "Continue to WhatsApp",
                  run: () => {
                    logContactAttempt({
                      recipientId: item.userId,
                      listingId: item.id,
                      method: "whatsapp",
                      listingTitle: item.title,
                    });
                    window.open(waLink, "_blank", "noopener,noreferrer");
                  },
                });
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              aria-label={t("card.whatsapp")}
            >
              <MessageCircle className="h-3.5 w-3.5" /> {t("card.whatsapp")}
            </button>
          )}
          {phone && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSafety({
                  label: lang === "ar" ? "متابعة إلى الاتصال" : "Continue to Call",
                  run: () => {
                    logContactAttempt({
                      recipientId: item.userId,
                      listingId: item.id,
                      method: "call",
                      listingTitle: item.title,
                    });
                    window.location.href = telLink(phone);
                  },
                });
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
              aria-label={t("card.call")}
            >
              <Phone className="h-3.5 w-3.5" /> {t("card.call")}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setSafety({
                label: lang === "ar" ? "متابعة إلى الدردشة" : "Continue to Chat",
                run: () => setChatOpen(true),
              });
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
          >
            <Tag className="h-3.5 w-3.5" /> {t("card.message")}
          </button>
        </div>
        )}
      </div>

      {!hideContact && (
        <ListingChatDialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          listingId={item.id}
          listingTitle={item.title}
          sellerId={item.userId ?? null}
        />
      )}

      <ListingChatDialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        listingId={item.id}
        listingTitle={item.title}
        sellerId={item.userId ?? null}
      />

      <SafetyModal
        open={safety != null}
        continueLabel={safety?.label ?? ""}
        onClose={() => setSafety(null)}
        onContinue={() => safety?.run()}
      />
    </article>
  );
}
