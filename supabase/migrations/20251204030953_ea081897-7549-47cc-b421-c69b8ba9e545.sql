-- Add missing profile fields for Pre-Approval Letter PDF
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS work_email text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS nmls_company text,
ADD COLUMN IF NOT EXISTS state_license_text text;