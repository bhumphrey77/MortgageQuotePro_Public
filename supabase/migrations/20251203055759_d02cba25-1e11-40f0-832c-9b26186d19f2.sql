-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');

-- Create secure roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS (restrictive - only service role can insert/update/delete)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only allow SELECT for authenticated users to check their own role
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- Assign owner role to your account
INSERT INTO public.user_roles (user_id, role)
VALUES ('53af16fa-e249-4de9-a15c-81b85439dc25', 'owner');

-- Drop the unsafe UPDATE policy on subscriptions
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;