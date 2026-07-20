import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { landings } from "@/data/landings";

const URL = "https://www.alsaada.sale/l";

export const Route = createFileRoute("/l/")({
  head: () => ({
    meta: [
      { title: "أدلة البيع والشراء في البحرين — حراج السعادة" },
      {
        name: "description",
        content:
          "أدلة مختصرة ومركّزة لأشهر فئات البيع والشراء في البحرين: معدات مطاعم، أثاث، إلكترونيات، ماكينات قهوة، غرف تبريد وغيرها.",
      },
      { property: "og:title", content: "أدلة البيع والشراء في البحرين — حراج السعادة" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: LandingsHub,
});

function LandingsHub() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold">أدلة البيع والشراء في البحرين</h1>
          <p className="mt-2 text-muted-foreground">
            صفحات مركّزة لأشهر ما يبحث عنه المشترون والبائعون في البحرين — تنقّل مباشرة إلى القسم أو الصفقة التي تريد.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {landings.map((l) => (
            <Link
              key={l.slug}
              to="/l/$slug"
              params={{ slug: l.slug }}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <h2 className="mb-2 text-lg font-bold text-primary">{l.title}</h2>
              <p className="line-clamp-3 text-sm text-muted-foreground">{l.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
