-- ══════════════════════════════════════════════════════
-- Migration: Fix platform_admin RLS and add Create/Insert policies
-- ══════════════════════════════════════════════════════

-- 1. Allow platform admins to read ALL profiles (needed for member joins)
CREATE POLICY "Platform admins can view all profiles."
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 2. Allow platform admins to INSERT new profiles (when creating users)
CREATE POLICY "Platform admins can insert profiles."
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 3. Allow platform admins to INSERT new companies
CREATE POLICY "Platform admins can insert companies."
  ON public.companies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 4. Allow platform admins to INSERT into company_members (add users to companies)
CREATE POLICY "Platform admins can insert company_members."
  ON public.company_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 5. Allow platform admins to DELETE company_members (remove users from companies)
CREATE POLICY "Platform admins can delete company_members."
  ON public.company_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 6. Allow platform admins to UPDATE company_members (change roles)
CREATE POLICY "Platform admins can update company_members."
  ON public.company_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 7. Make platform_admins themselves readable by platform admins
-- (so they can list other admins)
CREATE POLICY "Platform admins can view all platform_admins."
  ON public.platform_admins FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM public.platform_admins pa2 WHERE pa2.user_id = auth.uid())
  );
