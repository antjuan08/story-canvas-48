
CREATE TABLE public.keynotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  audience TEXT,
  core_message TEXT,
  tone TEXT,
  length TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  story_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keynotes TO authenticated;
GRANT ALL ON public.keynotes TO service_role;
ALTER TABLE public.keynotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keynotes" ON public.keynotes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER keynotes_updated_at BEFORE UPDATE ON public.keynotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  show_name TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  topic TEXT,
  format TEXT,
  length TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  story_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.podcasts TO authenticated;
GRANT ALL ON public.podcasts TO service_role;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own podcasts" ON public.podcasts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER podcasts_updated_at BEFORE UPDATE ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reimagined_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_story_id UUID,
  angle TEXT,
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimagined_stories TO authenticated;
GRANT ALL ON public.reimagined_stories TO service_role;
ALTER TABLE public.reimagined_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reimagined" ON public.reimagined_stories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
