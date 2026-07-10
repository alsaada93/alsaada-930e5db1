
# حزمة تكامل "حراج السعادة" — ربط تطبيق Native بنفس backend الموقع

> جاهزة للنسخ وإعطائها لمساعد Google AI Studio. لا يتطلب هذا أي تعديل على قاعدة البيانات أو الجداول أو الحقول. الهدف: تطبيق موبايل يشارك نفس المستخدمين والبيانات والإعلانات مع الموقع.

---

## 1) بيانات الاتصال بـ Supabase (عامة وآمنة للتطبيق)

```
SUPABASE_URL            = https://grnkrmqjhjhgrnylihvq.supabase.co
SUPABASE_PROJECT_ID     = grnkrmqjhjhgrnylihvq
SUPABASE_ANON_KEY       = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmtybXFqaGpoZ3JueWxpaHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTM0NjAsImV4cCI6MjA5NTc4OTQ2MH0.WiKev-XUhuQd1yuELVkMuFCRLwHYuGK4qmsDgKpfM0w
```

- الرابط `odujhfwkvyqvyqelaphh` الذي كان لديك **خاطئ** — لا تستخدمه. المشروع الصحيح هو `grnkrmqjhjhgrnylihvq`.
- مفتاح `service_role` وكلمة سر قاعدة البيانات **غير متاحة** في Lovable Cloud ولا يجب وضعها داخل تطبيق موبايل إطلاقًا (أمان). التطبيق يستخدم anon key فقط + RLS.
- أي عميل Supabase (JS / Flutter / Kotlin / Swift) يُهيّأ بهذين القيمتين فقط، وسيصل تلقائيًا لنفس المستخدمين والإعلانات.

مثال تهيئة (JS/React Native):
```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  'https://grnkrmqjhjhgrnylihvq.supabase.co',
  '<ANON_KEY أعلاه>',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
)
```

---

## 2) نظام تسجيل الدخول (Authentication)

حالة المزودات الفعلية على الخادم (`GET /auth/v1/settings`):
```
email  = مفعّل
google = مفعّل
apple  = مفعّل
phone(OTP مباشر) = غير مفعّل  (الموقع يستخدم واتساب OTP عبر منطق خاص)
anonymous = مفعّل
```

### أ) Email / Password
يعمل مباشرة في أي عميل:
```js
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password, options: { data: { full_name } } })
```

### ب) Google OAuth — نقطة الخطأ الحالية
- على **الويب** الموقع يستخدم وسيط Lovable المُدار (لا يحتاج secret).
- على **native** الوسيط لا يعمل، فالتطبيق يستدعي GoTrue مباشرة → يظهر الخطأ:
  `Unsupported provider: missing OAuth secret`
  لأن مزوّد Google في المشروع لا يخزّن Client Secret خاص (الويب يعتمد على الوسيط).

**الحل لتطبيق native: إنشاء بيانات اعتماد Google خاصة وإدخالها في مزوّد Google بالمشروع:**
- Redirect URI (Web client) للمزوّد:
  `https://grnkrmqjhjhgrnylihvq.supabase.co/auth/v1/callback`
- Scheme للعودة إلى التطبيق: `harajalsaada://login-callback`
- Scopes: `openid`, `email`, `profile`
- تفعيل PKCE في عميل التطبيق:
  ```js
  createClient(url, anon, { auth: { flowType: 'pkce' } })
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'harajalsaada://login-callback' }
  })
  ```
- ثم إدخال **Client ID + Client Secret** في: Lovable Cloud → Auth → Sign-in methods → Google. (هذه الخطوة الوحيدة التي تُزيل خطأ missing OAuth secret على native).

### ج) Apple Login
مفعّل. لتطبيق iOS native استخدم Sign in with Apple بنفس نمط PKCE و redirect `harajalsaada://login-callback`.

### د) الجلسات مشتركة تلقائيًا
بما أن التطبيق والموقع يستخدمان نفس مشروع Supabase، فإن نفس حساب المستخدم ونفس بياناته وإعلاناته تظهر في الاثنين دون أي مزامنة إضافية.

---

## 3) هيكل قاعدة البيانات (الجداول الأساسية للتطبيق)

جميعها في schema `public` ومحميّة بـ RLS. أهمها للتطبيق:

| الجدول | الوصف | حقول مفتاحية |
|---|---|---|
| `listings` | الإعلانات (بيع/إيجار/مزاد/منشآت) | `id, user_id, listing_type, title, description, price, category_id, city, images[], video, contact_phone, status, views, featured, start_price, auction_ends_at, published_at, expires_at` |
| `listing_translations` | ترجمات الإعلان | `listing_id, lang, title, description` |
| `favorites` | المفضلة | `user_id, listing_id` |
| `auction_bids` | مزايدات المزاد | `listing_id, user_id, amount` |
| `listing_conversations` | محادثات بين المشتري والبائع | `listing_id, buyer_id, seller_id, last_message` |
| `listing_messages` | رسائل المحادثة | `conversation_id, sender_id, body, read_at` |
| `equipment_requests` | طلبات معدات | `user_id, title, category_id, city, budget, images[]` |
| `profiles` | ملف المستخدم | `id, full_name` |
| `user_roles` | صلاحيات (admin/user) | `user_id, role` |
| `brands` | العلامات التجارية | `name, category_id, item_name` |
| `blog_posts` | المدونة | `slug, title, content, published` |
| `hero_slides` | شرائح الواجهة | `image_url, title, link, active` |
| `fabrication_products` / `fabrication_categories` / `fabrication_projects` | قسم التصنيع/الحاسبة | حسب المنتج والتسعير |
| `site_settings` | إعدادات الموقع (طرق الدخول، العروض، إلخ) | `key, value(jsonb)` |
| `seller_contacts` | هواتف البائعين (محمية بدالة) | تُقرأ عبر `get_seller_phone()` |

ملاحظات مهمة لمساعد Google:
- قراءة/كتابة `listings` تخضع لـ RLS: القراءة العامة للإعلانات ذات `status='approved'`؛ صاحب الإعلان يرى ويعدّل إعلاناته عبر `auth.uid()`.
- الهاتف يُقرأ عبر RPC آمنة: `supabase.rpc('get_seller_phone', { _seller_id })`.
- زيادة المشاهدات: `supabase.rpc('increment_listing_views', { _id })`.
- الإعلانات لها انتهاء تلقائي (60 يومًا) عبر `expires_at`.

---

## 4) التخزين (Storage)

```
Bucket: listings   (عام Public = نعم)
```
رفع صور الإعلانات:
```js
supabase.storage.from('listings').upload(path, file)
const { data } = supabase.storage.from('listings').getPublicUrl(path)
```
حقول الصور في `listings.images` هي مصفوفة روابط عامة.

---

## 5) الروابط والنطاقات

```
Preview   : https://id-preview--027ed9d0-f2a9-4473-af02-58ad57600a39.lovable.app
Published : https://alsaada.lovable.app
Domains   : https://www.alsaada.sale , https://alsaada.sale
App Scheme (native) : harajalsaada://login-callback
```
أضف هذه النطاقات في Google Cloud → Authorized domains: `alsaada.sale`, `www.alsaada.sale`, `*.lovable.app`.

---

## 6) ملخص ما يحتاجه مساعد Google لإنجاز الربط

1. تهيئة عميل Supabase بـ URL + anon key أعلاه (القسم 1).
2. تفعيل تسجيل الدخول:
   - Email/Password يعمل فورًا.
   - Google/Apple على native: إنشاء Client ID/Secret + PKCE + redirect `harajalsaada://login-callback`، ثم إدخال الـ Secret في مزوّد Google بالمشروع (القسم 2).
3. استخدام نفس الجداول (القسم 3) للإعلانات والمفضلة والمحادثات والملف الشخصي.
4. استخدام bucket `listings` للصور (القسم 4).
5. الاعتماد على RLS الموجودة — لا حاجة لأي مفتاح خادمي في التطبيق.

النتيجة: تطبيق موبايل مرتبط بالكامل بنفس موقع حراج السعادة — نفس الحسابات، نفس الإعلانات، نفس البيانات.

---

### هل تريد مني تنفيذ خطوة الإصلاح على جانب الموقع؟
الشيء الوحيد الذي يتطلب فتح لوحة Lovable Cloud هو إدخال **Google Client ID/Secret** لتفعيل Google على native. أستطيع أنا:
- ضبط `redirect_uri` في كود الموقع ليكون متوافقًا مع native/الويب.
- أو إعداد مزوّد Google عبر أداة الربط الاجتماعي.

أخبرني إن أردت أن أنفّذ ذلك (سننتقل عندها من وضع التخطيط إلى التنفيذ).
