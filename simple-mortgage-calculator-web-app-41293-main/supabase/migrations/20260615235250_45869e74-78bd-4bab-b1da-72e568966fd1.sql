
-- 1. Remove client INSERT on subscriptions (trigger handles initial row)
DROP POLICY IF EXISTS "Users can insert their own free subscription" ON public.subscriptions;
REVOKE INSERT ON public.subscriptions FROM authenticated, anon;

-- 2. Remove client INSERT on admin_audit_log; route writes via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
REVOKE INSERT ON public.admin_audit_log FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_target_table text DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_owner_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_user_id, action, target_table, target_user_id, details, user_agent
  ) VALUES (
    auth.uid(), p_action, p_target_table, p_target_user_id, p_details, p_user_agent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb, text) TO authenticated;
