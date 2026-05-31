import { Sparkles, ShieldCheck, MessageSquare, Smartphone } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function FeatureStrip() {
  const { t } = useLanguage();
  const features = [
    { icon: Sparkles, title: t("feat.aiTitle"), desc: t("feat.aiDesc") },
    { icon: ShieldCheck, title: t("feat.fraudTitle"), desc: t("feat.fraudDesc") },
    { icon: MessageSquare, title: t("feat.chatTitle"), desc: t("feat.chatDesc") },
    { icon: Smartphone, title: t("feat.pwaTitle"), desc: t("feat.pwaDesc") },
  ];

  return (
    <section className="border-y border-border bg-accent/40">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
