-- Fix 1: Remove anonymous INSERT policy on lead_activities (allowed any anon to inject activities against any lead)
DROP POLICY IF EXISTS "Allow anonymous activity logging" ON public.lead_activities;

-- Fix 2: Harden user_roles INSERT to explicitly prevent privilege escalation.
-- Replace existing INSERT policy with one that additionally requires owner role for granting owner/admin.
DROP POLICY IF EXISTS "Owners and admins can insert user roles" ON public.user_roles;

CREATE POLICY "Owners and admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_owner_or_admin(auth.uid())
  AND (
    role = 'user'::app_role
    OR has_role(auth.uid(), 'owner'::app_role)
  )
);

-- Also block UPDATE explicitly (table currently has no UPDATE policy, but make sure)
-- (No-op safeguard: ensure no permissive UPDATE policy exists)
