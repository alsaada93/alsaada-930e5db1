import { useEffect, useState } from "react";
import { useHeroSlides } from "@/hooks/useHeroSlides";

/** شريط صور متحرك بين مربع البحث والتصنيفات — يتبدّل تلقائياً مع تنقّل بالنقاط. */
export function PromoCarousel() {
  const { slides, intervalMs } = useHeroSlides();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, Math.max(1500, intervalMs));
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8">
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-card">
        <div className="relative aspect-[16/6] w-full bg-muted">
          {slides.map((s, i) => (
            <a
              key={s.id}
              href={s.link ?? "#"}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === current ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <img src={s.image_url} alt={s.title ?? "عرض"} className="h-full w-full object-cover" />
              {(s.title || s.subtitle) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  {s.title && <p className="text-lg font-extrabold">{s.title}</p>}
                  {s.subtitle && <p className="text-sm text-white/85">{s.subtitle}</p>}
                </div>
              )}
            </a>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`عرض ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-white/70 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
