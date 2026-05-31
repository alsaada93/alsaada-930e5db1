import { Search, Camera, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/hero.jpg";

export function Hero() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    toast.success("تم رفع الصورة", {
      description: `جارٍ البحث عن منتجات مشابهة لـ "${file.name}"...`,
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-navy-foreground">
      <img
        src={heroImg}
        alt="معدات المطاعم والأثاث والإلكترونيات"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-80" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30">
            <Sparkles className="h-3.5 w-3.5" /> مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            سوق معدات المطاعم والأثاث والإلكترونيات
            <span className="block text-primary">في البحرين والخليج</span>
          </h1>
          <p className="mt-4 text-base text-navy-foreground/75 md:text-lg">
            بيع، شراء ومزاد على المعدات بثقة — تسعير ذكي، حماية من الاحتيال، وآلاف الإعلانات.
          </p>

          <div className="mt-7 rounded-2xl bg-white p-2 shadow-card">
            <div className="flex items-center gap-2">
              <Search className="ms-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="ماذا تبحث عنه اليوم؟"
                className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="بحث صوتي">
                <Mic className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="بحث بالصورة">
                <Camera className="h-5 w-5" />
              </button>
              <button className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                بحث
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-6">
            {[
              ["+15K", "إعلان نشط"],
              ["+4K", "تاجر موثوق"],
              ["+200", "مزاد أسبوعي"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-extrabold text-primary">{n}</div>
                <div className="text-xs text-navy-foreground/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
