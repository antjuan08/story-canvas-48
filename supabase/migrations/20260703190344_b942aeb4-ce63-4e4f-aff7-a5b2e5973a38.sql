
REVOKE EXECUTE ON FUNCTION public.increment_reimagine_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_reimagine_credit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_usage(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_tier_limit(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.increment_reimagine_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_reimagine_credit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_usage(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_tier_limit(text) TO authenticated, service_role;
