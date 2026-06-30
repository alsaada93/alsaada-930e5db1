import { useLanguage } from "@/hooks/useLanguage";

type Translatable = {
  id: string;
  title: string;
  description?: string;
};

/**
 * Returns the listing text as-is. Automatic AI translation was removed to avoid
 * AI credit usage; listings always display their original title/description.
 */
export function useListingTranslations(_items: Translatable[]) {
  const { lang } = useLanguage();

  return {
    lang,
    map: {} as Record<string, { title: string; description: string }>,
    translate: (id: string, fallbackTitle: string, fallbackDesc?: string) => ({
      title: fallbackTitle,
      description: fallbackDesc || "",
    }),
  };
}
