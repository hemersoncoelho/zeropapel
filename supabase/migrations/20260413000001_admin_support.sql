-- Add plan and support columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS support_mode_user_id UUID REFERENCES auth.users(id);

-- Create a platform_admins table to define who is a super-admin
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can see the table (to discover if they are admin)
CREATE POLICY "Admins can view platform_admins."
  ON public.platform_admins FOR SELECT
  USING (user_id = auth.uid());

-- Allow platform admins to view ALL companies (bypassing existing per-member RLS)
CREATE POLICY "Platform admins can view all companies."
  ON public.companies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Allow platform admins to update companies (support mode, plan changes)
CREATE POLICY "Platform admins can update companies."
  ON public.companies FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Allow platform admins to view all company_members
CREATE POLICY "Platform admins can view all company_members."
  ON public.company_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );
