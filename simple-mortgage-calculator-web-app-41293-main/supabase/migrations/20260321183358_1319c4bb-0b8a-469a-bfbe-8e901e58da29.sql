DROP POLICY "Users can insert their own subscription" ON public.subscriptions;

CREATE POLICY "Users can insert their own free subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tier = 'free'
    AND status = 'active'
  );