import { MessageCircle } from "lucide-react";

const PHONE = "36818153";

/** Fixed WhatsApp contact button at the bottom-right of the screen. */
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/973${PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp ${PHONE}`}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-bold text-white shadow-glow transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline">واتساب {PHONE}</span>
    </a>
  );
}
