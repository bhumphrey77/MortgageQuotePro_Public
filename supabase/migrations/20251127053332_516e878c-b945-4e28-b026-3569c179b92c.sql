-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'professional', 'business');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

-- Create trigger to create subscription when user signs up
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Create security definer function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier
  FROM public.subscriptions
  WHERE subscriptions.user_id = $1
  LIMIT 1;
$$;

-- Create security definer function to check if user has minimum tier
CREATE OR REPLACE FUNCTION public.has_tier_access(user_id UUID, required_tier subscription_tier)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN required_tier = 'free' THEN true
    WHEN required_tier = 'professional' THEN tier IN ('professional', 'business')
    WHEN required_tier = 'business' THEN tier = 'business'
    ELSE false
  END
  FROM public.subscriptions
  WHERE subscriptions.user_id = $1
  LIMIT 1;
$$;

-- Create security definer function to count user's saved quotes
CREATE OR REPLACE FUNCTION public.get_user_quote_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.saved_quotes
  WHERE saved_quotes.user_id = $1;
$$;

-- Update saved_quotes RLS policy to enforce free tier limit (3 quotes)
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.saved_quotes;

CREATE POLICY "Users can create their own quotes"
  ON public.saved_quotes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      public.has_tier_access(auth.uid(), 'professional'::subscription_tier)
      OR public.get_user_quote_count(auth.uid()) < 3
    )
  );