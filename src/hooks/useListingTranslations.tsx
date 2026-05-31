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
    queryFn: () =>
      run({
        data: {
          lang,
          items: items.map((i) => ({
            id: i.id,
            title: i.title ?? "",
            description: i.description ?? "",
          })),
        },
      }),
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
