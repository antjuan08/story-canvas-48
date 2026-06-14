
-- 1) Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_voice text,
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'storyteller',
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS subscription_interval text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS reimagine_credits integer NOT NULL DEFAULT 0;

-- 2) subscription_events
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription events" ON public.subscription_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscription events" ON public.subscription_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

-- 3) usage_counters (monthly period)
CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  keynotes_count integer NOT NULL DEFAULT 0,
  podcasts_count integer NOT NULL DEFAULT 0,
  books_count integer NOT NULL DEFAULT 0,
  reimagines_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start)
);
GRANT SELECT, INSERT, UPDATE ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own usage" ON public.usage_counters
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all usage" ON public.usage_counters
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

-- 4) profile_assets (brand voice uploads)
DO $$ BEGIN
  CREATE TYPE public.asset_kind AS ENUM ('image','video','audio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profile_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.asset_kind NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_assets TO authenticated;
GRANT ALL ON public.profile_assets TO service_role;
ALTER TABLE public.profile_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile assets" ON public.profile_assets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all profile assets" ON public.profile_assets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

-- 5) credit_purchases
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack text NOT NULL,
  credits integer NOT NULL,
  amount_cents integer NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO service_role;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credit purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all credit purchases" ON public.credit_purchases
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support'));

-- 6) Updated handle_new_user trigger: seed trial + first usage counter
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, subscription_tier, subscription_status, trial_ends_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      'storyteller',
      'trialing',
      now() + interval '7 days'
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.usage_counters (user_id, period_start)
    VALUES (NEW.id, date_trunc('month', now())::date)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$function$;

-- Make sure the auth trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Tier limit checker
CREATE OR REPLACE FUNCTION public.check_tier_limit(_kind text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  tier text;
  status text;
  trial_end timestamptz;
  period date := date_trunc('month', now())::date;
  used int := 0;
  cap int;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;

  SELECT subscription_tier, subscription_status, trial_ends_at
    INTO tier, status, trial_end
    FROM public.profiles WHERE id = uid;

  -- Trial expired with no active sub → block create actions
  IF status = 'trialing' AND trial_end IS NOT NULL AND trial_end < now() THEN
    RETURN false;
  END IF;
  IF status NOT IN ('trialing','active','past_due') THEN
    RETURN false;
  END IF;

  SELECT
    CASE _kind
      WHEN 'keynote'   THEN keynotes_count
      WHEN 'podcast'   THEN podcasts_count
      WHEN 'book'      THEN books_count
      WHEN 'reimagine' THEN reimagines_count
      ELSE 0 END
    INTO used
    FROM public.usage_counters
    WHERE user_id = uid AND period_start = period;
  used := COALESCE(used, 0);

  -- Caps per tier
  cap := CASE
    WHEN _kind = 'keynote' AND tier = 'storyteller' THEN 3
    WHEN _kind = 'keynote' AND tier = 'pro'         THEN 10
    WHEN _kind = 'podcast' AND tier = 'storyteller' THEN 3
    WHEN _kind = 'book'    AND tier = 'storyteller' THEN 1
    WHEN _kind = 'reimagine' AND tier <> 'creator'  THEN 0  -- creator-only feature
    ELSE -1  -- -1 = unlimited
  END;

  IF cap = -1 THEN RETURN true; END IF;
  RETURN used < cap;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_tier_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_tier_limit(text) TO authenticated;

-- 8) Increment usage helper (called from edge functions/wizards after a successful build)
CREATE OR REPLACE FUNCTION public.increment_usage(_kind text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  period date := date_trunc('month', now())::date;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.usage_counters (user_id, period_start)
    VALUES (uid, period)
    ON CONFLICT (user_id, period_start) DO NOTHING;
  UPDATE public.usage_counters SET
    keynotes_count   = keynotes_count   + CASE WHEN _kind='keynote'   THEN 1 ELSE 0 END,
    podcasts_count   = podcasts_count   + CASE WHEN _kind='podcast'   THEN 1 ELSE 0 END,
    books_count      = books_count      + CASE WHEN _kind='book'      THEN 1 ELSE 0 END,
    reimagines_count = reimagines_count + CASE WHEN _kind='reimagine' THEN 1 ELSE 0 END,
    updated_at = now()
   WHERE user_id = uid AND period_start = period;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_usage(text) TO authenticated;
