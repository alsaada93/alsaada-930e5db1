CREATE TABLE public.listing_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_conversations_no_self_chat CHECK (seller_id IS NULL OR buyer_id <> seller_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_conversations TO authenticated;
GRANT ALL ON public.listing_conversations TO service_role;

ALTER TABLE public.listing_conversations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX listing_conversations_listing_buyer_seller_idx
  ON public.listing_conversations (listing_id, buyer_id, COALESCE(seller_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX listing_conversations_buyer_idx ON public.listing_conversations (buyer_id, last_message_at DESC);
CREATE INDEX listing_conversations_seller_idx ON public.listing_conversations (seller_id, last_message_at DESC);
CREATE INDEX listing_conversations_listing_idx ON public.listing_conversations (listing_id);

CREATE POLICY "Members can view their listing conversations"
ON public.listing_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Members can start listing conversations"
ON public.listing_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_conversations.listing_id
      AND l.status = 'approved'
      AND (l.user_id IS NULL OR l.user_id = listing_conversations.seller_id)
  )
);

CREATE POLICY "Participants can update their conversations"
ON public.listing_conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Participants can delete their conversations"
ON public.listing_conversations
FOR DELETE
TO authenticated
USING (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE TABLE public.listing_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.listing_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 1200),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_messages TO authenticated;
GRANT ALL ON public.listing_messages TO service_role;

ALTER TABLE public.listing_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX listing_messages_conversation_idx ON public.listing_messages (conversation_id, created_at ASC);
CREATE INDEX listing_messages_sender_idx ON public.listing_messages (sender_id);

CREATE POLICY "Participants can view listing messages"
ON public.listing_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listing_conversations c
    WHERE c.id = listing_messages.conversation_id
      AND (
        auth.uid() = c.buyer_id
        OR auth.uid() = c.seller_id
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

CREATE POLICY "Participants can send listing messages"
ON public.listing_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.listing_conversations c
    WHERE c.id = listing_messages.conversation_id
      AND (
        auth.uid() = c.buyer_id
        OR auth.uid() = c.seller_id
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

CREATE POLICY "Participants can mark listing messages read"
ON public.listing_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listing_conversations c
    WHERE c.id = listing_messages.conversation_id
      AND (
        auth.uid() = c.buyer_id
        OR auth.uid() = c.seller_id
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listing_conversations c
    WHERE c.id = listing_messages.conversation_id
      AND (
        auth.uid() = c.buyer_id
        OR auth.uid() = c.seller_id
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

CREATE OR REPLACE FUNCTION public.touch_listing_conversation_from_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listing_conversations
  SET last_message = NEW.body,
      last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_listing_conversation_after_message
AFTER INSERT ON public.listing_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_listing_conversation_from_message();

CREATE TRIGGER update_listing_conversations_updated_at
BEFORE UPDATE ON public.listing_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_messages;