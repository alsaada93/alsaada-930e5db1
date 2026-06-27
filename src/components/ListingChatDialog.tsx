import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ListingChatDialog({
  open,
  onClose,
  listingId,
  listingTitle,
  sellerId,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId?: string | null;
}) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const canOpen = useMemo(() => {
    if (!user) return false;
    if (sellerId && user.id === sellerId && !isAdmin) return false;
    return true;
  }, [user, sellerId, isAdmin]);

  useEffect(() => {
    if (!open) return;
    if (!user) {
      toast.info(ar ? "سجّل الدخول لاستخدام الدردشة" : "Log in to use chat");
      onClose();
      navigate({ to: "/login" });
      return;
    }
    if (!canOpen) {
      toast.info(ar ? "لا يمكنك مراسلة إعلانك" : "You cannot message your own listing");
      onClose();
      return;
    }

    let active = true;
    setLoading(true);
    (async () => {
      const db = supabase as any;
      let { data: conv, error } = await db
        .from("listing_conversations")
        .select("id,listing_id,buyer_id,seller_id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error(ar ? "تعذّر فتح المحادثة" : "Couldn't open chat");
        if (active) setLoading(false);
        return;
      }

      if (!conv) {
        const created = await db
          .from("listing_conversations")
          .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId ?? null })
          .select("id,listing_id,buyer_id,seller_id")
          .single();
        conv = created.data;
        error = created.error;
      }

      if (error || !conv) {
        toast.error(ar ? "تعذّر إنشاء المحادثة" : "Couldn't start chat");
        if (active) setLoading(false);
        return;
      }

      const { data: rows } = await db
        .from("listing_messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (!active) return;
      setConversation(conv as Conversation);
      setMessages((rows as ChatMessage[]) ?? []);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [open, user, canOpen, listingId, sellerId, ar, navigate, onClose]);

  useEffect(() => {
    if (!conversation?.id) return;
    const channel = supabase
      .channel(`listing-chat-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listing_messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  if (!open) return null;

  const send = async () => {
    const text = body.trim();
    if (!text || !conversation || !user) return;
    setSending(true);
    setBody("");
    const db = supabase as any;
    const { error } = await db.from("listing_messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      body: text,
    });
    setSending(false);
    if (error) {
      setBody(text);
      toast.error(ar ? "تعذّر إرسال الرسالة" : "Couldn't send message");
      return;
    }

    const recipientId = conversation.seller_id && conversation.seller_id !== user.id ? conversation.seller_id : null;
    if (recipientId) {
      await db.from("notifications").insert({
        recipient_id: recipientId,
        listing_id: listingId,
        type: "contact",
        message: `رسالة جديدة على إعلان "${listingTitle}": ${text.slice(0, 120)}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:h-[680px] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={ar ? "إغلاق" : "Close"}>
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-right">
            <h2 className="truncate font-extrabold">{ar ? "دردشة الإعلان" : "Listing chat"}</h2>
            <p className="truncate text-xs font-semibold text-muted-foreground">{listingTitle}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
            <MessageCircle className="h-5 w-5" />
          </span>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30 px-3 py-4">
          {loading ? (
            <div className="grid h-full place-items-center text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm font-semibold text-muted-foreground">
              {ar ? "اكتب رسالتك الأولى للمعلن داخل الموقع." : "Send your first message to the seller in-app."}
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${mine ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground shadow-sm"}`}>
                      <p className="whitespace-pre-line break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString(ar ? "ar-BH" : "en", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card p-3">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={send}
              disabled={sending || !body.trim() || loading}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              aria-label={ar ? "إرسال" : "Send"}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 1200))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={ar ? "اكتب رسالتك هنا..." : "Write your message..."}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}