/**
 * يضغط الفيديو داخل المتصفّح قبل الرفع لتقليل الحجم وتسريع التحميل.
 * يعيد ترميز الفيديو بدقة أقل ومعدل بت منخفض باستخدام MediaRecorder + Canvas.
 * إذا تعذّر الضغط لأي سبب، يُعيد الملف الأصلي كما هو دون إيقاف عملية النشر.
 */
export async function compressVideo(
  file: File,
  opts: { maxDim?: number; bitrate?: number; minBytes?: number } = {},
): Promise<File> {
  const { maxDim = 720, bitrate = 1_500_000, minBytes = 4 * 1024 * 1024 } = opts;
  try {
    if (typeof window === "undefined") return file;
    if (!file.type.startsWith("video/")) return file;
    // لا داعي لضغط الفيديوهات الصغيرة
    if (file.size < minBytes) return file;
    if (typeof MediaRecorder === "undefined") return file;
    const canvasEl = document.createElement("canvas");
    if (typeof canvasEl.captureStream !== "function") return file;

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    (video as HTMLVideoElement & { crossOrigin?: string }).crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("metadata"));
    });

    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (!vw || !vh) {
      URL.revokeObjectURL(url);
      return file;
    }

    const scale = Math.min(1, maxDim / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    canvasEl.width = w;
    canvasEl.height = h;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return file;
    }

    const stream = canvasEl.captureStream(30);

    // محاولة الحفاظ على الصوت
    try {
      const v = video as HTMLVideoElement & {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      };
      const srcStream = v.captureStream?.() ?? v.mozCaptureStream?.();
      const audioTrack = srcStream?.getAudioTracks?.()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    } catch {
      /* بعض المتصفّحات لا تدعم التقاط الصوت — نتابع بدون صوت */
    }

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };

    const recorded = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    });

    recorder.start(1000);

    let raf = 0;
    const draw = () => {
      ctx.drawImage(video, 0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };

    await video.play();
    draw();

    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
    });

    cancelAnimationFrame(raf);
    if (recorder.state !== "inactive") recorder.stop();
    const blob = await recorded;
    URL.revokeObjectURL(url);

    if (!blob.size || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${base}.webm`, { type: "video/webm" });
  } catch {
    return file;
  }
}
