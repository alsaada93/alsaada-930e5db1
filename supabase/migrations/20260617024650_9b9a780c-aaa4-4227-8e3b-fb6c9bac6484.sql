-- Allow imported (Facebook) ads to live in the main listings feed with dedup support
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS source_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS listings_source_ref_idx
  ON public.listings (source, source_ref)
  WHERE source IS NOT NULL;