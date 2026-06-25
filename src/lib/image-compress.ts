/**
 * يضغط حجم الصورة في المتصفّح قبل رفعها لتسريع التحميل وتحسين الظهور في محركات البحث،
 * ويضيف علامة مائية باسم "حراج السعادة" في زاوية الصورة.
 * يصغّر الأبعاد إلى حد أقصى ويحوّلها إلى JPEG بجودة جيدة. يتجاهل الملفات غير الصور.
 */

const WATERMARK_TEXT = "حراج السعادة";

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // حجم الخط نسبي لأبعاد الصورة مع حد أدنى للوضوح
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.045));
  ctx.font = `bold ${fontSize}px Tahoma, "Segoe UI", sans-serif`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  const pad = Math.round(fontSize * 0.6);
  const x = width - pad;
  const y = height - pad;
  // ظل خفيف لزيادة التباين على الخلفيات الفاتحة والداكنة
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(WATERMARK_TEXT, x, y);
  // إزالة الظل لئلا يؤثر على عمليات لاحقة
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/** يحاول فك تشفير الصورة عبر createImageBitmap ثم يعود لاستخدام <img> كحل بديل (يدعم HEIC على سفاري). */
async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number } | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap) return { source: bitmap, width: bitmap.width, height: bitmap.height };

  // حل بديل: تحميل الصورة في عنصر <img> (يعالج بعض الصيغ التي يفشل فيها createImageBitmap مثل HEIC)
  return await new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** يضمن أن اسم الملف ينتهي بامتداد صورة مقبول في التخزين. */
function safeImageFile(file: File): File {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
  if (allowed.includes(ext)) return file;
  // إعادة تسمية الملفات غير المدعومة (مثل HEIC) لامتداد آمن حتى لا يرفضها التخزين
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([file], `${base}.jpg`, { type: file.type || "image/jpeg" });
}

export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
  watermark = true,
): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return safeImageFile(file);

    const decoded = await decodeImage(file);
    if (!decoded) return safeImageFile(file);

    let { width, height } = decoded;
    if (!width || !height) return safeImageFile(file);
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return safeImageFile(file);
    ctx.drawImage(decoded.source, 0, 0, width, height);
    if ("close" in decoded.source) (decoded.source as ImageBitmap).close?.();

    if (watermark) drawWatermark(ctx, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return safeImageFile(file);

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return safeImageFile(file);
  }
}
