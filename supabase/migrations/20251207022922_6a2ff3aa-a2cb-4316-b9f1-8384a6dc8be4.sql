-- Add explicit restrictive policies to prevent UPDATE and DELETE on email_usage
-- This ensures the audit trail remains immutable even if permissive policies are accidentally added later

CREATE POLICY "No one can update email usage records"
ON public.email_usage
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No one can delete email usage records"
ON public.email_usage
FOR DELETE
TO authenticated
USING (false);