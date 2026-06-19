// 1. دالة التحقق الخاصة بفيسبوك
export async function GET(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  // التحقق من التوكن الخاص بك
  if (mode === "subscribe" && token === "alsaada2026") {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// 2. دالة استقبال المنشورات والصور
export async function POST(req) {
  try {
    const body = await req.json();

    // طباعة البيانات القادمة للمراقبة
    console.log("البيانات المستقبلة من الويب هوك:", JSON.stringify(body, null, 2));

    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            // التحقق من وصول تحديث من الصفحة أو المجموعة
            if (change.field === "feed" || change.field === "group_feed") {
              const value = change.value;

              // 1. جلب بيانات المنشور الأساسية
              const postId = value.post_id || value.id;
              const message = value.message || "";
              const senderName = value.from ? value.from.name : "غير معروف";
              const itemType = value.item; // لمعرفة هل هو status, photo, video, comment

              // 2. الاستخراج العميق للصور (Deep Image Extraction)
              let extractedImages = [];

              // أ. التحقق من الصور المباشرة
              if (value.full_picture) extractedImages.push(value.full_picture);
              else if (value.picture) extractedImages.push(value.picture);

              // ب. الغوص في المرفقات (Attachments) والصور المتعددة (Subattachments)
              if (value.attachments && value.attachments.data) {
                for (const attachment of value.attachments.data) {
                  // استخراج صورة المرفق الرئيسي
                  if (attachment.media && attachment.media.image && attachment.media.image.src) {
                    extractedImages.push(attachment.media.image.src);
                  }

                  // استخراج صور الألبوم (إذا كان المنشور يحتوي على عدة صور)
                  if (attachment.subattachments && attachment.subattachments.data) {
                    for (const sub of attachment.subattachments.data) {
                      if (sub.media && sub.media.image && sub.media.image.src) {
                        extractedImages.push(sub.media.image.src);
                      }
                    }
                  }
                }
              }

              // ج. كحل بديل إذا كان نوع المنشور صورة ومرفق كرابط مباشر
              if (itemType === "photo" && value.link && extractedImages.length === 0) {
                extractedImages.push(value.link);
              }

              // تنظيف المصفوفة من الروابط المكررة (إن وجدت)
              const uniqueImages = [...new Set(extractedImages)];

              console.log(`=== تم استقبال منشور من حقل: ${change.field} ===`);
              console.log("- نوع العنصر:", itemType);
              console.log("- صاحب المنشور:", senderName);
              console.log("- النص:", message);
              console.log("- عدد الصور المستخرجة:", uniqueImages.length);
              console.log("- روابط الصور:", uniqueImages);

              // -------------------------------------------------------------
              // كود الإدخال في قاعدة بيانات Supabase يوضع هنا
              // يمكنك الآن حفظ المصفوفة (uniqueImages) بالكامل.
              // -------------------------------------------------------------
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (error) {
    console.error("خطأ في معالجة طلب الويب هوك:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
