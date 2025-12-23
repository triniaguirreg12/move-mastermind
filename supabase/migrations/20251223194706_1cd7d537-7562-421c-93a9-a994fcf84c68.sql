-- Add missing columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'mercado_pago';

-- Add constraint to ensure only valid providers
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_provider_check 
CHECK (provider IN ('paypal', 'mercado_pago'));

-- Create unique partial index to ensure only one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user 
ON public.subscriptions (user_id) 
WHERE status = 'activa';

-- Create function to check if subscription is valid for access
CREATE OR REPLACE FUNCTION public.has_valid_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('activa', 'cancelada')
      AND end_date >= now()
  )
$$;

-- Create function to expire subscriptions that have passed their end_date
CREATE OR REPLACE FUNCTION public.expire_old_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'vencida', updated_at = now()
  WHERE status = 'activa'
    AND auto_renew = false
    AND end_date < now();
END;
$$;

-- Create function to handle subscription renewal
CREATE OR REPLACE FUNCTION public.renew_subscription(_user_id uuid)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions;
  months_to_add integer;
BEGIN
  -- Get current subscription
  SELECT * INTO sub
  FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('activa', 'pago_fallido')
  ORDER BY created_at DESC
  LIMIT 1;

  IF sub IS NULL THEN
    RAISE EXCEPTION 'No active or past_due subscription found';
  END IF;

  -- Determine months to add based on plan
  months_to_add := CASE sub.plan
    WHEN 'globo' THEN 1
    WHEN 'volea' THEN 3
    WHEN 'bandeja' THEN 6
    WHEN 'smash' THEN 12
    ELSE 1
  END;

  -- Update subscription
  UPDATE public.subscriptions
  SET 
    status = 'activa',
    end_date = GREATEST(end_date, now()) + (months_to_add || ' months')::interval,
    updated_at = now()
  WHERE id = sub.id
  RETURNING * INTO sub;

  RETURN sub;
END;
$$;

-- Create function to cancel subscription (keeps access until end_date)
CREATE OR REPLACE FUNCTION public.cancel_subscription(_user_id uuid)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions;
BEGIN
  UPDATE public.subscriptions
  SET 
    auto_renew = false,
    updated_at = now()
  WHERE user_id = _user_id
    AND status = 'activa'
  RETURNING * INTO sub;

  RETURN sub;
END;
$$;

-- Create function to mark subscription as past_due (failed payment)
CREATE OR REPLACE FUNCTION public.mark_subscription_past_due(_user_id uuid)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions;
BEGIN
  UPDATE public.subscriptions
  SET 
    status = 'pago_fallido',
    updated_at = now()
  WHERE user_id = _user_id
    AND status = 'activa'
  RETURNING * INTO sub;

  RETURN sub;
END;
$$;