import { Link } from "@tanstack/react-router";

/**
 * يُدرج هاشتاقات تلقائية بنوع التصنيف/المنتج أسفل الإعلان لزيادة الظهور
 * داخل الموقع (روابط بحث) وخارجه (نصوص قابلة للأرشفة من محركات البحث).
 */
export function ListingHashtags({
  tags,
  className = "",
}: {
  tags: (string | null | undefined)[];
  className?: string;
}) {
  const clean = Array.from(
    new Set(
      tags
        .filter((t): t is string => !!t && t.trim().length > 0)
        .map((t) => t.trim()),
    ),
  );
  if (clean.length === 0) return null;

  const toTag = (s: string) => `#${s.replace(/\s+/g, "_")}`;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {clean.map((t) => (
        <Link
          key={t}
          to="/search"
          search={{ q: t }}
          className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-accent"
        >
          {toTag(t)}
        </Link>
      ))}
    </div>
  );
}
