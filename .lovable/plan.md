# برومبت جاهز لإرساله إلى Google AI Studio لإصلاح عودة تسجيل الدخول إلى التطبيق

انسخ النص التالي كما هو والصقه في محادثة Google AI Studio التي تبني بها التطبيق:

---

## وصف المشكلة
في تطبيقي، عند الضغط على زر "تسجيل الدخول عبر Google" تُفتح صفحة حساب Google وتتم المصادقة بنجاح، **لكن بعد إتمام تسجيل الدخول ينتقل المستخدم إلى موقع الويب `alsaada.sale` بدلاً من العودة إلى داخل التطبيق**. المطلوب أن يعود المستخدم بعد تسجيل الدخول إلى داخل التطبيق مباشرة مع جلسة مسجّلة، وليس إلى الموقع.

## السبب الجذري
- قيمة `redirectTo` المستخدمة في نداء تسجيل الدخول تشير حالياً إلى رابط الموقع (`https://alsaada.sale` أو `window.location.origin`)، لذلك يعود المستخدم إلى الموقع بدل التطبيق.
- التطبيق لا يستخدم تدفق PKCE اللازم لتطبيقات الجوال.
- الرابط العميق (deep link) الخاص بالتطبيق غير مُسجّل/غير مُلتقَط، ولا يتم تبديل الكود بجلسة عند العودة.

## بيانات الاتصال (استخدمها كما هي — لا تغيّرها)
```
SUPABASE_URL   = https://grnkrmqjhjhgrnylihvq.supabase.co
ANON_KEY       = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmtybXFqaGpoZ3JueWxpaHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTM0NjAsImV4cCI6MjA5NTc4OTQ2MH0.WiKev-XUhuQd1yuELVkMuFCRLwHYuGK4qmsDgKpfM0w
APP DEEP LINK  = harajalsaada://login-callback
```

## المطلوب تنفيذه في كود التطبيق

### 1) فعّل تدفق PKCE عند إنشاء عميل Supabase
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

### 2) اجعل redirectTo يشير إلى رابط التطبيق العميق (وليس الموقع)
```js
const redirectTo = 'harajalsaada://login-callback' // ليس alsaada.sale

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
    skipBrowserRedirect: true, // مهم: لا تدع المتصفح يعيد التوجيه للموقع تلقائياً
  },
})

// افتح رابط المصادقة في متصفح النظام ثم انتظر عودة الرابط العميق
// (استخدم آلية فتح المتصفح المتوفرة في بيئة التطبيق لديك)
openExternalBrowser(data.url)
```

### 3) التقط عودة الرابط العميق وبدّل الكود بجلسة
```js
// عند استقبال أي رابط عميق موجّه للتطبيق:
async function onDeepLink(url) {
  if (url.startsWith('harajalsaada://login-callback')) {
    const code = new URL(url).searchParams.get('code')
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      // الآن المستخدم مسجّل الدخول داخل التطبيق → انتقل إلى الشاشة الرئيسية
      navigateToHome()
    }
  }
}
```

### 4) سجّل الـ scheme في المنصّتين

**Android — داخل الـ Activity الرئيسية في `AndroidManifest.xml`:**
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="harajalsaada" android:host="login-callback" />
</intent-filter>
```

**iOS — في `Info.plist`:**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>harajalsaada</string>
    </array>
  </dict>
</array>
```

## قواعد مهمة يجب الالتزام بها
- **لا تستخدم أبداً** `redirectTo` يشير إلى `https://alsaada.sale` أو `window.location.origin` — هذا هو سبب ذهاب المستخدم للموقع.
- الخادم (Supabase) مُهيّأ ويعمل بشكل صحيح: تم اختبار نقطة `/authorize` وأعادت التوجيه إلى Google ثم إلى `harajalsaada://login-callback` بنجاح (رمز 302). المشكلة كلها **في كود التطبيق فقط**، لا حاجة لتغيير أي شيء في الخادم أو قاعدة البيانات أو الجداول.
- بعد `exchangeCodeForSession` تصبح نفس بيانات المستخدم والإعلانات متاحة تلقائياً داخل التطبيق لأن التطبيق والموقع يستخدمان نفس مشروع Supabase.
- لا تغيّر أسماء الحقول أو الجداول ولا تعِد بناء النظام.

---

## ملاحظة
هذا الإصلاح كله في جانب التطبيق (Google AI Studio). لا يتطلب أي تعديل على كود موقع "حراج السعادة" الحالي هنا في Lovable. أخبرني إن أردت أيضاً إضافة صفحة/مسار عودة `auth/callback` على جانب الموقع لدعم النسخة الويب.