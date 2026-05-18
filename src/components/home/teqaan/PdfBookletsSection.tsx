import { useState } from "react";
import { FileText, Download, Eye, ExternalLink, Maximize2, X, File } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageProvider";

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
    type: "PDF",
    category: "Architecture",
    categoryAr: "معماري",
  },
  {
    id: "cafe",
    title: "العرض التقديمي الشامل - كافيه طلابي",
    titleEn: "Comprehensive Master Presentation - Students Cafe",
    subtitle: "المساقط الأفقية، المودبورد، واللقطات التنفيذية وتفاصيل الخامات",
    subtitleEn: "Floor plans, material moodboards, dynamic HQ renders, and custom layout systems.",
    size: "8.7 MB",
    fileUrl: "/real-content/Designs/students cafe.pdf",
    cover: "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
    type: "Presentation",
    category: "Commercial",
    categoryAr: "تجاري",
  },
  {
    id: "shop",
    title: "كتيب تفاصيل الواجهات التجارية",
    titleEn: "Premium Shop Facade Engineering Specs",
    subtitle: "المواصفات الفنية، قطاعات الإضاءة، والخامات المستخدمة للواجهة",
    subtitleEn: "Structural framework details, lighting sections, and commercial exterior finishing specs.",
    size: "348 KB",
    fileUrl: "/real-content/Designs/Shop facade.pdf",
    cover: "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
    type: "Booklet",
    category: "Commercial",
    categoryAr: "تجاري",
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
    type: "PDF",
    category: "Interior",
    categoryAr: "داخلي",
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
    type: "Presentation",
    category: "Interior",
    categoryAr: "داخلي",
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
    type: "Booklet",
    category: "Architecture",
    categoryAr: "معماري",
  },
];

export default function PdfBookletsSection() {
  const { lang } = useLang();
  const [activePdf, setActivePdf] = useState<string | null>(null);

  const selectedBooklet = BOOKLETS.find((b) => b.id === activePdf);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Luxury Background Elements */}
      <div className="absolute inset-0 bg-[#DDB57C]/7 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#C18556 0.5px, transparent 0.5px), linear-gradient(90deg, #C18556 0.5px, transparent 0.5px)`, backgroundSize: '60px 60px' }} />
      
      <div className="container-luxe relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#C18556]/30" />
              <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                {lang === "ar" ? "الموارد" : "RESOURCES"}
              </span>
              <div className="w-12 h-px bg-[#C18556]/30" />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h2 className="text-4xl md:text-5xl font-serif text-[#0C363A] leading-[1.2] mb-8">
              {lang === "ar" ? (
                <>الكتب الفنية <span className="text-[#C18556] italic">والعروض التقديمية</span></>
              ) : (
                <>Technical Booklets & <span className="text-[#C18556] italic">Presentations</span></>
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-base md:text-lg text-[#0C363A]/60 leading-relaxed mx-auto max-w-2xl">
              {lang === "ar" 
                ? "مجموعة مختارة من الأدلة والعروض التي تساعدك على فهم تفاصيل التصميم والتنفيذ باحترافية، وتوثق معايير الجودة في مشاريعنا."
                : "A selection of guides and presentations to help you understand design and execution details professionally, documenting our quality standards."}
            </p>
          </Reveal>
        </div>

        {/* BOOKLETS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BOOKLETS.map((booklet, idx) => (
            <Reveal key={booklet.id} delay={idx * 100}>
              <div className="group relative bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden border border-[#C18556]/15 transition-all duration-500 hover:-translate-y-2 hover:border-[#C18556]/40 hover:shadow-2xl hover:shadow-[#0C363A]/5 flex flex-col h-full">
                
                {/* Thumbnail Area */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0C363A]/5">
                  <img
                    src={booklet.cover}
                    alt={lang === "ar" ? booklet.title : booklet.titleEn}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A]/80 via-[#0C363A]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  
                  {/* Badge */}
                  <div className={cn(
                    "absolute top-4 z-20 bg-[#C18556] text-[#0C363A] text-[9px] font-bold px-2.5 py-1 rounded-sm shadow-lg",
                    lang === "ar" ? "right-4" : "left-4"
                  )}>
                    {booklet.type}
                  </div>

                  {/* Quick View Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 z-30">
                    <button
                      onClick={() => setActivePdf(booklet.id)}
                      className="bg-white text-[#0C363A] px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-[#C18556] hover:text-white transition-all"
                    >
                      <Eye size={14} />
                      {lang === "ar" ? "تصفح الملف" : "VIEW FILE"}
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className={lang === "ar" ? "text-right" : "text-left"}>
                    <span className="text-[#C18556] text-[10px] font-bold uppercase tracking-widest mb-3 block">
                      {lang === "ar" ? booklet.categoryAr : booklet.category}
                    </span>
                    <h3 className="text-xl font-serif text-[#0C363A] mb-3 group-hover:text-[#C18556] transition-colors leading-tight">
                      {lang === "ar" ? booklet.title : booklet.titleEn}
                    </h3>
                    <p className="text-xs text-[#0C363A]/60 line-clamp-2 leading-relaxed mb-6">
                      {lang === "ar" ? booklet.subtitle : booklet.subtitleEn}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-[#C18556]/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#0C363A]/40 font-mono">
                      <File size={12} className="text-[#C18556]/40" />
                      <span>{booklet.size}</span>
                    </div>

                    <a
                      href={booklet.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-[#0C363A] text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-[#C18556] hover:shadow-lg"
                    >
                      <Download size={12} />
                      {lang === "ar" ? "تحميل" : "DOWNLOAD"}
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Reveal delay={600}>
            <button className="px-10 py-4 border border-[#0C363A]/20 text-[#0C363A] text-[11px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 hover:bg-[#0C363A] hover:text-white hover:border-[#0C363A]">
              {lang === "ar" ? "استكشف جميع الموارد" : "EXPLORE ALL RESOURCES"}
            </button>
          </Reveal>
        </div>
      </div>

      {/* MODAL PDF VIEWER */}
      {activePdf && selectedBooklet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C363A]/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl border border-[#C18556]/30 flex flex-col">
            
            <div className="px-6 py-4 bg-[#0C363A] text-white flex items-center justify-between border-b border-[#C18556]/20" dir={lang === "ar" ? "rtl" : "ltr"}>
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded bg-[#C18556]/10 flex items-center justify-center text-[#C18556]">
                   <FileText size={20} />
                </div>
                <div className="text-start">
                  <h4 className="font-serif text-base font-bold text-white truncate">
                    {lang === "ar" ? selectedBooklet.title : selectedBooklet.titleEn}
                  </h4>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block" dir="ltr">
                    {selectedBooklet.size} • {selectedBooklet.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedBooklet.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/10 hover:bg-[#C18556] rounded text-white transition-all"
                  title="Open Externally"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => setActivePdf(null)}
                  className="p-2 bg-white/10 hover:bg-red-500 rounded text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-full relative bg-[#FBF7F0]">
              <iframe
                src={`${selectedBooklet.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-none"
                title={selectedBooklet.title}
              />
            </div>
            
            <div className="p-3 bg-white text-center border-t border-[#C18556]/10 flex justify-center items-center gap-3" dir={lang === "ar" ? "rtl" : "ltr"}>
               <span className="text-[11px] text-[#0C363A]/60">{lang === "ar" ? "هل تواجه مشكلة؟" : "Having trouble?"}</span>
               <a href={selectedBooklet.fileUrl} target="_blank" rel="noreferrer" className="text-[#C18556] text-[11px] font-bold uppercase tracking-wider hover:underline flex items-center gap-2">
                 {lang === "ar" ? "فتح الملف مباشرة" : "Open Directly"}
                 <Maximize2 size={12} />
               </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
