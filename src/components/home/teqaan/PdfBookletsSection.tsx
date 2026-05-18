import { useState, useRef, useEffect } from "react";
import { FileText, Download, Eye, ExternalLink, Maximize2, X, File, ArrowLeft, ArrowRight } from "lucide-react";
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedBooklet = BOOKLETS.find((b) => b.id === activePdf);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.85;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScrollEvent = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const progress = Math.min(Math.max(Math.abs(scrollLeft) / maxScroll, 0), 1) * 100;
        setScrollProgress(progress);
      }
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollEvent);
      handleScrollEvent();
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScrollEvent);
      }
    };
  }, []);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

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

        {/* Carousel Container */}
        <div className="relative group/carousel w-full">
          {/* Left Arrow */}
          <button 
            onClick={() => handleScroll("left")}
            className="absolute left-[-24px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#C18556]/30 bg-[#0C363A]/95 text-[#C18556] flex items-center justify-center hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556] hover:scale-110 shadow-[0_12px_30px_rgba(12,54,58,0.2)] transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
            aria-label="Previous booklets"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={() => handleScroll("right")}
            className="absolute right-[-24px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#C18556]/30 bg-[#0C363A]/95 text-[#C18556] flex items-center justify-center hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556] hover:scale-110 shadow-[0_12px_30px_rgba(12,54,58,0.2)] transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
            aria-label="Next booklets"
          >
            <ArrowRight size={20} />
          </button>

          {/* Booklets Horizontal Scrollable Container */}
          <div 
            ref={scrollRef}
            className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-[24px] md:gap-[32px] pb-8 px-4 md:px-0 scroll-smooth"
          >
            {BOOKLETS.map((booklet, idx) => (
              <div 
                key={booklet.id} 
                className="w-[85vw] sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)] flex-shrink-0 snap-start flex"
              >
                <Reveal delay={idx * 100} className="w-full flex">
                  <div className="group relative bg-white/95 backdrop-blur-md rounded-[12px] border border-[#C18556]/20 shadow-[0_15px_45px_rgba(12,54,58,0.03)] hover:shadow-[0_30px_70px_rgba(12,54,58,0.12)] hover:border-[#C18556]/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full w-full overflow-hidden">
                    
                    {/* Thumbnail Area */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0C363A]/5">
                      <img
                        src={booklet.cover}
                        alt={lang === "ar" ? booklet.title : booklet.titleEn}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A]/85 via-[#0C363A]/20 to-transparent opacity-65 group-hover:opacity-85 transition-opacity duration-500" />
                      
                      {/* Badge */}
                      <div className={cn(
                        "absolute top-4 z-20 bg-[#0C363A]/90 backdrop-blur-md border border-[#C18556]/30 text-[#DDB57C] text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-md",
                        lang === "ar" ? "right-4" : "left-4"
                      )}>
                        {booklet.type}
                      </div>

                      {/* Quick View Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 z-30">
                        <button
                          onClick={() => setActivePdf(booklet.id)}
                          className="bg-white/95 text-[#0C363A] px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-[#C18556] hover:text-white hover:shadow-[#C18556]/20 transition-all duration-300"
                        >
                          <Eye size={14} />
                          {lang === "ar" ? "تصفح الملف" : "VIEW FILE"}
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div className={lang === "ar" ? "text-right" : "text-left"}>
                        <span className="text-[#C18556] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3 block">
                          {lang === "ar" ? booklet.categoryAr : booklet.category}
                        </span>
                        <h3 className="text-xl font-serif text-[#0C363A] mb-3 group-hover:text-[#C18556] transition-colors leading-[1.35]">
                          {lang === "ar" ? booklet.title : booklet.titleEn}
                        </h3>
                        <p className="text-xs text-[#0C363A]/60 line-clamp-2 leading-relaxed mb-6">
                          {lang === "ar" ? booklet.subtitle : booklet.subtitleEn}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-[#C18556]/15 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#0C363A]/40 font-mono">
                          <File size={12} className="text-[#C18556]/40" />
                          <span>{booklet.size}</span>
                        </div>

                        <a
                          href={booklet.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-[#0C363A] text-[#DDB57C] border border-[#C18556]/20 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556] hover:shadow-lg"
                        >
                          <Download size={12} />
                          {lang === "ar" ? "تحميل" : "DOWNLOAD"}
                        </a>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>

          {/* Luxury Scroll Progress Bar */}
          <div className="w-full max-w-[240px] mx-auto mt-6 h-[2px] bg-[#C18556]/20 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 bottom-0 bg-[#C18556] transition-all duration-300 rounded-full"
              style={{ 
                width: `${scrollProgress}%`,
                [lang === "ar" ? "right" : "left"]: 0 
              }}
            />
          </div>
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
