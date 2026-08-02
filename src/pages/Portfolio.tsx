import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/layout/SEO";
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
  Pause,
  Ruler,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import HoverPreview from "@/components/ui-luxe/HoverPreview";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects, parseAreaNumber, CmsAreaRange, defaultAreaRanges, getCmsAreaRanges } from "@/lib/publicCms";

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
  const [areaRanges, setAreaRanges] = useState<CmsAreaRange[]>(defaultAreaRanges);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [designsPage, setDesignsPage] = useState(1);
  const [executionPage, setExecutionPage] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tour360Open, setTour360Open] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [activeHoverPreview, setActiveHoverPreview] = useState<{ url: string; label: string } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectParam = searchParams.get("project");
  const apartmentParam = searchParams.get("apartment");
  const imageParam = searchParams.get("image");
  const videoParam = searchParams.get("video");

  // Derive activeProject
  const activeProject = useMemo(() => {
    if (!projectParam) return null;
    return items.find((p) => p.id === projectParam) || null;
  }, [projectParam, items]);

  // Derive activeVideo
  const activeVideo = useMemo(() => {
    if (!videoParam) return null;
    return items.find((p) => p.id === videoParam) || null;
  }, [videoParam, items]);

  const selectedApartment = apartmentParam;

  const isGroupedByApartments = useMemo(() => {
    if (!activeProject?.mediaItems) return false;
    const images = activeProject.mediaItems.filter(item => item.media_type === "image");
    return images.some(item => !!item.title_ar || !!item.title_en || (item.role && item.role !== "gallery" && item.role !== "cover"));
  }, [activeProject]);

  const apartmentGroups = useMemo(() => {
    if (!activeProject?.mediaItems) return {};
    const images = activeProject.mediaItems.filter(item => item.media_type === "image");
    const groups: Record<string, typeof images> = {};
    images.forEach(item => {
      const role = (item.role && item.role !== "gallery" && item.role !== "cover") 
        ? item.role 
        : (isAr ? "معرض الصور العام" : "General Gallery");
      const displayName = (isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar) || role;
      if (!groups[displayName]) groups[displayName] = [];
      groups[displayName].push(item);
    });
    return groups;
  }, [activeProject, isAr]);

  const apartmentImages = useMemo(() => {
    if (!activeProject || !selectedApartment || !isGroupedByApartments) return [];
    return apartmentGroups[selectedApartment]?.map(item => item.url) || [];
  }, [activeProject, selectedApartment, isGroupedByApartments, apartmentGroups]);

  const combinedGallery = useMemo(() => {
    if (!activeProject) return [];
    
    // Get Video if present
    const projectVideo = activeProject.videoUrl
      ? [{ type: "video" as const, url: activeProject.videoUrl, title: isAr ? "فيديو التنفيذ" : "Execution Video" }]
      : [];
    
    // Get images
    let projectImages: { type: "image"; url: string; title?: string }[] = [];
    if (activeProject.mediaItems && activeProject.mediaItems.length > 0) {
      const imgItems = activeProject.mediaItems.filter(item => item.media_type === "image");
      if (imgItems.length > 0) {
        projectImages = imgItems.map(item => ({
          type: "image" as const,
          url: item.url,
          title: (isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar) || 
                 ((item.role && item.role !== "gallery" && item.role !== "cover") ? item.role : undefined)
        }));
      }
    }
    
    // Fallback if mediaItems has no images
    if (projectImages.length === 0) {
      if (activeProject.images && activeProject.images.length > 0) {
        projectImages = activeProject.images.map(img => ({ type: "image" as const, url: img }));
      } else if (activeProject.img || activeProject.cover) {
        projectImages = [activeProject.img || activeProject.cover].filter(Boolean).map(img => ({ type: "image" as const, url: img as string }));
      }
    }

    // Get PDFs
    const projectPdfs = activeProject.pdfFiles?.length
      ? activeProject.pdfFiles.map(pdf => ({ type: "pdf" as const, url: pdf.url, title: pdf.title }))
      : activeProject.pdf
      ? [{ type: "pdf" as const, url: activeProject.pdf, title: isAr ? "ملف المشروع PDF" : "Project PDF" }]
      : [];

    return [...projectVideo, ...projectImages, ...projectPdfs];
  }, [activeProject, isAr]);

  const activeImage = imageParam !== null && combinedGallery[currentImageIndex]?.type === "image"
    ? (combinedGallery[currentImageIndex]?.url || activeProject?.img || activeProject?.cover || "/placeholder.svg")
    : null;

  const imagesOnly = useMemo(() => {
    return combinedGallery.filter(item => item.type === "image");
  }, [combinedGallery]);

  const activeGallery = useMemo(() => {
    return imagesOnly.map(item => item.url);
  }, [imagesOnly]);

  const fullscreenIndex = useMemo(() => {
    if (!activeImage) return -1;
    return imagesOnly.findIndex(img => img.url === activeImage);
  }, [imagesOnly, activeImage]);

  // Zoom & Pan Interactive States
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Autoplay State
  const [isAutoplay, setIsAutoplay] = useState(true);

  const handleNextLightboxImage = () => {
    if (!imagesOnly.length) return;
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    const nextIdx = (fullscreenIndex + 1) % imagesOnly.length;
    const nextImage = imagesOnly[nextIdx];
    const combinedIdx = combinedGallery.findIndex(item => item.url === nextImage.url);
    if (combinedIdx !== -1) {
      setCurrentImageIndex(combinedIdx);
      if (imageParam !== null) {
        const next = new URLSearchParams(searchParams);
        next.set("image", String(combinedIdx));
        setSearchParams(next, { replace: true });
      }
    }
  };

  const handlePrevLightboxImage = () => {
    if (!imagesOnly.length) return;
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    const prevIdx = fullscreenIndex === 0 ? imagesOnly.length - 1 : fullscreenIndex - 1;
    const prevImage = imagesOnly[prevIdx];
    const combinedIdx = combinedGallery.findIndex(item => item.url === prevImage.url);
    if (combinedIdx !== -1) {
      setCurrentImageIndex(combinedIdx);
      if (imageParam !== null) {
        const next = new URLSearchParams(searchParams);
        next.set("image", String(combinedIdx));
        setSearchParams(next, { replace: true });
      }
    }
  };

  // Mouse/Touch Drag Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setZoomOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - zoomOffset.x, y: touch.clientY - zoomOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setZoomOffset({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleImageDoubleClick = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setZoomOffset({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
      setZoomOffset({ x: 0, y: 0 });
    }
  };

  // Memoized lists of designs vs execution
  const designProjects = useMemo(() => {
    return items.filter((p) => p.portfolioKind === "design");
  }, [items]);

  const executionVideos = useMemo(() => {
    return items.filter((p) => p.portfolioKind === "execution");
  }, [items]);

  const selectedRange = useMemo(() => {
    return areaRanges.find((r) => r.id === selectedArea) || null;
  }, [selectedArea, areaRanges]);

  const filteredDesigns = useMemo(() => {
    if (!selectedArea || !selectedRange) return designProjects;
    return designProjects.filter((p) => {
      const areaNum = parseAreaNumber(p.area);
      if (areaNum === null || Number.isNaN(areaNum)) return false;
      const minMatch = selectedRange.min === null || selectedRange.min === undefined || areaNum >= selectedRange.min;
      const maxMatch = selectedRange.max === null || selectedRange.max === undefined || areaNum <= selectedRange.max;
      return minMatch && maxMatch;
    });
  }, [designProjects, selectedArea, selectedRange]);

  const paginatedDesigns = useMemo(() => {
    const startIndex = (designsPage - 1) * ITEMS_PER_PAGE;
    return filteredDesigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDesigns, designsPage]);

  const designsTotalPages = useMemo(() => {
    return Math.ceil(filteredDesigns.length / ITEMS_PER_PAGE) || 1;
  }, [filteredDesigns]);

  const paginatedExecution = useMemo(() => {
    const startIndex = (executionPage - 1) * ITEMS_PER_PAGE;
    return executionVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [executionVideos, executionPage]);

  const executionTotalPages = useMemo(() => {
    return Math.ceil(executionVideos.length / ITEMS_PER_PAGE) || 1;
  }, [executionVideos]);

  const setActiveProject = (project: CmsProject | null) => {
    const next = new URLSearchParams(searchParams);
    if (project) {
      next.set("project", project.id);
    } else {
      next.delete("project");
      next.delete("apartment");
      next.delete("image");
    }
    setSearchParams(next);
  };

  const setActiveVideo = (project: CmsProject | null) => {
    const next = new URLSearchParams(searchParams);
    if (project) {
      next.set("video", project.id);
    } else {
      next.delete("video");
    }
    setSearchParams(next);
  };

  const setSelectedApartment = (apt: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (apt) {
      next.set("apartment", apt);
    } else {
      next.delete("apartment");
      next.delete("image");
    }
    setSearchParams(next);
  };

  const setActiveImage = (img: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (img !== null) {
      const idx = combinedGallery.findIndex(item => item.url === img);
      next.set("image", idx !== -1 ? String(idx) : "0");
    } else {
      next.delete("image");
    }
    setSearchParams(next);
  };

  const handleCloseProject = () => {
    setActiveProject(null);
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  const handleCloseApartment = () => {
    setSelectedApartment(null);
  };

  const handleCloseImage = () => {
    setActiveImage(null);
  };

  useEffect(() => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
  }, [activeImage]);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setItems(rows);
    });
    getCmsAreaRanges().then((ranges) => {
      if (alive) setAreaRanges(ranges);
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
    setCurrentImageIndex(0);
  }, [activeTab]);

  useEffect(() => {
    setDesignsPage(1);
  }, [selectedArea]);

  useEffect(() => {
    setSelectedApartment(null);
    setCurrentImageIndex(0);
  }, [activeProject]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedApartment]);

  // Keep currentImageIndex in sync with imageParam in URL
  useEffect(() => {
    if (imageParam !== null) {
      const idx = parseInt(imageParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < combinedGallery.length) {
        setCurrentImageIndex(idx);
      }
    } else {
      setCurrentImageIndex(0);
    }
  }, [imageParam, combinedGallery]);

  useEffect(() => {
    const hasModal = activeProject || activeVideo || activeImage || tour360Open;
    document.body.style.overflow = hasModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeProject, activeVideo, activeImage, tour360Open]);

  const handleNextImage = () => {
    if (!combinedGallery.length) return;
    const nextIndex = currentImageIndex === combinedGallery.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(nextIndex);
    if (imageParam !== null) {
      const next = new URLSearchParams(searchParams);
      next.set("image", String(nextIndex));
      setSearchParams(next, { replace: true });
    }
  };

  const handlePrevImage = () => {
    if (!combinedGallery.length) return;
    const prevIndex = currentImageIndex === 0 ? combinedGallery.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    if (imageParam !== null) {
      const next = new URLSearchParams(searchParams);
      next.set("image", String(prevIndex));
      setSearchParams(next, { replace: true });
    }
  };

  // Autoplay Interval Sync
  useEffect(() => {
    if (!isAutoplay || !activeProject || combinedGallery.length <= 1 || activeImage) return;
    if (combinedGallery[currentImageIndex]?.type === "video") return;
    const interval = setInterval(() => {
      handleNextImage();
    }, 4500); // Cycle every 4.5s
    return () => clearInterval(interval);
  }, [isAutoplay, activeProject, combinedGallery.length, currentImageIndex, activeImage]);

  // Keyboard navigation for active image fullscreen zoom / lightbox
  useEffect(() => {
    if (!activeImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextLightboxImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevLightboxImage();
      } else if (e.key === "Escape") {
        setActiveImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, handleNextLightboxImage, handlePrevLightboxImage]);

  const pdfFiles = activeProject?.pdfFiles?.length
    ? activeProject.pdfFiles
    : activeProject?.pdf
    ? [{ title: isAr ? "ملف المشروع PDF" : "Project PDF", url: activeProject.pdf }]
    : [];

  const seoTitle = isAr
    ? `${activeTab === "designs" ? "تصاميم هندسية وثلاثية الأبعاد" : "مشاريع تنفيذ واقعية"} | معرض أعمالنا`
    : `${activeTab === "designs" ? "3D Engineering Designs" : "Real Executed Projects"} | Our Portfolio`;

  const seoDesc = isAr
    ? "تصفح مشاريع شركة تاكت للتصميم والتشطيب في مصر. معرض أعمال متكامل يضم تصاميم ثلاثية الأبعاد مقسمة بالمساحات وفيديوهات تغطية التنفيذ الفعلي."
    : "Explore Tact Architecture portfolio in Egypt. Architectural 3D design galleries cataloged by area sizes and high-quality executed project walk-throughs.";

  return (
    <div className="min-h-screen bg-[#061F22] text-white" dir={isAr ? "rtl" : "ltr"}>
      <SEO 
        title={seoTitle} 
        description={seoDesc} 
        keywords={isAr ? "معرض أعمال تاكت, مشاريع تشطيب, تصميم داخلي مصر, فيديوهات تشطيب" : "Tact portfolio, design gallery Egypt, interior design projects, real execution cairo"}
      />
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
                      const count = designProjects.filter((project) => {
                        const areaNum = parseAreaNumber(project.area);
                        if (areaNum === null || Number.isNaN(areaNum)) return false;
                        const minMatch = range.min === null || range.min === undefined || areaNum >= range.min;
                        const maxMatch = range.max === null || range.max === undefined || areaNum <= range.max;
                        return minMatch && maxMatch;
                      }).length;
                      return (
                        <Reveal key={range.id} delay={index * 80}>
                          <button
                            type="button"
                            onClick={() => setSelectedArea(range.id)}
                            className="group h-full w-full rounded-2xl p-6 transition-all duration-500 relative flex flex-col justify-between min-h-[190px] overflow-hidden border bg-[#0C363A]/40 backdrop-blur-md border-white/10 hover:border-gold/50 hover:bg-[#0C363A]/80 hover:shadow-xl hover:shadow-black/20 text-start"
                          >
                            {range.imageUrl && (
                              <>
                                <img
                                  src={range.imageUrl}
                                  alt=""
                                  className="absolute inset-0 h-full w-full object-cover transition-all duration-[1000ms] ease-out group-hover:scale-110 pointer-events-none brightness-[0.65] group-hover:brightness-[0.75] contrast-[1.05] saturate-[1.05]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#051719] via-[#051719]/45 to-[#051719]/70 group-hover:from-[#051719]/95 group-hover:via-[#051719]/35 group-hover:to-[#051719]/65 transition-all duration-500 pointer-events-none z-0" />
                                <div className="absolute inset-0 border border-transparent group-hover:border-gold/30 rounded-2xl transition-all duration-500 pointer-events-none z-10" />
                              </>
                            )}
                            
                            {/* Decorative Ambient Glow & Top line */}
                            {!range.imageUrl && (
                              <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-white/5 group-hover:bg-gold/10 transition-all duration-700 blur-[40px] pointer-events-none" />
                            )}
                            <div className="absolute top-0 start-0 w-full h-1.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            {/* Header: Area label or custom meta */}
                            <div className="flex items-center justify-between w-full relative z-10">
                              <span className="text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-md bg-[#051719]/70 text-white/90 border-white/10 group-hover:text-gold group-hover:border-gold/30 transition-all duration-300 shadow-md">
                                {isAr ? "مساحات مخصصة" : "CUSTOM AREAS"}
                              </span>
                              <span className="text-[10px] font-bold text-gold bg-[#051719]/70 px-2 py-0.5 rounded border border-gold/20 tracking-wider backdrop-blur-md shadow-md">
                                TACT
                              </span>
                            </div>

                            {/* Body: Area range title & Project count */}
                            <div className="mt-6 relative z-10">
                              <div className="h-0.5 rounded-full bg-gold transition-all duration-500 mb-3 w-6 group-hover:w-12" />
                              
                              <h2 className="font-serif-ar text-2xl text-white font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gold [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]">
                                {isAr ? range.titleAr : range.titleEn}
                              </h2>
                              
                              <p className="text-xs text-white/90 mt-1 leading-relaxed font-sans font-medium [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                                {isAr
                                  ? `${count} مشروع متكامل تم تصميمه بعناية فائقة.`
                                  : `${count} premium projects custom-designed.`}
                              </p>
                            </div>

                            {/* Footer Action banner with gliding arrow */}
                            <div className="mt-6 pt-3 border-t border-white/10 w-full flex items-center justify-between text-xs relative z-10">
                              <span className="font-bold text-white/90 group-hover:text-gold transition-all duration-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                                {isAr ? "تصفح المشاريع الهندسية" : "Browse engineering designs"}
                              </span>
                              <span className="text-white/90 group-hover:text-gold transition-all duration-300 transform group-hover:translate-x-[-4px]">
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
                                    className="h-full w-full object-cover image-crisp brightness-[1.08] contrast-[1.05] transition-transform duration-[1200ms] ease-out group-hover:scale-110"
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
                          onClick={() => {
                            setActiveProject(project);
                            setCurrentImageIndex(0);
                            setIsAutoplay(false);
                          }}

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
                                className="h-full w-full object-cover image-crisp brightness-[1.1] contrast-[1.05] transition-transform duration-[1200ms] ease-out group-hover:scale-110"
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

      {activeProject && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-8">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#061F22]/95 backdrop-blur-xl" onClick={handleCloseProject} />
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-gold/35 bg-[#F8F5EF] text-[#0C363A] shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
            <style>{`
              @keyframes slideReveal {
                from {
                  opacity: 0;
                  transform: scale(0.98);
                  filter: blur(8px);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                  filter: blur(0);
                }
              }
              .animate-slide-reveal {
                animation: slideReveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>
            <button
              type="button"
              onClick={handleCloseProject}
              className="absolute top-4 inset-inline-end-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-[#0C363A] text-gold transition-all duration-300 hover:bg-gold hover:text-[#061F22] hover:scale-110 active:scale-95 shadow-lg"
            >
              <X size={20} />
            </button>
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="bg-[#061F22] p-4 md:p-6 flex flex-col justify-between">
                {false ? (
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
                    {combinedGallery.length > 1 && (
                      <div className="flex justify-center mb-4.5 select-none">
                        <div className="bg-[#0C363A]/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-bold text-gold border border-gold/35 shadow-lg">
                          {currentImageIndex + 1} / {combinedGallery.length}
                        </div>
                      </div>
                    )}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-gold/25 bg-black flex items-center justify-center">
                      {combinedGallery[currentImageIndex]?.title && (
                        <div className="absolute top-4 inset-inline-end-4 z-10 flex items-center gap-1.5 bg-[#0C363A]/90 backdrop-blur-md text-gold border border-gold/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg select-none">
                          <span>{combinedGallery[currentImageIndex].title}</span>
                        </div>
                      )}



                      {/* Main Image Slider arrows overlay */}
                      {combinedGallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAutoplay(false);
                              handlePrevImage();
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-gold border border-gold/25 transition-all hover:bg-gold hover:text-[#061F22] hover:scale-105 active:scale-90 shadow-md backdrop-blur-sm"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAutoplay(false);
                              handleNextImage();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-gold border border-gold/25 transition-all hover:bg-gold hover:text-[#061F22] hover:scale-105 active:scale-90 shadow-md backdrop-blur-sm"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}

                      {combinedGallery[currentImageIndex]?.type === "video" ? (
                        <div key={currentImageIndex} className="animate-slide-reveal w-full h-full flex items-center justify-center bg-black">
                          <VideoPlayer project={activeProject} />
                        </div>
                      ) : combinedGallery[currentImageIndex]?.type === "pdf" ? (
                        /* Unified PDF Slide Card */
                        <div key={currentImageIndex} className="animate-slide-reveal w-full aspect-[4/3] rounded-md border border-gold/25 bg-[#0C363A]/40 backdrop-blur-md flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden select-none">
                          {/* Background grid texture */}
                          <div className="absolute inset-0 arch-grid opacity-10 pointer-events-none" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

                          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                            <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-gold/30 bg-[#061F22] text-gold shadow-[0_0_35px_rgba(212,175,55,0.25)]">
                              <FileText size={40} className="stroke-[1.5]" />
                            </div>
                            
                            <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 font-bold px-3 py-1 rounded-full tracking-[0.2em] uppercase mb-4">
                              {isAr ? "مستند فني PDF" : "TECHNICAL DOCUMENT PDF"}
                            </span>

                            <h3 className="font-serif-ar text-xl md:text-2xl font-extrabold text-white mb-3 leading-snug">
                              {combinedGallery[currentImageIndex].title || (isAr ? "كتالوج الرسومات الفنية للمشروع" : "Project Technical Drawings Catalog")}
                            </h3>

                            <p className="text-xs text-white/50 leading-relaxed mb-8">
                              {isAr 
                                ? "يحتوي هذا الملف على المخططات التنفيذية، المساقط الأفقية، وتوزيع الفرش والإنارة للمشروع بكامل التفاصيل الهندسية."
                                : "This file contains construction blueprints, layouts, furniture distribution, and lighting schemas in full engineering detail."}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                              <a
                                href={combinedGallery[currentImageIndex].url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setIsAutoplay(false)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 text-[#061F22] px-6 py-3.5 text-xs font-bold transition hover:bg-gold hover:text-[#061F22] shadow-md hover:shadow-gold/20 transform hover:-translate-y-0.5 active:translate-y-0"
                              >
                                <Eye size={16} />
                                {isAr ? "عرض المستند الفني" : "View Technical Document"}
                              </a>
                              <a
                                href={combinedGallery[currentImageIndex].url}
                                download
                                onClick={() => setIsAutoplay(false)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold px-6 py-3.5 text-xs font-bold transition hover:bg-gold hover:text-[#061F22] hover:border-gold shadow-md transform hover:-translate-y-0.5 active:translate-y-0 bg-[#061F22]/40"
                              >
                                <Download size={16} />
                                {isAr ? "تحميل الملف" : "Download File"}
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={currentImageIndex} className="animate-slide-reveal w-full h-full flex items-center justify-center">
                          <img
                            src={combinedGallery[currentImageIndex]?.url || activeProject.img || activeProject.cover || "/placeholder.svg"}
                            alt={getProjectTitle(activeProject, lang)}
                            className="h-full w-full object-contain image-crisp bg-[#061F22] cursor-zoom-in"
                            decoding="async"
                            onClick={() => setActiveImage(combinedGallery[currentImageIndex]?.url || activeProject.img || activeProject.cover || null)}
                          />

                          <button
                            type="button"
                            onClick={() => setActiveImage(combinedGallery[currentImageIndex]?.url || activeProject.img || activeProject.cover || null)}
                            className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-md bg-white/92 px-4 py-2 text-xs font-bold text-[#0C363A] transition hover:bg-gold shadow-md active:scale-95"
                          >
                            <Maximize2 size={14} />
                            {isAr ? "تكبير الصورة" : "Open Zoom"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Custom Horizontal Thumbnail Slider */}
                    {combinedGallery.length > 1 && (
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/50 scrollbar-track-white/5 select-none" style={{ scrollbarWidth: "thin" }}>
                        {combinedGallery.map((item, index) => {
                          const isActive = index === currentImageIndex;
                          if (item.type === "video") {
                            return (
                              <button
                                key={`${item.url}-${index}`}
                                type="button"
                                onClick={() => {
                                  setIsAutoplay(false);
                                  setCurrentImageIndex(index);
                                }}
                                className={cn(
                                  "w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md border transition-all duration-300 transform hover:scale-105 active:scale-[0.93] bg-[#0C363A]/80 flex flex-col items-center justify-center gap-1.5 p-1 relative",
                                  isActive
                                    ? "border-gold scale-105 shadow-[0_0_12px_rgba(212,175,55,0.4)] opacity-100 ring-1 ring-gold"
                                    : "border-gold/20 opacity-55 hover:opacity-100 hover:border-gold/50"
                                )}
                              >
                                <Play className="text-gold fill-gold/20" size={24} />
                                <span className="text-[9px] font-mono tracking-wider font-extrabold text-white/90 uppercase">{isAr ? "فيديو" : "VIDEO"}</span>
                              </button>
                            );
                          }
                          if (item.type === "pdf") {
                            return (
                              <button
                                key={`${item.url}-${index}`}
                                type="button"
                                onClick={() => {
                                  setIsAutoplay(false);
                                  setCurrentImageIndex(index);
                                }}
                                className={cn(
                                  "w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md border transition-all duration-300 transform hover:scale-105 active:scale-[0.93] bg-[#0C363A]/60 flex flex-col items-center justify-center gap-1.5 p-1 relative",
                                  isActive
                                    ? "border-gold scale-105 shadow-[0_0_12px_rgba(212,175,55,0.4)] opacity-100 ring-1 ring-gold"
                                    : "border-gold/20 opacity-55 hover:opacity-100 hover:border-gold/50"
                                )}
                              >
                                <FileText className="text-gold" size={24} />
                                <span className="text-[9px] font-mono tracking-wider font-extrabold text-white/90 uppercase">PDF</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              key={`${item.url}-${index}`}
                              type="button"
                              onClick={() => {
                                setIsAutoplay(false);
                                setCurrentImageIndex(index);
                              }}

                              className={cn(
                                "aspect-square w-16 h-16 md:w-20 md:h-20 flex-shrink-0 overflow-hidden rounded-md border transition-all duration-300 transform hover:scale-105 active:scale-95 bg-white/5 group",
                                isActive
                                  ? "border-gold scale-105 shadow-[0_0_12px_rgba(212,175,55,0.4)] opacity-100 ring-1 ring-gold"
                                  : "border-gold/20 opacity-55 hover:opacity-100 hover:border-gold/50"
                              )}
                            >
                              <img
                                src={item.url}
                                alt=""
                                className="h-full w-full object-cover image-crisp transition-transform duration-500 ease-out group-hover:scale-110"
                                decoding="async"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-6 md:p-9 flex flex-col justify-between relative bg-gradient-to-b from-[#FAF8F5] to-[#F3EFE6]">
                {/* Visual architectural background pattern overlay */}
                <div className="absolute inset-0 arch-grid opacity-[0.03] pointer-events-none" />
                <div className="relative z-10">
                  <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#0C363A]/60">
                    <span>{isAr ? "تصميمات" : "Designs"}</span>
                    {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    <span>{selectedRange ? (isAr ? selectedRange.titleAr : selectedRange.titleEn) : activeProject.area}</span>
                    {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    <span className="text-gold-deep font-bold">{getProjectTitle(activeProject, lang)}</span>
                  </div>
                  
                  <h2 className="font-serif-ar text-3xl font-extrabold leading-tight text-[#0C363A] md:text-5xl tracking-wide border-b border-[#0C363A]/10 pb-4">
                    {getProjectTitle(activeProject, lang)}
                  </h2>

                  {/* High-end Details Spec Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 rounded-xl border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-sm hover:border-gold transition-colors duration-300">
                      <span className="text-[10px] tracking-wider text-[#0C363A]/50 uppercase font-bold flex items-center gap-1">
                        <Ruler size={12} className="text-gold-deep" />
                        {isAr ? "المساحة الإجمالية" : "TOTAL SCALE AREA"}
                      </span>
                      <span className="text-sm font-extrabold text-[#0C363A]">
                        {activeProject.area || (isAr ? "مساحة غير محددة" : "Area TBD")}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-xl border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-sm hover:border-gold transition-colors duration-300">
                      <span className="text-[10px] tracking-wider text-[#0C363A]/50 uppercase font-bold flex items-center gap-1">
                        <Building2 size={12} className="text-gold-deep" />
                        {isAr ? "نوع التصميم" : "DESIGN TYPOLOGY"}
                      </span>
                      <span className="text-sm font-extrabold text-[#0C363A]">
                        {getProjectType(activeProject, lang)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-7 text-sm leading-8 text-[#0C363A]/80 font-sans font-medium bg-white/20 p-4 rounded-xl border border-black/[0.03]">
                    {getProjectDesc(activeProject, lang) || (isAr ? "وصف المشروع سيظهر هنا عند إضافته من لوحة التحكم." : "Project description will appear here when added from admin.")}
                  </p>
                </div>
                
                {pdfFiles.length > 0 && (
                  <div className="mt-8 rounded-xl border border-gold/25 bg-white p-5 shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 font-serif-ar text-base font-extrabold text-[#0C363A]">
                      <FileText size={18} className="text-gold-deep" />
                      {isAr ? "ملفات وكتالوجات المشروع PDF" : "Project Catalog PDF Files"}
                    </h3>
                    <div className="space-y-3">
                      {pdfFiles.map((file, index) => (
                        <a 
                          key={`${file.url}-${index}`} 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#0C363A]/10 px-4 py-3 text-xs font-extrabold transition-all duration-300 hover:border-gold hover:bg-gold/5 text-[#0C363A] hover:text-gold-deep bg-[#FAF8F5]/80"
                        >
                          <span className="truncate">{file.title}</span>
                          <Download size={14} className="text-gold-deep animate-pulse" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeProject.tour360Url && (
                  <div className="mt-8 rounded-xl border border-gold/25 bg-white p-5 shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 font-serif-ar text-base font-extrabold text-[#0C363A]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                      </span>
                      {isAr ? "الجولة الافتراضية 360° التفاعلية" : "Interactive 360° Virtual Tour"}
                    </h3>
                    <p className="text-xs text-[#0C363A]/70 leading-relaxed mb-4">
                      {isAr 
                        ? "استمتع بتجربة بصرية فريدة واستكشف تفاصيل المشروع والأبعاد الهندسية من خلال جولة افتراضية تفاعلية بزاوية 360 درجة."
                        : "Experience a unique virtual walkthrough and explore the project details and spatial layout with our 360° interactive tour."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTour360Open(activeProject.tour360Url)}
                      className="w-full flex items-center justify-between gap-3 rounded-lg border border-[#0C363A]/10 px-4 py-3 text-xs font-extrabold transition-all duration-300 hover:border-gold hover:bg-[#0C363A] hover:text-white text-[#0C363A] bg-[#FAF8F5]/80 group/btn"
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink size={14} className="text-gold-deep group-hover/btn:text-gold" />
                        <span>{isAr ? "ابدأ الجولة الافتراضية 360°" : "Start 360° Virtual Tour"}</span>
                      </span>
                      <span className="text-[10px] bg-gold/20 group-hover/btn:bg-gold/40 text-gold-deep group-hover/btn:text-white px-2 py-0.5 rounded font-mono font-bold animate-pulse">360°</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeVideo && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-3 md:p-10">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#061F22]/96 backdrop-blur-xl" onClick={handleCloseVideo} />
          <div className="relative w-full max-w-6xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/72">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gold">{isAr ? "تنفيذ بالفعل" : "Executed"}</span>
                {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                <span>{getProjectTitle(activeVideo, lang)}</span>
              </div>
              <button type="button" onClick={handleCloseVideo} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-[#061F22]">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg border border-gold/40 bg-black shadow-[0_35px_100px_rgba(0,0,0,0.5)]">
              <VideoPlayer project={activeVideo} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeImage && createPortal(
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/98 p-4 select-none">
          
          {/* Top Bar Navigation — hidden in TV Presentation Mode */}
          {!isPresentationMode && (
            <div className={cn(
              "absolute top-6 z-[250] flex items-center gap-3",
              isAr ? "left-6" : "right-6"
            )}>
              {/* TV Presentation Mode Button */}
              <button
                type="button"
                onClick={() => {
                  setIsPresentationMode(true);
                  setZoomScale(1);
                  setZoomOffset({ x: 0, y: 0 });
                }}
                className="px-4 py-2 h-12 rounded-full text-xs font-bold bg-black/60 border border-white/20 text-white hover:bg-gold hover:border-gold hover:text-[#0C363A] hover:scale-110 flex items-center justify-center transition-all duration-300 flex items-center gap-1.5 shadow-lg cursor-pointer backdrop-blur-sm"
                title={isAr ? "وضع العرض التقديمي للتلفزيون" : "TV Presentation Mode"}
              >
                <Maximize2 size={16} />
                <span>{isAr ? "وضع العرض" : "TV Mode"}</span>
              </button>

              <button
                type="button"
                aria-label="Close"
                className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-all hover:bg-gold hover:text-[#061F22] hover:border-gold hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm cursor-pointer"
                onClick={handleCloseImage}
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* Floating Exit TV Presentation Mode button */}
          {isPresentationMode && (
            <button
              type="button"
              onClick={() => setIsPresentationMode(false)}
              className={cn(
                "absolute top-6 z-[250] px-6 py-3 rounded-full bg-gold hover:bg-white border-2 border-gold text-[#0C363A] text-xs font-bold tracking-wider shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer scale-110",
                isAr ? "left-6" : "right-6"
              )}
            >
              <X size={16} />
              <span>{isAr ? "إلغاء وضع العرض" : "Exit TV Mode"}</span>
            </button>
          )}

          {/* Fullscreen Slider Navigation Arrows */}
          {imagesOnly.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrevLightboxImage(); }}
                className={cn(
                  "absolute left-6 top-1/2 -translate-y-1/2 z-[250] grid place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-all hover:bg-gold hover:text-[#061F22] hover:border-gold hover:scale-110 active:scale-95 shadow-2xl backdrop-blur-sm cursor-pointer",
                  isPresentationMode ? "h-24 w-24 text-gold border-gold/40 bg-black/85" : "h-14 w-14"
                )}
              >
                <ChevronLeft size={isPresentationMode ? 44 : 28} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNextLightboxImage(); }}
                className={cn(
                  "absolute right-6 top-1/2 -translate-y-1/2 z-[250] grid place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-all hover:bg-gold hover:text-[#061F22] hover:border-gold hover:scale-110 active:scale-95 shadow-2xl backdrop-blur-sm cursor-pointer",
                  isPresentationMode ? "h-24 w-24 text-gold border-gold/40 bg-black/85" : "h-14 w-14"
                )}
              >
                <ChevronRight size={isPresentationMode ? 44 : 28} />
              </button>
            </>
          )}

          {/* Fullscreen Slide Image */}
          <div className="relative max-h-[90vh] max-w-[94vw] flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImage}
              alt=""
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleImageDoubleClick}
              className="max-h-[88vh] max-w-[94vw] rounded-md object-contain shadow-2xl select-none"
              style={{
                transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)`,
                cursor: zoomScale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), translate 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            />
          </div>

          {/* Floating Luxury Zoom-Pan Controls — hidden in TV mode */}
          {!isPresentationMode && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-2xl select-none">
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 4))}
                className="p-2 text-white/80 hover:text-gold transition-colors hover:scale-110 active:scale-95"
                title={isAr ? "تكبير" : "Zoom In"}
              >
                <ZoomIn size={18} />
              </button>
              
              <span className="text-[10px] text-white/60 font-mono min-w-[2.5rem] text-center">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                onClick={() => {
                  setZoomScale(prev => {
                    const next = Math.max(prev - 0.5, 1);
                    if (next === 1) setZoomOffset({ x: 0, y: 0 });
                    return next;
                  });
                }}
                className="p-2 text-white/80 hover:text-gold transition-colors hover:scale-110 active:scale-95"
                title={isAr ? "تصغير" : "Zoom Out"}
              >
                <ZoomOut size={18} />
              </button>

              <div className="h-4 w-px bg-white/10" />

              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setZoomOffset({ x: 0, y: 0 });
                }}
                className="p-2 text-white/80 hover:text-gold transition-colors hover:scale-110 active:scale-95"
                title={isAr ? "إعادة ضبط" : "Reset Zoom"}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          )}

          {/* Immersive Counter Badge — hidden in TV mode */}
          {imagesOnly.length > 1 && !isPresentationMode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg">
              {fullscreenIndex + 1} / {imagesOnly.length}
            </div>
          )}
        </div>,
        document.body
      )}

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
                {isAr ? "الجولة الافتراضية 360°" : "360° Virtual Tour"}
                {activeProject && (
                  <span className="text-gold mx-2 font-sans font-medium text-xs md:text-sm opacity-80">
                    - {getProjectTitle(activeProject, lang)}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={tour360Open}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-[#0C363A]/80 text-gold px-3.5 py-2 text-xs font-bold transition-all duration-300 hover:bg-gold hover:text-[#061F22] hover:scale-105 active:scale-95 shadow-lg"
                title={isAr ? "فتح في علامة تبويب جديدة" : "Open in new tab"}
              >
                <ExternalLink size={14} />
                <span>{isAr ? "فتح في نافذة جديدة" : "Open in new window"}</span>
              </a>
              <button
                type="button"
                onClick={() => setTour360Open(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-[#0C363A] text-gold transition-all duration-300 hover:bg-gold hover:text-[#061F22] hover:scale-110 shadow-lg active:scale-95"
                title={isAr ? "إغلاق" : "Close"}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Tour Iframe container */}
          <div className="flex-1 w-full h-full rounded-xl overflow-hidden border border-gold/35 mt-4 bg-black relative">
            <iframe
              src={tour360Open}
              title={activeProject ? getProjectTitle(activeProject, lang) : "360 Tour"}
              allow="xr-spatial-tracking; gyroscope; accelerometer; vr"
              allowFullScreen
              scrolling="no"
              className="absolute inset-0 w-full h-full border-none"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Hover Preview Overlay */}
      <HoverPreview
        imageUrl={(activeImage || activeProject || activeVideo || tour360Open) ? null : (activeHoverPreview?.url || null)}
        label={(activeImage || activeProject || activeVideo || tour360Open) ? null : (activeHoverPreview?.label || null)}
        lang={lang}
      />
    </div>
  );
}
