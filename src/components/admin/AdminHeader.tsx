export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-border bg-card px-6 py-5">
      <h1 className="text-xl font-extrabold text-card-foreground md:text-2xl">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
