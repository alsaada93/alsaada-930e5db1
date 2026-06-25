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
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ImageEditor from "@/components/ImageEditor";
import { bahrainRegions, listings, brandsFor } from "@/data/marketplace";
import { cityCenter } from "@/data/bahrainCities";
import { brandInfo } from "@/data/brandsCatalog";
import { useCategories } from "@/hooks/useCategories";
import { brandLabel } from "@/data/brandLabels";
import { countries, type Country } from "@/data/countries";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { compressVideo } from "@/lib/video-compress";
import { matchesAr } from "@/lib/text";
import { showsCondition, categoryKind } from "@/lib/category-kind";
import { carBrandLogo } from "@/data/carBrandLogos";
import { countryByName } from "@/data/countries";

interface AddListingSearch {
  edit?: string;
}

export const Route = createFileRoute("/add-listing")({
  validateSearch: (search: Record<string, unknown>): AddListingSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "أضف إعلان | حراج السعادة Haraj Al Saada" },
      { name: "description", content: "أضف إعلانك لبيع معدات المطاعم والفنادق والإلكترونيات على حراج السعادة." },
      { property: "og:title", content: "أضف إعلان | حراج السعادة Haraj Al Saada" },
      { property: "og:description", content: "أنشئ إعلانًا جديدًا مع تسعير ذكي بالذكاء الاصطناعي على حراج السعادة." },
      { property: "og:url", content: "https://www.alsaada.sale/add-listing" },
    ],
    links: [{ rel: "canonical", href: "https://www.alsaada.sale/add-listing" }],
  }),
  component: AddListingPage,
});

const MAX_IMAGES = 30;
const DRAFT_KEY = "alsaada_listing_draft";

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
  const { categories } = useCategories();
  const ar = lang === "ar";
  const { edit: editId } = Route.useSearch();
  const isEdit = !!editId;
  const [listingType, setListingType] = useState<ListingType | null>("normal");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const draftReady = useRef(false);
  // Unified, reorderable media (existing URLs in edit mode + newly added files)
  const [media, setMedia] = useState<{ id: string; url: string; file?: File }[]>([]);
  // Existing video (edit mode) — can be removed
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  // New video selected during creation (uploaded alongside images on submit)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  // Guest contact (required if not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  // رقم هاتف المعلن المسجَّل (مرتبط بزر الاتصال وواتساب في صفحة الإعلان)
  const [contactPhone, setContactPhone] = useState("");

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
  const [customBrand, setCustomBrand] = useState("");

  // Country of manufacture
  const [country, setCountry] = useState<Country | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categoryId, categories],
  );
  const activeGroup = useMemo(
    () => activeCategory?.groups.find((g) => g.name === groupName),
    [activeCategory, groupName],
  );
  // وسم الحالة (جديد/مستعمل) يُخفى في السيارات والعقارات
  const showCondition = useMemo(
    () => showsCondition(activeCategory?.name ?? categoryId, activeCategory?.nameEn),
    [activeCategory, categoryId],
  );
  // هل التصنيف الحالي مركبات؟ — لعرض شعارات الماركات وحقول السيارة
  const isVehicleCat = useMemo(
    () => categoryKind(activeCategory?.name ?? categoryId, activeCategory?.nameEn) === "vehicle",
    [activeCategory, categoryId],
  );
  // عند اختيار ماركة لها بلد منشأ معروف، يُختار بلد الصنع تلقائياً
  useEffect(() => {
    if (!brand) return;
    const info = brandInfo(brand);
    if (info?.country) {
      const c = countryByName(info.country);
      if (c) setCountry(c);
    }
  }, [brand]);



  // Region search
  const [region, setRegion] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim();
    if (!q) return bahrainRegions.slice(0, 12);
    return bahrainRegions.filter((r) => matchesAr(r, q)).slice(0, 12);
  }, [regionQuery]);

  // Map location
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

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
        setMedia((((data.images as string[] | null) ?? []).map((url) => ({ id: url, url }))));
        setExistingVideo((data.video as string | null) ?? null);
        setContactPhone((data.contact_phone as string | null) ?? "");
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
    const q = brandQuery.trim();
    if (!q) return brandOptions;
    return brandOptions.filter(
      (b) => matchesAr(b, q) || matchesAr(brandLabel(b, "ar"), q) || matchesAr(brandLabel(b, "en"), q),
    );
  }, [brandOptions, brandQuery]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim();
    if (!q) return countries;
    return countries.filter((c) => matchesAr(c.en, q) || matchesAr(c.ar, q));
  }, [countryQuery]);

  // Price + AI
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("مستعمل");
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detect a previously saved draft on mount (only for new listings)
  useEffect(() => {
    if (editId) {
      draftReady.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && (d.titleText || d.descText || d.categoryId || d.price)) {
          setShowResume(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    draftReady.current = true;
  }, [editId]);

  // Persist the draft as the user fills the form
  useEffect(() => {
    if (!draftReady.current || editId || submitted) return;
    const draft = {
      listingType, step, titleText, descText, categoryId, groupName, itemName,
      brand, region, price, condition, negotiable, delivery, biz, auctionDuration,
      guestName, guestPhone,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [
    editId, submitted, listingType, step, titleText, descText, categoryId, groupName,
    itemName, brand, region, price, condition, negotiable, delivery, biz, auctionDuration,
    guestName, guestPhone,
  ]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setListingType(d.listingType ?? "normal");
        setTitleText(d.titleText ?? "");
        setDescText(d.descText ?? "");
        setCategoryId(d.categoryId ?? "");
        setGroupName(d.groupName ?? "");
        setItemName(d.itemName ?? "");
        setBrand(d.brand ?? "");
        setRegion(d.region ?? "");
        setPrice(d.price ?? "");
        setCondition(d.condition ?? "مستعمل");
        setNegotiable(Boolean(d.negotiable));
        setDelivery(Boolean(d.delivery));
        if (d.biz) setBiz((p) => ({ ...p, ...d.biz }));
        setAuctionDuration(d.auctionDuration ?? "24");
        setGuestName(d.guestName ?? "");
        setGuestPhone(d.guestPhone ?? "");
        setStep(d.step ?? 1);
      }
    } catch {
      /* ignore */
    }
    setShowResume(false);
    draftReady.current = true;
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setShowResume(false);
    draftReady.current = true;
  };

  // Auto-suggested titles based on the chosen category/kind/brand to speed up posting.
  const titleSuggestions = useMemo(() => {
    if (!activeCategory) return [];
    const condWord = condition === "جديد" ? "جديد" : "مستعمل";
    const base = activeGroup?.name || activeCategory.name;
    const set = new Set<string>();
    if (brand) set.add(`${base} ${brand} ${condWord}`);
    set.add(`${base} ${condWord} للبيع`);
    set.add(`${base} بحالة ممتازة`);
    if (activeGroup) set.add(`${activeGroup.name} ${activeCategory.name}`);
    return Array.from(set)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .slice(0, 4);
  }, [activeCategory, activeGroup, brand, condition]);



  const handleImages = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - media.length;
    if (remaining <= 0) {
      toast.error(t("toast.maxImages"));
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    const next = await Promise.all(
      picked.map(async (f) => {
        const compressed = await compressImage(f);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url: URL.createObjectURL(compressed),
          file: compressed,
        };
      }),
    );
    setMedia((p) => [...p, ...next]);
  };

  const moveMedia = (from: number, to: number) => {
    setMedia((p) => {
      if (to < 0 || to >= p.length) return p;
      const arr = [...p];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
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
    let ext = (file.name.split(".").pop() || "").toLowerCase();
    // التخزين يقبل صيغ صور محددة فقط؛ نضمن امتداداً آمناً للصور
    if (kind === "images" && !["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) {
      ext = "jpg";
    }
    if (!ext) ext = "bin";
    const path = `${kind}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || (kind === "images" ? "image/jpeg" : undefined),
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
      if (!categoryId) return fail(t("toast.pickCat"));
      if (!region) return fail(t("toast.pickRegion"));
      return true;
    }
    if (s === 2) {
      if (!titleText.trim()) return fail(ar ? "اكتب عنوان الإعلان" : "Enter a title");
      if (!descText.trim()) return fail(ar ? "اكتب وصف الإعلان" : "Enter a description");
      if (media.length === 0) return fail(t("toast.needImage"));
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
      const imageUrls = await Promise.all(
        media.map((m) => (m.file ? uploadFile(m.file, "images") : Promise.resolve(m.url))),
      );

      // Upload the video chosen during creation (if any)
      let videoUrl: string | null = isEdit ? existingVideo : null;
      if (videoFile) {
        try {
          const compressedVideo = await compressVideo(videoFile);
          videoUrl = await uploadFile(compressedVideo, "videos");
        } catch (e) {
          console.error("video upload failed", e);
          toast.error(ar ? "تعذّر رفع الفيديو، سيُنشر الإعلان بدون فيديو" : "Video upload failed; listing will publish without it");
        }
      }

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
        brand: (brand === "أخرى" ? customBrand.trim() : brand) || null,
        country_of_origin: country ? country.ar : null,
        group_name: groupName || null,
        item_name: itemName || null,
        city: region,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        images: imageUrls,
        contact_name: user
          ? ((user.user_metadata?.full_name as string | undefined)?.trim() || null)
          : guestName.trim(),
        contact_phone: user ? (contactPhone.trim() || null) : guestPhone.trim(),
        status: "pending",
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
        const { status: _ignoreStatus, ...editPayload } = payload;
        const { error } = await supabase.from("listings").update({ ...editPayload, video: videoUrl }).eq("id", editId);
        if (error) throw error;
        toast.success(ar ? "تم تحديث الإعلان" : "Listing updated");
        navigate({ to: "/listing/$id", params: { id: editId } });
        return;
      }

      const { data, error } = await supabase.from("listings").insert({ ...payload, video: videoUrl }).select("id").single();
      if (error) throw error;
      setNewId(data?.id ?? null);
      setSubmitted(true);
      toast.success(ar ? "تم إضافة الإعلان بنجاح، وبقيت موافقة الإدارة" : "Listing submitted — pending admin approval");
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
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
      const compressed = await compressVideo(files[0]);
      const url = await uploadFile(compressed, "videos");
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

  // ---- Resume draft prompt ----
  if (showResume) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Pencil className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold">
              {ar ? "لديك إعلان لم يكتمل" : "You have an unfinished listing"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {ar
                ? "وجدنا مسودة إعلان سابقة. هل تريد متابعة النشر من حيث توقفت أم البدء من جديد؟"
                : "We found a previous draft. Continue where you left off or start over?"}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={restoreDraft}
                className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                {ar ? "متابعة نشر الإعلان السابق" : "Continue previous listing"}
              </button>
              <button
                onClick={discardDraft}
                className="rounded-xl border border-border px-5 py-3 font-bold hover:bg-muted"
              >
                {ar ? "البدء من جديد" : "Start over"}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- Success screen (with post-publish video option) ----
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-4 text-2xl font-extrabold">
              {ar ? "تم إضافة الإعلان بنجاح" : "Listing submitted"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {ar
                ? "تم استلام جميع بيانات إعلانك. الإعلان الآن بانتظار موافقة الإدارة، وستصلك رسالة بالقبول أو الرفض مع السبب."
                : "We received your listing details. It is now pending admin approval — you will be notified upon approval or rejection with a reason."}
            </p>

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

  const submitLabel =
    listingType === "auction" ? t("add.publishAuction") : listingType === "business" ? t("add.publishBusiness") : t("add.publish");

  const stepNames = ar
    ? ["التصنيف والموقع", "تفاصيل الإعلان", "السعر والحالة", "المراجعة والنشر"]
    : ["Category & location", "Listing details", "Price & condition", "Review & publish"];
  const stepPct = step * 25;

  // قوة الإعلان — تُحسب مباشرة من اكتمال الحقول
  const adPower = (() => {
    let p = 0;
    const tl = titleText.trim().length;
    if (tl >= 12) p += 20; else if (tl > 0) p += 10;
    const dl = descText.trim().length;
    if (dl >= 40) p += 20; else if (dl > 0) p += 10;
    if (Number(price) > 0) p += 15;
    if (region) p += 15;
    if ((user ? contactPhone : guestPhone).trim()) p += 15;
    if (media.length >= 3) p += 15; else if (media.length >= 1) p += 10;
    return Math.min(100, p);
  })();
  const powerLabel = adPower >= 90 ? (ar ? "ممتاز" : "Excellent") : adPower >= 70 ? (ar ? "قوي" : "Strong") : adPower >= 40 ? (ar ? "جيد" : "Good") : (ar ? "ضعيف" : "Weak");
  const powerColor = adPower >= 90 ? "bg-emerald-500" : adPower >= 70 ? "bg-primary" : adPower >= 40 ? "bg-amber-500" : "bg-destructive";

  const fieldCls =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">
        {/* شريط التقدم العلوي الثابت + بطاقة قوة الإعلان */}
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-extrabold sm:text-lg">{ar ? "أضف إعلان جديد" : "Add new listing"}</h1>
            <span className="text-xs font-bold text-primary">{stepPct}%</span>
          </div>

          {/* مراحل التقدم */}
          <div className="mt-2 flex items-center gap-1.5">
            {stepNames.map((name, i) => {
              const n = i + 1;
              const reached = step >= n;
              return <div key={name} className={`h-1.5 flex-1 rounded-full transition-colors ${reached ? "bg-primary" : "bg-muted"}`} />;
            })}
          </div>
          <div className="mt-1.5 flex items-start gap-1">
            {stepNames.map((name, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <span
                  key={name}
                  className={`flex flex-1 items-center justify-center gap-0.5 text-center text-[10px] font-semibold leading-tight ${
                    active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {done && <Check className="h-3 w-3 shrink-0" />}
                  {name}
                </span>
              );
            })}
          </div>

          {/* بطاقة قوة الإعلان */}
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">{ar ? "قوة الإعلان" : "Ad strength"}</span>
              <span className="text-xs font-bold">{powerLabel}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${powerColor}`} style={{ width: `${adPower}%` }} />
              </div>
              <span className="text-sm font-extrabold tabular-nums">{adPower}%</span>
            </div>
            {adPower > 90 && (
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                {ar ? "إعلانك مكتمل وجاهز للنشر" : "Your ad is complete and ready to publish"}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {ar ? "يتم حفظ بياناتك تلقائياً" : "Your data is saved automatically"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* ===== Step 2: Title, Description, Images ===== */}
          <div className={step === 2 ? "space-y-5" : "hidden"}>
            <div>
              <label className="mb-1 flex items-center justify-between text-base font-extrabold">
                <span>{t("add.adTitle")}</span>
                <span className="text-xs font-semibold text-muted-foreground">{titleText.trim().length}/80</span>
              </label>
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                maxLength={80}
                placeholder={t("add.adTitlePh")}
                className="h-14 w-full rounded-xl border border-border bg-background px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {ar ? "مثال: آيفون 13 برو 256 جيجا بحالة ممتازة" : "e.g. iPhone 13 Pro 256GB, excellent condition"}
              </p>
              {titleText.trim().length > 0 && (
                <p className={`mt-1 text-xs font-semibold ${titleText.trim().length >= 12 ? "text-emerald-600" : "text-amber-600"}`}>
                  {titleText.trim().length >= 12 ? (ar ? "عنوان جيد ✓" : "Good title ✓") : (ar ? "أضف تفاصيل أكثر للعنوان" : "Add more detail to the title")}
                </p>
              )}
              {titleSuggestions.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-semibold text-muted-foreground">{t("add.suggestTitle")}</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {titleSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTitleText(s)}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between text-sm font-semibold">
                <span>{t("add.description")}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {descText.trim() ? descText.trim().split(/\s+/).length : 0} {ar ? "كلمة" : "words"} · {descText.length}/1200
                </span>
              </label>
              <textarea
                rows={6}
                maxLength={1200}
                value={descText}
                onChange={(e) => setDescText(e.target.value)}
                placeholder={t("add.descPh")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                {t("add.images")} ({media.length}/{MAX_IMAGES})
              </label>
              <p className="mb-2 text-xs text-muted-foreground">
                {ar
                  ? "أول صورة هي الغلاف · اسحب الأسهم لإعادة الترتيب · الإعلانات المصوّرة تحصل على تفاعل أعلى"
                  : "First image is the cover · use arrows to reorder · listings with photos get more engagement"}
              </p>
              <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => handleImages(e.target.files)} />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {media.map((m, i) => (
                  <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={m.url} alt={ar ? `صورة الإعلان ${i + 1}` : `Listing image ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute start-1 bottom-1 rounded bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        {ar ? "الغلاف" : "Cover"}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={ar ? `حذف الصورة ${i + 1}` : `Delete image ${i + 1}`}
                      onClick={() => setMedia((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute end-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {m.file && (
                      <button
                        type="button"
                        aria-label={ar ? `تعديل الصورة ${i + 1}` : `Edit image ${i + 1}`}
                        onClick={() => setEditingIndex(i)}
                        className="absolute start-1 top-1 rounded-full bg-primary p-1 text-primary-foreground opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={i === 0}
                        aria-label={ar ? "تحريك لليمين" : "Move forward"}
                        onClick={() => moveMedia(i, i - 1)}
                        className="rounded bg-white/90 p-0.5 text-foreground disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === media.length - 1}
                        aria-label={ar ? "تحريك لليسار" : "Move back"}
                        onClick={() => moveMedia(i, i + 1)}
                        className="rounded bg-white/90 p-0.5 text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {media.length < MAX_IMAGES && (
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

              {/* Existing video preview (edit mode) */}
              {existingVideo && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-semibold">{ar ? "الفيديو" : "Video"}</label>
                  <div className="relative w-full max-w-xs overflow-hidden rounded-lg border border-border">
                    <video src={existingVideo} controls className="h-full w-full" />
                    <button
                      type="button"
                      aria-label={ar ? "حذف الفيديو" : "Delete video"}
                      onClick={() => setExistingVideo(null)}
                      className="absolute end-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Video upload alongside images (during creation) */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  {ar ? "فيديو الإعلان (اختياري)" : "Listing video (optional)"}
                </label>
                <input
                  ref={vidInput}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 60 * 1024 * 1024) {
                      toast.error(ar ? "حجم الفيديو كبير (الحد 60 ميجابايت)" : "Video too large (max 60MB)");
                      return;
                    }
                    setVideoFile(f);
                    setVideoPreview(URL.createObjectURL(f));
                  }}
                />
                {videoPreview ? (
                  <div className="relative w-full max-w-xs overflow-hidden rounded-lg border border-border">
                    <video src={videoPreview} controls className="h-full w-full" />
                    <button
                      type="button"
                      aria-label={ar ? "حذف الفيديو" : "Delete video"}
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview(null);
                      }}
                      className="absolute end-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => vidInput.current?.click()}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Video className="h-5 w-5" />
                    {ar ? "اختر فيديو" : "Choose video"}
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* ===== Step 1: Category, brand, country, region, map ===== */}
          <div className={step === 1 ? "space-y-5" : "hidden"}>
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
                {isVehicleCat && brand && carBrandLogo(brand) && (
                  <img
                    src={carBrandLogo(brand)!}
                    alt=""
                    className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 object-contain"
                  />
                )}
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
                  className={`${fieldCls} pe-10 disabled:opacity-50 ${
                    isVehicleCat && brand && carBrandLogo(brand) ? "ps-10" : ""
                  }`}
                />
              </div>
              {brandOpen && activeCategory && filteredBrands.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-card">
                  {filteredBrands.map((b) => {
                    const logo = isVehicleCat ? carBrandLogo(b) : null;
                    return (
                      <li key={b}>
                        <button
                          type="button"
                          onClick={() => {
                            setBrand(b);
                            setBrandQuery("");
                            setBrandOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-accent"
                        >
                          {logo && (
                            <img
                              src={logo}
                              alt=""
                              loading="lazy"
                              className="h-5 w-5 shrink-0 object-contain"
                            />
                          )}
                          <span>{brandLabel(b, lang)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* وصف الماركة التلقائي عند الاختيار */}
            {brand && brandInfo(brand) && (
              <div className="rounded-2xl border border-primary/30 bg-accent/30 p-4 text-sm">
                <p className="font-extrabold text-primary">
                  {brandInfo(brand)!.name}{" "}
                  <span className="text-foreground">— {brandInfo(brand)!.country}</span>
                </p>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {brandInfo(brand)!.type}
                </p>
                <p className="mt-1.5 leading-relaxed text-foreground">
                  {brandInfo(brand)!.description}
                </p>
              </div>
            )}

            {/* إدخال اسم الماركة يدوياً عند اختيار "أخرى" */}
            {brand === "أخرى" && (
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  {ar ? "اكتب اسم الماركة" : "Type the brand name"}
                </label>
                <input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder={ar ? "مثال: ماركة غير مدرجة" : "e.g. a brand not listed"}
                  className={fieldCls}
                />
              </div>
            )}





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
                          // تحديد موقع المدينة على الخريطة تلقائياً
                          const c = cityCenter(r);
                          if (c) setCoords(c);
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold hover:bg-accent"
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
            {/* السعر */}
            <div>
              <label className="mb-1 block text-sm font-semibold">
                {listingType === "auction" ? t("add.startPrice") : t("add.price")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="h-16 w-full rounded-xl border border-border bg-background ps-4 pe-16 text-2xl font-extrabold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {ar ? "د.ب" : "BHD"}
                </span>
              </div>
            </div>

            {listingType === "auction" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold">{t("add.auctionDuration")}</label>
                <input type="number" min={1} value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} className={fieldCls} />
              </div>
            ) : showCondition ? (
              <div>
                <label className="mb-1 block text-sm font-semibold">{t("add.condition")}</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className={fieldCls}>
                  <option value="جديد">{t("add.new")}</option>
                  <option value="مستعمل">{t("add.used")}</option>
                </select>
              </div>
            ) : null}

            {listingType !== "auction" && (
              <div className="space-y-2">
                <Toggle label={ar ? "السعر قابل للتفاوض" : "Negotiable price"} checked={negotiable} onChange={setNegotiable} />
                <Toggle label={ar ? "خدمة التوصيل متاحة" : "Delivery available"} checked={delivery} onChange={setDelivery} />
              </div>
            )}

            {/* ملخص مباشر */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-extrabold">{ar ? "ملخص" : "Summary"}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Stat label={ar ? "السعر" : "Price"} value={`${Number(price || 0).toLocaleString(ar ? "ar" : "en")} ${ar ? "د.ب" : "BHD"}`} />
                {showCondition && <Stat label={ar ? "الحالة" : "Condition"} value={condition} />}
                <Stat label={ar ? "التوصيل" : "Delivery"} value={delivery ? (ar ? "متاح" : "Yes") : (ar ? "غير متاح" : "No")} />
                <Stat label={ar ? "التفاوض" : "Negotiable"} value={negotiable ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
              </div>
            </div>

            {listingType === "business" && <BusinessFields t={t} biz={biz} setBiz={setBiz} />}
          </div>

          {/* ===== Step 4: Contact / login ===== */}
          <div className={step === 4 ? "space-y-5" : "hidden"}>
            {/* معاينة حقيقية للإعلان */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {media[0] ? (
                <img src={media[0].url} alt={titleText} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-extrabold">{titleText || (ar ? "بدون عنوان" : "Untitled")}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-primary">{Number(price || 0).toLocaleString(ar ? "ar" : "en")}</span>
                  <span className="text-sm text-muted-foreground">{ar ? "د.ب" : "BHD"}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                  {activeCategory && <span className="rounded-full bg-accent px-2.5 py-1">{ar ? activeCategory.name : activeCategory.nameEn}</span>}
                  {region && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2.5 py-1">
                      <MapPin className="h-3 w-3" />
                      {region}
                    </span>
                  )}
                  {showCondition && <span className="rounded-full bg-accent px-2.5 py-1">{condition}</span>}
                </div>
                {(user ? contactPhone : guestPhone).trim() && (
                  <p className="mt-2 text-sm font-bold">
                    {ar ? "الهاتف: " : "Phone: "}
                    {(user ? contactPhone : guestPhone).trim()}
                  </p>
                )}
                {descText && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{descText}</p>}
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-accent/40 p-3 text-xs font-semibold text-foreground">
              {ar ? "سيظهر رقم الهاتف للمشترين في صفحة الإعلان." : "Your phone number will be visible to buyers on the listing page."}
            </div>

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
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                  {t("add.postingAs")} <span className="font-bold">{user.email}</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    {ar ? "رقم الهاتف (للاتصال والواتساب)" : "Phone number (call & WhatsApp)"}
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={ar ? "مثال: 3XXXXXXX" : "e.g. 3XXXXXXX"}
                    className={fieldCls}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ar
                      ? "سيظهر هذا الرقم كزر اتصال وواتساب في صفحة إعلانك. اتركه فارغاً لإخفاء أزرار التواصل."
                      : "Shown as call & WhatsApp buttons on your listing. Leave empty to hide contact buttons."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* شريط الأزرار السفلي الثابت */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-xl border border-border px-5 py-3 text-sm font-bold hover:bg-muted"
                >
                  {ar ? "السابق" : "Back"}
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
                >
                  {ar ? "التالي" : "Next"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 px-4 py-3 text-sm font-bold text-primary hover:bg-accent"
                  >
                    <Eye className="h-4 w-4" /> {ar ? "معاينة" : "Preview"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? ar
                        ? "جارٍ النشر..."
                        : "Publishing..."
                      : isEdit
                        ? ar
                          ? "حفظ التعديلات"
                          : "Save changes"
                        : ar
                          ? "نشر الإعلان الآن"
                          : "Publish now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </main>
      <Footer />
      <ImageEditor
        open={editingIndex !== null}
        file={editingIndex !== null ? media[editingIndex]?.file ?? null : null}
        isCover={editingIndex === 0}
        onMakeCover={() => {
          if (editingIndex !== null && editingIndex !== 0) {
            moveMedia(editingIndex, 0);
            setEditingIndex(0);
          }
        }}
        onClose={() => setEditingIndex(null)}
        onApply={(edited) => {
          setMedia((prev) =>
            prev.map((m, idx) => {
              if (idx !== editingIndex) return m;
              URL.revokeObjectURL(m.url);
              return { ...m, url: URL.createObjectURL(edited), file: edited };
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
            {media[0] && (
              <img
                src={media[0].url}
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
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-card"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
            checked ? "ltr:translate-x-5 rtl:-translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
