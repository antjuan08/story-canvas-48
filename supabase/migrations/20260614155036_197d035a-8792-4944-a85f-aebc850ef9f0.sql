
-- 1) Lock down profiles SELECT to own row
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2) Safe helper exposing only public display fields (no email)
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE (id uuid, full_name text, avatar_url text, title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.title
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- 3) Storage: owner-only download policy for recordings bucket
CREATE POLICY "Users read own recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
