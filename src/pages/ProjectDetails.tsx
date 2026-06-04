import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import ProjectCard from "@/components/ui-luxe/ProjectCard";
import SEO from "@/components/layout/SEO";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pause,
  Play,
  ExternalLink,
  X,
  Eye,
  Download,
  Maximize2,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects } from "@/lib/publicCms";

function getYoutubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/i);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
}

function getVimeoEmbed(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : url;
}

function VideoPlayer({ project }: { project: CmsProject }) {
  const videoUrl = project.videoUrl || "";
  if (project.videoSourceType === "youtube") {
    return <iframe src={getYoutubeEmbed(videoUrl)} title={project.nameAr || project.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full border-none rounded-2xl" />;
  }
  if (project.videoSourceType === "vimeo") {
    return <iframe src={getVimeoEmbed(videoUrl)} title={project.nameAr || project.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full border-none rounded-2xl" />;
  }
  return <video src={videoUrl} controls autoPlay className="h-full w-full object-contain rounded-2xl bg-black" />;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const { lang } = useLang();
  const [projects, setProjects] = useState<CmsProject[]>(() => fallbackProjects());
  const project = projects.find((p) => p.id === id);

  const currentProject: CmsProject = project || {
    id: "showcase",
    kind: "img",
    name: "Project Showcase",
    nameAr: "مشروع مميز",
    type: "Finishing Scope",
    typeAr: "نطاق التشطيبات",
    area: "220 m²",
    desc: "A complete walkthrough and master layout documenting premium finishing materials, refined lighting integration, and turnkey project delivery.",
    descAr: "توثيق هندسي متكامل يبرز دقة تنفيذ بنود التشطيبات الفاخرة، وتناسق الخامات والدهانات مع المخططات المعمارية المعتمدة.",
    img: "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
    cover: "",
    pdf: "",
    images: [
      "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
      "/real-content/Designs/Landscape/Screenshot_14-5-2026_185938_.webp",
      "/real-content/Designs/Landscape/Screenshot_14-5-2026_185952_.webp",
    ],
    mediaItems: [],
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedApartment = searchParams.get("apartment");

  const setSelectedApartment = (apt: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (apt) {
      next.set("apartment", apt);
    } else {
      next.delete("apartment");
    }
    setSearchParams(next);
  };

  const isGroupedByApartments = useMemo(() => {
    if (!currentProject?.mediaItems) return false;
    const images = currentProject.mediaItems.filter(item => item.media_type === "image");
    return images.some(item => !!item.title_ar || !!item.title_en || (item.role && item.role !== "gallery" && item.role !== "cover"));
  }, [currentProject]);

  const apartmentGroups = useMemo(() => {
    if (!currentProject?.mediaItems) return {};
    const images = currentProject.mediaItems.filter(item => item.media_type === "image");
    const groups: Record<string, typeof images> = {};
    images.forEach(item => {
      const role = (item.role && item.role !== "gallery" && item.role !== "cover") 
        ? item.role 
        : (lang === "ar" ? "معرض الصور العام" : "General Gallery");
      const displayName = (lang === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar) || role;
      if (!groups[displayName]) groups[displayName] = [];
      groups[displayName].push(item);
    });
    return groups;
  }, [currentProject, lang]);

  const gallery = useMemo(() => {
    // 1. Get video slide if present
    const projectVideo = currentProject.videoUrl
      ? [{ type: "video" as const, url: currentProject.videoUrl, title: lang === "ar" ? "فيديو التنفيذ" : "Execution Video" }]
      : [];

    // 2. Get images
    let projectImages: { type: "image"; url: string; title?: string }[] = [];
    if (currentProject.mediaItems && currentProject.mediaItems.length > 0) {
      const imgItems = currentProject.mediaItems.filter(item => item.media_type === "image");
      if (imgItems.length > 0) {
        projectImages = imgItems.map(item => ({
          type: "image" as const,
          url: item.url,
          title: (lang === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar) || 
                 ((item.role && item.role !== "gallery" && item.role !== "cover") ? item.role : undefined)
        }));
      }
    }
    
    // Fallback if mediaItems has no images
    if (projectImages.length === 0) {
      if (currentProject.images && currentProject.images.length > 0) {
        projectImages = currentProject.images.map(img => ({ type: "image" as const, url: img }));
      } else if (currentProject.img || currentProject.cover) {
        projectImages = [currentProject.img || currentProject.cover].filter(Boolean).map(img => ({ type: "image" as const, url: img }));
      }
    }

    // 3. Get PDFs
    const projectPdfs = currentProject.pdf
      ? [{ type: "pdf" as const, url: currentProject.pdf, title: lang === "ar" ? "ملف المشروع PDF" : "Project PDF" }]
      : [];

    return [...projectVideo, ...projectImages, ...projectPdfs];
  }, [currentProject, lang]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomDisabled, setIsZoomDisabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tour360Open, setTour360Open] = useState<string | null>(null);

  const activeImageTitle = useMemo(() => {
    const activeItem = gallery[currentIndex];
    if (!activeItem) return null;
    return activeItem.title || null;
  }, [gallery, currentIndex]);

  const related = projects.filter((p) => p.kind === "img" && p.id !== currentProject.id).slice(0, 3);

  useEffect(() => {
    setSelectedApartment(null);
    setCurrentIndex(0);
    setZoomLevel(1);
  }, [id]);

  useEffect(() => {
    setCurrentIndex(0);
    setZoomLevel(1);
  }, [selectedApartment]);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setProjects(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (gallery[currentIndex]?.type === "video") return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % gallery.length);
      setZoomLevel(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [gallery.length, isPaused, currentIndex]);

  useEffect(() => {
    document.body.style.overflow = tour360Open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [tour360Open]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    setZoomLevel(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % gallery.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    if (isZoomDisabled) return;
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    if (isZoomDisabled) return;
    setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleZoomDisable = () => {
    setIsZoomDisabled((prev) => {
      if (!prev) setZoomLevel(1);
      return !prev;
    });
  };

  const activeImageSrc = gallery[currentIndex]?.url || currentProject.img || currentProject.cover || "";

  const seoTitle = lang === "ar"
    ? `مشروع ${currentProject.nameAr || currentProject.name} | معرض أعمالنا`
    : `Project ${currentProject.name || currentProject.nameAr} | Portfolio`;

  const seoDesc = lang === "ar"
    ? `${currentProject.descAr || currentProject.desc || "تفاصيل وصور المشروع الهندسية والتشطيبات."}`
    : `${currentProject.desc || currentProject.descAr || "Technical details, layouts, and executed photos of the project."}`;

  const seoKeywords = lang === "ar"
    ? `${currentProject.nameAr}, تاكت للتصميم, تشطيبات في مصر, ديكورات`
    : `${currentProject.name}, Tact Architecture, interior design, Egypt finishing`;

  const ogImg = currentProject.cover || currentProject.img || "/logo.png";

  return (
    <div className="min-h-screen bg-[#FBFBFA] pt-32 pb-24 text-foreground selection:bg-gold/20 selection:text-teal-deep" dir={lang === "ar" ? "rtl" : "ltr"}>
      <SEO 
        title={seoTitle} 
        description={seoDesc.slice(0, 160)} 
        keywords={seoKeywords}
        ogImage={ogImg}
      />
      <div className="container-luxe max-w-6xl">
        
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-serif-ar font-bold text-teal-deep tracking-tight">
            {lang === "ar" ? currentProject.nameAr : currentProject.name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-muted text-muted-foreground border border-border">
              {lang === "ar" ? "القسم:" : "Category:"} <strong className="ms-1 text-foreground/80 font-serif-ar">{lang === "ar" ? currentProject.typeAr : currentProject.type}</strong>
            </span>
            {/* Area is hidden as requested */}
          </div>
        </header>

        {false ? (
          /* Render Apartments Grid */
          <div className="w-full py-6 select-none animate-fadeIn">
            <h3 className="text-teal-deep text-xs uppercase tracking-wider font-extrabold mb-6 flex items-center gap-2 font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-gold animate-pulse" />
              {lang === "ar" ? "شقق وأقسام المشروع الفرعية" : "Project Apartments & Subfolders"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(apartmentGroups).map(([roleName, items]) => {
                const coverUrl = items[0]?.url || "/placeholder.svg";
                return (
                  <button
                    key={roleName}
                    type="button"
                    onClick={() => setSelectedApartment(roleName)}
                    className="group relative h-56 rounded-2xl overflow-hidden border border-border/80 hover:border-gold/60 bg-white/50 text-start flex flex-col justify-end p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(12,54,58,0.15)] active:scale-[0.99] shadow-md"
                  >
                    <img
                      src={coverUrl}
                      alt={roleName}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-105 brightness-[0.88] group-hover:brightness-[0.95]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 w-full">
                      <span className="inline-flex items-center gap-1.5 text-[10px] bg-gold text-[#061F22] font-mono px-3 py-1 rounded-full font-bold tracking-wider mb-3 shadow-lg">
                        {items.length} {lang === "ar" ? "صورة" : "PHOTOS"}
                      </span>
                      <h4 className="font-serif-ar text-2xl font-bold text-white group-hover:text-gold transition-colors duration-300 truncate">
                        {roleName}
                      </h4>
                      <div className="w-8 h-[2px] bg-gold/50 mt-2 transition-all duration-300 group-hover:w-16" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Render Slideshow and Thumbnails */
          <div className="animate-fadeIn">
            {gallery.length > 1 && (
              <div className="flex justify-center mb-4 select-none">
                <div className="bg-[#0C363A]/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-bold text-gold border border-gold/35 shadow-lg">
                  {currentIndex + 1} / {gallery.length}
                </div>
              </div>
            )}
            {false && (
              <div className="mb-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedApartment(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-deep text-gold border border-teal-deep hover:bg-teal-deep/90 hover:text-white transition-all shadow-md group font-serif-ar font-bold text-xs"
                >
                  {lang === "ar" ? <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /> : <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />}
                  <span>{lang === "ar" ? "العودة للشقق والمساقط" : "Back to Apartments"}</span>
                </button>
                
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-serif-ar bg-gold/10 text-teal-deep border border-gold/30 font-bold">
                  {selectedApartment}
                </span>
              </div>
            )}

            <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-border group select-none">
              
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                {gallery[currentIndex]?.type === "video" ? (
                  <div key={currentIndex} className="w-full h-full flex items-center justify-center bg-black">
                    <VideoPlayer project={currentProject} />
                  </div>
                ) : gallery[currentIndex]?.type === "pdf" ? (
                  /* Unified PDF Slide Card */
                  <div key={currentIndex} className="w-full h-full bg-[#0C363A]/45 backdrop-blur-md flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden select-none">
                    {/* Background grid texture */}
                    <div className="absolute inset-0 arch-grid opacity-10 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                      <div className="mb-5 grid h-16 w-16 md:h-20 md:w-20 place-items-center rounded-full border border-gold/30 bg-[#061F22] text-gold shadow-[0_0_35px_rgba(212,175,55,0.25)]">
                        <FileText size={36} className="stroke-[1.5]" />
                      </div>
                      
                      <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 font-bold px-3 py-1 rounded-full tracking-[0.2em] uppercase mb-4">
                        {lang === "ar" ? "مستند فني PDF" : "TECHNICAL DOCUMENT PDF"}
                      </span>

                      <h3 className="font-serif-ar text-lg md:text-2xl font-extrabold text-white mb-3 leading-snug">
                        {gallery[currentIndex].title || (lang === "ar" ? "كتالوج الرسومات الفنية للمشروع" : "Project Technical Drawings Catalog")}
                      </h3>

                      <p className="text-xs text-white/50 leading-relaxed mb-6 md:mb-8 max-w-sm hidden sm:block">
                        {lang === "ar" 
                          ? "يحتوي هذا الملف على المخططات التنفيذية، المساقط الأفقية، وتوزيع الفرش والإنارة للمشروع بكامل التفاصيل الهندسية."
                          : "This file contains construction blueprints, layouts, furniture distribution, and lighting schemas in full engineering detail."}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                        <a
                          href={gallery[currentIndex].url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setIsPaused(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 text-[#061F22] px-6 py-3 text-xs font-bold transition hover:bg-gold hover:text-[#061F22] shadow-md hover:shadow-gold/20 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Eye size={14} />
                          {lang === "ar" ? "عرض المستند" : "View Document"}
                        </a>
                        <a
                          href={gallery[currentIndex].url}
                          download
                          onClick={() => setIsPaused(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold px-6 py-3 text-xs font-bold transition hover:bg-gold hover:text-[#061F22] hover:border-gold shadow-md transform hover:-translate-y-0.5 active:translate-y-0 bg-[#061F22]/40"
                        >
                          <Download size={14} />
                          {lang === "ar" ? "تحميل الملف" : "Download File"}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={activeImageSrc} 
                    alt={currentProject.nameAr}
                    className="w-full h-full object-cover transition-all duration-500 ease-out"
                    style={{ 
                      transform: `scale(${zoomLevel})`,
                      cursor: isZoomDisabled ? "default" : zoomLevel > 1 ? "zoom-out" : "zoom-in"
                    }}
                    onClick={() => {
                      if (isZoomDisabled) return;
                      setZoomLevel(prev => prev === 1 ? 1.4 : 1);
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {activeImageTitle && (
                <div className={`absolute top-4 ${lang === "ar" ? "right-4" : "left-4"} z-20 bg-teal-deep/95 backdrop-blur-md text-gold border border-gold/30 px-4 py-2.5 rounded-xl text-xs font-serif-ar font-bold shadow-lg select-none`}>
                  <span>{activeImageTitle}</span>
                </div>
              )}

              {gallery[currentIndex]?.type === "image" && (
                <div className={`absolute top-4 ${lang === "ar" ? "left-4" : "right-4"} z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-border/60 text-xs text-teal-deep font-mono`}>
                  
                  <button 
                    onClick={toggleZoomDisable}
                    className={cn("px-3 py-1.5 rounded-lg transition-all font-serif-ar", isZoomDisabled ? "bg-muted text-muted-foreground line-through" : "hover:bg-gold/20 font-medium")}
                  >
                    {lang === "ar" ? (isZoomDisabled ? "تفعيل التكبير" : "تعطيل التكبير") : (isZoomDisabled ? "Enable Zoom" : "Disable Zoom")}
                  </button>

                  <div className="w-[1px] h-4 bg-border mx-0.5" />

                  <button 
                    onClick={handleZoomOut}
                    disabled={isZoomDisabled || zoomLevel <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/20 disabled:opacity-30 transition-all"
                    title={lang === "ar" ? "تصغير" : "Zoom Out"}
                  >
                    <ZoomOut size={14} />
                  </button>

                  <button 
                    onClick={handleZoomIn}
                    disabled={isZoomDisabled || zoomLevel >= 2.5}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/20 disabled:opacity-30 transition-all"
                    title={lang === "ar" ? "تكبير" : "Zoom In"}
                  >
                    <ZoomIn size={14} />
                  </button>

                  <button 
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/20 disabled:opacity-30 transition-all"
                    title={lang === "ar" ? "إعادة الضبط" : "Reset Zoom"}
                  >
                    <RotateCcw size={14} />
                  </button>

                </div>
              )}

              <button 
                onClick={handlePrev}
                className={`absolute top-1/2 -translate-y-1/2 ${lang === "ar" ? "right-4" : "left-4"} z-10 w-10 h-10 rounded-full bg-white/90 text-teal-deep hover:bg-gold hover:text-white flex items-center justify-center shadow-lg transition-all transform active:scale-95`}
                aria-label="السابق"
              >
                {lang === "ar" ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </button>

              <button 
                onClick={handleNext}
                className={`absolute top-1/2 -translate-y-1/2 ${lang === "ar" ? "left-4" : "right-4"} z-10 w-10 h-10 rounded-full bg-white/90 text-teal-deep hover:bg-gold hover:text-white flex items-center justify-center shadow-lg transition-all transform active:scale-95`}
                aria-label="التالي"
              >
                {lang === "ar" ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>

            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/50 scrollbar-track-white/5 select-none" style={{ scrollbarWidth: "thin" }}>
              {gallery.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setZoomLevel(1);
                    }}
                    className={cn(
                      "relative flex-shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 bg-white/5 group",
                      isActive
                        ? "border-gold shadow-md scale-105 opacity-100 ring-1 ring-gold/40"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#0C363A] text-gold p-1 select-none">
                        <Play className="text-gold fill-gold/20" size={20} />
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider font-extrabold uppercase text-white/90">
                          {lang === "ar" ? "فيديو" : "VIDEO"}
                        </span>
                      </div>
                    ) : item.type === "pdf" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#0C363A] text-gold p-1 select-none">
                        <FileText className="text-gold" size={20} />
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider font-extrabold uppercase text-white/90">
                          PDF
                        </span>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <section className="mt-16 pt-12 border-t border-border/80">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-3">
              <h2 className="text-xl md:text-2xl font-serif-ar font-bold text-teal-deep">
                {lang === "ar" ? "عن المشروع" : "About the Project"}
              </h2>
              <p className="mt-4 text-base md:text-lg text-foreground/80 leading-relaxed font-serif-ar">
                {lang === "ar" ? currentProject.descAr : currentProject.desc}
              </p>

              {currentProject.pdf && (
                <div className="mt-8">
                  <a
                    href={currentProject.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-teal-deep text-gold hover:bg-teal-deep/90 shadow-md transition-all font-serif-ar font-bold text-sm"
                  >
                    <FileText size={16} />
                    <span>{lang === "ar" ? "تحميل ملف وتفاصيل المشروع (PDF)" : "Download Scope Specifications (PDF)"}</span>
                  </a>
                </div>
              )}

              {currentProject.tour360Url && (
                <div className="mt-8 rounded-2xl border border-gold/25 bg-[#0C363A] text-white p-6 shadow-xl max-w-xl relative overflow-hidden group">
                  {/* Decorative glowing background glow */}
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-gold/10 transition-all duration-700 blur-[30px] pointer-events-none" />
                  
                  <h3 className="mb-4 flex items-center gap-2 font-serif-ar text-base font-extrabold text-white relative z-10">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold"></span>
                    </span>
                    {lang === "ar" ? "الجولة الافتراضية 360° التفاعلية" : "Interactive 360° Virtual Tour"}
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed mb-5 font-sans relative z-10">
                    {lang === "ar" 
                      ? "استمتع بتجربة بصرية فريدة واستكشف تفاصيل المشروع والأبعاد الهندسية من خلال جولة افتراضية تفاعلية بزاوية 360 درجة."
                      : "Experience a unique virtual walkthrough and explore the project details and spatial layout with our 360° interactive tour."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTour360Open(currentProject.tour360Url)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 px-5 py-3.5 text-xs font-extrabold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#061F22] text-white bg-white/5 group/btn relative z-10"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink size={14} className="text-gold group-hover/btn:text-[#061F22]" />
                      <span>{lang === "ar" ? "ابدأ الجولة التفاعلية 360°" : "Start 360° Interactive Tour"}</span>
                    </span>
                    <span className="text-[10px] bg-gold/20 group-hover/btn:bg-[#061F22]/15 text-gold group-hover/btn:text-[#061F22] px-2.5 py-0.5 rounded-md font-mono font-bold animate-pulse">360°</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        <div className="mt-12">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-border text-xs font-serif-ar text-foreground hover:border-gold hover:text-teal-deep transition-all shadow-sm group"
          >
            {lang === "ar" ? <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /> : <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />}
            <span>{lang === "ar" ? "العودة للمشاريع والتصميمات" : "Back to Projects"}</span>
          </Link>
        </div>

        <section className="mt-24 pt-12 border-t border-border">
          <div className="text-center md:text-start mb-8">
            <span className="text-xs uppercase tracking-widest font-mono text-gold block mb-1">
              {lang === "ar" ? "تصفح المزيد" : "Explore More"}
            </span>
            <h3 className="text-2xl font-serif-ar font-bold text-teal-deep">
              {lang === "ar" ? "مشاريع وتصميمات أخرى مقترحة" : "Recommended Projects"}
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProjectCard key={p.id} p={p as any} />
            ))}
          </div>
        </section>

      </div>

      {tour360Open && createPortal(
        <div className="fixed inset-0 z-[230] flex flex-col justify-between bg-[#061F22]/95 backdrop-blur-xl p-3 md:p-6 animate-fadeIn">
          {/* Header */}
          <div className="relative z-50 flex items-center justify-between gap-4 pb-3 border-b border-white/10 select-none">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <h2 className="font-serif-ar text-base md:text-lg font-extrabold text-white">
                {lang === "ar" ? "الجولة الافتراضية 360°" : "360° Virtual Tour"}
                <span className="text-gold mx-2 font-sans font-medium text-xs md:text-sm opacity-80">
                  - {lang === "ar" ? currentProject.nameAr : currentProject.name}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={tour360Open}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-[#0C363A]/80 text-gold px-3.5 py-2 text-xs font-bold transition-all duration-300 hover:bg-gold hover:text-[#061F22] hover:scale-105 active:scale-95 shadow-lg"
                title={lang === "ar" ? "فتح في علامة تبويب جديدة" : "Open in new tab"}
              >
                <ExternalLink size={14} />
                <span>{lang === "ar" ? "فتح في نافذة جديدة" : "Open in new window"}</span>
              </a>
              <button
                type="button"
                onClick={() => setTour360Open(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-[#0C363A] text-gold transition-all duration-300 hover:bg-gold hover:text-[#061F22] hover:scale-110 shadow-lg active:scale-95"
                title={lang === "ar" ? "إغلاق" : "Close"}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Tour Iframe container */}
          <div className="flex-1 w-full h-full rounded-xl overflow-hidden border border-gold/35 mt-4 bg-black relative">
            <iframe
              src={tour360Open}
              title={lang === "ar" ? currentProject.nameAr : currentProject.name}
              allow="xr-spatial-tracking; gyroscope; accelerometer; vr"
              allowFullScreen
              scrolling="no"
              className="absolute inset-0 w-full h-full border-none"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
