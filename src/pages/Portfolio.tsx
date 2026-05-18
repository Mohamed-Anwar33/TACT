import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import Reveal from "@/components/ui-luxe/Reveal";
import { Link } from "react-router-dom";
import { Play, ArrowUpRight, X, FileText, LayoutGrid, Film, Palette, Sofa, Trees, Compass, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsProject, fallbackProjects, getCmsProjects } from "@/lib/publicCms";

const FILTERS = [
  { en: "All Projects", ar: "جميع المشاريع", icon: LayoutGrid },
  { en: "Designs", ar: "التصاميم المعمارية", icon: Compass },
  { en: "Finishing", ar: "التشطيبات الداخلية", icon: Palette },
  { en: "Videos", ar: "فيديوهات التنفيذ", icon: Film },
  { en: "Landscape", ar: "تنسيق الحدائق", icon: Trees },
  { en: "Furniture", ar: "الأثاث والمفروشات", icon: Sofa },
];

const ITEMS_PER_PAGE = 6;

export default function Portfolio() {
  const { lang } = useLang();
  const [filter, setFilter] = useState("All Projects");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<CmsProject[]>(() => fallbackProjects());

  const allItems = useMemo(() => [...items].sort((a, b) => a.id.localeCompare(b.id)), [items]);

  useEffect(() => {
    let alive = true;
    getCmsProjects().then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const res = filter === "All Projects" 
      ? allItems 
      : allItems.filter((it) => {
          if (filter === "Designs") return it.kind === "img";
          if (filter === "Finishing") return it.kind === "video";
          if (filter === "Videos") return it.kind === "video";
          if (filter === "Landscape") return `${it.name} ${it.nameAr} ${it.type} ${it.typeAr}`.toLowerCase().includes("landscape") || `${it.nameAr} ${it.typeAr}`.includes("حدائق");
          if (filter === "Furniture") return `${it.name} ${it.nameAr} ${it.type} ${it.typeAr}`.toLowerCase().includes("furniture") || `${it.nameAr} ${it.typeAr}`.includes("أثاث");
          return true;
        });
    return res;
  }, [filter, allItems]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (activeVideo) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [activeVideo]);

  return (
    <div className="min-h-screen bg-[#FFFFFF]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* LUXURY HERO SECTION */}
      <section className="relative pt-48 pb-32 bg-[#0C363A] overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/marble-similar.png")' }} />
        
        <div className="container-luxe relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="flex flex-col items-start">
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-8 font-bold">
                <span>{lang === "ar" ? "أعمالنا" : "Portfolio"}</span>
                <span className="w-4 h-[1px] bg-gold/30" />
                <span className="text-gold">{lang === "ar" ? "أعمالنا المميزة" : "Featured Work"}</span>
              </nav>
              
              <h1 className="text-5xl md:text-7xl font-serif-ar font-bold text-white leading-tight">
                {lang === "ar" ? "سابقة أعمالنا" : "Our Legacy"}
              </h1>
              
              <p className="mt-8 text-lg text-ivory/60 max-w-xl font-serif-ar leading-relaxed">
                {lang === "ar" 
                  ? "نبتكر مساحات تجمع بين الجمال والوظيفة، من الفكرة إلى التنفيذ النهائي. كل مشروع نحكي به قصة فريدة تعكس ذوق العميل وتفوق التصميم."
                  : "We create spaces that blend beauty and functionality, from concept to final execution. Every project tells a unique story reflecting our clients' taste."}
              </p>

              <div className="flex flex-wrap gap-6 mt-12">
                <Link to="/contact" className="btn-gold !py-5 !px-10 text-xs tracking-widest uppercase shadow-[0_10px_30px_rgba(193, 133, 86,0.3)]">
                  {lang === "ar" ? "تواصل معنا" : "Work With Us"}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative max-w-md mx-auto lg:mr-auto lg:ml-0">
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden border border-gold/20 shadow-2xl">
                <img 
                  src="/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp" 
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000" 
                  alt="Hero Preview" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A] via-transparent to-transparent" />
              </div>
              
              <div className="absolute -bottom-6 -right-6 md:right-6 bg-white p-6 rounded-2xl shadow-2xl border border-gold/10 backdrop-blur-xl bg-white/95 animate-float">
                <div className="text-center">
                  <div className="text-3xl font-serif font-bold text-teal-deep mb-1">12+</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-gold font-bold">
                    {lang === "ar" ? "سنة خبرة" : "Years Experience"}
                  </div>
                  <div className="text-[9px] text-teal-deep/40 mt-1 uppercase">
                    {lang === "ar" ? "في التصميم والتنفيذ" : "Design & Build"}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="sticky top-[70px] z-[80] bg-white/90 backdrop-blur-xl border-b border-border py-6 shadow-sm overflow-hidden">
        <div className="container-luxe">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {FILTERS.map((f) => (
              <button
                key={f.en}
                onClick={() => setFilter(f.en)}
                className={cn(
                  "group shrink-0 px-8 py-3.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-500 flex items-center gap-3 border shadow-sm",
                  filter === f.en 
                    ? "bg-teal-deep text-white border-teal-deep scale-105 shadow-xl shadow-teal-deep/20" 
                    : "bg-white text-teal-deep/60 border-border hover:border-gold hover:text-gold"
                )}
              >
                <f.icon size={16} className={cn("transition-colors", filter === f.en ? "text-gold" : "group-hover:text-gold")} />
                <span>{lang === "ar" ? f.ar : f.en}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO GRID */}
      <section className="py-24">
        <div className="container-luxe">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[900px] items-start">
            {currentItems.map((item, i) => {
              const isVideo = item.kind === "video";
              const p = item as any;

              return (
                <Reveal key={p.id} delay={(i % 3) * 100}>
                  <div className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-white shadow-lg hover:shadow-2xl transition-all duration-700">
                    {!isVideo ? (
                      <Link to={`/portfolio/${p.id}`} className="absolute inset-0 z-20">
                        <span className="sr-only">View {p.nameAr}</span>
                      </Link>
                    ) : (
                      <button onClick={() => setActiveVideo(p.videoUrl)} className="absolute inset-0 z-20">
                        <span className="sr-only">Watch {p.nameAr}</span>
                      </button>
                    )}
                    <img 
                      src={p.cover || p.img} 
                      alt={p.nameAr} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A] via-[#0C363A]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    <div className="absolute top-8 inset-x-8 flex justify-between items-start z-20">
                      <div className="flex flex-col gap-2">
                        {isVideo ? (
                          <div className="bg-gold/90 backdrop-blur-md text-brand-dark text-[9px] font-bold px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest shadow-xl">
                            <Film size={12} />
                            <span>Video Walkthrough</span>
                          </div>
                        ) : p.pdf && (
                          <div className="bg-white/90 backdrop-blur-md text-teal-deep text-[9px] font-bold px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest shadow-xl">
                            <FileText size={12} />
                            <span>Technical Catalog</span>
                          </div>
                        )}
                        <span className="bg-black/40 backdrop-blur-md text-white/80 text-[9px] font-mono px-3 py-1.5 rounded-lg border border-white/10 self-start">
                          {p.area}
                        </span>
                      </div>
                    </div>

                    {isVideo && (
                      <button onClick={() => setActiveVideo(p.videoUrl)} className="absolute inset-0 flex items-center justify-center z-20 group/play">
                        <div className="w-20 h-20 rounded-full bg-gold/95 text-teal-deep flex items-center justify-center shadow-[0_0_50px_rgba(193, 133, 86,0.4)] transform scale-90 group-hover/play:scale-110 group-hover/play:bg-white transition-all duration-500">
                          <Play size={28} className="fill-current translate-x-1" />
                        </div>
                      </button>
                    )}

                    <div className="absolute inset-0 flex flex-col justify-end p-10 z-10">
                      <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-[1px] bg-gold" />
                          <span className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase">
                            {lang === "ar" ? p.typeAr : p.type}
                          </span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-serif-ar font-bold text-white mb-6">
                          {lang === "ar" ? p.nameAr : p.name}
                        </h3>
                        
                        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 pt-6 border-t border-white/20 pointer-events-none">
                          {isVideo ? (
                            <div className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-gold transition-colors">
                              {lang === "ar" ? "المشاهدة الآن" : "Watch Now"}
                              <ArrowUpRight size={14} className="text-gold" />
                            </div>
                          ) : (
                            <div className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-gold transition-colors">
                              {lang === "ar" ? "المزيد عن المشروع" : "Project Details"}
                              <ArrowUpRight size={14} className="text-gold" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* PAGINATION UI */}
          {totalPages > 1 && (
            <div className="mt-20 flex justify-center items-center gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-teal-deep hover:bg-gold hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {lang === "ar" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-full text-xs font-bold transition-all",
                      currentPage === i + 1 
                        ? "bg-teal-deep text-white shadow-lg" 
                        : "text-teal-deep/40 hover:text-teal-deep hover:bg-gold/10"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-teal-deep hover:bg-gold hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {lang === "ar" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* INTEGRATED CTA BANNER */}
      <section className="pb-24">
        <div className="container-luxe">
          <Reveal>
            <div className="relative rounded-lg bg-brand-dark p-12 md:p-20 flex flex-col items-center text-center border border-gold/30 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 arch-grid opacity-10 pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gold/5 rounded-full blur-[100px]" />
              
              <div className="relative z-10 max-w-3xl">
                <h3 className="text-3xl md:text-5xl font-serif-ar font-bold text-white mb-8 leading-tight">
                  {lang === "ar" ? "لديك مشروع في ذهنك؟" : "Have a vision for your space?"}
                  <br />
                  <span className="text-gold mt-2 block">{lang === "ar" ? "لنصممه معًا ونحوّله إلى واقع استثنائي" : "Let's turn it into an architectural reality."}</span>
                </h3>
                <div className="flex flex-wrap justify-center gap-6 mt-10">
                  <Link to="/contact" className="btn-gold !py-5 !px-12 text-xs tracking-widest uppercase">
                    {lang === "ar" ? "ابدأ مشروعك الآن" : "Start Your Project"}
                    {lang === "ar" ? <ArrowLeft size={16} className="mr-2" /> : <ArrowRight size={16} className="ml-2" />}
                  </Link>
                  <Link to="/services" className="px-12 py-5 rounded-xl border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white/5 transition-all">
                    {lang === "ar" ? "عرض خدماتنا" : "Our Services"}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-teal-deep/98 backdrop-blur-3xl" onClick={() => setActiveVideo(null)} />
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden border border-gold/40 shadow-3xl animate-scale-up">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-8 right-8 z-[210] w-14 h-14 rounded-full bg-white/10 hover:bg-gold hover:text-teal-deep backdrop-blur-xl flex items-center justify-center text-white transition-all duration-500 hover:rotate-90 shadow-2xl"
            >
              <X size={24} />
            </button>
            <video src={activeVideo} controls autoPlay className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
