import { Heart, MapPin, Eye } from "lucide-react";
import type { Listing } from "@/data/marketplace";

export function ListingCard({ item }: { item: Listing }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.featured && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-glow">
            مميّز
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">
          {item.condition}
        </span>
        <button
          className="absolute bottom-2 left-2 rounded-full bg-white/90 p-1.5 text-foreground transition-colors hover:text-primary"
          aria-label="إضافة للمفضلة"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-bold text-card-foreground">{item.title}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-primary">{item.price.toLocaleString("ar")}</span>
          <span className="text-xs font-semibold text-muted-foreground">د.ب</span>
          {item.negotiable && <span className="text-[11px] text-muted-foreground">• قابل للتفاوض</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {item.city}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString("ar")}
          </span>
        </div>
      </div>
    </article>
  );
}
