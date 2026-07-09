UPDATE public.site_settings
SET value = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = '0f9ea3d0-c9bd-4e9f-9e70-c082f4f3e2cd'
      THEN jsonb_set(elem, '{image}', '"/__l5e/assets-v1/81612644-eeea-4330-98a8-ee3f177ac7d7/cat-general.jpg"')
      ELSE elem END
  )
  FROM jsonb_array_elements(value) elem
)
WHERE key = 'categories';