
-- 1) Remove support role from broad profiles SELECT access
DROP POLICY IF EXISTS "Admins and support view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Lock down trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
