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
  Tag,
  Gavel,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { categories, bahrainRegions, listings } from "@/data/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

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

type ListingType = "normal" | "auction" | "business";

interface AiEstimate {
  average: number;
  suggested: number;
  speed: string;
  market: string;
}

function AddListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [listingType, setListingType] = useState<ListingType | null>(null);
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

  // Media (keep File objects so we can upload them to storage)
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [video, setVideo] = useState<{ url: string; file: File } | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  // Price + AI
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("مستعمل");
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(t("toast.maxImages"));
      return;
    }
    const next = Array.from(files)
      .slice(0, remaining)
      .map((f) => ({ url: URL.createObjectURL(f), file: f }));
    setImages((p) => [...p, ...next]);
  };

  const handleVideo = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setVideo({ url: URL.createObjectURL(files[0]), file: files[0] });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("toast.noGeo"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success(t("toast.located"));
      },
      () => {
        setLocating(false);
        toast.error(t("toast.geoFail"));
      },
    );
  };

  const estimatePrice = () => {
    if (!activeCategory) {
      toast.error(t("toast.pickCat"));
      return;
    }
    setEstimating(true);
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
        speed: condition === "جديد" ? t("speed.fast") : t("speed.medium"),
        market: suggested > average ? t("market.above") : t("market.within"),
      });
      if (!price) setPrice(String(suggested));
      setEstimating(false);
    }, 700);
  };

  const uploadFile = async (file: File, kind: string) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${kind}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
  };

  const numOrNull = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return v != null && v !== "" && !Number.isNaN(n) ? n : null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user && (!guestName.trim() || !guestPhone.trim())) {
      toast.error(t("toast.guestNeeded"));
      return;
    }
    if (!region) {
      toast.error(t("toast.pickRegion"));
      return;
    }
    if (images.length === 0) {
      toast.error(t("toast.needImage"));
      return;
    }

    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      // Upload media
      const imageUrls = await Promise.all(images.map((img) => uploadFile(img.file, "images")));
      const videoUrl = video ? await uploadFile(video.file, "videos") : null;

      const isBusiness = listingType === "business";
      const isAuction = listingType === "auction";
      const auctionHours = numOrNull(fd.get("auctionDuration")) ?? 24;

      const payload = {
        user_id: user?.id ?? null,
        listing_type: listingType ?? "normal",
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        price: Number(price) || 0,
        condition,
        category_id: categoryId || null,
        group_name: groupName || null,
        item_name: itemName || null,
        city: region,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        images: imageUrls,
        video: videoUrl,
        contact_name: user ? (user.email ?? null) : guestName.trim(),
        contact_phone: user ? null : guestPhone.trim(),
        status: "approved",
        start_price: isAuction ? Number(price) || 0 : null,
        auction_ends_at: isAuction
          ? new Date(Date.now() + auctionHours * 3600_000).toISOString()
          : null,
        rent: isBusiness ? numOrNull(fd.get("rent")) : null,
        area_sqm: isBusiness ? numOrNull(fd.get("area")) : null,
        outlets: isBusiness ? numOrNull(fd.get("outlets")) : null,
        staff_count: isBusiness ? numOrNull(fd.get("staff")) : null,
        monthly_revenue: isBusiness ? numOrNull(fd.get("monthlyRevenue")) : null,
        operating_cost: isBusiness ? numOrNull(fd.get("opCost")) : null,
        has_license: isBusiness ? fd.get("license") === "with" : null,
        includes_equipment: isBusiness ? fd.get("includesEquip") === "on" : null,
        sale_reason: isBusiness ? String(fd.get("reason") || "").trim() || null : null,
      };

      const { error } = await supabase.from("listings").insert(payload);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(lang === "ar" ? "تعذّر نشر الإعلان، حاول مرة أخرى" : "Could not publish, try again");
    } finally {
      setSaving(false);
    }
  };

  // ---- Success screen ----
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-4 text-2xl font-extrabold">{t("add.received")}</h1>
            <p className="mt-2 text-muted-foreground">{t("add.receivedDesc")}</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground"
            >
              {t("add.back")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- Type chooser screen ----
  if (!listingType) {
    const options: { type: ListingType; icon: typeof Tag; title: string; desc: string }[] = [
      { type: "normal", icon: Tag, title: t("add.typeNormal"), desc: t("add.typeNormalDesc") },
      { type: "auction", icon: Gavel, title: t("add.typeAuction"), desc: t("add.typeAuctionDesc") },
      { type: "business", icon: Store, title: t("add.typeBusiness"), desc: t("add.typeBusinessDesc") },
    ];
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" /> {t("add.back")}
          </Link>
          <h1 className="text-2xl font-extrabold">{t("add.chooseTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("add.chooseSub")}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {options.map((o) => (
              <button
                key={o.type}
                type="button"
                onClick={() => setListingType(o.type)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <o.icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-extrabold">{o.title}</h3>
                <p className="text-sm text-muted-foreground">{o.desc}</p>
                <span className="mt-2 text-sm font-bold text-primary group-hover:underline">{t("add.continue")} →</span>
              </button>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heading =
    listingType === "auction" ? t("add.newAuction") : listingType === "business" ? t("add.newBusiness") : t("add.newAd");
  const submitLabel =
    listingType === "auction" ? t("add.publishAuction") : listingType === "business" ? t("add.publishBusiness") : t("add.publish");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <button
          onClick={() => setListingType(null)}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="h-4 w-4" /> {t("add.changeType")}
        </button>

        <h1 className="text-2xl font-extrabold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{t("add.formSub")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Contact / login */}
          {!user ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">{t("add.contactGuest")}</span>
                <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <LogIn className="h-3.5 w-3.5" /> {t("add.loginShort")}
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t("add.name")}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  required
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder={t("add.phone")}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              {t("add.postingAs")} <span className="font-bold">{user.email}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-semibold">{t("add.adTitle")}</label>
            <input
              required
              type="text"
              name="title"
              placeholder={t("add.adTitlePh")}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category cascade */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">{t("add.mainCat")}</label>
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
                <option value="" disabled>{t("add.chooseCat")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {lang === "ar" ? c.name : c.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">{t("add.subCat")}</label>
              <select
                value={groupName}
                disabled={!activeCategory}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setItemName("");
                }}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t("add.chooseSection")}</option>
                {activeCategory?.groups.map((g) => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">{t("add.type")}</label>
              <select
                value={itemName}
                disabled={!activeGroup}
                onChange={(e) => setItemName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t("add.chooseTypeOpt")}</option>
                {activeGroup?.items.map((it) => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Business details */}
          {listingType === "business" && <BusinessFields t={t} />}

          {/* Region search */}
          <div className="relative">
            <label className="mb-1 block text-sm font-semibold">{t("add.region")}</label>
            <div className="relative">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={region || regionQuery}
                onChange={(e) => {
                  setRegion("");
                  setRegionQuery(e.target.value);
                  setRegionOpen(true);
                }}
                onFocus={() => setRegionOpen(true)}
                placeholder={t("add.regionPh")}
                className="h-11 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full rounded-md px-3 py-2 text-start text-sm hover:bg-accent"
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
            <label className="mb-1 block text-sm font-semibold">{t("add.mapLocation")}</label>
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-primary" />
              {locating ? t("add.locating") : coords ? t("add.updateLocation") : t("add.useMyLocation")}
            </button>
            {coords && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <iframe
                  title="map"
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
              {t("add.images")} ({images.length}/{MAX_IMAGES})
            </label>
            <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => handleImages(e.target.files)} />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((img, i) => (
                <div key={img.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={img.url} alt={`${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute start-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
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
                  <span className="text-[10px] font-semibold">{t("add.addImg")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Video */}
          <div>
            <label className="mb-1 block text-sm font-semibold">{t("add.video")}</label>
            <input ref={vidInput} type="file" accept="video/*" hidden onChange={(e) => handleVideo(e.target.files)} />
            {video ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <video src={video.url} controls className="h-56 w-full bg-black object-contain" />
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  className="absolute start-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground"
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
                <Video className="h-5 w-5" /> {t("add.addVideo")}
              </button>
            )}
          </div>

          {/* Price + condition + AI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                {listingType === "auction" ? t("add.startPrice") : t("add.price")}
              </label>
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
            {listingType === "auction" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold">{t("add.auctionDuration")}</label>
                <input
                  type="number"
                  name="auctionDuration"
                  min={1}
                  defaultValue={24}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-semibold">{t("add.condition")}</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="جديد">{t("add.new")}</option>
                  <option value="مستعمل">{t("add.used")}</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={estimatePrice}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/70"
          >
            <Sparkles className="h-4 w-4" />
            {estimating ? t("add.analyzing") : t("add.aiSuggest")}
          </button>

          {estimate && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-4">
              <Stat label={t("add.avgPrice")} value={`${estimate.average} ${lang === "ar" ? "د.ب" : "BHD"}`} />
              <Stat label={t("add.suggestedPrice")} value={`${estimate.suggested} ${lang === "ar" ? "د.ب" : "BHD"}`} />
              <Stat label={t("add.sellSpeed")} value={estimate.speed} />
              <Stat label={t("add.marketCompare")} value={estimate.market} />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold">{t("add.description")}</label>
            <textarea
              required
              rows={5}
              placeholder={t("add.descPh")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
          >
            {submitLabel}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function BusinessFields({ t }: { t: (k: string) => string }) {
  const [license, setLicense] = useState("with");
  const input =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  return (
    <div className="rounded-2xl border border-primary/30 bg-accent/30 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-primary">
        <Store className="h-4 w-4" /> {t("biz.heading")}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.rent")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.area")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.outlets")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.staff")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.monthlyRevenue")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.opCost")}</label>
          <input type="number" min={0} placeholder="0" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.license")}</label>
          <select value={license} onChange={(e) => setLicense(e.target.value)} className={input}>
            <option value="with">{t("biz.withLicense")}</option>
            <option value="without">{t("biz.withoutLicense")}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.reason")}</label>
          <input type="text" placeholder={t("biz.reasonPh")} className={input} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
        {t("biz.includesEquip")}
      </label>
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
