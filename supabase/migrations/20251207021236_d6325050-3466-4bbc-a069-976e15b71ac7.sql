-- Drop and recreate the user-facing subscription policies to target authenticated role only
-- This ensures only authenticated users can access their subscription data

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;

-- Recreate with authenticated role restriction
CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);