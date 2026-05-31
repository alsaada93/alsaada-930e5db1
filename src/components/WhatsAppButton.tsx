import { MessageCircle } from "lucide-react";

// Bottom-of-page contact number (general inquiries).
const PHONE = "33982383";

/** Fixed WhatsApp logo button at the bottom-right of the screen (no number shown). */
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/973${PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow transition-transform hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
