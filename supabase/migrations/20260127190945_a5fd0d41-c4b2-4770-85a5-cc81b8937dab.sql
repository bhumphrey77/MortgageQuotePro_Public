-- Create a secure function to lookup loan officer by slug
-- This returns only the loan_officer_id without exposing the full table
CREATE OR REPLACE FUNCTION public.get_loan_officer_id_by_slug(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.loan_officer_slugs
  WHERE slug = p_slug
  LIMIT 1;
$$;

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view slugs for lookup" ON public.loan_officer_slugs;

-- Create a new policy that only allows checking if a slug exists (via the function)
-- But doesn't allow direct table SELECT that exposes user_id
CREATE POLICY "Users can view their own slug only"
ON public.loan_officer_slugs
FOR SELECT
USING (auth.uid() = user_id);