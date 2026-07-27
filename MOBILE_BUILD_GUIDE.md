# دليل بناء ونشر تطبيق حراج السعادة

## نظرة عامة

تم تحويل موقع حراج السعادة إلى تطبيق جوال باستخدام **Capacitor**. التطبيق يعرض نفس الموقع بالكامل (تصميم وبيانات) داخل غلاف أصلي، ويُرفع على App Store و Google Play.

## المتطلبات

- حساب **Apple Developer** (99$ سنوياً) — للرفع على App Store.
- حساب **Google Play Developer** (25$ مرة واحدة) — للرفع على Google Play.
- جهاز **Mac** لتشغيل Xcode وإنشاء ملف IPA.
- **Android Studio** لإنشاء ملف APK/AAB.

## الخطوة 1: تصدير المشروع من Lovable

1. اربط المشروع بـ GitHub (إن لم يكن مربوطاً) من إعدادات Lovable.
2. استنسخ المشروع على جهازك:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```
3. ثبّت الاعتماديات:
   ```bash
   bun install
   # أو npm install
   ```

## الخطوة 2: إنشاء مشاريع iOS و Android

```bash
# إنشاء مشروع iOS
npx cap add ios

# إنشاء مشروع Android
npx cap add android

# توليد الأيقونات وشاشة البداية (من resources/icon.png و resources/splash.png)
npx capacitor-assets generate
```

> ملاحظة: إذا لم تكن `capacitor-assets` مثبتة، ثبّتها عبر:
> ```bash
> npm install -g @capacitor/assets
> ```

## الخطوة 3: فتح المشروع في Android Studio

```bash
npx cap open android
```

### إنشاء ملف التوقيع (Keystore) — مرة واحدة فقط

1. في Android Studio: **Build → Generate Signed Bundle / APK...**
2. اختر **APK** أو **App Bundle (AAB)**.
3. أنشئ keystore جديد:
   - Key store path: اختر موقعاً آمناً
   - Password: كلمة مرور قوية
   - Key alias: `alsaada`
   - Validity: 25 سنة
4. أكمل البناء للحصول على ملف `app-release.aab` أو `app-release.apk`.

## الخطوة 4: فتح المشروع في Xcode

```bash
npx cap open ios
```

### إعدادات Xcode

1. اختر مشروع `App` من الـ navigator.
2. في **Signing & Capabilities**:
   - اختر فريقك (Team) من Apple Developer.
   - تأكد من أن الـ Bundle Identifier هو `sale.alsaada.app`.
3. في **General → App Icons and Launch Images**:
   - تأكد من أن App Icons Source = `AppIcon`.
   - Launch Screen File = `LaunchScreen.storyboard`.
4. اختر جهازاً حقيقياً أو **Any iOS Device** ثم:
   - **Product → Archive**.
   - من Organizer، اضغط **Distribute App** واتبع خطوات App Store Connect.

## الخطوة 5: إضافة الميزات الأصلية (اختياري)

تم تثبيت الإضافات التالية:
- `@capacitor/camera` — كاميرا/معرض الصور.
- `@capacitor/share` — مشاركة الإعلانات.
- `@capacitor/preferences` — تخزين محلي آمن.
- `@capacitor/status-bar` — تلوين شريط الحالة.
- `@capacitor/splash-screen` — شاشة البداية.
- `@capacitor/app` — التحكم بزر الرجوع.

## الخطوة 6: تحديث التطبيق

عند تعديل الموقع:
1. انشر الموقع من Lovable.
2. شغّل:
   ```bash
   npx cap sync
   npx cap open android
   npx cap open ios
   ```
3. أعد البناء والرفع للمتاجر.

## ملاحظات مهمة

- التطبيق يحمل الموقع من `https://www.alsaada.sale`. أي تعديل على الموقع يظهر في التطبيق فوراً بدون تحديث المتجر.
- إذا أردت تغيير Bundle ID أو اسم التطبيق، عدّل `capacitor.config.ts` ثم شغّل `npx cap sync`.
- لاختبار تسجيل الدخول عبر Google على الويب وAndroid وبعد إعادة تثبيت التطبيق، اتبع القائمة الكاملة في `GOOGLE_SIGNIN_TEST_CHECKLIST.md`.
- عند ظهور خطأ Google يحتوي على `redirect_uri=https://www.alsaada.sale/~oauth/callback` يجب تسجيل هذا الرابط نفسه حرفياً في Google Cloud Console ضمن Web OAuth Client، وليس `/auth/callback`.
- تم توحيد تدفق Google للويب وأندرويد على Web OAuth Client مع Authorization Code + PKCE (S256). لا تستخدم Android Client ID كـ `client_id` في تدفق المتصفح؛ دوره فقط ربط الحزمة وبصمات SHA داخل نفس مشروع Google.
- للاختبار السريع على جهاز Android:
  ```bash
  npx cap run android
  ```
- للاختبار السريع على جهاز iOS (يتطلب Mac + جهاز/محاكي):
  ```bash
  npx cap run ios
  ```

## دعم

لأي مشكلة في بناء التطبيق، راجع:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Apple App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
