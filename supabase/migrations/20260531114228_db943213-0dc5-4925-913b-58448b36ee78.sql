
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
