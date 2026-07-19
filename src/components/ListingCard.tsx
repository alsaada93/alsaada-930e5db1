import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Eye, Star, BadgeCheck, MessageCircle, Phone, Tag } from "lucide-react";
import { categories, type Listing } from "@/data/marketplace";
import { showsCondition, categoryKind, realEstateLabel } from "@/lib/category-kind";
import { isPriceOnRequest, priceOnRequestLabel } from "@/lib/price-display";
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
import { useCardConfig } from "@/hooks/useCardConfig";

const DEFAULT_PHONE = "33982383"; // الرقم المحلي البحريني (قسم المطاعم فقط)

const BTN_SIZE: Record<string, string> = {
  sm: "px-2 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};
const BTN_ICON: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};
const IMG_BG: Record<string, string> = {
  background: "bg-background",
  white: "bg-white",
  muted: "bg-muted",
};

export function ListingCard({
  item,
  displayTitle,
  hideContact = false,
  hideMeta = false,
}: {
  item: Listing;
  displayTitle?: string;
  /** إخفاء أزرار التواصل (واتساب/اتصال/دردشة) — مستخدم في الصفحة الرئيسية */
  hideContact?: boolean;
  /** إخفاء التقييم والموقع وعدد المشاهدات — مستخدم في الصفحة الرئيسية والعروض */
  hideMeta?: boolean;
}) {
  const { byId } = useSellers();
  const { t, lang } = useLanguage();
  const { boost } = useViewBoost();
  const { config } = useCardConfig();
  const seller = item.sellerId ? byId.get(item.sellerId) : undefined;
  const [chatOpen, setChatOpen] = useState(false);
  const [safety, setSafety] = useState<null | { label: string; run: () => void }>(null);

  const isRestaurant = item.categoryId === "restaurant" || item.category === "مطاعم وكافيهات";
  const isOffer = Boolean(item.isOffer);
  const phone = seller?.phone ?? item.phone ?? (isRestaurant ? DEFAULT_PHONE : null);
  const rating = listingRating(item.id);
  const reviews = seller?.reviews_count ?? item.sellerReviews ?? 0;
  const deals = seller?.deals_count ?? item.sellerDeals ?? 0;
  const verified = seller?.verified ?? item.sellerVerified ?? false;
  const title = displayTitle || item.title;
  const condLabel = item.condition === "جديد" ? t("cond.new") : t("cond.used");
  const cat = categories.find((c) => c.id === item.categoryId || c.id === item.category);
  const showCond = showsCondition(cat?.name ?? item.category, cat?.nameEn);
  const isRealEstate = categoryKind(cat?.name ?? item.category, cat?.nameEn) === "realestate";
  const reLabel = realEstateLabel(`${item.title} ${item.description ?? ""}`);

  const waLink = phone ? whatsappLink({ phone, listingTitle: title, listingId: item.id }) : null;

  const brand = detectBrand(`${item.title} ${item.description ?? ""}`);
  const brandLogo = carBrandLogo(brand);

  // قياس مربع الصورة من إعدادات لوحة التحكم
  const imageStyle =
    config.imageAspect === "custom"
      ? { height: `${config.imageHeightPx}px` }
      : { aspectRatio: config.imageAspect.replace("/", " / ") };
  const objectFit = config.imageFit === "cover" ? "object-cover" : "object-contain";

  // صور الإعلان مع التمرير التلقائي (انزلاق من اليمين لليسار) داخل البطاقة
  const gallery = (item.images && item.images.length > 0 ? item.images : [item.image]).filter(Boolean);
  const [imgIndex, setImgIndex] = useState(0);
  // فاصل زمني عشوائي لكل بطاقة بين 1.5 و2.5 ثانية حتى لا تتحرك كل الإعلانات معاً
  const rotateMs = useMemo(() => 2500 + Math.random() * 1000, []);
  useEffect(() => {
    if (!config.imageAutoRotate || gallery.length < 2) return;
    const timer = setInterval(() => {
      setImgIndex((i) => (i + 1) % gallery.length);
    }, rotateMs);
    return () => clearInterval(timer);
  }, [config.imageAutoRotate, rotateMs, gallery.length]);


  // أزرار التواصل الظاهرة
  const showWa = config.showContact && config.showWhatsapp && !!phone && !!waLink;
  const showCall = config.showContact && config.showCall && !!phone;
  const showChat = config.showContact && config.showChat;
  const visibleBtns = [showWa, showCall, showChat].filter(Boolean).length;
  const btnCls = `inline-flex items-center justify-center gap-1 font-bold transition-opacity hover:opacity-90 ${BTN_SIZE[config.buttonSize] ?? BTN_SIZE.sm}`;
  const btnIcon = BTN_ICON[config.buttonSize] ?? BTN_ICON.sm;

  return (
    <article
      className="group overflow-hidden border border-border bg-card shadow-card transition-shadow"
      style={{ borderRadius: `${config.cardRadius}px` }}
    >
      <Link to="/listing/$id" params={{ id: item.id }} className="block">
        <div
          className={`relative flex items-center justify-center overflow-hidden ${IMG_BG[config.imageBg] ?? IMG_BG.background}`}
          style={imageStyle}
        >
          <div
            dir="ltr"
            className="flex h-full w-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${imgIndex * 100}%)` }}
          >

            {gallery.map((img, i) => (
              <img
                key={`${img}-${i}`}
                src={optimizedImage(img, 600, 70, config.imageFit)}
                srcSet={optimizedSrcSet(img, [300, 600, 900], 70, config.imageFit)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                alt={title}
                width={600}
                height={600}
                loading="lazy"
                decoding="async"
                className={`block h-full w-full shrink-0 object-center ${objectFit}`}
              />
            ))}
          </div>


          {gallery.length > 1 && (
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === imgIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {config.showWatermark && (
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 select-none text-[10px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              حراج السعادة
            </span>
          )}

          {config.showBrandLogo && brandLogo && (
            <span className="absolute left-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 p-1 shadow-md ring-1 ring-black/5">
              <img src={brandLogo} alt={brand ?? ""} loading="lazy" className="h-full w-full object-contain" />
            </span>
          )}

          {isOffer && (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-glow">
              {lang === "en" ? "Special offer" : "عرض خاص"}
            </span>
          )}
          {!isOffer && item.featured && (
            <span className="absolute right-2 top-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-glow">
              {t("card.featured")}
            </span>
          )}
          {isOffer && item.sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rotate-[-12deg] rounded-lg bg-red-600 px-4 py-1.5 text-base font-extrabold text-white shadow-lg ring-2 ring-white/80">
                {lang === "en" ? "SOLD" : "تم البيع"}
              </span>
            </div>
          )}
          {config.showCondition && !isOffer && showCond && (
            <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
              {condLabel}
            </span>
          )}
          {config.showCondition && !isOffer && isRealEstate && (
            <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
              {lang === "en" ? reLabel.en : reLabel.ar}
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        {config.showTitle && (
          <Link to="/listing/$id" params={{ id: item.id }}>
            <h3 className="line-clamp-1 font-bold text-card-foreground hover:text-primary">{title}</h3>
          </Link>
        )}
        {config.showPrice && (
          <div className="mt-1 flex items-baseline gap-1">
            {!isPriceOnRequest(item.price) ? (
              <>
                <span className="text-lg font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
                <span className="text-xs font-semibold text-muted-foreground">د.ب</span>
                {item.negotiable && <span className="text-[11px] text-muted-foreground">• {t("card.negotiable")}</span>}
              </>
            ) : (
              <span className="text-sm font-bold text-primary">{priceOnRequestLabel(lang)}</span>
            )}
          </div>
        )}

        {!hideMeta && config.showRating && (
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
        )}

        {!hideMeta && (config.showLocation || config.showViews) && (
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            {config.showLocation ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {displayCity(item.city)}
              </span>
            ) : (
              <span />
            )}
            {config.showViews && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {boostViews(item.views, boost).toLocaleString("ar")}
              </span>
            )}
          </div>
        )}

        {!hideContact && config.showContact && visibleBtns > 0 && (
          <div className={`mt-3 grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${visibleBtns}, minmax(0, 1fr))` }}>
            {showWa && (
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
                      window.open(waLink!, "_blank", "noopener,noreferrer");
                    },
                  });
                }}
                className={`${btnCls} bg-[#25D366] text-white`}
                style={{ borderRadius: `${config.buttonRadius}px` }}
                aria-label={t("card.whatsapp")}
              >
                <MessageCircle className={btnIcon} /> {t("card.whatsapp")}
              </button>
            )}
            {showCall && (
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
                      window.location.href = telLink(phone!);
                    },
                  });
                }}
                className={`${btnCls} bg-primary text-primary-foreground`}
                style={{ borderRadius: `${config.buttonRadius}px` }}
                aria-label={t("card.call")}
              >
                <Phone className={btnIcon} /> {t("card.call")}
              </button>
            )}
            {showChat && (
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
                className={`${btnCls} border border-border bg-muted text-foreground hover:bg-accent`}
                style={{ borderRadius: `${config.buttonRadius}px` }}
              >
                <Tag className={btnIcon} /> {t("card.message")}
              </button>
            )}
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

      <SafetyModal
        open={safety != null}
        continueLabel={safety?.label ?? ""}
        onClose={() => setSafety(null)}
        onContinue={() => safety?.run()}
      />
    </article>
  );
}
