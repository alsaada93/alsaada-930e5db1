CREATE TABLE public.listing_deletions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  other_site TEXT,
  listing_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.listing_deletions TO authenticated;
GRANT ALL ON public.listing_deletions TO service_role;

ALTER TABLE public.listing_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their own deletions"
ON public.listing_deletions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners and admins can view deletions"
ON public.listing_deletions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));