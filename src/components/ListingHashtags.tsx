import { Link } from "@tanstack/react-router";
import { buildHashtags } from "@/lib/hashtags";

/**
 * يُدرج هاشتاقات تلقائية بنوع التصنيف/المنتج أسفل الإعلان لزيادة الظهور
 * داخل الموقع (روابط بحث) وخارجه (نصوص قابلة للأرشفة من محركات البحث).
 * يُولّد ١٠ هاشتاقات على الأقل مرتبطة بالأثاث والمعدات والإلكترونيات.
 */
export function ListingHashtags({
  tags,
  className = "",
  min = 10,
}: {
  tags: (string | null | undefined)[];
  className?: string;
  min?: number;
}) {
  const hashtags = buildHashtags(tags, min);
  if (hashtags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {hashtags.map((tag) => (
        <Link
          key={tag}
          to="/search"
          search={{ q: tag.replace(/^#/, "").replace(/_/g, " ") }}
          className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-accent"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
