import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import ProjectCard from "@/components/ui-luxe/ProjectCard";
import { ArrowLeft, ArrowRight, FileText, ZoomIn, ZoomOut, RotateCcw, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects } from "@/lib/publicCms";

export default function ProjectDetails() {
  const { id } = useParams();
  const { lang } = useLang();
  const [projects, setProjects] = useState<CmsProject[]>(() => fallbackProjects());
  const project = projects.find((p) => p.id === id);

  const currentProject = project || {
    id: "showcase",
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
  };

  const [selectedApartment, setSelectedApartment] = useState<string | null>(null);

  const isGroupedByApartments = useMemo(() => {
    if (!currentProject?.mediaItems) return false;
    const images = currentProject.mediaItems.filter(item => item.media_type === "image");
    return images.some(item => item.role && item.role !== "gallery" && item.role !== "cover");
  }, [currentProject]);

  const apartmentGroups = useMemo(() => {
    if (!currentProject?.mediaItems) return {};
    const images = currentProject.mediaItems.filter(item => item.media_type === "image");
    const groups: Record<string, typeof images> = {};
    images.forEach(item => {
      const role = (item.role && item.role !== "gallery" && item.role !== "cover") 
        ? item.role 
        : (lang === "ar" ? "معرض الصور العام" : "General Gallery");
      if (!groups[role]) groups[role] = [];
      groups[role].push(item);
    });
    return groups;
  }, [currentProject, lang]);

  const apartmentImages = useMemo(() => {
    if (!currentProject || !selectedApartment || !isGroupedByApartments) return [];
    return apartmentGroups[selectedApartment]?.map(item => item.url) || [];
  }, [currentProject, selectedApartment, isGroupedByApartments, apartmentGroups]);

  const rawGallery = currentProject.images?.length ? currentProject.images : [currentProject.img || currentProject.cover].filter(Boolean);

  const gallery = useMemo(() => {
    if (isGroupedByApartments) {
      if (selectedApartment) {
        return apartmentImages;
      }
      return [];
    }
    return rawGallery;
  }, [isGroupedByApartments, selectedApartment, apartmentImages, rawGallery]);

  const related = projects.filter((p) => p.kind === "img" && p.id !== currentProject.id).slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomDisabled, setIsZoomDisabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % gallery.length);
      setZoomLevel(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [gallery.length, isPaused]);

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

  const activeImageSrc = gallery[currentIndex] || currentProject.img || currentProject.cover;

  return (
    <div className="min-h-screen bg-[#FBFBFA] pt-32 pb-24 text-foreground selection:bg-gold/20 selection:text-teal-deep" dir={lang === "ar" ? "rtl" : "ltr"}>
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

        {isGroupedByApartments && !selectedApartment ? (
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
            {isGroupedByApartments && selectedApartment && (
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
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              <div className={`absolute top-4 ${lang === "ar" ? "left-4" : "right-4"} z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-border/60 text-xs text-teal-deep font-mono`}>
                
                <button 
                  onClick={toggleZoomDisable}
                  className={cn("px-3 py-1.5 rounded-lg transition-all font-serif-ar", isZoomDisabled ? "bg-muted text-muted-foreground line-through" : "hover:bg-gold/20 font-medium")}
                >
                  {lang === "ar" ? (isZoomDisabled ? "تفعيل التكبير" : "تعطيل التكبير") : (isZoomDisabled ? "Enable Zoom" : "Disable Zoom")}
                </button>

                <div className="w-[1px] h-4 bg-border mx-0.5" />

                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-all font-serif-ar flex items-center gap-1"
                >
                  {isPaused ? <Play size={12} className="fill-current" /> : <Pause size={12} className="fill-current" />}
                  <span>{lang === "ar" ? (isPaused ? "تشغيل" : "إيقاف") : (isPaused ? "Play" : "Pause")}</span>
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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-ivory font-mono tracking-widest border border-white/10">
                {currentIndex + 1} / {gallery.length}
              </div>

            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {gallery.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={cn(
                    "relative flex-shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300",
                    idx === currentIndex 
                      ? "border-gold shadow-md scale-105" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img 
                    src={src} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </button>
              ))}
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
    </div>
  );
}
