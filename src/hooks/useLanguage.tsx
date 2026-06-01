import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

/** Central translation dictionary for the whole app. */
const dict: Dict = {
  // Header
  "header.searchPlaceholder": { ar: "ابحث عن معدات، أثاث، إلكترونيات...", en: "Search equipment, furniture, electronics..." },
  "header.favorites": { ar: "المفضلة", en: "Favorites" },
  "header.notifications": { ar: "الإشعارات", en: "Notifications" },
  "header.login": { ar: "دخول", en: "Login" },
  "header.addListing": { ar: "أضف إعلان", en: "Post Ad" },
  "header.menu": { ar: "القائمة", en: "Menu" },
  "header.tagline": { ar: "سوق المعدات والأثاث والإلكترونيات", en: "Equipment, furniture & electronics market" },

  // Hero
  "hero.badge": { ar: "مدعوم بالذكاء الاصطناعي", en: "Powered by AI" },
  "hero.title1": { ar: "حراج السعادة", en: "Haraj Al Saada" },
  "hero.title2": { ar: "Haraj Al Saada", en: "حراج السعادة" },
  "hero.subtitle": { ar: "شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين", en: "Buy and sell restaurant equipment, furniture and electronics in Bahrain" },
  "hero.searchPlaceholder": { ar: "ماذا تبحث عنه اليوم؟", en: "What are you looking for today?" },
  "hero.imageSearch": { ar: "بحث بالصورة", en: "Image search" },
  "hero.search": { ar: "بحث", en: "Search" },
  "hero.uploaded": { ar: "تم رفع الصورة", en: "Image uploaded" },
  "hero.searching": { ar: "جارٍ البحث عن منتجات مشابهة", en: "Searching for similar products" },
  "hero.imageSearchLabel": { ar: "البحث بالصورة:", en: "Image search:" },
  "hero.imageTooBig": { ar: "حجم الصورة كبير جداً (الحد 6 ميجابايت)", en: "Image too large (6MB max)" },
  "hero.imageFailed": { ar: "تعذّر التعرف على الصورة، حاول بصورة أوضح", en: "Couldn't recognize the image, try a clearer photo" },
  "buy.title": { ar: "نشتري مباشرة", en: "We Buy Directly" },
  "buy.desc": { ar: "نشتري معدات المطاعم والأثاث والإلكترونيات المستعملة — تثمين مجاني وسعر مناسب.", en: "We buy used restaurant equipment, furniture and electronics — free valuation and a fair price." },
  "buy.cta": { ar: "اتصل: 36818153", en: "Call: 36818153" },
  "buy.ctaPhotos": { ar: "أرسل صور معداتك الآن للتثمين", en: "Send your equipment photos now for valuation" },
  "buy.waMsg": { ar: "مرحباً، أريد تثمين معداتي. إليكم الصور:", en: "Hello, I'd like a valuation for my equipment. Here are the photos:" },
  "header.tagline2": { ar: "شراء وبيع معدات المطاعم والأثاث والإلكترونيات في البحرين", en: "Buy & sell restaurant equipment, furniture & electronics in Bahrain" },


  // Features
  "feat.aiTitle": { ar: "تسعير ذكي بالـ AI", en: "Smart AI pricing" },
  "feat.aiDesc": { ar: "اعرف السعر السوقي العادل والمدة المتوقعة للبيع فور إضافة الإعلان.", en: "Know the fair market price and expected time to sell instantly." },
  "feat.fraudTitle": { ar: "حماية من الاحتيال", en: "Fraud protection" },
  "feat.fraudDesc": { ar: "اكتشاف الإعلانات المكررة والصور المزيفة والحسابات غير الموثوقة.", en: "Detection of duplicate ads, fake images and untrusted accounts." },
  "feat.chatTitle": { ar: "تواصل مباشر", en: "Direct contact" },
  "feat.chatDesc": { ar: "دردشة داخل الموقع وواتساب واتصال مباشر مع البائع.", en: "In-app chat, WhatsApp and direct call with the seller." },
  "feat.pwaTitle": { ar: "تطبيق PWA", en: "PWA app" },
  "feat.pwaDesc": { ar: "تجربة سريعة على الجوال مع إشعارات فورية ودعم العربية والإنجليزية.", en: "Fast mobile experience with instant notifications and Arabic & English." },

  // Categories
  "cat.title": { ar: "التصنيفات الرئيسية", en: "Main categories" },
  "cat.subtitle": { ar: "تصفّح حسب نوع المعدات والمنتجات", en: "Browse by type of equipment and products" },
  "cat.adsSuffix": { ar: "إعلان", en: "ads" },

  // Listings sections
  "sec.featured": { ar: "الإعلانات المميزة", en: "Featured listings" },
  "sec.featuredSub": { ar: "إعلانات مختارة من تجار موثوقين", en: "Selected ads from trusted sellers" },
  "sec.latest": { ar: "أحدث الإعلانات", en: "Latest listings" },
  "sec.latestSub": { ar: "آخر ما تم إضافته على حراج السعادة", en: "Newest additions on Haraj Al Saada" },

  // Listing card / detail shared labels
  "card.featured": { ar: "مميّز", en: "Featured" },
  "card.verified": { ar: "موثق", en: "Verified" },
  "card.trustedSeller": { ar: "بائع موثوق", en: "Trusted seller" },
  "card.negotiable": { ar: "قابل للتفاوض", en: "Negotiable" },
  "card.reviews": { ar: "تقييم", en: "reviews" },
  "card.deal": { ar: "صفقة", en: "deals" },
  "card.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "card.call": { ar: "اتصال", en: "Call" },
  "card.message": { ar: "رسالة", en: "Message" },
  "card.offer": { ar: "عرض سعر", en: "Offer" },
  "cond.new": { ar: "جديد", en: "New" },
  "cond.used": { ar: "مستعمل", en: "Used" },
  "card.views": { ar: "مشاهدة", en: "views" },
  "card.contactWaMsg": { ar: "مرحباً، أنا مهتم بإعلان", en: "Hello, I'm interested in the listing" },
  "card.onSite": { ar: "المعروض على حراج السعادة", en: "on Haraj Al Saada" },
  "listing.description": { ar: "الوصف", en: "Description" },
  "listing.relatedTags": { ar: "وسوم للبحث", en: "Search tags" },
  "listing.internalMsg": { ar: "الرسائل الداخلية", en: "Internal messages" },
  "listing.internalMsgDesc": { ar: "سيتم فتح المحادثة بعد تسجيل الدخول.", en: "Chat will open after you log in." },

  "footer.tagline": { ar: "حراج السعادة — منصة بيع وشراء ومزاد معدات المطاعم والأثاث والإلكترونيات في مملكة البحرين.", en: "Haraj Al Saada — buy, sell and bid on restaurant equipment, furniture and electronics in the Kingdom of Bahrain." },
  "footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "footer.admin": { ar: "لوحة الإدارة", en: "Admin panel" },

  // Add listing type chooser
  "add.chooseTitle": { ar: "ماذا تريد أن تنشر؟", en: "What would you like to post?" },
  "add.chooseSub": { ar: "اختر نوع الإعلان المناسب قبل المتابعة", en: "Choose the listing type before continuing" },
  "add.typeNormal": { ar: "إعلان عادي", en: "Regular ad" },
  "add.typeNormalDesc": { ar: "بيع منتج أو معدة واحدة بسعر ثابت أو قابل للتفاوض.", en: "Sell a single product or piece of equipment at a fixed or negotiable price." },
  "add.typeAuction": { ar: "إنشاء مزاد", en: "Create auction" },
  "add.typeAuctionDesc": { ar: "اعرض منتجك للمزايدة وحدد سعراً ابتدائياً ومدة المزاد.", en: "List your item for bidding with a starting price and auction duration." },
  "add.typeBusiness": { ar: "بيع نشاط كامل", en: "Sell full business" },
  "add.typeBusinessDesc": { ar: "بيع مطعم أو نشاط بالكامل مع جميع المعدات والتفاصيل المالية.", en: "Sell a restaurant or full business with all equipment and financials." },
  "add.continue": { ar: "متابعة", en: "Continue" },
  "add.back": { ar: "العودة للرئيسية", en: "Back to home" },
  "add.changeType": { ar: "تغيير نوع الإعلان", en: "Change listing type" },

  // Add listing form
  "add.newAd": { ar: "أضف إعلان جديد", en: "Add a new listing" },
  "add.newAuction": { ar: "إنشاء مزاد جديد", en: "Create a new auction" },
  "add.newBusiness": { ar: "بيع نشاط تجاري كامل", en: "Sell a full business" },
  "add.formSub": { ar: "املأ التفاصيل لعرض إعلانك على آلاف المشترين في مملكة البحرين.", en: "Fill in the details to show your ad to thousands of buyers in the Kingdom of Bahrain." },
  "add.contactGuest": { ar: "بيانات التواصل (للنشر كزائر)", en: "Contact details (post as guest)" },
  "add.loginShort": { ar: "تسجيل الدخول", en: "Login" },
  "add.name": { ar: "الاسم", en: "Name" },
  "add.phone": { ar: "رقم الهاتف (مثال: 3xxxxxxx)", en: "Phone (e.g. 3xxxxxxx)" },
  "add.postingAs": { ar: "تنشر باسم حسابك:", en: "Posting as:" },
  "add.adTitle": { ar: "عنوان الإعلان", en: "Listing title" },
  "add.adTitlePh": { ar: "مثال: فرن بيتزا احترافي ستانلس ستيل", en: "e.g. Professional stainless steel pizza oven" },
  "add.suggestTitle": { ar: "عناوين مقترحة (انقر للاستخدام):", en: "Suggested titles (tap to use):" },
  "add.mainCat": { ar: "التصنيف الرئيسي", en: "Main category" },
  "add.chooseCat": { ar: "اختر التصنيف", en: "Choose category" },
  "add.subCat": { ar: "نوع الصنف", en: "Item kind" },
  "add.chooseSection": { ar: "اختر نوع الصنف", en: "Choose item kind" },
  "add.type": { ar: "نوع المنتج", en: "Product type" },
  "add.chooseTypeOpt": { ar: "اختر نوع المنتج", en: "Choose product type" },
  "add.region": { ar: "المنطقة (ابحث عن مناطق البحرين)", en: "Area (search Bahrain regions)" },
  "add.regionPh": { ar: "ابحث: المنامة، الرفاع، المحرق...", en: "Search: Manama, Riffa, Muharraq..." },
  "add.mapLocation": { ar: "الموقع على الخريطة", en: "Map location" },
  "add.locating": { ar: "جارٍ التحديد...", en: "Locating..." },
  "add.updateLocation": { ar: "تحديث الموقع", en: "Update location" },
  "add.useMyLocation": { ar: "استخدم موقعي الحالي", en: "Use my current location" },
  "add.images": { ar: "الصور", en: "Images" },
  "add.addImg": { ar: "إضافة", en: "Add" },
  "add.video": { ar: "فيديو للإعلان (اختياري)", en: "Listing video (optional)" },
  "add.addVideo": { ar: "إضافة فيديو", en: "Add video" },
  "add.price": { ar: "السعر (د.ب)", en: "Price (BHD)" },
  "add.startPrice": { ar: "السعر الابتدائي للمزاد (د.ب)", en: "Auction starting price (BHD)" },
  "add.auctionDuration": { ar: "مدة المزاد (ساعات)", en: "Auction duration (hours)" },
  "add.condition": { ar: "الحالة", en: "Condition" },
  "add.new": { ar: "جديد", en: "New" },
  "add.used": { ar: "مستعمل", en: "Used" },
  "add.aiSuggest": { ar: "اقتراح السعر بالذكاء الاصطناعي", en: "AI price suggestion" },
  "add.analyzing": { ar: "جارٍ التحليل...", en: "Analyzing..." },
  "add.avgPrice": { ar: "متوسط السعر", en: "Average price" },
  "add.suggestedPrice": { ar: "السعر المقترح", en: "Suggested price" },
  "add.sellSpeed": { ar: "سرعة البيع", en: "Sell speed" },
  "add.marketCompare": { ar: "مقارنة بأولكس والسوق المفتوح", en: "vs OLX & Open Souq" },
  "add.description": { ar: "الوصف", en: "Description" },
  "add.descPh": { ar: "اكتب وصفاً تفصيلياً للمنتج...", en: "Write a detailed description..." },
  "add.publish": { ar: "نشر الإعلان", en: "Publish listing" },
  "add.publishAuction": { ar: "نشر المزاد", en: "Publish auction" },
  "add.publishBusiness": { ar: "نشر النشاط للبيع", en: "Publish business for sale" },
  "add.received": { ar: "تم استلام إعلانك", en: "Your listing was received" },
  "add.receivedDesc": { ar: "سيتم مراجعة الإعلان من قبل الإدارة قبل نشره. شكراً لاستخدامك حراج السعادة.", en: "Your listing will be reviewed by the team before publishing. Thanks for using Haraj Al Saada." },

  // Business sale fields
  "biz.heading": { ar: "تفاصيل النشاط التجاري", en: "Business details" },
  "biz.rent": { ar: "سعر الإيجار الشهري (د.ب)", en: "Monthly rent (BHD)" },
  "biz.area": { ar: "المساحة (متر مربع)", en: "Area (m²)" },
  "biz.outlets": { ar: "عدد الفتحات / الواجهات", en: "Number of openings / fronts" },
  "biz.staff": { ar: "عدد الموظفين السابقين", en: "Previous staff count" },
  "biz.license": { ar: "السجل التجاري", en: "Commercial license" },
  "biz.withLicense": { ar: "مع سجل تجاري", en: "With license" },
  "biz.withoutLicense": { ar: "بدون سجل", en: "Without license" },
  "biz.monthlyRevenue": { ar: "المدخول الشهري (د.ب)", en: "Monthly revenue (BHD)" },
  "biz.opCost": { ar: "مصاريف التشغيل الشهرية (د.ب)", en: "Monthly operating costs (BHD)" },
  "biz.includesEquip": { ar: "البيع يشمل جميع المعدات", en: "Sale includes all equipment" },
  "biz.reason": { ar: "سبب البيع", en: "Reason for sale" },
  "biz.reasonPh": { ar: "مثال: السفر، تغيير النشاط...", en: "e.g. travel, changing business..." },

  // Toasts
  "toast.maxImages": { ar: "الحد الأقصى 30 صورة", en: "Maximum 30 images" },
  "toast.noGeo": { ar: "المتصفح لا يدعم تحديد الموقع", en: "Your browser does not support geolocation" },
  "toast.located": { ar: "تم تحديد موقعك على الخريطة", en: "Your location was set on the map" },
  "toast.geoFail": { ar: "تعذّر تحديد الموقع، تأكد من السماح بالوصول", en: "Could not get location, please allow access" },
  "toast.pickCat": { ar: "اختر التصنيف أولاً لتقدير السعر", en: "Choose a category first to estimate the price" },
  "toast.guestNeeded": { ar: "أدخل الاسم ورقم الهاتف للنشر كزائر، أو سجّل الدخول", en: "Enter name and phone to post as guest, or login" },
  "toast.pickRegion": { ar: "اختر المنطقة", en: "Choose an area" },
  "toast.needImage": { ar: "أضف صورة واحدة على الأقل", en: "Add at least one image" },
  "speed.fast": { ar: "سريع (3-7 أيام)", en: "Fast (3-7 days)" },
  "speed.medium": { ar: "متوسط (1-3 أسابيع)", en: "Medium (1-3 weeks)" },
  "market.above": { ar: "أعلى قليلاً من أسعار أولكس والسوق المفتوح", en: "Slightly above OLX & Open Souq prices" },
  "market.within": { ar: "منافس ضمن أسعار أولكس والسوق المفتوح", en: "Competitive with OLX & Open Souq prices" },
};

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict | string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("alsaada_lang")) as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("alsaada_lang", l);
  }, []);

  const toggle = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);

  const t = useCallback(
    (key: string) => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
