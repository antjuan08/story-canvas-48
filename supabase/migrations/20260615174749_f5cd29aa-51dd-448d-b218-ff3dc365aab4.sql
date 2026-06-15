
CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role and postgres to update any field
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
     OR session_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  -- For all other roles, lock billing-sensitive fields to their OLD values
  NEW.subscription_tier      := OLD.subscription_tier;
  NEW.subscription_status    := OLD.subscription_status;
  NEW.trial_ends_at          := OLD.trial_ends_at;
  NEW.stripe_customer_id     := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.reimagine_credits      := OLD.reimagine_credits;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_billing_fields();
