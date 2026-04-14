-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their companies." ON public.company_members;

-- Create a helper function that avoids RLS loops by running as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_member_of(company_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.company_members cm 
    WHERE cm.company_id = $1 
    AND cm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy using the helper function
CREATE POLICY "Users can view members of their companies."
  ON public.company_members FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_member_of(company_id)
  );

-- Also fix any other possible recursion if they try to read their own rows
-- Wait, the above policy allows viewing if you are the user or if you are in the company.
