-- Add new profile fields for company information
ALTER TABLE profiles
ADD COLUMN nmls_license text,
ADD COLUMN company_address text,
ADD COLUMN website text;