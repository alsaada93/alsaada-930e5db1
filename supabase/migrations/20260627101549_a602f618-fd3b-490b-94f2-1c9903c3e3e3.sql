DROP POLICY IF EXISTS "Participants can update their conversations" ON public.listing_conversations;
DROP POLICY IF EXISTS "Participants can mark listing messages read" ON public.listing_messages;
REVOKE UPDATE ON public.listing_conversations FROM authenticated;
REVOKE UPDATE ON public.listing_messages FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_listing_conversation_from_message() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_listing_conversation_from_message() TO service_role;