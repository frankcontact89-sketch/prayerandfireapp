
-- Restrict profile visibility (hide emails from public)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Safe lookup for the "Forgot username" flow without exposing emails publicly
CREATE OR REPLACE FUNCTION public.get_username_by_email(_email text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.profiles WHERE email = _email LIMIT 1;
$$;

-- Admin access to purchases for fulfillment/reporting
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
