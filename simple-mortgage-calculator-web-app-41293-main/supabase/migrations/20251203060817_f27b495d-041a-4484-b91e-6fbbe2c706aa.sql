-- Allow owners/admins to view all profiles
CREATE POLICY "Owners and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.is_owner_or_admin(auth.uid()));

-- Allow owners/admins to view all subscriptions
CREATE POLICY "Owners and admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated 
USING (public.is_owner_or_admin(auth.uid()));

-- Allow owners/admins to update subscriptions (for managing tiers)
CREATE POLICY "Owners and admins can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated 
USING (public.is_owner_or_admin(auth.uid()));

-- Allow owners/admins to view all user roles
CREATE POLICY "Owners and admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (public.is_owner_or_admin(auth.uid()));

-- Allow owners/admins to insert user roles
CREATE POLICY "Owners and admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_owner_or_admin(auth.uid()));

-- Allow owners/admins to delete user roles (but not their own owner role)
CREATE POLICY "Owners and admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated 
USING (public.is_owner_or_admin(auth.uid()) AND NOT (user_id = auth.uid() AND role = 'owner'));