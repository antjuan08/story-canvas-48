DROP POLICY IF EXISTS "Authenticated can view community posts" ON public.community_posts;
CREATE POLICY "View community posts of public stories or own"
  ON public.community_posts FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = community_posts.story_id AND s.is_public = true
    )
  );

DROP POLICY IF EXISTS "Admins and support view all profiles" ON public.profiles;
CREATE POLICY "Admins and support view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

DROP POLICY IF EXISTS "Users manage own usage" ON public.usage_counters;
CREATE POLICY "Users view own usage"
  ON public.usage_counters FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.usage_counters FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_tier_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;