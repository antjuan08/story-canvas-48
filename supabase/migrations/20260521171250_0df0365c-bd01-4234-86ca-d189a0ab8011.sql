
-- =========================================================
-- Helper: updated_at trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  title text,
  bio text,
  avatar_url text,
  interests text[] DEFAULT '{}',
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
  EXCEPTION WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RETURN NEW;
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- FOLDERS  (created before stories/collections/etc that reference it)
-- =========================================================
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_folder_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  context text NOT NULL CHECK (context IN ('vault','stage','recordings')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own folders"
  ON public.folders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- STORIES
-- =========================================================
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  image_url text,
  audio_url text,
  video_url text,
  tags text[] DEFAULT '{}',
  category text,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  section text,
  grade text,
  is_public boolean NOT NULL DEFAULT false,
  is_licensable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own or public stories"
  ON public.stories FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users insert own stories"
  ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stories"
  ON public.stories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own stories"
  ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- COLLECTIONS
-- =========================================================
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  context text NOT NULL CHECK (context IN ('vault','stage')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections"
  ON public.collections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.collection_stories (
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, story_id)
);
ALTER TABLE public.collection_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collection_stories"
  ON public.collection_stories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

-- =========================================================
-- STORY COLLABORATORS
-- =========================================================
CREATE TABLE public.story_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perspective_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.story_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or collaborator can view"
  ON public.story_collaborators FOR SELECT TO authenticated
  USING (
    collaborator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Story owner manages collaborators"
  ON public.story_collaborators FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));
CREATE POLICY "Collaborator updates own perspective"
  ON public.story_collaborators FOR UPDATE TO authenticated
  USING (collaborator_id = auth.uid());

-- =========================================================
-- PRESENTATIONS
-- =========================================================
CREATE TABLE public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('sermon','keynote','podcast','book')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own presentations"
  ON public.presentations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.presentation_stories (
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (presentation_id, story_id)
);
ALTER TABLE public.presentation_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own presentation_stories"
  ON public.presentation_stories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentations p WHERE p.id = presentation_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.presentations p WHERE p.id = presentation_id AND p.user_id = auth.uid()));

-- =========================================================
-- RECORDINGS
-- =========================================================
CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_url text,
  video_url text,
  duration_seconds int,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  linked_story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  linked_presentation_id uuid REFERENCES public.presentations(id) ON DELETE SET NULL,
  analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recordings"
  ON public.recordings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- COMMUNITY POSTS
-- =========================================================
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view community posts"
  ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own community posts"
  ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own community posts"
  ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own community posts"
  ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- LICENSE REQUESTS
-- =========================================================
CREATE TABLE public.license_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.license_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requester or owner can view"
  ON public.license_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Requester inserts own request"
  ON public.license_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Owner updates request status"
  ON public.license_requests FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-avatars', 'profile-avatars', true),
  ('story-media', 'story-media', true),
  ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all three buckets
CREATE POLICY "Public read profile-avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');
CREATE POLICY "Public read story-media" ON storage.objects FOR SELECT
  USING (bucket_id = 'story-media');
CREATE POLICY "Public read recordings-bucket" ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings');

-- Authenticated users upload/update/delete inside their own user-id folder
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own story-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own story-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own story-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own recordings" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own recordings" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own recordings" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
