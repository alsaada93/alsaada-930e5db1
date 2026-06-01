-- Notifications: keep guest contact working, block arbitrary spam
DROP POLICY IF EXISTS "Anyone can create a notification" ON public.notifications;
CREATE POLICY "Notify real listing owners only"
ON public.notifications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  type IN ('contact', 'offer')
  AND listing_id IS NOT NULL
  AND recipient_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = notifications.listing_id
      AND l.user_id = notifications.recipient_id
  )
);

-- Price offers: keep guest offers working, block impersonation & junk
DROP POLICY IF EXISTS "Anyone can send an offer" ON public.price_offers;
CREATE POLICY "Send offers on real listings only"
ON public.price_offers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  amount > 0
  AND (sender_id IS NULL OR sender_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = price_offers.listing_id
      AND l.user_id = price_offers.recipient_id
  )
);
