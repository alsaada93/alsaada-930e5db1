import { Sparkles, ShieldCheck, MessageSquare, Smartphone } from "lucide-react";

const features = [
  { icon: Sparkles, title: "تسعير ذكي بالـ AI", desc: "اعرف السعر السوقي العادل والمدة المتوقعة للبيع فور إضافة الإعلان." },
  { icon: ShieldCheck, title: "حماية من الاحتيال", desc: "اكتشاف الإعلانات المكررة والصور المزيفة والحسابات غير الموثوقة." },
  { icon: MessageSquare, title: "تواصل مباشر", desc: "دردشة داخل الموقع وواتساب واتصال مباشر مع البائع." },
  { icon: Smartphone, title: "تطبيق PWA", desc: "تجربة سريعة على الجوال مع إشعارات فورية ودعم العربية والإنجليزية." },
];

export function FeatureStrip() {
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
