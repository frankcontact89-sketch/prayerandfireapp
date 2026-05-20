CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('prayer_request','testimony','contact')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit"
ON public.submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view submissions"
ON public.submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
ON public.submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete submissions"
ON public.submissions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_submissions_type_created ON public.submissions (type, created_at DESC);