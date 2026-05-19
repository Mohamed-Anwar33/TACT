import { useState, useEffect } from "react";
import { Quote, Play, Star, Plus, X, Image as ImageIcon, MessageSquare, Send, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import { REVIEW_VIDEOS } from "@/data/site";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { getCmsReviews } from "@/lib/publicCms";
import { submitClientReview } from "@/lib/reviewSubmission";
import { toast } from "sonner";

export default function TestimonialsSection({ section }: { section?: any }) {
  const { lang } = useLang();
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Submission Form State
  const [form, setForm] = useState({ name: "", role: "", quote: "", rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Load reviews from Supabase
  useEffect(() => {
    async function loadReviews() {
      try {
        const cmsReviews = await getCmsReviews();
        setReviews(cmsReviews || []);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    }
    loadReviews();
  }, []);

  const selectedReviewIds: string[] = Array.isArray(section?.metadata?.selectedIds) ? section.metadata.selectedIds.map(String) : [];
  const pinnedReviews = selectedReviewIds
    .map((id) => reviews.find((review) => String(review.id) === id))
    .filter(Boolean);
  const carouselReviews = pinnedReviews.length > 0 ? pinnedReviews : reviews;
  const currentReview = carouselReviews[currentReviewIndex % Math.max(carouselReviews.length, 1)];

  useEffect(() => {
    setCurrentReviewIndex(0);
  }, [section?.metadata?.selectedIds, reviews.length]);

  const goToPrevReview = () => {
    if (!carouselReviews.length) return;
    setCurrentReviewIndex((prev) => (prev - 1 + carouselReviews.length) % carouselReviews.length);
  };

  const goToNextReview = () => {
    if (!carouselReviews.length) return;
    setCurrentReviewIndex((prev) => (prev + 1) % carouselReviews.length);
  };

  // Filter reviews that contain a screenshot image
  const screenshotReviews = reviews.filter((r) => r.image_url || r.imageUrl);
  const showReviewSlider = section?.metadata?.showReviewSlider !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.quote) {
      toast.error(lang === "ar" ? "يرجى تعبئة الاسم وتفاصيل التقييم" : "Please fill in your name and review text");
      return;
    }

    setSubmitting(true);
    try {
      await submitClientReview(form);

      toast.success(
        lang === "ar" 
          ? "نشكرك لتقييمك! تم إرسال التقييم بنجاح للمراجعة." 
          : "Thank you! Your feedback has been submitted for review."
      );
      setForm({ name: "", role: "", quote: "", rating: 5 });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#FAF7F2] via-[#FFFFFF] to-[#FAF7F2]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Blueprint Grid & Decorative Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#C18556 0.5px, transparent 0.5px), linear-gradient(90deg, #C18556 0.5px, transparent 0.5px)`, backgroundSize: '70px 70px' }} />
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C18556]/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C18556]/20 to-transparent" />

      <div className="container-luxe max-w-[1180px] relative z-10 px-4">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-10 h-px bg-[#C18556]/40" />
              <span className="text-[#C18556] text-[12px] md:text-[13px] uppercase tracking-[0.3em] font-bold">
                {lang === "ar" ? "آراء وثقة عملائنا" : "CLIENT REVIEWS & TRUST"}
              </span>
              <div className="w-10 h-px bg-[#C18556]/40" />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h2 className="text-3xl md:text-5xl font-bold text-[#0C363A] leading-[1.25] mb-6">
              {lang === "ar" ? (
                <>ثقة تُبنى <span className="text-[#C18556] font-serif italic">مع كل تسليم</span></>
              ) : (
                <>Trust Built <span className="text-[#C18556] font-serif italic">With Every Unit</span></>
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-[14px] md:text-[16px] text-[#0C363A]/70 leading-relaxed max-w-[650px] mx-auto mb-8">
              {lang === "ar" 
                ? "نوثق آراء عملائنا بكل مصداقية عبر تغطيات مرئية وتفاصيل حية على أرض الواقع تجسد التزامنا التام بالجودة والدقة."
                : "We document our clients' experiences with absolute credibility through video coverage and live updates on the ground."}
            </p>
          </Reveal>

          {/* Quick Review submission trigger CTA */}
          <Reveal delay={400}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#0C363A] to-[#124B50] text-[#DDB57C] hover:text-white text-[13px] font-bold rounded-[6px] shadow-[0_10px_25px_rgba(12,54,58,0.15)] hover:shadow-[0_12px_30px_rgba(193,133,86,0.25)] border border-[#C18556]/25 transition-all duration-300 hover:translate-y-[-2px] group"
            >
              <Plus size={16} className="text-[#DDB57C] transition-transform duration-300 group-hover:rotate-90" />
              <span>{lang === "ar" ? "أضف تقييمك السريع للموقع" : "Add Your Instant Feedback"}</span>
            </button>
          </Reveal>
        </div>

        {/* Video Cards Grid - Side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-20">
          {/* Card 1: Client Interviews */}
          <Reveal delay={200}>
            <div className="group relative w-full h-[280px] sm:h-[350px] rounded-[12px] overflow-hidden border border-[#C18556]/20 shadow-[0_20px_50px_rgba(12,54,58,0.06)] bg-[#0C363A] transition-all duration-500 hover:translate-y-[-6px] hover:border-[#C18556]/60 hover:shadow-[0_25px_60px_rgba(193,133,86,0.16)]">
              {/* Image Thumbnail */}
              <img 
                src={REVIEW_VIDEOS[0]?.cover || "/real-content/Customers Reviews/فيديو اراء العملاء-thumb.webp"} 
                alt="Client Interviews" 
                className="absolute inset-0 w-full h-full object-cover image-crisp opacity-85"
                loading="lazy"
                decoding="async"
              />
              {/* Smooth cinematic gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061F22] via-[#061F22]/30 to-transparent z-10" />

              {/* Float Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <button
                  type="button"
                  onClick={() => setActiveVideo(REVIEW_VIDEOS[0]?.videoUrl)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C18556]/95 hover:bg-white text-white hover:text-[#0C363A] flex items-center justify-center shadow-[0_0_35px_rgba(193,133,86,0.55)] transition-all duration-500 hover:scale-110 group-hover:rotate-6"
                >
                  <Play size={24} className="fill-current translate-x-[1.5px]" />
                </button>
              </div>

              {/* Title & Badge */}
              <div className="absolute bottom-6 inset-x-6 z-20 text-right pointer-events-none">
                <div className="inline-block bg-[#C18556] text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full mb-3 shadow-[0_4px_12px_rgba(193,133,86,0.35)]">
                  {lang === "ar" ? "آراء حية بالصوت والصورة" : "LIVE CLIENT INTERVIEWS"}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight font-serif drop-shadow-md">
                  {lang === "ar" ? "مقابلات وآراء العملاء" : "Client Interviews & Meetings"}
                </h3>
                <p className="text-[12px] sm:text-[13px] text-white/80 mt-1.5 drop-shadow-sm font-sans">
                  {lang === "ar" ? "لقاءات مسجلة وموثقة مع عملائنا الكرام بعد التسليم النهائي للوحدات." : "Recorded live conversations with clients detailing their execution experience."}
                </p>
              </div>

              {/* Glass Frame Corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
          </Reveal>

          {/* Card 2: WhatsApp Compilation */}
          <Reveal delay={350}>
            <div className="group relative w-full h-[280px] sm:h-[350px] rounded-[12px] overflow-hidden border border-[#C18556]/20 shadow-[0_20px_50px_rgba(12,54,58,0.06)] bg-[#0C363A] transition-all duration-500 hover:translate-y-[-6px] hover:border-[#C18556]/60 hover:shadow-[0_25px_60px_rgba(193,133,86,0.16)]">
              {/* Image Thumbnail */}
              <img 
                src={REVIEW_VIDEOS[1]?.cover || "/real-content/Customers Reviews/Customers Reviews-thumb.webp"} 
                alt="WhatsApp Chat Reviews" 
                className="absolute inset-0 w-full h-full object-cover image-crisp opacity-85"
                loading="lazy"
                decoding="async"
              />
              {/* Smooth cinematic gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061F22] via-[#061F22]/30 to-transparent z-10" />

              {/* Float Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <button
                  type="button"
                  onClick={() => setActiveVideo(REVIEW_VIDEOS[1]?.videoUrl)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C18556]/95 hover:bg-white text-white hover:text-[#0C363A] flex items-center justify-center shadow-[0_0_35px_rgba(193,133,86,0.55)] transition-all duration-500 hover:scale-110 group-hover:rotate-6"
                >
                  <Play size={24} className="fill-current translate-x-[1.5px]" />
                </button>
              </div>

              {/* Title & Badge */}
              <div className="absolute bottom-6 inset-x-6 z-20 text-right pointer-events-none">
                <div className="inline-block bg-[#0C363A] border border-[#C18556]/30 text-[#DDB57C] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full mb-3 shadow-[0_4px_12px_rgba(12,54,58,0.25)]">
                  {lang === "ar" ? "توثيق ورضا مستمر" : "SOCIAL CHAT PROOF"}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight font-serif drop-shadow-md">
                  {lang === "ar" ? "محادثات وآراء الواتساب" : "WhatsApp Chat compilations"}
                </h3>
                <p className="text-[12px] sm:text-[13px] text-white/80 mt-1.5 drop-shadow-sm font-sans">
                  {lang === "ar" ? "مجموعة لقطات وتوثيق لمحادثات واتساب تعكس مدى سعادة ورضا عملائنا." : "Visual compilation of chats and instant reactions from our clients."}
                </p>
              </div>

              {/* Glass Frame Corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
          </Reveal>
        </div>

        {/* Client Reviews Slider */}
        {showReviewSlider && carouselReviews.length > 0 && currentReview && (
          <Reveal delay={450}>
            <div className="mb-20 rounded-[10px] border border-[#C18556]/18 bg-white shadow-[0_22px_60px_rgba(12,54,58,0.08)] overflow-hidden">
              <div className="grid min-h-[360px]">
                <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                  {!(currentReview.image_url || currentReview.imageUrl) && (
                    <Quote size={78} strokeWidth={1.2} className="absolute top-8 end-8 text-[#C18556]/10 pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 text-[#C18556] mb-6">
                      {Array.from({ length: currentReview.rating || 5 }).map((_, idx) => (
                        <Star key={idx} size={16} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>

                    {(currentReview.image_url || currentReview.imageUrl) ? (
                      <button
                        type="button"
                        onClick={() => setActiveImage(currentReview.image_url || currentReview.imageUrl)}
                        className="group block w-full cursor-zoom-in overflow-hidden rounded-[8px] border border-[#C18556]/18 bg-[#0C363A]"
                      >
                        <img
                          src={currentReview.image_url || currentReview.imageUrl}
                          alt={lang === "ar" ? currentReview.nameAr || currentReview.name : currentReview.name || currentReview.nameAr}
                          className="max-h-[520px] min-h-[260px] w-full object-contain image-crisp transition-transform duration-500 group-hover:scale-[1.01]"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ) : (
                      <p className="text-xl sm:text-2xl lg:text-[28px] leading-[1.85] text-[#0C363A] font-serif font-medium">
                        "{lang === "ar" ? currentReview.quoteAr || currentReview.quote : currentReview.quote || currentReview.quoteAr}"
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-t border-[#C18556]/12 pt-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#0C363A]">
                        {lang === "ar" ? currentReview.nameAr || currentReview.name : currentReview.name || currentReview.nameAr}
                      </h3>
                      <p className="mt-1 text-sm text-[#0C363A]/55">
                        {lang === "ar" ? currentReview.roleAr || currentReview.role : currentReview.role || currentReview.roleAr}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={goToPrevReview}
                        className="h-11 w-11 rounded-full border border-[#C18556]/25 bg-white text-[#0C363A] transition-colors hover:bg-[#0C363A] hover:text-white"
                        aria-label={lang === "ar" ? "الرأي السابق" : "Previous review"}
                      >
                        {lang === "ar" ? <ChevronRight size={20} className="mx-auto" /> : <ChevronLeft size={20} className="mx-auto" />}
                      </button>
                      <div className="min-w-[64px] text-center text-xs font-bold tracking-[0.18em] text-[#C18556]">
                        {String((currentReviewIndex % carouselReviews.length) + 1).padStart(2, "0")} / {String(carouselReviews.length).padStart(2, "0")}
                      </div>
                      <button
                        type="button"
                        onClick={goToNextReview}
                        className="h-11 w-11 rounded-full border border-[#C18556]/25 bg-white text-[#0C363A] transition-colors hover:bg-[#0C363A] hover:text-white"
                        aria-label={lang === "ar" ? "الرأي التالي" : "Next review"}
                      >
                        {lang === "ar" ? <ChevronLeft size={20} className="mx-auto" /> : <ChevronRight size={20} className="mx-auto" />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {carouselReviews.length > 1 && (
                <div className="flex justify-center gap-2 border-t border-[#C18556]/12 bg-[#FAF7F2] px-5 py-4">
                  {carouselReviews.map((review, idx) => (
                    <button
                      key={review.id || idx}
                      type="button"
                      onClick={() => setCurrentReviewIndex(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === currentReviewIndex % carouselReviews.length ? "w-8 bg-[#C18556]" : "w-2.5 bg-[#C18556]/25 hover:bg-[#C18556]/50"
                      )}
                      aria-label={`${lang === "ar" ? "عرض الرأي" : "Show review"} ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* WhatsApp Screenshots Lightbox Gallery */}
        {screenshotReviews.length > 0 && (
          <div className="mt-16 pt-16 border-t border-[#C18556]/12">
            <Reveal>
              <div className="flex items-center gap-3 mb-8 justify-center">
                <ImageIcon size={18} className="text-[#C18556]" />
                <h3 className="text-2xl font-bold text-[#0C363A] text-center font-serif">
                  {lang === "ar" ? "معرض آراء العملاء المصورة" : "Client Conversations Gallery"}
                </h3>
              </div>
            </Reveal>

            {/* Horizontal sliding screenshots masonry container */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {screenshotReviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 100}>
                  <div 
                    onClick={() => setActiveImage(r.image_url)}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-[#C18556]/15 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] cursor-zoom-in transition-all duration-500 hover:translate-y-[-4px] hover:border-[#C18556]/50 hover:shadow-[0_15px_35px_rgba(193,133,86,0.12)]"
                  >
                    <img 
                      src={r.image_url} 
                      alt={r.client_name_ar || "التقييم المصور"} 
                      className="w-full h-full object-cover image-crisp"
                      loading="lazy"
                      decoding="async"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#0C363A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white text-[#0C363A] flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Star size={16} fill="#C18556" className="text-[#C18556]" />
                      </div>
                    </div>
                    
                    {/* Name Badge */}
                    <div className="absolute bottom-3 inset-x-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-[4px] pointer-events-none">
                      <p className="text-[11px] text-white font-medium text-center truncate">
                        {lang === "ar" ? (r.client_name_ar || "عميل تاكت") : (r.client_name_en || "Tact Client")}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FULL SCREEN VIDEO MODAL / LIGHTBOX */}
      {activeVideo && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setActiveVideo(null)} />
          
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border border-[#C18556]/30 shadow-2xl z-10 animate-scale-up">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-[#C18556] text-white flex items-center justify-center transition-all shadow-md"
            >
              <X size={20} />
            </button>
            <video 
              src={activeVideo} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {activeImage && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setActiveImage(null)} />
          
          <div className="relative max-w-full max-h-[90vh] bg-[#061F22]/80 p-2 rounded-lg border border-[#C18556]/30 shadow-2xl z-10 animate-scale-up overflow-hidden">
            <button 
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-[#C18556] text-white flex items-center justify-center transition-all shadow-md"
            >
              <X size={20} />
            </button>
            <img 
              src={activeImage} 
              alt="Full Resolution Screenshot" 
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* STAR RATING SUBMISSION GLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 animate-fade-in">
          {/* Glass Overlay backdrop */}
          <div className="absolute inset-0 bg-[#061F22]/92 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[12px] border border-[#C18556]/40 shadow-[0_30px_70px_rgba(0,0,0,0.5)] p-5 md:p-7 z-10 text-right animate-scale-up overflow-y-auto max-h-[90vh]" dir={lang === "ar" ? "rtl" : "ltr"}>
            
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-[#C18556] hover:border-[#C18556] flex items-center justify-center transition-all"
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-[#0C363A]/10 text-[#0C363A] flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0C363A]">
                  {lang === "ar" ? "أضف تقييمك السريع" : "Add Your Star Feedback"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === "ar" ? "رأيك وسام فخر يساعدنا على التطوير المستمر" : "Your opinion is highly valued."}
                </p>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Star Rating selector row */}
              <div className="form-group text-center bg-gray-50 py-2 rounded-lg border border-gray-100">
                <label className="block text-[13px] font-bold text-[#0C363A] mb-1.5">
                  {lang === "ar" ? "التقييم العام للخدمة" : "Overall Rating"}
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={() => setForm({ ...form, rating: star })}
                      className="transition-transform duration-200 hover:scale-125 focus:outline-none p-1"
                    >
                      <Star 
                        size={26} 
                        className={cn(
                          "transition-colors duration-200",
                          star <= (hoveredStar ?? form.rating) 
                            ? "fill-[#C18556] text-[#C18556]" 
                            : "text-gray-300 fill-none"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name input */}
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#0C363A]">
                  {lang === "ar" ? "الاسم الكريم بالكامل *" : "Full Name *"}
                </label>
                <input 
                  type="text" 
                  required
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={lang === "ar" ? "مثال: أ. محمد أنور" : "e.g. Mohamed Anwar"} 
                  className="w-full text-[13px] px-4 py-2 rounded-[6px] border border-gray-200 focus:border-[#C18556] focus:ring-1 focus:ring-[#C18556] bg-white outline-none transition-all text-right font-medium"
                />
              </div>

              {/* Unit Type input */}
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#0C363A]">
                  {lang === "ar" ? "نوع الوحدة والمنطقة (اختياري)" : "Unit Type & Location (Optional)"}
                </label>
                <input 
                  type="text" 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder={lang === "ar" ? "مثال: شقة التجمع الخامس، فيلا الشروق" : "e.g. Villa in Fifth Settlement"} 
                  className="w-full text-[13px] px-4 py-2 rounded-[6px] border border-gray-200 focus:border-[#C18556] focus:ring-1 focus:ring-[#C18556] bg-white outline-none transition-all text-right font-medium"
                />
              </div>

              {/* Review Quote input */}
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#0C363A]">
                  {lang === "ar" ? "اكتب تفاصيل تقييمك ورأيك *" : "Your Review Description *"}
                </label>
                <textarea 
                  required
                  rows={3}
                  value={form.quote} 
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  placeholder={lang === "ar" ? "حدثنا عن تجربتك في التصميم، التنفيذ والالتزام بالمواعيد..." : "Tell us about your experience..."} 
                  className="w-full text-[13px] px-4 py-2 rounded-[6px] border border-gray-200 focus:border-[#C18556] focus:ring-1 focus:ring-[#C18556] bg-white outline-none transition-all text-right font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0C363A] text-white hover:bg-[#C18556] text-[13px] font-bold rounded-[6px] shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  <Send size={15} className="rtl:rotate-180" />
                  <span>{submitting ? (lang === "ar" ? "جاري الإرسال..." : "Submitting...") : (lang === "ar" ? "إرسال تقييمي" : "Submit Feedback")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-500 hover:text-black rounded-[6px] text-[13px] font-bold transition-all"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
