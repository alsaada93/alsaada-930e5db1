-- Remove broad table-level read access; webhook_secret must never be client-readable.
REVOKE SELECT ON public.facebook_sync_meta FROM authenticated;

-- Allow reading only the non-sensitive status columns from the client.
GRANT SELECT (id, last_sync_at, api_status, created_at, updated_at)
  ON public.facebook_sync_meta TO authenticated;
