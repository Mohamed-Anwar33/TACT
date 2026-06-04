import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Play, X, Compass, Palette, Sparkles } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { getCmsProjects, getProjectPreviewMedia, type CmsProject } from "@/lib/publicCms";

function ProjectCard({ p, index, lang, onPlayVideo }: { p: any; index: number; lang: string; onPlayVideo?: (url: string) => void }) {
  const previewMedia = getProjectPreviewMedia(p);
  const videoUrl = p.videoUrl || p.video_url || previewMedia?.videoUrl;
  const isVideo = !!videoUrl || previewMedia?.type === "video";
  const title = lang === "ar" ? p.nameAr || p.title_ar : p.name || p.title_en;
  const imageUrl = previewMedia?.type === "image" ? previewMedia.url : "";

  return (
    <Reveal delay={index * 120} className="w-full">
      <div className="group relative w-full h-[320px] md:h-[360px] overflow-hidden rounded-[12px] border border-[#C18556]/22 bg-[#061F22] shadow-[0_20px_45px_rgba(0,0,0,0.25)] transition-all duration-500 hover:translate-y-[-6px] hover:border-[#C18556]/65 hover:shadow-[0_25px_50px_rgba(193,133,86,0.22)]">
        {/* Full Card Link or Video Click Overlay */}
        {isVideo ? (
          <button 
            type="button"
            onClick={() => videoUrl && onPlayVideo?.(videoUrl)}
            className="absolute inset-0 z-30 w-full h-full text-start cursor-pointer focus:outline-none"
          >
            <span className="sr-only">Watch {title}</span>
          </button>
        ) : (
          <Link to={`/portfolio/${p.id}`} className="absolute inset-0 z-30">
            <span className="sr-only">View {title}</span>
          </Link>
        )}

        {/* Project Cover Image */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover image-crisp z-0 opacity-95 transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : previewMedia?.type === "video" ? (
          <video
            src={previewMedia.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover image-crisp z-0 opacity-95 transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="absolute inset-0 z-0 grid place-items-center bg-[#061F22] text-[#C18556]/70">
            <Palette size={34} />
          </div>
        )}
        
        {/* Cinematic Premium Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061F22] via-[#061F22]/35 to-transparent z-10 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent z-10 pointer-events-none" />
        
        {/* Top Info Badges (Always visible on the outside) */}
        <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20 pointer-events-none">
          {/* Project Area Dimensions - Hidden as requested */}
          <div />
          {/* Subcategory Icon/Tag */}
          <span className="bg-[#C18556] text-white text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-[4px] shadow-sm flex items-center gap-1.5">
            <Sparkles size={8} className="animate-pulse" />
            {isVideo ? (lang === "ar" ? "تنفيذ واقعي" : "EXECUTED") : (lang === "ar" ? "تصميم ثلاثي" : "3D DESIGN")}
          </span>
        </div>

        {/* Play Button Overlay for Videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-[60px] h-[60px] rounded-full bg-[#C18556]/90 text-[#061F22] flex items-center justify-center shadow-[0_0_30px_rgba(193,133,86,0.55)] transition-all duration-500 group-hover:scale-115 group-hover:bg-white">
              <Play size={20} className="fill-current translate-x-[1px] text-[#061F22]" />
            </div>
          </div>
        )}

        {/* Bottom Details Container (Permanently displayed on the outside) */}
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 z-20 pointer-events-none bg-gradient-to-t from-[#061F22] via-[#061F22]/90 to-transparent">
          <div className={cn(
            "transition-all duration-500",
            lang === "ar" ? "text-right" : "text-left"
          )}>
            {/* Title */}
            <h3 className="text-lg md:text-[21px] font-bold text-white mb-2 leading-[1.3] drop-shadow-md">
              {title}
            </h3>
            
            {/* Description snippet */}
            {isVideo && (
              <p className="text-[12px] md:text-[13px] text-white/80 line-clamp-2 mb-3 leading-relaxed drop-shadow-sm font-light">
                {lang === "ar" ? p.descAr || p.description_ar : p.desc || p.description_en}
              </p>
            )}

            {/* Navigation CTA link */}
            <div className="flex items-center gap-2 text-[#C18556] text-[12px] font-bold group-hover:text-white transition-colors duration-300">
              <span className="border-b border-[#C18556]/40 pb-0.5 group-hover:border-white/40">
                {isVideo ? (lang === "ar" ? "مشاهدة التغطية المرئية" : "Watch Video Coverage") : (lang === "ar" ? "عرض ألبوم التصميم" : "View Design Album")}
              </span>
              {lang === "ar" ? (
                <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
              ) : (
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </div>
          </div>
        </div>

        {/* Delicate Glass Corners on Hover */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
      </div>
    </Reveal>
  );
}

export default function ProjectsShowcase({ section }: { section?: any }) {
  const { lang } = useLang();
  const [activeMainTab, setActiveMainTab] = useState<"designs" | "finishing">("designs");
  const [cmsProjects, setCmsProjects] = useState<CmsProject[]>([]);
  
  // Video modal player
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setCmsProjects(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Reset scroll position when tab changes
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({ left: 0 });
    }
  }, [activeMainTab]);

  // Check overflow dynamically
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const checkOverflow = () => {
      setShowArrows(container.scrollWidth > container.clientWidth);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    const timer = setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timer);
    };
  }, [cmsProjects, activeMainTab]);

  const handleScroll = (direction: "prev" | "next") => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector(".project-card-wrapper");
    const cardWidth = card ? card.clientWidth : 360;
    const gap = 24;
    const amount = cardWidth + gap;

    const isRtl = lang === "ar";
    let scrollDelta = direction === "next" ? amount : -amount;
    if (isRtl) {
      scrollDelta = -scrollDelta; // Invert for RTL scroll direction
    }

    container.scrollBy({ left: scrollDelta, behavior: "smooth" });
  };

  // Dynamic Filtering Logic
  let displayItems: any[] = [];
  const selectedIds: string[] = Array.isArray(section?.metadata?.selectedIds) ? section.metadata.selectedIds : [];
  const selectedProjects = selectedIds.length
    ? selectedIds.map((id) => cmsProjects.find((project) => project.id === id)).filter(Boolean)
    : [];
  const projectSource = selectedProjects;

  if (activeMainTab === "designs") {
    const designs = projectSource.filter((project: any) => (project.portfolioKind || (project.videoUrl ? "execution" : "design")) === "design");
    displayItems = designs.slice(0, 12);
  } else {
    const videos = projectSource.filter((project: any) => (project.portfolioKind || (project.videoUrl ? "execution" : "design")) === "execution");
    displayItems = videos.slice(0, 12);
  }

  // Dynamic values
  const hasCustomTitle = lang === "ar" ? !!section?.titleAr : !!section?.titleEn;
  const defaultTitleAr = <>سابقة أعمال <span className="text-[#C18556] font-serif italic">تتحدى تفاصيلها</span></>;
  const defaultTitleEn = <>Portfolio That <span className="text-[#C18556] font-serif italic">Defies Details</span></>;

  const renderTitle = () => {
    if (!hasCustomTitle) {
      return lang === "ar" ? defaultTitleAr : defaultTitleEn;
    }
    const titleText = lang === "ar" ? section?.titleAr || "" : section?.titleEn || "";
    const separator = titleText.includes("|") ? "|" : titleText.includes(" - ") ? " - " : titleText.includes("\n") ? "\n" : null;
    if (separator) {
      const parts = titleText.split(separator);
      const main = parts[0].trim();
      const sub = parts.slice(1).join(separator).trim();
      return (
        <>
          {main} <span className="text-[#C18556] font-serif italic">{sub}</span>
        </>
      );
    }
    return titleText;
  };

  const bodyText = lang === "ar" ? section?.bodyAr : section?.bodyEn;
  const renderBody = () => {
    if (!bodyText) {
      return lang === "ar" 
        ? "تصفح مشاريعنا المقسمة بدقة لتلبي تطلعاتك المعمارية، ما بين التصاميم ثلاثية الأبعاد الراقية وفيديوهات التنفيذ الفعلي على أرض الواقع."
        : "Browse our projects categorized neatly to match your architectural vision, from high-end 3D designs to real executed walkthroughs.";
    }
    return bodyText;
  };

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#061F22] via-[#0C363A] to-[#061F22]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Decorative Grid Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#FFFFFF 0.5px, transparent 0.5px), linear-gradient(90deg, #FFFFFF 0.5px, transparent 0.5px)`, backgroundSize: '80px 80px' }} />
      
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <div className={cn("absolute top-0 bottom-0 w-px bg-gradient-to-b from-[#C18556] via-transparent to-[#C18556]", lang === "ar" ? "right-[5%]" : "left-[5%]")} />
        <div className={cn("absolute top-0 bottom-0 w-px bg-gradient-to-b from-[#C18556] via-transparent to-[#C18556]", lang === "ar" ? "left-[5%]" : "right-[5%]")} />
      </div>

      <div className="container-luxe max-w-[1180px] relative z-10 px-4">
        
        {/* Section Header */}
        <div className="text-center mb-[44px] max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-[44px] h-px bg-[#C18556]/55" />
              <span className="text-[#C18556] text-[13px] md:text-[14px] uppercase tracking-widest font-bold">
                {lang === "ar" ? section?.sectionNameAr || "معرض أعمال تاكت" : section?.sectionNameEn || "TACT PORTFOLIO"}
              </span>
              <div className="w-[44px] h-px bg-[#C18556]/55" />
            </div>
          </Reveal>
          
          <Reveal delay={150}>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.2] mb-6">
              {renderTitle()}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-[14px] md:text-[16px] text-white/70 leading-[1.7] mx-auto max-w-[680px]">
              {renderBody()}
            </p>
          </Reveal>
        </div>

        {/* PRIMARY TABS - DESIGNS VS FINISHING */}
        <div className="flex justify-center mb-8">
          <Reveal delay={350} className="w-full max-w-md">
            <div className="flex bg-[#072428] border border-[#C18556]/25 rounded-[8px] p-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
              {/* Designs Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("designs");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[6px] text-[13px] font-bold transition-all duration-300",
                  activeMainTab === "designs"
                    ? "bg-[#C18556] text-[#061F22] shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Compass size={16} />
                <span>{lang === "ar" ? "تصميمات (Designs)" : "Designs"}</span>
              </button>

              {/* Finishing Videos Tab */}
              <button
                type="button"
                onClick={() => setActiveMainTab("finishing")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[6px] text-[13px] font-bold transition-all duration-300",
                  activeMainTab === "finishing"
                    ? "bg-[#C18556] text-[#061F22] shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Palette size={16} />
                <span>{lang === "ar" ? "تشطيبات/فيديوهات (Finishing)" : "Finishing Videos"}</span>
              </button>
            </div>
          </Reveal>
        </div>

        {displayItems.length > 0 && (
          <div className="relative w-full mt-10">
            {/* Scrollable track */}
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayItems.map((p, i) => (
                <div key={p.id} className="project-card-wrapper flex-shrink-0 w-[88%] sm:w-[47%] md:w-[31.5%] snap-start">
                  <ProjectCard p={p} index={i} lang={lang} onPlayVideo={setActiveVideo} />
                </div>
              ))}
            </div>

            {/* Custom Navigation Arrows */}
            {showArrows && (
              <>
                <button
                  type="button"
                  onClick={() => handleScroll("prev")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-40 bg-[#C18556] text-[#061F22] w-12 h-12 rounded-full hidden md:flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none",
                    lang === "ar" ? "-right-6" : "-left-6"
                  )}
                  aria-label="Previous"
                >
                  {lang === "ar" ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleScroll("next")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 z-40 bg-[#C18556] text-[#061F22] w-12 h-12 rounded-full hidden md:flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none",
                    lang === "ar" ? "-left-6" : "-right-6"
                  )}
                  aria-label="Next"
                >
                  {lang === "ar" ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </button>
              </>
            )}
          </div>
        )}

        {/* BROWSE ALL PROJECTS BUTTON */}
        <div className="text-center mt-16">
          <Reveal delay={450}>
            <Link 
              to="/portfolio" 
              className="inline-flex items-center justify-center px-9 py-4 border border-[#C18556]/60 text-white text-[13px] font-bold rounded-[6px] transition-all duration-400 hover:bg-[#C18556] hover:text-[#061F22] hover:border-[#C18556] group shadow-lg"
            >
              <span>{lang === "ar" ? "استعرض معرض المشاريع بالكامل" : "BROWSE COMPLETE GALLERY"}</span>
              <ArrowRight size={15} className={cn(
                "ms-2 transition-transform duration-300",
                lang === "ar" ? "rotate-180 group-hover:-translate-x-1.5" : "group-hover:translate-x-1.5"
              )} />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX MODAL FOR VIDEOS */}
      {activeVideo && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-black/96 backdrop-blur-md" onClick={() => setActiveVideo(null)} />
          
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border border-[#C18556]/40 shadow-2xl z-10 animate-scale-in">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C18556] text-white flex items-center justify-center transition-all shadow-md"
            >
              <X size={20} />
            </button>
            <video src={activeVideo} controls autoPlay className="w-full h-full object-contain" />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
