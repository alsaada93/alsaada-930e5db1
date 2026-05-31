export function Footer() {
  const cols = [
    { title: "سوقو", links: ["من نحن", "كيف تبيع", "كيف تشتري", "الباقات والأسعار"] },
    { title: "التصنيفات", links: ["معدات المطاعم", "الكوفي شوب", "الأثاث", "الإلكترونيات"] },
    { title: "المساعدة", links: ["الأسئلة الشائعة", "تواصل معنا", "الإبلاغ عن إعلان", "مركز الدعم"] },
    { title: "قانوني", links: ["سياسة الخصوصية", "الشروط والأحكام", "سياسة المزادات"] },
  ];
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="text-xl font-extrabold">
            SOOGO <span className="text-primary">| سوقو</span>
          </div>
          <p className="mt-2 text-sm text-navy-foreground/60">
            سوق معدات المطاعم والأثاث والإلكترونيات في البحرين والخليج.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 font-bold">{c.title}</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="transition-colors hover:text-primary">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-navy-foreground/50">
        © {new Date().getFullYear()} سوقو SOOGO — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
