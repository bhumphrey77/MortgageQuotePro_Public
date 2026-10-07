-- Create audit log table for admin profile access
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only owners can view audit logs (not regular admins - separation of duties)
CREATE POLICY "Only owners can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- Admins and owners can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (public.is_owner_or_admin(auth.uid()));

-- Create index for common queries
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.admin_audit_log IS 'Tracks admin access to sensitive user data for security accountability';