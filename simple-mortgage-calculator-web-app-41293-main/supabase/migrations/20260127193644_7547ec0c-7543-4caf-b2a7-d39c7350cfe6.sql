-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.saved_quotes;

-- Create a new policy that explicitly requires authentication AND ownership
CREATE POLICY "Users can view their own quotes"
ON public.saved_quotes
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);