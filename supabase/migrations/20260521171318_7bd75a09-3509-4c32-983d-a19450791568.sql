
-- Revoke execute on SECURITY DEFINER helper functions (they're only used by triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Drop broad SELECT policies on storage.objects for public buckets.
-- Public buckets serve files via public URL without needing an RLS SELECT policy.
DROP POLICY IF EXISTS "Public read profile-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read story-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read recordings-bucket" ON storage.objects;
