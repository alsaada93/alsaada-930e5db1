import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useLanguage } from "@/hooks/useLanguage";

/** تخطيط موحّد لصفحات المحتوى أسفل الموقع (من نحن، البيع، الأسئلة...) */
export function InfoLayout({
  title,
  subtitle,
  children,
}: {
  title: { ar: string; en: string };
  subtitle?: { ar: string; en: string };
  children: ReactNode;
}) {
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold">{lang === "ar" ? title.ar : title.en}</h1>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">{lang === "ar" ? subtitle.ar : subtitle.en}</p>
          )}
        </header>
        <div className="space-y-6 leading-relaxed text-foreground/90">{children}</div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export function InfoSection({
  heading,
  children,
}: {
  heading?: { ar: string; en: string };
  children: ReactNode;
}) {
  const { lang } = useLanguage();
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      {heading && (
        <h2 className="mb-3 text-xl font-bold text-primary">
          {lang === "ar" ? heading.ar : heading.en}
        </h2>
      )}
      <div className="space-y-2">{children}</div>
    </section>
  );
}
