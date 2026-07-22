-- Enrich brands table with logo and description, clean stray quotes in names
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS equipment_type TEXT;

-- Clean stray leading/trailing double-quotes that leaked in during import
UPDATE public.brands
SET name = regexp_replace(name, '^"+|"+$', '', 'g')
WHERE name ~ '"';

-- Deduplicate rows created by the quote cleanup (keep the earliest per name+category)
DELETE FROM public.brands b
USING public.brands b2
WHERE b.name = b2.name
  AND b.category_id = b2.category_id
  AND b.id > b2.id;

-- Seed a logo URL for every brand (Clearbit logo service, falls back on the client to
-- Google's favicon service and finally to text initials when no image resolves)
UPDATE public.brands
SET logo_url = 'https://logo.clearbit.com/' || regexp_replace(lower(name), '[^a-z0-9]+', '', 'g') || '.com'
WHERE logo_url IS NULL
  AND length(regexp_replace(lower(name), '[^a-z0-9]+', '', 'g')) > 1;
