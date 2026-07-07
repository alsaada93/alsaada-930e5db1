import { MessageCircle, Facebook, Instagram, Send, Twitter, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { isNativePlatform } from "@/lib/capacitor";

/**
 * أزرار المشاركة لأشهر منصات التواصل في البحرين:
 * واتساب، فيسبوك، إنستقرام، إكس (تويتر)، تيليجرام + نسخ الرابط.
 */
export function ShareButtons({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const text = `${title} — ${url}`;
  const enc = encodeURIComponent;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(ar ? "تم نسخ الرابط" : "Link copied");
    } catch {
      toast.error(ar ? "تعذّر نسخ الرابط" : "Couldn't copy link");
    }
  };

  const openInstagram = async () => {
    await copyLink();
    toast.info(ar ? "تم نسخ الرابط — الصقه في إنستقرام" : "Link copied — paste it on Instagram");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title,
        text,
        url,
        dialogTitle: ar ? "مشاركة الإعلان" : "Share listing",
      });
    } catch {
      // User cancelled or share sheet failed — fall back to copy.
      await copyLink();
    }
  };

  type Platform = {
    key: string;
    label: string;
    icon: typeof MessageCircle;
    color: string;
    href?: string;
    onClick?: () => void;
  };

  const platforms: Platform[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      color: "#25D366",
      href: `https://wa.me/?text=${enc(text)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "#E1306C",
      onClick: openInstagram,
    },
    {
      key: "x",
      label: "X",
      icon: Twitter,
      color: "#000000",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: Send,
      color: "#229ED9",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
    },
  ];

  const size = compact ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && (
        <span className="text-sm font-bold text-foreground">{ar ? "مشاركة:" : "Share:"}</span>
      )}
      {platforms.map((p) =>
        p.onClick ? (
          <button
            key={p.key}
            type="button"
            onClick={p.onClick}
            aria-label={p.label}
            title={p.label}
            className={`flex ${size} items-center justify-center rounded-full text-white transition-transform hover:scale-110`}
            style={{ backgroundColor: p.color }}
          >
            <p.icon className="h-4 w-4" />
          </button>
        ) : (
          <a
            key={p.key}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            title={p.label}
            className={`flex ${size} items-center justify-center rounded-full text-white transition-transform hover:scale-110`}
            style={{ backgroundColor: p.color }}
          >
            <p.icon className="h-4 w-4" />
          </a>
        ),
      )}
      {isNativePlatform() && (
        <button
          type="button"
          onClick={nativeShare}
          aria-label={ar ? "مشاركة" : "Share"}
          title={ar ? "مشاركة" : "Share"}
          className={`flex ${size} items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110`}
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={copyLink}
        aria-label={ar ? "نسخ الرابط" : "Copy link"}
        title={ar ? "نسخ الرابط" : "Copy link"}
        className={`flex ${size} items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:bg-accent`}
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}
