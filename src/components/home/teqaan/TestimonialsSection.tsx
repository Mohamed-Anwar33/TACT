import { useState, useEffect } from "react";
import { Quote, ChevronRight, ChevronLeft, Play } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { TESTIMONIALS_AR, REVIEW_VIDEOS } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { getCmsReviews } from "@/lib/publicCms";

const STATIC_TESTIMONIALS = [
  {
    quote: TESTIMONIALS_AR[0],
    nameAr: "عميل مميز",
    nameEn: "Premium Client",
    locationAr: "مشروع سكني",
    locationEn: "Residential Project",
    rating: 5,
  },
  {
    quote: TESTIMONIALS_AR[1],
    nameAr: "أسرة سعيدة",
    nameEn: "Happy Family",
    locationAr: "تشطيب متكامل",
    locationEn: "Full Finishing",
    rating: 5,
  },
  {
    quote: TESTIMONIALS_AR[2],
    nameAr: "عميل تاكت",
    nameEn: "Tact Client",
    locationAr: "تصميم داخلي",
    locationEn: "Interior Design",
    rating: 5,
  },
];

export default function TestimonialsSection({ section }: { section?: any }) {
  const { lang } = useLang();
  const [reviews, setReviews] = useState<any[]>(STATIC_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  useEffect(() => {
    async function loadDynamic() {
      const cmsReviews = await getCmsReviews();
      if (cmsReviews.length) {
        const selectedIds = section?.metadata?.selectedIds;
        let displayReviews = cmsReviews;
        if (Array.isArray(selectedIds) && selectedIds.length > 0) {
          displayReviews = selectedIds
            .map(id => cmsReviews.find(r => r.id === id || String(r.id) === String(id)))
            .filter(Boolean);
          if (displayReviews.length === 0) {
            displayReviews = cmsReviews;
          }
        }
        setReviews(displayReviews.map((item) => ({
          quote: lang === "en" ? item.quote : item.quoteAr,
          nameAr: item.nameAr,
          nameEn: item.name,
          locationAr: item.roleAr,
          locationEn: item.role,
          rating: item.rating || 5,
        })));
      } else {
        setReviews(STATIC_TESTIMONIALS);
      }
    }
    loadDynamic();
  }, [lang, section]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const currentReview = reviews[currentIndex] || STATIC_TESTIMONIALS[0];
  const featuredVideoObj = REVIEW_VIDEOS[0];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Luxury Background Elements */}
      <div className="absolute inset-0 bg-[#DDB57C]/7 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#C18556 0.5px, transparent 0.5px), linear-gradient(90deg, #C18556 0.5px, transparent 0.5px)`, backgroundSize: '60px 60px' }} />
      
      <div className="container-luxe relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Testimonials Block (45%) */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                  {lang === "ar" ? "عملاؤنا" : "CLIENTS"}
                </span>
                <div className="w-12 h-px bg-[#C18556]/30" />
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h2 className="text-4xl md:text-5xl font-serif text-[#0C363A] leading-[1.2] mb-12">
                {lang === "ar" ? (
                  <>ثقة تُبنى <span className="text-[#C18556] italic">مع كل تسليم</span></>
                ) : (
                  <>Trust Built <span className="text-[#C18556] italic">With Every Delivery</span></>
                )}
              </h2>
            </Reveal>

            <Reveal delay={300}>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-lg p-8 md:p-12 border border-[#C18556]/15 shadow-2xl shadow-[#0C363A]/5 transition-all duration-500 hover:border-[#C18556]/30 group">
                {/* Large Subtle Quote Mark */}
                <div className="absolute top-6 right-6 text-[#C18556]/10 pointer-events-none transform -scale-x-100">
                  <Quote size={80} strokeWidth={1} fill="currentColor" />
                </div>

                <div className="relative z-10">
                  <p className="text-lg md:text-xl text-[#0C363A]/80 font-serif leading-relaxed italic mb-8 transition-all duration-500">
                    “{currentReview.quote}”
                  </p>

                  <div className="flex items-center gap-4 pt-8 border-t border-[#C18556]/10">
                    <div className="flex-1">
                      <h4 className="text-base font-serif text-[#0C363A] font-bold">
                        {lang === "ar" ? currentReview.nameAr : currentReview.nameEn}
                      </h4>
                      <p className="text-[10px] uppercase tracking-widest text-[#C18556] font-bold mt-1">
                        {lang === "ar" ? currentReview.locationAr : currentReview.locationEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                        onClick={prevSlide}
                        className="w-10 h-10 rounded-full border border-[#C18556]/20 flex items-center justify-center text-[#0C363A] hover:bg-[#C18556] hover:text-white transition-all"
                       >
                         {lang === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                       </button>
                       <button 
                        onClick={nextSlide}
                        className="w-10 h-10 rounded-full border border-[#C18556]/20 flex items-center justify-center text-[#0C363A] hover:bg-[#C18556] hover:text-white transition-all"
                       >
                         {lang === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Dots */}
            <div className="mt-8 flex gap-2">
              {reviews.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-1 transition-all duration-300 rounded-full",
                    idx === currentIndex ? "w-8 bg-[#C18556]" : "w-3 bg-[#C18556]/20"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Video Block (55%) */}
          <div className="lg:col-span-7">
            <Reveal delay={450}>
              <div className="mb-8">
                 <div className="flex items-center gap-4 mb-4">
                  <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                    {lang === "ar" ? "رؤيتنا" : "VISION"}
                  </span>
                  <div className="w-12 h-px bg-[#C18556]/30" />
                </div>
                <h3 className="text-2xl md:text-3xl font-serif text-[#0C363A]">
                  {lang === "ar" ? "فيديو حول أعمالنا ورؤيتنا" : "A Film About Our Work & Vision"}
                </h3>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#C18556]/25 shadow-2xl shadow-[#0C363A]/15 group bg-[#0C363A]">
                {isPlayingVideo && featuredVideoObj ? (
                  <video
                    src={featuredVideoObj.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={featuredVideoObj?.cover || "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp"}
                      alt="Review Video Cover"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A]/80 via-[#0C363A]/10 to-transparent flex items-center justify-center">
                      <button
                        onClick={() => setIsPlayingVideo(true)}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white text-[#0C363A] flex items-center justify-center shadow-2xl hover:bg-[#C18556] hover:text-white transition-all duration-500 group-hover:scale-110"
                      >
                        <Play size={32} fill="currentColor" className={cn("transition-transform", lang === "ar" ? "translate-x-[-2px]" : "translate-x-[2px]")} />
                      </button>
                    </div>
                    
                    {/* Decorative Corner Marks */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#C18556]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#C18556]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className={cn("absolute bottom-8 z-20 text-white max-w-sm pointer-events-none", lang === "ar" ? "right-8 text-right" : "left-8 text-left")}>
                      <p className="text-[10px] text-[#C18556] font-bold tracking-widest uppercase mb-2">
                        {lang === "ar" ? "توثيق حي ومباشر" : "LIVE DOCUMENTATION"}
                      </p>
                      <p className="text-sm md:text-base font-serif text-white/90 leading-relaxed">
                        {lang === "ar" ? "استعرض تجارب عملائنا في جودة التشطيب والتسليم المعتمد" : "Explore our client experiences in finishing quality and certified delivery."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Architectural Detail */}
      <div className={cn(
        "absolute bottom-0 w-32 h-32 opacity-[0.03] pointer-events-none",
        lang === "ar" ? "left-0" : "right-0"
      )}>
        <div className="w-full h-full border-t border-l border-[#0C363A]" />
      </div>
    </section>
  );
}
