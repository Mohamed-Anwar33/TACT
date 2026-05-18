import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Play, X } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects } from "@/lib/publicCms";

function ProjectCard({ p, index, lang, onPlayVideo }: { p: any; index: number; lang: string; onPlayVideo?: (url: string) => void }) {
  const num = (index + 1).toString().padStart(2, '0');
  const isVideo = p.kind === "video";

  return (
    <Reveal delay={index * 150} className="w-full">
      <div className="group relative w-full h-[300px] md:h-[340px] overflow-hidden rounded-[10px] border border-[#C18556]/32 bg-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-all duration-500 hover:translate-y-[-6px] hover:border-[#C18556]/62">
        {/* Full Card Link or Video Play Button Overlay */}
        {isVideo ? (
          <button 
            type="button"
            onClick={() => onPlayVideo?.(p.videoUrl || p.cover || p.img)}
            className="absolute inset-0 z-30 w-full h-full text-start cursor-pointer"
          >
            <span className="sr-only">Watch {p.name}</span>
          </button>
        ) : (
          <Link to={`/portfolio/${p.id}`} className="absolute inset-0 z-30">
            <span className="sr-only">View {p.name}</span>
          </Link>
        )}

        {/* Project Image */}
        <img 
          src={p.img || p.cover || "/placeholder-project.jpg"} 
          alt={lang === "ar" ? (p.nameAr || p.name) : (p.name || p.nameAr)} 
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.045] z-0"
        />
        
        {/* Cinematic Overlay Gradient - Lightened to show the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061F22] via-[#061F22]/20 to-transparent transition-opacity duration-500 z-10" />
        
        {/* Top Content: Number & Category */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-20 pointer-events-none">
          <div className="text-[17px] font-medium text-[#C18556]/78 font-serif">
            {num}
          </div>
        </div>

        {/* Play Button Icon for Videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-[60px] h-[60px] rounded-full bg-[#C18556]/90 text-[#061F22] flex items-center justify-center shadow-[0_0_30px_rgba(193,133,86,0.5)] transition-all duration-500 group-hover:scale-110 group-hover:bg-white">
              <Play size={20} className="fill-current translate-x-0.5 text-[#061F22]" />
            </div>
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-20 pointer-events-none">
          <div className={cn(
            "transition-all duration-700",
            lang === "ar" ? "text-right" : "text-left"
          )}>
            <h3 className="text-xl md:text-[25px] font-bold text-white mb-2 leading-[1.35]">
              {lang === "ar" ? (p.nameAr || p.name) : (p.name || p.nameAr)}
            </h3>
            
            <p className="text-[14px] md:text-[15px] text-white/90 line-clamp-2 mb-4 leading-[1.7]">
              {lang === "ar" 
                ? (p.descAr || "تصميم وتشطيب متكامل بأعلى معايير الجودة والدقة الهندسيـة.")
                : (p.desc || "Integrated design and finishing with highest quality and engineering precision standards.")}
            </p>

            <div className="flex items-center gap-2 text-[#C18556] text-[14px] font-bold group/link">
              <span>{isVideo ? (lang === "ar" ? "مشاهدة الفيديو" : "Watch Walkthrough") : (lang === "ar" ? "عرض المشروع" : `View ${p.name}`)}</span>
              {lang === "ar" ? (
                <ArrowLeft size={16} className="transition-transform duration-300 group-hover/link:-translate-x-1" />
              ) : (
                <ArrowRight size={16} className="transition-transform duration-300 group-hover/link:translate-x-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function ProjectsShowcase({ section }: { section?: any }) {
  const { lang } = useLang();
  const [projects, setProjects] = useState<CmsProject[]>(() => fallbackProjects());
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setProjects(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const selectedIds = section?.metadata?.selectedIds;
  let displayProjects = projects;
  if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    displayProjects = selectedIds
      .map(id => projects.find(p => p.id === id))
      .filter(Boolean) as CmsProject[];
    
    if (displayProjects.length === 0) {
      displayProjects = projects.filter((p) => p.kind === "img").slice(0, 3);
    }
  } else {
    displayProjects = projects.filter((p) => p.kind === "img").slice(0, 3);
  }

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

  return (
    <section className="relative w-full py-20 md:py-24 overflow-hidden bg-gradient-to-br from-[#061F22] via-[#0C363A] to-[#061F22]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Decorative Blueprint & Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#FFFFFF 0.5px, transparent 0.5px), linear-gradient(90deg, #FFFFFF 0.5px, transparent 0.5px)`, backgroundSize: '80px 80px' }} />
      
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <div className={cn("absolute top-0 bottom-0 w-px bg-gradient-to-b from-[#C18556] via-transparent to-[#C18556]", lang === "ar" ? "right-[5%]" : "left-[5%]")} />
        <div className={cn("absolute top-0 bottom-0 w-px bg-gradient-to-b from-[#C18556] via-transparent to-[#C18556]", lang === "ar" ? "left-[5%]" : "right-[5%]")} />
      </div>

      {/* Inner Frame */}
      <div className="absolute inset-[28px] border border-[#C18556]/16 pointer-events-none hidden md:block">
        <div className="absolute top-0 left-0 w-1 h-1 bg-[#C18556]/40 rounded-full" />
        <div className="absolute top-0 right-0 w-1 h-1 bg-[#C18556]/40 rounded-full" />
        <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#C18556]/40 rounded-full" />
        <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#C18556]/40 rounded-full" />
      </div>

      <div className="container-luxe max-w-[1180px] relative z-10">
        {/* Header */}
        <div className="text-center mb-[52px] max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="w-[44px] h-px bg-[#C18556]/55" />
              <span className="text-[#C18556] text-[13px] md:text-[14px] uppercase tracking-widest font-medium">
                {lang === "ar" ? "أعمالنا المميزة" : "Featured Works"}
              </span>
              <div className="w-[44px] h-px bg-[#C18556]/55" />
            </div>
          </Reveal>
          
          <Reveal delay={150}>
            <h2 className="text-3xl md:text-[44px] lg:text-[56px] font-bold text-white leading-[1.2] mb-6">
              {lang === "ar" ? (
                <>سابقة أعمال <span className="text-[#C18556]">تتحدى تفاصيلها</span></>
              ) : (
                <>Portfolio That <span className="text-[#C18556]">Defies Details</span></>
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-[15px] md:text-[16px] text-white leading-[1.8] mx-auto max-w-[680px]">
              {lang === "ar" 
                ? "نماذج مختارة من مشاريع صممناها بعناية، حيث يلتقي الجمال بالوظيفة في كل تفصيلة معمارية تعكس رؤية عملائنا."
                : "Selected models of projects designed with care, where beauty meets functionality in every architectural detail reflecting our clients' vision."}
            </p>
          </Reveal>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel w-full">
          {/* Left Arrow */}
          {displayProjects.length > 3 && (
            <button 
              onClick={() => handleScroll("left")}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#C18556]/40 bg-[#061F22]/90 text-white flex items-center justify-center hover:bg-[#C18556] hover:text-[#061F22] hover:border-[#C18556] hover:scale-110 shadow-2xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Right Arrow */}
          {displayProjects.length > 3 && (
            <button 
              onClick={() => handleScroll("right")}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#C18556]/40 bg-[#061F22]/90 text-white flex items-center justify-center hover:bg-[#C18556] hover:text-[#061F22] hover:border-[#C18556] hover:scale-110 shadow-2xl transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
            >
              <ArrowRight size={20} />
            </button>
          )}

          {/* Projects Horizontal Scrollable Container */}
          <div 
            ref={scrollRef}
            className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-[24px] md:gap-[32px] pb-6 px-4 md:px-0 scroll-smooth"
          >
            {displayProjects.map((p, i) => (
              <div 
                key={p.id} 
                className="w-[85vw] sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)] flex-shrink-0 snap-start flex"
              >
                <ProjectCard p={p} index={i} lang={lang} onPlayVideo={setActiveVideo} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Reveal delay={450}>
            <Link 
              to="/portfolio" 
              className="inline-flex items-center justify-center px-9 py-4 border border-[#C18556]/70 text-white text-[14px] font-semibold rounded-[6px] transition-all duration-400 hover:bg-[#C18556] hover:text-[#061F22] hover:border-[#C18556] group"
            >
              {lang === "ar" ? "استعرض جميع المشاريع" : "BROWSE ALL PROJECTS"}
              <ArrowRight size={16} className={cn(
                "ms-2 transition-transform duration-300",
                lang === "ar" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"
              )} />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* VIDEO MODAL / LIGHTBOX */}
      {activeVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-[#061F22]/98 backdrop-blur-3xl" onClick={() => setActiveVideo(null)} />
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden border border-[#C18556]/40 shadow-3xl animate-scale-up">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 z-[210] w-12 h-12 rounded-full bg-white/10 hover:bg-[#C18556] hover:text-[#061F22] backdrop-blur-xl flex items-center justify-center text-white transition-all duration-500 hover:rotate-90 shadow-2xl"
            >
              <X size={20} />
            </button>
            <video src={activeVideo} controls autoPlay className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}
