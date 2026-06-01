import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { translateListings } from "@/lib/translate.functions";
import { useLanguage } from "@/hooks/useLanguage";

type Translatable = {
  id: string;
  title: string;
  description?: string;
};

/**
 * Returns a map of listingId -> { title, description } translated into the
 * currently selected language. Listings are translated on demand and cached
 * server-side, so repeated views are instant.
 */
export function useListingTranslations(items: Translatable[]) {
  const { lang } = useLanguage();
  const run = useServerFn(translateListings);

  // Stable key based on the ids being shown + language.
  const ids = useMemo(
    () =>
      items
        .map((i) => i.id)
        .sort()
        .join(","),
    [items],
  );

  const { data } = useQuery({
    queryKey: ["listing-translations", lang, ids],
    enabled: items.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const payload = items.map((i) => ({
        id: i.id,
        title: i.title ?? "",
        description: i.description ?? "",
      }));
      // Server fn caps batches at 40 items, so chunk larger lists.
      const merged: Record<string, { title: string; description: string }> = {};
      for (let i = 0; i < payload.length; i += 40) {
        const chunk = payload.slice(i, i + 40);
        const res = await run({ data: { lang, items: chunk } });
        Object.assign(merged, res);
      }
      return merged;
    },
  });

  return {
    lang,
    map: data ?? {},
    translate: (id: string, fallbackTitle: string, fallbackDesc?: string) => ({
      title: data?.[id]?.title || fallbackTitle,
      description: data?.[id]?.description || fallbackDesc || "",
    }),
  };
}
