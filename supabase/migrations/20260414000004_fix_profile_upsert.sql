-- Add UPDATE policy for platform_admins on profiles to allow UPSERT
CREATE POLICY "Platform admins can update profiles."
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );
