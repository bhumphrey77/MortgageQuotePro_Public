
-- Email usage: remove client INSERT; only service_role (edge function) can write
DROP POLICY IF EXISTS "Users can insert their own email usage" ON public.email_usage;
REVOKE INSERT ON public.email_usage FROM authenticated, anon;

-- Leads: remove unvalidated anonymous insert path
DROP POLICY IF EXISTS "Allow anonymous lead capture" ON public.leads;
REVOKE INSERT ON public.leads FROM anon;
