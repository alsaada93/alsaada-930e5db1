import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
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
  Check,
  Pencil,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ImageEditor from "@/components/ImageEditor";
import { categories, bahrainRegions, listings, brandsFor } from "@/data/marketplace";
import { brandLabel } from "@/data/brandLabels";
import { countries, type Country } from "@/data/countries";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface AddListingSearch {
  edit?: string;
}

export const Route = createFileRoute("/add-listing")({
  validateSearch: (search: Record<string, unknown>): AddListingSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "أضف إعلان | السعادة ماركت Al Saada Market" },
      { name: "description", content: "أضف إعلانك لبيع معدات المطاعم والفنادق والإلكترونيات على السعادة ماركت." },
      { property: "og:title", content: "أضف إعلان | السعادة ماركت Al Saada Market" },
      { property: "og:description", content: "أنشئ إعلانًا جديدًا مع تسعير ذكي بالذكاء الاصطناعي على السعادة ماركت." },
      { property: "og:url", content: "https://alsaada-market.lovable.app/add-listing" },
    ],
    links: [{ rel: "canonical", href: "https://alsaada-market.lovable.app/add-listing" }],
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
  const ar = lang === "ar";
  const { edit: editId } = Route.useSearch();
  const isEdit = !!editId;
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  // Unified, reorderable media (existing URLs in edit mode + newly added files)
  const [media, setMedia] = useState<{ id: string; url: string; file?: File }[]>([]);
  // Existing video (edit mode) — can be removed
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  // Guest contact (required if not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Title + description (controlled so they persist across steps)
  const [titleText, setTitleText] = useState("");
  const [descText, setDescText] = useState("");

  // Category cascade
  const [categoryId, setCategoryId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);

  // Country of manufacture
  const [country, setCountry] = useState<Country | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

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
  const imgInput = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Post-publish video
  const [newId, setNewId] = useState<string | null>(null);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoDone, setVideoDone] = useState(false);
  const postVidInput = useRef<HTMLInputElement>(null);

  // Extra options
  const [negotiable, setNegotiable] = useState(true);
  const [delivery, setDelivery] = useState(false);

  // Business fields (controlled to survive step navigation)
  const [biz, setBiz] = useState({
    rent: "",
    area: "",
    outlets: "",
    staff: "",
    monthlyRevenue: "",
    opCost: "",
    license: "with",
    reason: "",
    includesEquip: true,
  });
  const [auctionDuration, setAuctionDuration] = useState("24");

  // Brands from the database (managed in admin), merged with built-in lists
  const [dbBrands, setDbBrands] = useState<{ name: string; category_id: string; item_name: string | null }[]>([]);
  useEffect(() => {
    supabase
      .from("brands")
      .select("name, category_id, item_name")
      .then(({ data }) => setDbBrands(data ?? []));
  }, []);

  // Load existing listing when editing
  useEffect(() => {
    if (!editId) return;
    supabase
      .from("listings")
      .select("*")
      .eq("id", editId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setListingType((data.listing_type as ListingType) ?? "normal");
        setTitleText(data.title ?? "");
        setDescText(data.description ?? "");
        setCategoryId(data.category_id ?? "");
        setGroupName(data.group_name ?? "");
        setItemName(data.item_name ?? "");
        setBrand(data.brand ?? "");
        setRegion(data.city ?? "");
        setPrice(String(data.price ?? ""));
        setCondition(data.condition ?? "مستعمل");
        setNegotiable(Boolean(data.negotiable_flag ?? data.negotiable));
        setDelivery(Boolean(data.delivery_available));
        setExistingImages((data.images as string[] | null) ?? []);
        if (data.lat != null && data.lng != null) {
          setCoords({ lat: Number(data.lat), lng: Number(data.lng) });
        }
        setBiz((p) => ({
          ...p,
          rent: data.rent != null ? String(data.rent) : "",
          area: data.area_sqm != null ? String(data.area_sqm) : "",
          outlets: data.outlets != null ? String(data.outlets) : "",
          staff: data.staff_count != null ? String(data.staff_count) : "",
          monthlyRevenue: data.monthly_revenue != null ? String(data.monthly_revenue) : "",
          opCost: data.operating_cost != null ? String(data.operating_cost) : "",
          license: data.has_license ? "with" : "without",
          reason: data.sale_reason ?? "",
        }));
        setStep(1);
      });
  }, [editId]);

  const brandOptions = useMemo(() => {
    if (!categoryId) return [];
    const base = brandsFor(categoryId, itemName || undefined);
    const fromDb = dbBrands
      .filter((b) => b.category_id === categoryId && (!itemName || !b.item_name || b.item_name === itemName))
      .map((b) => b.name);
    const merged = [...new Set([...base.filter((b) => b !== "أخرى"), ...fromDb])].sort((a, b) => a.localeCompare(b));
    return [...merged, "أخرى"];
  }, [categoryId, itemName, dbBrands]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brandOptions;
    return brandOptions.filter(
      (b) => b.toLowerCase().includes(q) || brandLabel(b, "ar").includes(brandQuery.trim()),
    );
  }, [brandOptions, brandQuery]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.en.toLowerCase().includes(q) || c.ar.includes(countryQuery.trim()),
    );
  }, [countryQuery]);

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
      let peers = listings.filter((l) => l.category === activeCategory.name);
      if (groupName) {
        const bySub = peers.filter((l) => l.sub === groupName);
        if (bySub.length >= 3) peers = bySub;
      }
      const sameCond = peers.filter((l) => l.condition === condition);
      const sample = sameCond.length >= 3 ? sameCond : peers;
      const base = sample.length ? sample.reduce((s, l) => s + l.price, 0) / sample.length : 600;

      let factor = condition === "جديد" ? 1.12 : 0.92;
      const premium = ["Apple", "Sony", "Bose", "Daikin", "Miele", "Rational", "La Marzocco", "Herman Miller", "Bosch", "Samsung", "LG"];
      const budget = ["Nikai", "Geepas", "TCL", "Hisense", "Realme", "Oppo", "Home Box"];
      if (brand && premium.includes(brand)) factor *= 1.15;
      else if (brand && budget.includes(brand)) factor *= 0.9;
      const len = descText.trim().length;
      if (len > 220) factor *= 1.05;
      else if (len > 0 && len < 40) factor *= 0.97;
      if (negotiable) factor *= 0.98;

      const average = Math.round(base);
      const suggested = Math.max(5, Math.round((base * factor) / 5) * 5);
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

  const num = (v: string) => {
    const n = Number(v);
    return v !== "" && !Number.isNaN(n) ? n : null;
  };

  // ---- Step validation ----
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!titleText.trim()) return fail(ar ? "اكتب عنوان الإعلان" : "Enter a title");
      if (!descText.trim()) return fail(ar ? "اكتب وصف الإعلان" : "Enter a description");
      if (images.length === 0 && existingImages.length === 0) return fail(t("toast.needImage"));
      return true;
    }
    if (s === 2) {
      if (!categoryId) return fail(t("toast.pickCat"));
      if (!region) return fail(t("toast.pickRegion"));
      return true;
    }
    if (s === 3) {
      if (!price) return fail(ar ? "أدخل السعر" : "Enter a price");
      return true;
    }
    return true;
  };

  const fail = (msg: string) => {
    toast.error(msg);
    return false;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    if (!user && (!guestName.trim() || !guestPhone.trim())) {
      toast.error(t("toast.guestNeeded"));
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls = await Promise.all(images.map((img) => uploadFile(img.file, "images")));
      const imageUrls = [...existingImages, ...uploadedUrls];

      const isBusiness = listingType === "business";
      const isAuction = listingType === "auction";
      const auctionHours = num(auctionDuration) ?? 24;

      const payload = {
        user_id: user?.id ?? null,
        listing_type: listingType ?? "normal",
        title: titleText.trim(),
        description: descText.trim(),
        price: Number(price) || 0,
        condition,
        category_id: categoryId || null,
        brand: brand || null,
        country_of_origin: country ? country.ar : null,
        group_name: groupName || null,
        item_name: itemName || null,
        city: region,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        images: imageUrls,
        contact_name: user ? (user.email ?? null) : guestName.trim(),
        contact_phone: user ? null : guestPhone.trim(),
        status: "approved",
        start_price: isAuction ? Number(price) || 0 : null,
        auction_ends_at: isAuction ? new Date(Date.now() + auctionHours * 3600_000).toISOString() : null,
        rent: isBusiness ? num(biz.rent) : null,
        area_sqm: isBusiness ? num(biz.area) : null,
        outlets: isBusiness ? num(biz.outlets) : null,
        staff_count: isBusiness ? num(biz.staff) : null,
        monthly_revenue: isBusiness ? num(biz.monthlyRevenue) : null,
        operating_cost: isBusiness ? num(biz.opCost) : null,
        has_license: isBusiness ? biz.license === "with" : null,
        includes_equipment: isBusiness ? biz.includesEquip : null,
        sale_reason: isBusiness ? biz.reason.trim() || null : null,
        negotiable_flag: isAuction ? false : negotiable,
        delivery_available: isAuction ? false : delivery,
      };

      if (isEdit && editId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success(ar ? "تم تحديث الإعلان" : "Listing updated");
        navigate({ to: "/listing/$id", params: { id: editId } });
        return;
      }

      const { data, error } = await supabase.from("listings").insert({ ...payload, video: null }).select("id").single();
      if (error) throw error;
      setNewId(data?.id ?? null);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(ar ? "تعذّر نشر الإعلان، حاول مرة أخرى" : "Could not publish, try again");
    } finally {
      setSaving(false);
    }
  };

  const handlePostVideo = async (files: FileList | null) => {
    if (!files || !files[0] || !newId) return;
    setVideoSaving(true);
    try {
      const url = await uploadFile(files[0], "videos");
      const { error } = await supabase.from("listings").update({ video: url }).eq("id", newId);
      if (error) throw error;
      setVideoDone(true);
      toast.success(ar ? "تمت إضافة الفيديو" : "Video added");
    } catch (err) {
      console.error(err);
      toast.error(
        ar ? "تعذّر إضافة الفيديو. سجّل الدخول لإدارة إعلانك." : "Could not add video. Log in to manage your listing.",
      );
    } finally {
      setVideoSaving(false);
    }
  };

  // ---- Success screen (with post-publish video option) ----
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-4 text-2xl font-extrabold">{t("add.received")}</h1>
            <p className="mt-2 text-muted-foreground">{t("add.receivedDesc")}</p>

            {/* Add video after publishing */}
            <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-accent/30 p-5 text-start">
              <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
                <Video className="h-4 w-4 text-primary" />
                {ar ? "أضف فيديو لإعلانك (اختياري)" : "Add a video to your listing (optional)"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {ar
                  ? "الفيديو يزيد ثقة المشترين ويسرّع البيع."
                  : "A video builds buyer trust and speeds up the sale."}
              </p>
              <input ref={postVidInput} type="file" accept="video/*" hidden onChange={(e) => handlePostVideo(e.target.files)} />
              {videoDone ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                  <Check className="h-4 w-4" /> {ar ? "تم رفع الفيديو" : "Video uploaded"}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={videoSaving}
                  onClick={() => postVidInput.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-background px-4 py-2 text-sm font-bold hover:bg-accent disabled:opacity-60"
                >
                  <Video className="h-4 w-4 text-primary" />
                  {videoSaving ? (ar ? "جارٍ الرفع..." : "Uploading...") : ar ? "اختر فيديو" : "Choose video"}
                </button>
              )}
            </div>

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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {options.map((o) => (
              <button
                key={o.type}
                type="button"
                onClick={() => {
                  setListingType(o.type);
                  setStep(1);
                }}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-start shadow-card transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <o.icon className="h-6 w-6" />
                </span>
                <h2 className="text-lg font-extrabold">{o.title}</h2>
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

  const stepNames = ar
    ? ["التفاصيل والصور", "التصنيف والموقع", "السعر", "النشر"]
    : ["Details & photos", "Category & location", "Price", "Publish"];

  const fieldCls =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

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

        {/* Stepper */}
        <div className="mt-5 flex items-center gap-2">
          {stepNames.map((name, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={name} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : n}
                  </span>
                  {n < stepNames.length && (
                    <span className={`mx-1 h-0.5 flex-1 rounded ${done ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
                <span className={`text-center text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* ===== Step 1: Title, Description, Images ===== */}
          <div className={step === 1 ? "space-y-5" : "hidden"}>
            <div>
              <label className="mb-1 block text-sm font-semibold">{t("add.adTitle")}</label>
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                placeholder={t("add.adTitlePh")}
                className={fieldCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">{t("add.description")}</label>
              <textarea
                rows={5}
                value={descText}
                onChange={(e) => setDescText(e.target.value)}
                placeholder={t("add.descPh")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                {t("add.images")} ({images.length}/{MAX_IMAGES})
              </label>
              <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => handleImages(e.target.files)} />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {existingImages.map((url, i) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={url} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`حذف الصورة ${i + 1}`}
                      onClick={() => setExistingImages((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute start-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.map((img, i) => (
                  <div key={img.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={img.url} alt={`صورة الإعلان ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`حذف الصورة ${i + 1}`}
                      onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute start-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={ar ? `تعديل الصورة ${i + 1}` : `Edit image ${i + 1}`}
                      onClick={() => setEditingIndex(i)}
                      className="absolute end-1 top-1 rounded-full bg-primary p-1 text-primary-foreground opacity-0 transition group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
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
              <p className="mt-1 text-xs text-muted-foreground">
                {ar ? "يمكنك إضافة الفيديو بعد نشر الإعلان." : "You can add a video after publishing."}
              </p>
            </div>
          </div>

          {/* ===== Step 2: Category, brand, country, region, map ===== */}
          <div className={step === 2 ? "space-y-5" : "hidden"}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold">{t("add.mainCat")}</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setGroupName("");
                    setItemName("");
                    setBrand("");
                  }}
                  className={fieldCls}
                >
                  <option value="" disabled>{t("add.chooseCat")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {ar ? c.name : c.nameEn}</option>
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
                  className={`${fieldCls} disabled:opacity-50`}
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
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setBrand("");
                  }}
                  className={`${fieldCls} disabled:opacity-50`}
                >
                  <option value="">{t("add.chooseTypeOpt")}</option>
                  {activeGroup?.items.map((it) => (
                    <option key={it} value={it}>{it}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand */}
            <div className="relative">
              <label className="mb-1 block text-sm font-semibold">{ar ? "الماركة" : "Brand"}</label>
              <div className="relative">
                <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={brand ? brandLabel(brand, lang) : brandQuery}
                  disabled={!activeCategory}
                  onChange={(e) => {
                    setBrand("");
                    setBrandQuery(e.target.value);
                    setBrandOpen(true);
                  }}
                  onFocus={() => setBrandOpen(true)}
                  onBlur={() => setTimeout(() => setBrandOpen(false), 150)}
                  placeholder={ar ? "ابحث واختر الماركة" : "Search and choose brand"}
                  className={`${fieldCls} pe-10 disabled:opacity-50`}
                />
              </div>
              {brandOpen && activeCategory && filteredBrands.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-card">
                  {filteredBrands.map((b) => (
                    <li key={b}>
                      <button
                        type="button"
                        onClick={() => {
                          setBrand(b);
                          setBrandQuery("");
                          setBrandOpen(false);
                        }}
                        className="w-full rounded-md px-3 py-2 text-start text-sm hover:bg-accent"
                      >
                        {brandLabel(b, lang)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Country */}
            <div className="relative">
              <label className="mb-1 block text-sm font-semibold">{ar ? "بلد الصنع" : "Country of manufacture"}</label>
              <div className="relative">
                <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={country ? `${country.flag} ${ar ? country.ar : country.en}` : countryQuery}
                  onChange={(e) => {
                    setCountry(null);
                    setCountryQuery(e.target.value);
                    setCountryOpen(true);
                  }}
                  onFocus={() => setCountryOpen(true)}
                  onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
                  placeholder={ar ? "ابحث عن الدولة" : "Search for a country"}
                  className={`${fieldCls} pe-10`}
                />
              </div>
              {countryOpen && filteredCountries.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-card">
                  {filteredCountries.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setCountry(c);
                          setCountryQuery("");
                          setCountryOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-accent"
                      >
                        <span className="text-base">{c.flag}</span>
                        <span>{ar ? c.ar : c.en}</span>
                        {c.popular && (
                          <span className="ms-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                            {ar ? "مشهورة" : "Popular"}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Region */}
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
                  className={`${fieldCls} pe-10`}
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

            {/* Map */}
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
          </div>

          {/* ===== Step 3: Price, condition, AI, business ===== */}
          <div className={step === 3 ? "space-y-5" : "hidden"}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  {listingType === "auction" ? t("add.startPrice") : t("add.price")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className={fieldCls}
                />
              </div>
              {listingType === "auction" ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold">{t("add.auctionDuration")}</label>
                  <input
                    type="number"
                    min={1}
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                    className={fieldCls}
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-semibold">{t("add.condition")}</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className={fieldCls}>
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
                <Stat label={t("add.avgPrice")} value={`${estimate.average} ${ar ? "د.ب" : "BHD"}`} />
                <Stat label={t("add.suggestedPrice")} value={`${estimate.suggested} ${ar ? "د.ب" : "BHD"}`} />
                <Stat label={t("add.sellSpeed")} value={estimate.speed} />
                <Stat label={t("add.marketCompare")} value={estimate.market} />
              </div>
            )}

            {listingType !== "auction" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-card">
                  {ar ? "السعر قابل للتفاوض" : "Negotiable price"}
                  <input
                    type="checkbox"
                    checked={negotiable}
                    onChange={(e) => setNegotiable(e.target.checked)}
                    className="h-5 w-5 rounded border-border accent-primary"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-card">
                  {ar ? "خدمة التوصيل متاحة" : "Delivery available"}
                  <input
                    type="checkbox"
                    checked={delivery}
                    onChange={(e) => setDelivery(e.target.checked)}
                    className="h-5 w-5 rounded border-border accent-primary"
                  />
                </label>
              </div>
            )}

            {listingType === "business" && <BusinessFields t={t} biz={biz} setBiz={setBiz} />}
          </div>

          {/* ===== Step 4: Contact / login ===== */}
          <div className={step === 4 ? "space-y-5" : "hidden"}>
            {!user ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold">{t("add.contactGuest")}</span>
                  <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    <LogIn className="h-3.5 w-3.5" /> {t("add.loginShort")}
                  </Link>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {ar
                    ? "سجّل الدخول لإدارة إعلاناتك لاحقًا وإضافة فيديو، أو أكمل كزائر بإدخال بيانات التواصل."
                    : "Log in to manage your listings and add a video later, or continue as a guest with your contact details."}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={t("add.name")}
                    className={fieldCls}
                  />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder={t("add.phone")}
                    className={fieldCls}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                {t("add.postingAs")} <span className="font-bold">{user.email}</span>
              </div>
            )}
          </div>

          {/* ===== Navigation buttons ===== */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="rounded-full border border-border px-6 py-3 font-bold hover:bg-muted"
              >
                {ar ? "السابق" : "Back"}
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
              >
                {ar ? "التالي" : "Next"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-5 py-3 font-bold text-primary hover:bg-accent"
                >
                  <Eye className="h-4 w-4" /> {ar ? "معاينة" : "Preview"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? ar
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : isEdit
                      ? ar
                        ? "حفظ التعديلات"
                        : "Save changes"
                      : submitLabel}
                </button>
              </>
            )}
          </div>
        </form>
      </main>
      <Footer />
      <ImageEditor
        open={editingIndex !== null}
        file={editingIndex !== null ? images[editingIndex]?.file ?? null : null}
        onClose={() => setEditingIndex(null)}
        onApply={(edited) => {
          setImages((prev) =>
            prev.map((img, idx) => {
              if (idx !== editingIndex) return img;
              URL.revokeObjectURL(img.url);
              return { url: URL.createObjectURL(edited), file: edited };
            }),
          );
        }}
      />
      {showPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-black/70 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="my-8 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{ar ? "معاينة الإعلان" : "Listing preview"}</h2>
              <button type="button" onClick={() => setShowPreview(false)} aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            {(existingImages[0] || images[0]) && (
              <img
                src={existingImages[0] ?? images[0].url}
                alt={titleText}
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            )}
            <h3 className="mt-3 text-xl font-extrabold">{titleText || (ar ? "بدون عنوان" : "Untitled")}</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-primary">{Number(price || 0).toLocaleString("ar")}</span>
              <span className="text-sm text-muted-foreground">د.ب</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[region, condition].filter(Boolean).join(" • ")}
            </p>
            {descText && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{descText}</p>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground"
            >
              {ar ? "متابعة" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BizState {
  rent: string;
  area: string;
  outlets: string;
  staff: string;
  monthlyRevenue: string;
  opCost: string;
  license: string;
  reason: string;
  includesEquip: boolean;
}

function BusinessFields({
  t,
  biz,
  setBiz,
}: {
  t: (k: string) => string;
  biz: BizState;
  setBiz: React.Dispatch<React.SetStateAction<BizState>>;
}) {
  const input =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const set = (patch: Partial<BizState>) => setBiz((p) => ({ ...p, ...patch }));
  return (
    <div className="rounded-2xl border border-primary/30 bg-accent/30 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-primary">
        <Store className="h-4 w-4" /> {t("biz.heading")}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.rent")}</label>
          <input type="number" min={0} placeholder="0" value={biz.rent} onChange={(e) => set({ rent: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.area")}</label>
          <input type="number" min={0} placeholder="0" value={biz.area} onChange={(e) => set({ area: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.outlets")}</label>
          <input type="number" min={0} placeholder="0" value={biz.outlets} onChange={(e) => set({ outlets: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.staff")}</label>
          <input type="number" min={0} placeholder="0" value={biz.staff} onChange={(e) => set({ staff: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.monthlyRevenue")}</label>
          <input type="number" min={0} placeholder="0" value={biz.monthlyRevenue} onChange={(e) => set({ monthlyRevenue: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.opCost")}</label>
          <input type="number" min={0} placeholder="0" value={biz.opCost} onChange={(e) => set({ opCost: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.license")}</label>
          <select value={biz.license} onChange={(e) => set({ license: e.target.value })} className={input}>
            <option value="with">{t("biz.withLicense")}</option>
            <option value="without">{t("biz.withoutLicense")}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{t("biz.reason")}</label>
          <input type="text" placeholder={t("biz.reasonPh")} value={biz.reason} onChange={(e) => set({ reason: e.target.value })} className={input} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={biz.includesEquip}
          onChange={(e) => set({ includesEquip: e.target.checked })}
          className="h-4 w-4 rounded border-border accent-primary"
        />
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
