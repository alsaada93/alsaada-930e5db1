import { useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * نص قابل للطي: يعرض سطرين فقط ويبدأ بإخفاء الثالث تدريجياً (تلاشٍ)
 * مع زر "انظر للمزيد" لفتح باقي النص.
 */
export function CollapsibleText({
  text,
  className = "",
  clampLines = 2,
}: {
  text: string;
  className?: string;
  clampLines?: number;
}) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // نتحقق إن كان النص أطول من عدد الأسطر المسموح
    setOverflowing(el.scrollHeight - el.clientHeight > 2);
  }, [text, clampLines]);

  return (
    <div className={className}>
      <div className="relative">
        <p
          ref={ref}
          className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
          style={
            expanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: clampLines,
                  overflow: "hidden",
                }
          }
        >
          {text}
        </p>
        {!expanded && overflowing && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
            aria-hidden
          />
        )}
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-bold text-primary hover:underline"
        >
          {expanded
            ? lang === "en"
              ? "Show less"
              : "عرض أقل"
            : lang === "en"
              ? "See more"
              : "انظر للمزيد"}
        </button>
      )}
    </div>
  );
}
