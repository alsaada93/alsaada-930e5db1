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

export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
  watermark = true,
): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;

    let { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    if (watermark) drawWatermark(ctx, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
