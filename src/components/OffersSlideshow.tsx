import { useEffect, useState } from "react";
import { optimizedImage } from "@/lib/image-url";

/** شريط صور متحرك (سلايدر) لصفحة العروض — يتحكم به الأدمن. */
export function OffersSlideshow({
  images,
  intervalMs,
}: {
  images: string[];
  intervalMs: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      Math.max(1500, intervalMs),
    );
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <div className="relative aspect-[16/6] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-card">
        {images.map((src, i) => (
          <img
            key={src + i}
            src={optimizedImage(src, 1200)}
            alt="عرض"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            decoding="async"
          />
        ))}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`صورة ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? "w-5 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
