import { useState } from "react";
import { FileText, Download, ExternalLink, Maximize2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import Reveal from "@/components/ui-luxe/Reveal";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { cn } from "@/lib/utils";

const BOOKLETS = [
  {
    id: "landscape",
    title: "كتيب تصميم اللاندسكيب والمناظر الطبيعية",
    titleEn: "Landscape & Outdoor Spaces Design Booklet",
    subtitle: "المخططات الهندسية وتوزيع المساحات الخارجية والمسطحات الخضراء",
    subtitleEn: "Masterplans, softscape distributions, and high-end outdoor execution specs.",
    size: "4.2 MB",
    fileUrl: "/real-content/Designs/Landscape.pdf",
    cover: "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
    color: "from-brand-dark/85 to-brand-teal/80",
  },
  {
    id: "cafe",
    title: "العرض التقديمي الشامل - كافيه طلابي",
    titleEn: "Comprehensive Master Presentation - Students Cafe",
    subtitle: "المساقط الأفقية، المودبورد، واللقطات التنفيذية وتفاصيل الخامات المعتمدة",
    subtitleEn: "Floor plans, material moodboards, dynamic HQ renders, and custom layout systems.",
    size: "8.7 MB",
    fileUrl: "/real-content/Designs/students cafe.pdf",
    cover: "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
    color: "from-brand-dark/85 to-brand-gold/75",
  },
  {
    id: "shop",
    title: "كتيب تفاصيل الواجهات التجارية",
    titleEn: "Premium Shop Facade Engineering Specs",
    subtitle: "المواصفات الفنية، قطاعات الإضاءة، والخامات المستخدمة للواجهة الخارجية",
    subtitleEn: "Structural framework details, lighting sections, and commercial exterior finishing specs.",
    size: "348 KB",
    fileUrl: "/real-content/Designs/Shop facade.pdf",
    cover: "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
    color: "from-brand-dark/90 to-brand-teal/75",
  },
  {
    id: "classic1",
    title: "كتيب المخططات الكلاسيكية الفاخرة",
    titleEn: "Luxury Classic Style Blueprints - Vol 1",
    subtitle: "تفاصيل الزخارف الكلاسيكية، وتوزيع الإضاءة والأثاث للقصور والفلل",
    subtitleEn: "Authentic classical moldings, symmetrical layout plans, and high-end decorative finishes.",
    size: "4.3 MB",
    fileUrl: "/real-content/Designs/ملفات pdf/Classic Styles/download.pdf",
    cover: "/real-content/Designs/Landscape/Screenshot_14-5-2026_19049_.webp",
    color: "from-brand-dark/90 to-brand-sand/55",
  },
  {
    id: "classic2",
    title: "العرض التقديمي للتصاميم الكلاسيكية",
    titleEn: "Classic Style Interior Concepts - Vol 2",
    subtitle: "استعراض المساقط الأفقية والألوان الملكية المعتمدة للأسقف والحوائط",
    subtitleEn: "Floor patterns, royal palette selections, and structural execution documents.",
    size: "3.1 MB",
    fileUrl: "/real-content/Designs/ملفات pdf/Classic Styles/download1.pdf",
    cover: "/real-content/Designs/Landscape/Screenshot_14-5-2026_1912_.webp",
    color: "from-brand-dark/90 to-brand-teal/70",
  },
  {
    id: "neoclassic",
    title: "كتيب الطراز النيو-كلاسيك الحديث",
    titleEn: "Neo Classic Minimalist Harmony Specs",
    subtitle: "الدمج المعماري بين أصالة الخطوط الكلاسيكية وبساطة الروح العصرية",
    subtitleEn: "Bridging architectural heritage with modern lifestyle distributions perfectly.",
    size: "1.8 MB",
    fileUrl: "/real-content/Designs/ملفات pdf/Neo Classic Styles/download.pdf",
    cover: "/real-content/Designs/Landscape/Screenshot_14-5-2026_19153_.webp",
    color: "from-brand-dark/90 to-brand-teal/80",
  },
];

export default function Presentations() {
  const { lang } = useLang();
  const [selectedId, setSelectedId] = useState<string>(BOOKLETS[0].id);

  const activeBooklet = BOOKLETS.find((b) => b.id === selectedId) || BOOKLETS[0];

  return (
    <main className="pt-24 pb-20 min-h-screen bg-background relative" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="absolute inset-0 arch-grid opacity-25 pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-teal-soft/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container-luxe relative z-10">
        
        <Reveal className="text-center max-w-3xl mx-auto mb-12">
          <SectionEyebrow label={lang === "ar" ? "التوثيق الهندسي والمخططات" : "Technical Blueprints & Masterplans"} />
          <h1 className="text-4xl md:text-6xl font-serif-ar text-teal-deep font-bold mt-4">
            {lang === "ar" ? "الكتيبات الفنية والعروض التقديمية" : "Engineering Booklets & Presentations"}
          </h1>
          <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed">
            {lang === "ar" 
              ? "نضع بين يديك الملفات والمخططات الأصلية الموثقة للمشاريع بصيغة PDF تفاعلية، لتستكشف فلسفة التصميم، وتوزيع المساحات، وأدق معايير الجودة المتبعة لدينا."
              : "Explore our authentic certified project PDFs, detailing high-precision floor layouts, structural elements, and design philosophies directly in your browser."}
          </p>
        </Reveal>

        <Reveal delay={150} className="mb-10 grid grid-cols-2 md:grid-cols-3 gap-2 max-w-5xl mx-auto bg-muted/40 p-2 rounded-xl border border-border">
          {BOOKLETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={cn(
                "py-3 px-4 rounded-lg text-xs md:text-sm transition-all flex items-center justify-between gap-2 border text-start font-serif-ar font-bold",
                selectedId === b.id 
                  ? "bg-teal-deep text-white border-gold shadow-md" 
                  : "bg-background text-muted-foreground border-transparent hover:text-teal-deep hover:bg-white"
              )}
            >
              <div className="truncate">
                <span className="block text-[10px] text-gold font-mono uppercase tracking-widest mb-0.5">
                  {b.size}
                </span>
                <span className="truncate block">
                  {lang === "ar" ? b.title : b.titleEn}
                </span>
              </div>
            </button>
          ))}
        </Reveal>

        <Reveal delay={300} className="grid lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-bl-full pointer-events-none" />
            
            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6 border border-border shadow-inner">
              <img 
                src={activeBooklet.cover} 
                alt={activeBooklet.title} 
                className="w-full h-full object-cover scale-105" 
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t mix-blend-multiply opacity-50", activeBooklet.color)} />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-gold text-[10px] font-mono px-2 py-0.5 rounded">
                PDF Document
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider block mb-1">
              {lang === "ar" ? "تفاصيل الكتيب النشط" : "Active Blueprint Spec"}
            </span>
            <h3 className="text-xl font-serif-ar font-bold text-teal-deep leading-snug">
              {lang === "ar" ? activeBooklet.title : activeBooklet.titleEn}
            </h3>
            
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60">
              {lang === "ar" ? activeBooklet.subtitle : activeBooklet.subtitleEn}
            </p>

            <div className="mt-6 space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{lang === "ar" ? "حجم الملف:" : "File Size:"}</span>
                <span className="font-mono font-bold text-teal-deep">{activeBooklet.size}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{lang === "ar" ? "صيغة التوثيق:" : "Format:"}</span>
                <span className="font-mono font-bold text-teal-deep">Adobe PDF</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex flex-col gap-3">
              <a
                href={activeBooklet.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="btn-gold text-center text-xs py-2.5 flex items-center justify-center gap-2 w-full"
              >
                <Download size={14} />
                <span>{lang === "ar" ? "تنزيل الكتيب الأصلي" : "Download Original PDF"}</span>
              </a>

              <a
                href={activeBooklet.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost-light !text-teal-deep text-center text-xs py-2 flex items-center justify-center gap-2 w-full border-border hover:bg-muted transition-colors font-bold"
              >
                <ExternalLink size={14} />
                <span>{lang === "ar" ? "فتح في نافذة المتصفح" : "Open in New Tab"}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col h-[700px]">
            <div className="bg-teal-deep text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-gold/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="font-mono tracking-wide text-white/80">LIVE PDF VIEWPORT</span>
              </div>
              <span className="text-white/50 text-[10px] truncate max-w-xs" dir="ltr">
                {activeBooklet.fileUrl}
              </span>
            </div>

            <div className="flex-1 w-full h-full relative bg-muted/20">
              <iframe
                src={`${activeBooklet.fileUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-none"
                title={activeBooklet.title}
              />
            </div>

            <div className="p-2 bg-muted text-center text-[11px] text-muted-foreground border-t border-border">
              <span>{lang === "ar" ? "تلميح: استخدم شريط أدوات الـ PDF العلوي للتكبير أو طباعة المخطط." : "Tip: Use the internal PDF controls to zoom or print specific layouts."}</span>
            </div>
          </div>

        </Reveal>

      </div>
    </main>
  );
}
