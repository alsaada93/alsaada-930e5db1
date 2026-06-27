import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string | null;
  last_message: string | null;
  last_message_at: string;
};

type ListingMini = {
  id: string;
  title: string;
  images: string[] | null;
  contact_name: string | null;
  user_id: string | null;
  source: string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ListingInbox() {
  const { user, isAdmin } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listings, setListings] = useState<Record<string, ListingMini>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      const db = supabase as any;
      const { data: rows, error } = await db
        .from("listing_conversations")
        .select("id,listing_id,buyer_id,seller_id,last_message,last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(80);
      if (!active) return;
      if (error) {
        toast.error("تعذّر تحميل الدردشات");
        setLoading(false);
        return;
      }
      const convs = ((rows as Conversation[]) ?? []).filter(
        (c) => isAdmin || c.buyer_id === user.id || c.seller_id === user.id,
      );
      setConversations(convs);
      setSelectedId((prev) => prev ?? convs[0]?.id ?? null);

      const ids = [...new Set(convs.map((c) => c.listing_id))];
      if (ids.length) {
        const { data: listingRows } = await db
          .from("listings")
          .select("id,title,images,contact_name,user_id,source")
          .in("id", ids);
        if (active) {
          const map = Object.fromEntries(((listingRows as ListingMini[]) ?? []).map((l) => [l.id, l]));
          setListings(map);
        }
      } else {
        setListings({});
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }
    let active = true;
    setLoadingMessages(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("listing_messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .eq("conversation_id", selected.id)
        .order("created_at", { ascending: true });
      if (!active) return;
      setMessages((data as ChatMessage[]) ?? []);
      setLoadingMessages(false);
    })();

    const channel = supabase
      .channel(`account-chat-${selected.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listing_messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selected?.id]);

  const send = async () => {
    const text = body.trim();
    if (!text || !selected || !user) return;
    setSending(true);
    setBody("");
    const { error } = await (supabase as any).from("listing_messages").insert({
      conversation_id: selected.id,
      sender_id: user.id,
      body: text,
    });
    setSending(false);
    if (error) {
      setBody(text);
      toast.error("تعذّر إرسال الرسالة");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-56 place-items-center text-primary">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!conversations.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">لا توجد دردشات حتى الآن.</p>;
  }

  const activeConversation = selected ?? conversations[0];

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-[280px_1fr]">
      <div className="max-h-[520px] overflow-y-auto border-b border-border md:border-b-0 md:border-e">
        {conversations.map((c) => {
          const l = listings[c.listing_id];
          const active = selected?.id === c.id;
          const isWebhook = !c.seller_id || l?.source === "facebook";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full items-center gap-3 border-b border-border p-3 text-right hover:bg-muted ${active ? "bg-muted" : ""}`}
            >
              <img src={l?.images?.[0] ?? "/placeholder.svg"} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{l?.title ?? "إعلان"}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{c.last_message || "محادثة جديدة"}</span>
                {isWebhook && <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">ويبهوك / إدارة</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[520px] flex-col">
        <div className="flex items-center justify-between border-b border-border p-3">
          <Link to="/listing/$id" params={{ id: activeConversation.listing_id }} className="text-sm font-bold text-primary hover:underline">
            فتح الإعلان
          </Link>
          <div className="min-w-0 text-right">
            <h3 className="truncate font-extrabold">{listings[activeConversation.listing_id]?.title ?? "إعلان"}</h3>
            <p className="text-xs text-muted-foreground">دردشة داخل الموقع</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-3">
          {loadingMessages ? (
            <div className="grid h-full place-items-center text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground shadow-sm"}`}>
                      <p className="whitespace-pre-line break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleString("ar-BH", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <button type="button" onClick={send} disabled={sending || !body.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 1200))}
              placeholder="اكتب ردك هنا..."
              rows={1}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}