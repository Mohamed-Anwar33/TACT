import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Film, Image as ImageIcon } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { PROJECTS, SERVICES_AR, SERVICES_EN, TEAM, TESTIMONIALS_AR } from "@/data/site";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import TeamPreview from "@/components/home/TeamPreview";
import PhilosophySection from "@/components/home/teqaan/PhilosophySection";
import ServicesGrid from "@/components/home/teqaan/ServicesGrid";
import ProjectsShowcase from "@/components/home/teqaan/ProjectsShowcase";
import TestimonialsSection from "@/components/home/teqaan/TestimonialsSection";
import FinalCTA from "@/components/home/teqaan/FinalCTA";
import { cn } from "@/lib/utils";
import { CmsSection, getCmsSections } from "@/lib/publicCms";
import SEO from "@/components/layout/SEO";
import { resolveMediaUrl } from "@/lib/realContent";
import cmsSnapshot from "@/data/cms-snapshot.json";

function getCmsSectionsSync(pageSlug: string): Record<string, CmsSection> {
  try {
    const cached = localStorage.getItem(`tact_cms_sections_${pageSlug}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }

  const sections = cmsSnapshot.cms_sections.filter((row: any) => row.page_slug === pageSlug && row.visible !== false);
  const mediaRows = cmsSnapshot.cms_section_media;

  const mapped = sections.map((row: any) => ({
    id: row.id,
    pageSlug: row.page_slug,
    sectionKey: row.section_key,
    sectionNameEn: row.section_name_en,
    sectionNameAr: row.section_name_ar,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    bodyEn: row.body_en,
    bodyAr: row.body_ar,
    ctaLabelEn: row.cta_label_en,
    ctaLabelAr: row.cta_label_ar,
    ctaUrl: row.cta_url,
    metadata: row.metadata,
    media: mediaRows
      .filter((item: any) => item.section_id === row.id)
      .map((item: any) => ({
        id: item.id,
        role: item.role,
        mediaType: item.media_type,
        url: resolveMediaUrl(item.url) || item.url,
        titleEn: item.title_en,
        titleAr: item.title_ar,
        altEn: item.alt_en,
        altAr: item.alt_ar,
      })),
  }));

  return Object.fromEntries(mapped.map((row) => [row.sectionKey, row]));
}

const HERO_SLIDES = [
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
  "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185938_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191947_.webp",
];

export default function Home() {
  const { t, lang } = useLang();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroMode, setHeroMode] = useState(() => {
    return localStorage.getItem("tact_hero_bg_mode") || "video";
  });
  const [sections, setSections] = useState<Record<string, CmsSection>>(() => {
    return getCmsSectionsSync("home");
  });
  const [isMobile, setIsMobile] = useState(false);
  const heroSection = sections.hero;
  const heroVideo = heroSection?.media.find((item) => (item.role === "video" || item.role === "section") && item.mediaType === "video")?.url || "/real-content/Finishing videos/Luxury modern.mp4";
  const heroPoster = heroSection?.media.find((item) => item.role === "poster" || item.role === "cover" || (item.role === "section" && item.mediaType === "image"))?.url || "/real-content/Finishing videos/Luxury modern-thumb.webp";
  const heroTitle = lang === "ar" ? heroSection?.titleAr || t("hero_headline") : heroSection?.titleEn || t("hero_headline");
  const heroBody = lang === "ar" ? heroSection?.bodyAr || t("hero_subtitle") : heroSection?.bodyEn || t("hero_subtitle");
  const heroCtaLabel = lang === "ar" ? heroSection?.ctaLabelAr || t("cta_start") : heroSection?.ctaLabelEn || t("cta_start");
  const heroCtaUrl = heroSection?.ctaUrl || "/questionnaire";

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Listen to live switches from the Admin Dashboard
  useEffect(() => {
    const handleStorageChange = () => {
      const mode = localStorage.getItem("tact_hero_bg_mode") || "video";
      setHeroMode(mode);
    };

    window.addEventListener("hero_bg_mode_changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("hero_bg_mode_changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getCmsSections("home").then((rows) => {
      if (!alive) return;
      const mapped = Object.fromEntries(rows.map((row) => [row.sectionKey, row]));
      try {
        localStorage.setItem("tact_cms_sections_home", JSON.stringify(mapped));
      } catch (e) {
        // Ignore
      }
      setSections(mapped);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Image slideshow interval cycler
  useEffect(() => {
    if (heroMode !== "images") return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroMode]);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": lang === "ar" ? "تاكت للتصميم والتشطيب | Tact Architecture" : "Tact Architecture, Decoration & Furniture",
    "image": `${window.location.origin}/logo.png`,
    "@id": `${window.location.origin}/#organization`,
    "url": window.location.origin,
    "telephone": "+201000000000",
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": lang === "ar" ? "التجمع الخامس" : "Fifth Settlement",
      "addressLocality": lang === "ar" ? "القاهرة الجديدة" : "New Cairo",
      "addressRegion": lang === "ar" ? "القاهرة" : "Cairo",
      "addressCountry": "EG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 30.0264,
      "longitude": 31.4913
    }
  };

  const heroVideoMp4 = heroVideo;
  const heroVideoWebM = heroVideo.replace(/\.mp4$/i, ".webm");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || heroMode !== "video" || isMobile) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => {
      observer.unobserve(video);
    };
  }, [heroMode, heroVideo, isMobile]);

  return (
    <>
      <SEO 
        schemaData={homeSchema} 
      />
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#0C363A]">

        {/* CONDITIONAL HERO BACKGROUND: VIDEO OR SLIDESHOW */}
        {heroMode === "video" && !isMobile ? (
          <div className="absolute inset-0 w-full h-full z-0">
            <video
              ref={videoRef}
              poster={heroPoster}
              preload="metadata"
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={heroVideoWebM} type="video/webm" />
              <source src={heroVideoMp4} type="video/mp4" />
            </video>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#0C363A]/72 pointer-events-none" />
            <div className={cn(
              "absolute inset-0 pointer-events-none",
              lang === "ar"
                ? "bg-gradient-to-l from-[#0C363A] via-[#0C363A]/40 to-transparent"
                : "bg-gradient-to-r from-[#0C363A] via-[#0C363A]/40 to-transparent"
            )} />
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(12,54,58,0.9)] pointer-events-none" />
          </div>
        ) : heroMode === "video" && isMobile ? (
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              src={heroPoster}
              alt="تاكت للتصميم والتشطيب"
              className="w-full h-full object-cover image-crisp"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={768}
              height={1024}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#0C363A]/72 pointer-events-none" />
            <div className={cn(
              "absolute inset-0 pointer-events-none",
              lang === "ar"
                ? "bg-gradient-to-l from-[#0C363A] via-[#0C363A]/40 to-transparent"
                : "bg-gradient-to-r from-[#0C363A] via-[#0C363A]/40 to-transparent"
            )} />
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(12,54,58,0.9)] pointer-events-none" />
          </div>
        ) : (
          HERO_SLIDES.map((src, idx) => (
            <div
              key={src}
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-1500 ease-in-out",
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              <img
                src={src}
                alt="مشروع حقيقي لشركة تاكت"
                className="w-full h-full object-cover image-crisp"
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "low"}
                decoding="async"
                width={1920}
                height={1080}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-[#0C363A]/72 pointer-events-none" />
            </div>
          ))
        )}

        {/* Architectural Frame */}
        <div className="absolute inset-6 border border-[#C18556]/20 pointer-events-none z-10 hidden md:block">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C18556]/60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C18556]/60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C18556]/60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C18556]/60" />
        </div>

        <div className="container-luxe relative z-20 h-full flex flex-col justify-center text-white">
          <div className={cn(
            "flex flex-col",
            lang === "ar" ? "items-start text-right" : "items-start text-left"
          )}>
            <Reveal>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[#C18556] text-[10px] md:text-xs font-bold tracking-[0.5em] uppercase">
                  {lang === "ar" ? "تاكت للعمارة والديكور" : "TACT ARCHITECTURE & DECORATION"}
                </span>
                <div className="h-px w-12 bg-[#C18556]/40" />
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif leading-[1.1] max-w-4xl text-balance">
                {heroTitle}
              </h1>
            </Reveal>

            <Reveal delay={300}>
              <p className="mt-8 max-w-lg text-sm md:text-lg text-white/85 leading-relaxed font-light">
                {heroBody}
              </p>
            </Reveal>

            <Reveal delay={450}>
              <div className="flex flex-wrap gap-5 mt-12 items-center">
                <Link
                  to={heroCtaUrl}
                  className="bg-[#C18556] text-[#0C363A] px-10 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#DDB57C] hover:scale-105 active:scale-95 shadow-lg shadow-[#C18556]/20"
                >
                  {heroCtaLabel}
                </Link>
                <Link
                  to="/portfolio"
                  className="border border-[#C18556]/60 text-white px-10 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#C18556]/10 backdrop-blur-sm"
                >
                  {t("cta_view_work")}
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Slideshow progress indicator only shown when images mode is active */}
          {heroMode === "images" && (
            <Reveal delay={600} className="absolute bottom-24 flex items-center gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i === currentSlide ? "w-10 bg-[#C18556]" : "w-4 bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`شريحة ${i + 1}`}
                />
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-[#0C363A] text-white py-12 md:py-16 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C18556]/30 to-transparent" />

        <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-8">
          {(() => {
            const fallback = [
              { value_ar: "+12", value_en: "+12", label_ar: "سنة خبرة", label_en: "Years Experience" },
              { value_ar: "+60", value_en: "+60", label_ar: "مشروع منفذ", label_en: "Completed Projects" },
              { value_ar: "متكامل", value_en: "Integrated", label_ar: "من الفكرة للتنفيذ", label_en: "From Concept to Reality" },
              { value_ar: "معتمد", value_en: "Certified", label_ar: "بأعلى معايير الجودة", label_en: "Highest Quality Standards" },
            ];
            let statsData = fallback;
            try {
              const sec = sections["stats-strip"];
              if (sec?.bodyAr && sec.bodyAr.startsWith("[")) statsData = JSON.parse(sec.bodyAr);
            } catch { /* use fallback */ }
            return statsData.map((s: any, i: number) => (
              <Reveal key={i} delay={i * 100} className="relative group flex flex-col items-center md:items-start md:ps-8 md:border-s md:border-[#C18556]/20 first:border-s-0 first:ps-0">
                <div className="text-[#C18556] font-serif text-3xl md:text-5xl mb-2 transition-transform duration-500 group-hover:-translate-y-1">
                  {lang === "ar" ? s.value_ar : s.value_en}
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/60 font-medium">
                  {lang === "ar" ? s.label_ar : s.label_en}
                </div>
              </Reveal>
            ));
          })()}
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C18556]/15 to-transparent" />
      </section>

      <div className="relative z-[60]">
        <PhilosophySection section={sections["about-preview"]} />
        <TeamPreview section={sections["team-preview"]} />
        <TestimonialsSection section={sections["testimonials"]} />
        <ProjectsShowcase section={sections["works-preview"]} />
        <ServicesGrid section={sections["services-preview"]} />
        <FinalCTA section={sections["packages-cta"]} />
      </div>
    </>
  );
}
