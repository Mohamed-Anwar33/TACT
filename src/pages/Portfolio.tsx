import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Layers3,
  Maximize2,
  Play,
  Ruler,
  X,
} from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects, parseAreaNumber } from "@/lib/publicCms";

const areaRanges = [
  { id: "less-than-150", titleAr: "أقل من 150 م²", titleEn: "Less than 150 m²", min: 0, max: 149 },
  { id: "150-to-200", titleAr: "من 150 إلى 200 م²", titleEn: "150 to 200 m²", min: 150, max: 200 },
  { id: "200-to-300", titleAr: "من 200 إلى 300 م²", titleEn: "200 to 300 m²", min: 201, max: 300 },
  { id: "more-than-300", titleAr: "أكثر من 300 م²", titleEn: "More than 300 m²", min: 301, max: null },
];

function getProjectTitle(project: CmsProject, lang: "ar" | "en") {
  return lang === "ar" ? project.nameAr || project.name : project.name || project.nameAr;
}

function getProjectType(project: CmsProject, lang: "ar" | "en") {
  return lang === "ar" ? project.typeAr || project.type : project.type || project.typeAr;
}

function getProjectDesc(project: CmsProject, lang: "ar" | "en") {
  return lang === "ar" ? project.descAr || project.desc : project.desc || project.descAr;
}

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
    return <iframe src={getYoutubeEmbed(videoUrl)} title={project.nameAr || project.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />;
  }
  if (project.videoSourceType === "vimeo") {
    return <iframe src={getVimeoEmbed(videoUrl)} title={project.nameAr || project.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />;
  }
  return <video src={videoUrl} controls autoPlay className="h-full w-full object-contain" />;
}

const ITEMS_PER_PAGE = 6;

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isAr,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isAr: boolean;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
      {/* Previous Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all duration-300",
          currentPage === 1
            ? "border-white/5 bg-white/0 text-white/30 cursor-not-allowed"
            : "border-gold/30 bg-[#0C363A]/40 text-gold hover:bg-gold hover:text-[#061F22] hover:border-gold shadow-md"
        )}
      >
        {isAr ? (
          <>
            <ChevronRight size={16} />
            <span>السابق</span>
          </>
        ) : (
          <>
            <ChevronLeft size={16} />
            <span>Previous</span>
          </>
        )}
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5">
        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "h-9 w-9 rounded-lg border text-xs font-bold transition-all duration-300 flex items-center justify-center",
                isActive
                  ? "border-gold bg-gold text-[#061F22] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "border-white/10 bg-[#0C363A]/20 text-white/70 hover:border-gold/50 hover:bg-[#0C363A]/60 hover:text-white"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all duration-300",
          currentPage === totalPages
            ? "border-white/5 bg-white/0 text-white/30 cursor-not-allowed"
            : "border-gold/30 bg-[#0C363A]/40 text-gold hover:bg-gold hover:text-[#061F22] hover:border-gold shadow-md"
        )}
      >
        {isAr ? (
          <>
            <span>التالي</span>
            <ChevronLeft size={16} />
          </>
        ) : (
          <>
            <span>Next</span>
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

export default function Portfolio() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [items, setItems] = useState<CmsProject[]>(() => fallbackProjects());
  const [activeTab, setActiveTab] = useState<"designs" | "execution">("designs");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<CmsProject | null>(null);
  const [activeVideo, setActiveVideo] = useState<CmsProject | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [designsPage, setDesignsPage] = useState(1);
  const [executionPage, setExecutionPage] = useState(1);
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setSelectedArea(null);
    setActiveProject(null);
    setActiveVideo(null);
    setActiveImage(null);
    setDesignsPage(1);
    setExecutionPage(1);
    setSelectedApartment(null);
  }, [activeTab]);

  useEffect(() => {
    setDesignsPage(1);
  }, [selectedArea]);

  useEffect(() => {
    setSelectedApartment(null);
  }, [activeProject]);

  useEffect(() => {
    const hasModal = activeProject || activeVideo || activeImage;
    document.body.style.overflow = hasModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeProject, activeVideo, activeImage]);

  const designProjects = useMemo(
    () => items.filter((item) => item.portfolioKind === "design" || item.kind === "img").sort((a, b) => a.id.localeCompare(b.id)),
    [items]
  );

  const executionVideos = useMemo(
    () => items.filter((item) => item.portfolioKind === "execution" || !!item.videoUrl).sort((a, b) => a.id.localeCompare(b.id)),
    [items]
  );

  const selectedRange = areaRanges.find((range) => range.id === selectedArea) || null;
  const selectedProjects = selectedArea ? designProjects.filter((project) => project.areaRange === selectedArea) : [];
  
  const paginatedDesigns = useMemo(() => {
    const startIndex = (designsPage - 1) * ITEMS_PER_PAGE;
    return selectedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [selectedProjects, designsPage]);

  const designsTotalPages = Math.max(1, Math.ceil(selectedProjects.length / ITEMS_PER_PAGE));

  const paginatedExecution = useMemo(() => {
    const startIndex = (executionPage - 1) * ITEMS_PER_PAGE;
    return executionVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [executionVideos, executionPage]);

  const executionTotalPages = Math.max(1, Math.ceil(executionVideos.length / ITEMS_PER_PAGE));

  const gallery = activeProject?.images?.length ? activeProject.images : [activeProject?.img || activeProject?.cover].filter(Boolean) as string[];

  const isGroupedByApartments = useMemo(() => {
    if (!activeProject?.mediaItems) return false;
    const images = activeProject.mediaItems.filter(item => item.media_type === "image");
    return images.some(item => item.role && item.role !== "gallery" && item.role !== "cover");
  }, [activeProject]);

  const apartmentGroups = useMemo(() => {
    if (!activeProject?.mediaItems) return {};
    const images = activeProject.mediaItems.filter(item => item.media_type === "image");
    const groups: Record<string, typeof images> = {};
    images.forEach(item => {
      const role = (item.role && item.role !== "gallery" && item.role !== "cover") 
        ? item.role 
        : (isAr ? "معرض الصور العام" : "General Gallery");
      if (!groups[role]) groups[role] = [];
      groups[role].push(item);
    });
    return groups;
  }, [activeProject, isAr]);

  const apartmentImages = useMemo(() => {
    if (!activeProject || !selectedApartment || !isGroupedByApartments) return [];
    return apartmentGroups[selectedApartment]?.map(item => item.url) || [];
  }, [activeProject, selectedApartment, isGroupedByApartments, apartmentGroups]);

  const activeGallery = isGroupedByApartments && selectedApartment ? apartmentImages : gallery;

  const pdfFiles = activeProject?.pdfFiles?.length
    ? activeProject.pdfFiles
    : activeProject?.pdf
    ? [{ title: isAr ? "ملف المشروع PDF" : "Project PDF", url: activeProject.pdf }]
    : [];

  return (
    <div className="min-h-screen bg-[#061F22] text-white" dir={isAr ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#061F22] via-[#0C363A] to-[#061F22] pt-44 pb-20 md:pt-52 md:pb-24">
        <div className="absolute inset-0 arch-grid opacity-20" />
        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/marble-similar.png")' }} />
        <div className="container-luxe relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 flex items-center justify-center gap-4">
                <span className="h-px w-12 bg-gold/60" />
                <span className="text-xs font-bold tracking-[0.28em] text-gold">{isAr ? "معرض أعمالنا" : "Our Gallery"}</span>
                <span className="h-px w-12 bg-gold/60" />
              </div>
              <h1 className="font-serif-ar text-4xl font-bold leading-tight text-white md:text-7xl">
                {isAr ? "سابقة أعمال تتحدى تفاصيلها" : "Portfolio That Defies Details"}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-white/72 md:text-lg">
                {isAr
                  ? "تجربة منظمة تفصل بين التصاميم المقسمة حسب المساحات وفيديوهات التنفيذ الفعلي على أرض الواقع، لتصل إلى ما تبحث عنه بوضوح."
                  : "A clearer experience separating area-based designs from real execution videos, so every visitor reaches the right work quickly."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative z-20 -mt-10 pb-24">
        <div className="container-luxe">
          <Reveal>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-[#08282C]/60 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveTab("designs")}
                className={cn(
                  "group text-start rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[190px] overflow-hidden border",
                  activeTab === "designs"
                    ? "bg-gradient-to-br from-[#0F3D42] to-[#0A2629] border-gold shadow-[0_15px_40px_rgba(212,175,55,0.18)] ring-1 ring-gold/40 text-white"
                    : "bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-lg hover:shadow-black/20 text-white/70 hover:text-white"
                )}
              >
                {/* Decorative Abstract Background Elements */}
                <div className={cn(
                  "absolute -right-16 -bottom-16 w-36 h-36 rounded-full transition-all duration-700 blur-[40px] pointer-events-none",
                  activeTab === "designs" ? "bg-gold/15" : "bg-white/5 group-hover:bg-gold/10"
                )} />
                <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Header: Project Count & Active Badge */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className={cn(
                    "text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-sm transition-all duration-300",
                    activeTab === "designs"
                      ? "bg-gold/15 text-gold border-gold/30"
                      : "bg-white/5 text-white/60 border-white/10 group-hover:text-gold/80 group-hover:border-gold/20"
                  )}>
                    {designProjects.length} {isAr ? "مشروع متاح" : "Projects"}
                  </span>
                  
                  {activeTab === "designs" && (
                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 tracking-wider">
                      {isAr ? "نشط" : "ACTIVE"}
                    </span>
                  )}
                </div>

                {/* Body: Tab Name & Desc */}
                <div className="mt-6 relative z-10">
                  <div className={cn(
                    "h-0.5 rounded-full bg-gold transition-all duration-500 mb-3",
                    activeTab === "designs" ? "w-12" : "w-6 group-hover:w-12"
                  )} />
                  
                  <h3 className="font-serif-ar text-2xl font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gold text-white">
                    {isAr ? "تصميمات هندسية" : "Engineering Designs"}
                  </h3>
                  
                  <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {isAr
                      ? "تصفح مشاريعنا وتصاميمنا الهندسية الجاهزة والمقسمة بعناية فائقة حسب المساحة."
                      : "Browse our ready engineering designs, organized by area sizes."}
                  </p>
                </div>

                {/* Footer Action text */}
                <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs relative z-10">
                  <span className={cn(
                    "font-bold transition-all duration-300",
                    activeTab === "designs" ? "text-gold tracking-wide" : "text-white/40 group-hover:text-white/80"
                  )}>
                    {activeTab === "designs"
                      ? (isAr ? "تم تحديد معرض التصاميم" : "Selected designs exhibition")
                      : (isAr ? "اضغط لفتح هذا المعرض" : "Click to view exhibition")
                    }
                  </span>
                  <span className={cn(
                    "transition-all duration-300 transform",
                    activeTab === "designs" ? "text-gold translate-x-[-4px]" : "text-white/40 group-hover:text-gold group-hover:translate-x-[-4px]"
                  )}>
                    {isAr ? "←" : "→"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("execution")}
                className={cn(
                  "group text-start rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[190px] overflow-hidden border",
                  activeTab === "execution"
                    ? "bg-gradient-to-br from-[#0F3D42] to-[#0A2629] border-gold shadow-[0_15px_40px_rgba(212,175,55,0.18)] ring-1 ring-gold/40 text-white"
                    : "bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-lg hover:shadow-black/20 text-white/70 hover:text-white"
                )}
              >
                {/* Decorative Abstract Background Elements */}
                <div className={cn(
                  "absolute -right-16 -bottom-16 w-36 h-36 rounded-full transition-all duration-700 blur-[40px] pointer-events-none",
                  activeTab === "execution" ? "bg-gold/15" : "bg-white/5 group-hover:bg-gold/10"
                )} />
                <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Header: Project Count & Active Badge */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className={cn(
                    "text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-sm transition-all duration-300",
                    activeTab === "execution"
                      ? "bg-gold/15 text-gold border-gold/30"
                      : "bg-white/5 text-white/60 border-white/10 group-hover:text-gold/80 group-hover:border-gold/20"
                  )}>
                    {executionVideos.length} {isAr ? "فيديو متاح" : "Videos"}
                  </span>
                  
                  {activeTab === "execution" && (
                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 tracking-wider">
                      {isAr ? "نشط" : "ACTIVE"}
                    </span>
                  )}
                </div>

                {/* Body: Tab Name & Desc */}
                <div className="mt-6 relative z-10">
                  <div className={cn(
                    "h-0.5 rounded-full bg-gold transition-all duration-500 mb-3",
                    activeTab === "execution" ? "w-12" : "w-6 group-hover:w-12"
                  )} />
                  
                  <h3 className="font-serif-ar text-2xl font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gold text-white">
                    {isAr ? "تنفيذ بالفعل" : "Executed in Reality"}
                  </h3>
                  
                  <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {isAr
                      ? "شاهد جودة وواقعية تشطيباتنا وعملنا على أرض الواقع موثقاً بالفيديو خطوة بخطوة."
                      : "Watch our real-life finishing works and execution step by step on video."}
                  </p>
                </div>

                {/* Footer Action text */}
                <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs relative z-10">
                  <span className={cn(
                    "font-bold transition-all duration-300",
                    activeTab === "execution" ? "text-gold tracking-wide" : "text-white/40 group-hover:text-white/80"
                  )}>
                    {activeTab === "execution"
                      ? (isAr ? "تم تحديد معرض التنفيذ الفعلي" : "Selected execution exhibition")
                      : (isAr ? "اضغط لفتح هذا المعرض" : "Click to view exhibition")
                    }
                  </span>
                  <span className={cn(
                    "transition-all duration-300 transform",
                    activeTab === "execution" ? "text-gold translate-x-[-4px]" : "text-white/40 group-hover:text-gold group-hover:translate-x-[-4px]"
                  )}>
                    {isAr ? "←" : "→"}
                  </span>
                </div>
              </button>
            </div>
          </Reveal>

          <div className="mt-10 min-h-[560px] rounded-2xl border border-white/10 bg-[#08282C]/60 backdrop-blur-xl p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-8">
            {activeTab === "designs" && (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/68">
                    <button type="button" onClick={() => setSelectedArea(null)} className={cn("transition-colors hover:text-gold", !selectedArea && "text-gold")}>
                      {isAr ? "تصميمات" : "Designs"}
                    </button>
                    {selectedRange && (
                      <>
                        {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        <span className="text-white">{isAr ? selectedRange.titleAr : selectedRange.titleEn}</span>
                      </>
                    )}
                  </div>
                  {selectedArea && (
                    <button type="button" onClick={() => setSelectedArea(null)} className="inline-flex items-center gap-2 rounded-md border border-gold/30 px-4 py-2 text-xs font-bold text-gold transition hover:bg-gold hover:text-[#061F22]">
                      {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                      {isAr ? "العودة للمساحات" : "Back to Areas"}
                    </button>
                  )}
                </div>

                {!selectedArea ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {areaRanges.map((range, index) => {
                      const count = designProjects.filter((project) => project.areaRange === range.id).length;
                      return (
                        <Reveal key={range.id} delay={index * 80}>
                          <button
                            type="button"
                            onClick={() => setSelectedArea(range.id)}
                            className="group h-full w-full rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[190px] overflow-hidden border bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-xl hover:shadow-black/20 text-start"
                          >
                            {/* Decorative Ambient Glow & Top line */}
                            <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-white/5 group-hover:bg-gold/10 transition-all duration-700 blur-[40px] pointer-events-none" />
                            <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            {/* Header: Area label or custom meta */}
                            <div className="flex items-center justify-between w-full relative z-10">
                              <span className="text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-sm bg-white/5 text-white/60 border-white/10 group-hover:text-gold/80 group-hover:border-gold/20 transition-all duration-300">
                                {isAr ? "مساحات مخصصة" : "CUSTOM AREAS"}
                              </span>
                              <span className="text-[10px] font-bold text-gold/70 bg-gold/5 px-2 py-0.5 rounded border border-gold/10 tracking-wider">
                                TACT
                              </span>
                            </div>

                            {/* Body: Area range title & Project count */}
                            <div className="mt-6 relative z-10">
                              <div className="h-0.5 rounded-full bg-gold transition-all duration-500 mb-3 w-6 group-hover:w-12" />
                              
                              <h2 className="font-serif-ar text-2xl text-white font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gold">
                                {isAr ? range.titleAr : range.titleEn}
                              </h2>
                              
                              <p className="text-xs text-white/50 mt-1 leading-relaxed font-sans">
                                {isAr
                                  ? `${count} مشروع متكامل تم تصميمه بعناية فائقة.`
                                  : `${count} premium projects custom-designed.`}
                              </p>
                            </div>

                            {/* Footer Action banner with gliding arrow */}
                            <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs relative z-10">
                              <span className="font-bold text-white/40 group-hover:text-[#D4AF37] transition-all duration-300">
                                {isAr ? "تصفح المشاريع الهندسية" : "Browse engineering designs"}
                              </span>
                              <span className="text-white/40 group-hover:text-[#D4AF37] transition-all duration-300 transform group-hover:translate-x-[-4px]">
                                {isAr ? "←" : "→"}
                              </span>
                            </div>
                          </button>
                        </Reveal>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {paginatedDesigns.length ? paginatedDesigns.map((project, index) => {
                        const areaNum = parseAreaNumber(project.area) || project.area || "150";
                        return (
                          <Reveal key={project.id} delay={(index % 3) * 90}>
                            <div
                              role="button"
                              onClick={() => setActiveProject(project)}
                              className="group cursor-pointer text-start relative overflow-hidden rounded-2xl border border-white/10 bg-[#0C363A]/25 backdrop-blur-md text-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-2xl flex flex-col justify-between"
                            >
                              {/* Glowing luxury top line */}
                              <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                              
                              {/* Glowing bottom corner aura bubble */}
                              <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-white/5 group-hover:bg-gold/10 transition-all duration-700 blur-[35px] pointer-events-none z-0" />
                              
                              <div>
                                <div className="relative aspect-[4/3] overflow-hidden bg-[#061F22]">
                                  <img
                                    src={project.img || project.cover || "/placeholder.svg"}
                                    alt={getProjectTitle(project, lang)}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover image-crisp brightness-[1.08] contrast-[1.05] transition-transform duration-[800ms] group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                                  
                                  {/* Luxury hand-drawn style Badges */}
                                  <span className="absolute top-4 start-4 bg-black/55 backdrop-blur-md text-white text-[9px] font-mono px-2.5 py-1 rounded-md border border-white/10 tracking-[0.15em] uppercase font-bold z-10 shadow-lg">
                                    TECHNICAL CATALOG
                                  </span>
                                  
                                  <span className="absolute top-4 end-4 bg-gold/90 text-[#061F22] text-[10px] font-extrabold px-3 py-1 rounded-md border border-gold/30 shadow-lg tracking-wider z-10">
                                    n° {areaNum}
                                  </span>
                                </div>

                                <div className="p-6 relative z-10 flex flex-col">
                                  <div className="mb-4">
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border bg-white/5 border-white/10 text-gold/80 inline-block">
                                      {getProjectType(project, lang)}
                                    </span>
                                  </div>
                                  
                                  <h3 className="font-serif-ar text-2xl font-extrabold leading-snug text-white group-hover:text-gold transition-colors duration-300 mb-3">
                                    {getProjectTitle(project, lang)}
                                  </h3>
                                  
                                  <p className="text-xs text-white/50 leading-relaxed font-sans line-clamp-3 min-h-[3.6rem] mb-4">
                                    {getProjectDesc(project, lang) || (isAr ? "تفاصيل المشروع متاحة داخل العرض." : "Project details are available inside.")}
                                  </p>
                                </div>
                              </div>

                              <div className="px-6 pb-6 pt-3 relative z-10">
                                <div className="pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs font-bold text-gold group-hover:text-white transition-colors duration-300">
                                  <span>{isAr ? "عرض تفاصيل المشروع" : "View Project Details"}</span>
                                  <span className="transform group-hover:translate-x-[-4px] transition-transform duration-300">
                                    {isAr ? "←" : "→"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Reveal>
                        );
                      }) : (
                        <div className="col-span-full rounded-lg border border-dashed border-gold/30 bg-white/[0.04] p-10 text-center text-white/65">
                          {isAr ? "هذه المساحة جاهزة لإضافة المشاريع والصور من لوحة التحكم لاحقًا." : "This area is ready for projects and images to be added from the admin panel later."}
                        </div>
                      )}
                    </div>

                    <Pagination
                      currentPage={designsPage}
                      totalPages={designsTotalPages}
                      onPageChange={setDesignsPage}
                      isAr={isAr}
                    />
                  </>
                )}
              </>
            )}

            {activeTab === "execution" && (
              <>
                <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-5 text-sm text-white/68">
                  <span className="text-gold">{isAr ? "تنفيذ بالفعل" : "Executed"}</span>
                  {activeVideo && (
                    <>
                      {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      <span className="text-white">{getProjectTitle(activeVideo, lang)}</span>
                    </>
                  )}
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedExecution.length ? paginatedExecution.map((project, index) => {
                    const areaNum = parseAreaNumber(project.area) || project.area || "150";
                    return (
                      <Reveal key={project.id} delay={(index % 3) * 90}>
                        <div
                          role="button"
                          onClick={() => setActiveVideo(project)}
                          className="group cursor-pointer text-start relative overflow-hidden rounded-2xl border border-white/10 bg-[#0C363A]/25 backdrop-blur-md shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-2xl flex flex-col justify-between"
                        >
                          {/* Glowing luxury top line */}
                          <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                          
                          {/* Glowing bottom corner aura bubble */}
                          <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-white/5 group-hover:bg-gold/10 transition-all duration-700 blur-[35px] pointer-events-none z-0" />
                          
                          <div>
                            <div className="relative aspect-video overflow-hidden bg-black">
                              <img
                                src={project.cover || project.img || "/placeholder.svg"}
                                alt={getProjectTitle(project, lang)}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover image-crisp brightness-[1.1] contrast-[1.05] transition-transform duration-[800ms] group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                              
                              {/* Play Button Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/55 transition-all duration-300">
                                <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-[#061F22] shadow-[0_0_42px_rgba(212,175,55,0.4)] transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]">
                                  <Play size={24} className="fill-current translate-x-0.5" />
                                </span>
                              </div>

                              {/* Luxury hand-drawn style Badges */}
                              <span className="absolute top-4 start-4 bg-black/55 backdrop-blur-md text-white text-[9px] font-mono px-2.5 py-1 rounded-md border border-white/10 tracking-[0.15em] uppercase font-bold z-10 shadow-lg">
                                VIDEO WALKTHROUGH
                              </span>
                              
                              <span className="absolute top-4 end-4 bg-gold/90 text-[#061F22] text-[10px] font-extrabold px-3 py-1 rounded-md border border-gold/30 shadow-lg tracking-wider z-10">
                                n° {areaNum}
                              </span>
                            </div>

                            <div className="p-6 relative z-10">
                              <div className="mb-4">
                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border bg-white/5 border-white/10 text-gold/80 inline-block">
                                  {getProjectType(project, lang) || (isAr ? "تنفيذ وتشطيب" : "Execution")}
                                </span>
                              </div>
                              
                              <h3 className="font-serif-ar text-2xl font-extrabold leading-snug text-white group-hover:text-gold transition-colors duration-300 mb-3">
                                {getProjectTitle(project, lang)}
                              </h3>
                              
                              <p className="text-xs text-white/50 leading-relaxed font-sans line-clamp-2 min-h-[2.4rem] mb-4">
                                {getProjectDesc(project, lang) || (isAr ? "فيديو يوضح مراحل التنفيذ على أرض الواقع." : "A real execution walkthrough video.")}
                              </p>
                            </div>
                          </div>

                          <div className="px-6 pb-6 pt-3 relative z-10">
                            <div className="pt-3 border-t border-white/5 w-full flex items-center justify-between text-xs font-bold text-gold group-hover:text-white transition-colors duration-300">
                              <span>{isAr ? "تشغيل وعرض الفيديو" : "Play & View Video"}</span>
                              <span className="transform group-hover:translate-x-[-4px] transition-transform duration-300">
                                  {isAr ? "←" : "→"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    );
                  }) : (
                    <div className="col-span-full rounded-lg border border-dashed border-gold/30 bg-white/[0.04] p-10 text-center text-white/65">
                      {isAr ? "لا توجد فيديوهات تنفيذ حاليًا." : "No execution videos yet."}
                    </div>
                  )}
                </div>

                <Pagination
                  currentPage={executionPage}
                  totalPages={executionTotalPages}
                  onPageChange={setExecutionPage}
                  isAr={isAr}
                />
              </>
            )}
          </div>

          <section className="relative overflow-hidden mt-16 rounded-2xl border border-white/10 bg-[#0C363A]/40 backdrop-blur-md p-8 text-center shadow-2xl md:p-14 group">
            {/* Glowing luxury top line */}
            <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
            
            {/* Glowing bottom corner aura bubble */}
            <div className="absolute -right-24 -bottom-24 w-52 h-52 rounded-full bg-gold/10 group-hover:bg-gold/15 transition-all duration-700 blur-[50px] pointer-events-none z-0" />
            
            <h2 className="font-serif-ar text-3xl font-bold text-white md:text-5xl relative z-10">
              {isAr ? "لديك مشروع في ذهنك؟" : "Have a project in mind?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/65 relative z-10">
              {isAr ? "شاركنا تفاصيل مساحتك لنصمم وننفذ تجربة تليق بتوقعاتك." : "Share your space details and we will shape the right design and execution experience."}
            </p>
            <div className="relative z-10 flex justify-center mt-8">
              <Link to="/contact" className="btn-gold group/btn flex items-center gap-2">
                {isAr ? "ابدأ مشروعك الآن" : "Start Your Project"}
                <span className={cn("transform transition-transform duration-300", isAr ? "group-hover/btn:translate-x-[-4px]" : "group-hover/btn:translate-x-[4px]")}>
                  {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </span>
              </Link>
            </div>
          </section>
        </div>
      </section>

      {activeProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-8">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#061F22]/95 backdrop-blur-xl" onClick={() => setActiveProject(null)} />
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-gold/35 bg-[#F8F5EF] text-[#0C363A] shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
            <button type="button" onClick={() => setActiveProject(null)} className="absolute left-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-[#0C363A] text-gold transition hover:bg-gold hover:text-[#061F22]">
              <X size={20} />
            </button>
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="bg-[#061F22] p-4 md:p-6">
                {isGroupedByApartments && !selectedApartment ? (
                  /* Apartments Grid Layout */
                  <div className="h-full flex flex-col justify-center py-4">
                    <h3 className="text-gold text-xs uppercase tracking-wider font-extrabold mb-5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                      {isAr ? "شقق ومساحات المشروع الفرعية" : "Project Apartments & Subfolders"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[62vh] overflow-y-auto pr-1 select-none scrollbar-none">
                      {Object.entries(apartmentGroups).map(([roleName, items], idx) => {
                        const coverUrl = items[0]?.url || "/placeholder.svg";
                        return (
                          <button
                            key={roleName}
                            type="button"
                            onClick={() => setSelectedApartment(roleName)}
                            className="group relative h-44 rounded-xl overflow-hidden border border-white/10 hover:border-gold/50 bg-[#0C363A]/30 text-start flex flex-col justify-end p-5 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(212,175,55,0.18)] active:scale-[0.98]"
                          >
                            <img
                              src={coverUrl}
                              alt={roleName}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.78] group-hover:brightness-[0.9]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-transparent" />
                            
                            <div className="relative z-10">
                              <span className="inline-block text-[9px] bg-gold text-[#061F22] font-mono px-2.5 py-0.5 rounded font-extrabold tracking-wider mb-2.5 shadow-md">
                                {items.length} {isAr ? "صورة" : "PHOTOS"}
                              </span>
                              <h4 className="font-serif-ar text-xl font-bold text-white group-hover:text-gold transition-colors duration-300 truncate">
                                {roleName}
                              </h4>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Standard Image + Thumbnails (or single apartment view) */
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-gold/25 bg-black">
                      {isGroupedByApartments && selectedApartment && (
                        <button
                          type="button"
                          onClick={() => setSelectedApartment(null)}
                          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[#0C363A]/90 backdrop-blur-md text-gold border border-gold/40 px-3.5 py-2 rounded-xl text-xs font-bold transition hover:bg-gold hover:text-[#061F22] shadow-lg active:scale-95"
                        >
                          <span>{isAr ? "← العودة للشقق" : "← Back to Apartments"}</span>
                        </button>
                      )}
                      <img src={activeGallery[0] || activeProject.img || activeProject.cover || "/placeholder.svg"} alt={getProjectTitle(activeProject, lang)} className="h-full w-full object-contain image-crisp bg-[#061F22]" decoding="async" />
                      <button type="button" onClick={() => setActiveImage(activeGallery[0])} className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-md bg-white/92 px-4 py-2 text-xs font-bold text-[#0C363A] transition hover:bg-gold">
                        <Maximize2 size={14} />
                        {isAr ? "تكبير الصورة" : "Open"}
                      </button>
                    </div>
                    {activeGallery.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-5">
                        {activeGallery.map((src, index) => (
                          <button key={`${src}-${index}`} type="button" onClick={() => setActiveImage(src)} className="aspect-square overflow-hidden rounded-md border border-gold/20 bg-white/5 transition hover:border-gold">
                            <img
                              src={src}
                              alt=""
                              className="h-full w-full object-cover image-crisp"
                              decoding="async"
                              onError={(e) => {
                                (e.currentTarget.closest("button") as HTMLElement | null)?.remove();
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-6 md:p-9">
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#0C363A]/60">
                  <span>{isAr ? "تصميمات" : "Designs"}</span>
                  {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  <span>{selectedRange ? (isAr ? selectedRange.titleAr : selectedRange.titleEn) : activeProject.area}</span>
                  {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  <span className="text-gold-deep">{getProjectTitle(activeProject, lang)}</span>
                </div>
                <h2 className="font-serif-ar text-3xl font-bold leading-tight md:text-5xl">{getProjectTitle(activeProject, lang)}</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#0C363A] px-3 py-2 text-xs font-bold text-gold"><Ruler size={14} />{activeProject.area || (isAr ? "مساحة غير محددة" : "Area TBD")}</span>
                  <span className="inline-flex items-center gap-2 rounded-md border border-gold/25 px-3 py-2 text-xs font-bold text-[#0C363A]"><ImageIcon size={14} />{getProjectType(activeProject, lang)}</span>
                </div>
                <p className="mt-7 text-base leading-8 text-[#0C363A]/75">{getProjectDesc(activeProject, lang) || (isAr ? "وصف المشروع سيظهر هنا عند إضافته من لوحة التحكم." : "Project description will appear here when added from admin.")}</p>
                {pdfFiles.length > 0 && (
                  <div className="mt-8 rounded-lg border border-gold/25 bg-white p-4">
                    <h3 className="mb-4 flex items-center gap-2 font-serif-ar text-lg font-bold"><FileText size={18} className="text-gold-deep" />{isAr ? "ملفات المشروع" : "Project Files"}</h3>
                    <div className="space-y-3">
                      {pdfFiles.map((file, index) => (
                        <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-md border border-[#0C363A]/10 px-4 py-3 text-sm font-bold transition hover:border-gold hover:bg-gold/10">
                          <span>{file.title}</span>
                          <Download size={16} className="text-gold-deep" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeVideo && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-3 md:p-10">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#061F22]/96 backdrop-blur-xl" onClick={() => setActiveVideo(null)} />
          <div className="relative w-full max-w-6xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/72">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gold">{isAr ? "تنفيذ بالفعل" : "Executed"}</span>
                {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                <span>{getProjectTitle(activeVideo, lang)}</span>
              </div>
              <button type="button" onClick={() => setActiveVideo(null)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-[#061F22]">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg border border-gold/40 bg-black shadow-[0_35px_100px_rgba(0,0,0,0.5)]">
              <VideoPlayer project={activeVideo} />
            </div>
          </div>
        </div>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/95 p-4">
          <button type="button" aria-label="Close" className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-[#061F22]" onClick={() => setActiveImage(null)}>
            <X size={20} />
          </button>
          <img src={activeImage} alt="" className="max-h-[88vh] max-w-[94vw] rounded-md object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}
