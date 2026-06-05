/**
 * يضغط حجم الصورة في المتصفّح قبل رفعها لتسريع التحميل وتحسين الظهور في محركات البحث.
 * يصغّر الأبعاد إلى حد أقصى ويحوّلها إلى JPEG بجودة جيدة. يتجاهل الملفات غير الصور.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    // لا داعي لضغط الملفات الصغيرة جداً
    if (file.size < 120 * 1024) return file;

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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
