-- Sellers table: public marketplace seller profiles with ratings
CREATE TABLE public.sellers (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  deals_count INTEGER NOT NULL DEFAULT 0,
  city TEXT,
  member_since TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sellers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers are viewable by everyone"
ON public.sellers FOR SELECT
USING (true);

-- Seller reviews table: individual ratings left for sellers
CREATE TABLE public.seller_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seller_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_reviews TO authenticated;
GRANT ALL ON public.seller_reviews TO service_role;

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
ON public.seller_reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can leave reviews"
ON public.seller_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON public.seller_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.seller_reviews FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_id);

-- Validate rating range via trigger (avoid immutable CHECK issues)
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_seller_review_rating
BEFORE INSERT OR UPDATE ON public.seller_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Timestamp trigger for sellers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();