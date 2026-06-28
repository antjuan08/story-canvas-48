
-- Deduplicate any existing rows before adding the unique constraint
DELETE FROM public.credit_purchases a
USING public.credit_purchases b
WHERE a.ctid < b.ctid
  AND a.stripe_session_id = b.stripe_session_id;

ALTER TABLE public.credit_purchases
  ADD CONSTRAINT credit_purchases_stripe_session_id_key UNIQUE (stripe_session_id);

CREATE OR REPLACE FUNCTION public.increment_reimagine_credits(_user_id uuid, _delta int)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
  UPDATE public.profiles
     SET reimagine_credits = COALESCE(reimagine_credits, 0) + _delta,
         updated_at = now()
   WHERE id = _user_id
  RETURNING reimagine_credits INTO new_balance;
  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_reimagine_credit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
  UPDATE public.profiles
     SET reimagine_credits = reimagine_credits - 1,
         updated_at = now()
   WHERE id = _user_id
     AND COALESCE(reimagine_credits, 0) > 0
  RETURNING reimagine_credits INTO new_balance;
  RETURN new_balance; -- NULL means no credit was available
END;
$$;

REVOKE ALL ON FUNCTION public.increment_reimagine_credits(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_reimagine_credit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_reimagine_credits(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_reimagine_credit(uuid) TO service_role;
