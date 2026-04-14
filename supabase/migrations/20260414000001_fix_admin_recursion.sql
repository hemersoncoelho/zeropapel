-- Drop the self-referential policy that causes infinite recursion
DROP POLICY IF EXISTS "Platform admins can view all platform_admins." ON public.platform_admins;

-- The original policy from 20260413000001 is sufficient to know if someone is an admin:
-- CREATE POLICY "Admins can view platform_admins." ON public.platform_admins FOR SELECT USING (user_id = auth.uid());
