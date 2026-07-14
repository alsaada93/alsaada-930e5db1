# خطة إعداد الوثيقة الهندسية الكاملة لمشروع حراج السعادة

**الوضع:** استكشاف فقط — لا تعديل على أي ملف أو قاعدة بيانات.  
**الإخراج:** عرض كامل داخل المحادثة، موزّع على Parts متعددة.

## مصادر الاستخراج

1. **قاعدة البيانات (DDL كامل)** — استعلامات على `information_schema` و `pg_catalog` عبر `supabase--read_query`:
   - كل الجداول والأعمدة والأنواع والـ defaults والـ NOT NULL
   - Primary Keys, Foreign Keys, Unique, Check constraints
   - الفهارس (`pg_indexes`)
   - الـ Triggers (`information_schema.triggers`)
   - الـ Views و Materialized Views
   - الـ Functions (RPC) — موجودة أصلاً في `<db-functions>` بالسياق
   - الـ RLS Policies (`pg_policies`) لكل الجداول الـ44
   - الـ Enums (`app_role` وغيرها)
   - Storage: bucket `listings` وسياساته
2. **الشيفرة** — قراءة متوازية لأهم الملفات:
   - `src/router.tsx`, `src/start.ts`, `src/server.ts`, `vite.config.ts`, `package.json`, `capacitor.config.ts`
   - كل ملفات `src/routes/` (فهرس + عيّنات المحتوى الحساسة: `index.tsx`, `listing.$id.tsx`, `add-listing.tsx`, `login.tsx`, `account.tsx`, `admin.*`)
   - كل ملفات `src/lib/*.functions.ts` و `*.server.ts`
   - كل `src/hooks/*.tsx` المرتبطة بالبيانات
   - `src/integrations/supabase/*` و `src/integrations/lovable/*`
   - `android/app/src/main/AndroidManifest.xml` وإعدادات Capacitor
3. **إعدادات Supabase** — `supabase--project_info` + قائمة الأسرار والباكِتس والدوال (متوفرة في السياق).

## هيكل الإخراج (Parts)

| Part | يحتوي |
|---|---|
| **Part 1/8** | SECTION 1: هيكل المشروع الكامل — شجرة المجلدات + وصف وظيفة كل ملف + مخطط الترابط |
| **Part 2/8** | SECTION 2: DDL كامل لكل الجداول الـ44 (CREATE TABLE + PK/FK/Indexes/Constraints/Defaults) |
| **Part 3/8** | SECTION 2 (تابع): كل RLS Policies + Triggers + Enums + Functions المخصصة |
| **Part 4/8** | SECTION 3 (Supabase config) + SECTION 4 (Auth flow) + SECTION 5 (Google OAuth + PKCE + Deep Link) — مع كود كامل لتدفق تسجيل الدخول |
| **Part 5/8** | SECTION 6 (Users/Roles) + SECTION 7 (Ads lifecycle كامل مع كود Upload/Compress/Create/Approve/Delete) + SECTION 9 (Storage bucket `listings`) |
| **Part 6/8** | SECTION 8 (Realtime) + SECTION 10 (API: server functions + REST endpoints) + SECTION 11 (Functions: كود كامل لدوال Auth/Ads/Upload، توقيعات + شرح للباقي) + SECTION 12 (Search) + SECTION 13 (Notifications) |
| **Part 7/8** | SECTION 14 (Admin Panel — كل صفحة `admin.*`) + SECTION 15 (Business Logic و Validations: انتهاء الإعلانات، المزادات، العروض، الأدوار، السياسات) |
| **Part 8/8** | SECTION 16 (Android Migration Spec — مسار مزدوج): <br>• **A. Kotlin Native + Compose + supabase-kt**: شاشة بشاشة، جداول، APIs، Navigation، Validation، Error handling <br>• **B. Capacitor الحالي**: تحليل الفجوات في `android/` الحالي وقائمة إصلاحات <br>+ SECTION 17 (Sync Web↔Supabase↔Android) + SECTION 18 (خاتمة) |

## قواعد الالتزام أثناء الكتابة

- **لا تعديل**: لن يُنفَّذ أي `write` أو `migration` أو `insert`.
- **الكود المختلط**: كود كامل حرفي لدوال Auth/Google OAuth/Upload Image/Create Ad/Approve/Delete + Deep Link handler. توقيعات + شرح تدفق للدوال الأقل حرجًا.
- **لا اختصار للـ DDL** — كل جدول بكل أعمدته وسياساته.
- **مصطلحات**: الإشارة إلى "Lovable Cloud / قاعدة البيانات" في النص الموجَّه للمستخدم، مع الحفاظ على أسماء تقنية دقيقة (Postgres/PostgREST/RLS) داخل الأقسام الفنية.
- **حجم الرسائل**: كل Part رسالة مستقلة؛ إن تجاوز Part الحد يُقسَّم إلى Part N.a / N.b.

## الخطوات التنفيذية (بعد الموافقة)

1. تشغيل استعلامات القراءة على `pg_catalog` / `information_schema` / `pg_policies` (استعلامات متوازية).
2. قراءة متوازية لكل ملفات الشيفرة اللازمة.
3. إصدار Part 1 → انتظار "التالي" أو المتابعة المباشرة (حسب طلبك).
4. متابعة إصدار Parts 2..8 بالتسلسل.

بعد موافقتك سأبدأ فورًا بـ Part 1.
