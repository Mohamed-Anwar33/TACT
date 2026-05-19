import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { TESTIMONIALS_AR, REVIEW_VIDEOS } from "@/data/site";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import { Quote, Play, Star, CheckCircle2, Plus, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCmsReviews } from "@/lib/publicCms";
import { submitClientReview } from "@/lib/reviewSubmission";

const STATIC_REVIEWS = [
  { id: "s1", name: "أ. محمد الشريف", role: "مشروع فيلا سكنية", quote: TESTIMONIALS_AR[0], rating: 5, date: "2026-04-12" },
  { id: "s2", name: "د. ريم العبد الله", role: "تشطيب شقة بالتجمع", quote: TESTIMONIALS_AR[1], rating: 5, date: "2026-03-28" },
  { id: "s3", name: "م. خالد المنصور", role: "مقر إداري فاخر", quote: TESTIMONIALS_AR[2], rating: 5, date: "2026-03-15" },
  { id: "s4", name: "أ. فاطمة الزهراء", role: "بنتهاوس الساحل", quote: TESTIMONIALS_AR[3], rating: 5, date: "2026-02-20" },
  { id: "s5", name: "أ. عمر الفاروق", role: "عيادة طبية متكاملة", quote: TESTIMONIALS_AR[4], rating: 5, date: "2026-01-30" },
  { id: "s6", name: "أ. سارة يوسف", role: "تجديد وتأثيث كامل", quote: TESTIMONIALS_AR[5], rating: 5, date: "2026-01-10" },
];

export default function Testimonials() {
  const { t, lang } = useLang();
  const [reviews, setReviews] = useState<any[]>(STATIC_REVIEWS);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    role: "",
    quote: "",
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const dynamicMapped = data.map((d) => ({
          id: d.id,
          name: d.name,
          role: lang === "en" ? (d.role_en || d.role_ar || "Client") : (d.role_ar || d.role_en || "عميل تاكت"),
          quote: lang === "en" ? (d.quote_en || d.quote_ar) : (d.quote_ar || d.quote_en),
          rating: d.rating || 5,
          date: d.created_at.split("T")[0],
          videoUrl: d.video_url,
        }));
        setReviews([...dynamicMapped, ...STATIC_REVIEWS]);
      } else {
        setReviews(STATIC_REVIEWS);
      }
      const cmsReviews = await getCmsReviews();
      if (cmsReviews.length) {
        setReviews(cmsReviews.map((review) => ({
          id: review.id,
          name: lang === "ar" ? review.nameAr : review.name,
          role: lang === "ar" ? review.roleAr : review.role,
          quote: lang === "ar" ? review.quoteAr : review.quote,
          rating: review.rating,
          date: "",
          videoUrl: review.videoUrl,
          imageUrl: review.imageUrl,
        })));
      }
      setLoading(false);
    }
    loadReviews();
  }, [lang]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.quote) {
      toast.error(lang === "ar" ? "يرجى تعبئة الاسم ونص التقييم" : "Please fill in your name and review");
      return;
    }

    setSubmitting(true);
    try {
      await submitClientReview(form);
      setSubmitted(true);
      toast.success(lang === "ar" ? "تم إرسال تقييمك بنجاح!" : "Review submitted successfully!");
      setForm({ name: "", role: "", quote: "", rating: 5 });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "5star") return r.rating === 5;
    if (filter === "video") return !!r.videoUrl;
    return true;
  });

  return (
    <>
      <section className="pt-40 pb-20 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container-luxe relative z-10 text-center md:text-right">
          <SectionEyebrow label={t("testimonials_eyebrow")} />
          <h1 className="display-1 mt-4 max-w-4xl text-balance font-serif-ar">
            {lang === "ar" ? "سجل الشرف لعملائنا" : "Client Wall of Honor"}
          </h1>
          <p className="text-ivory/70 max-w-xl mt-4 text-base leading-relaxed">
            {lang === "ar"
              ? "نفخر بكل مساحة سلمناها وبكل علاقة ثقة بنيناها على مدار أكثر من 12 عاماً من الالتزام والجودة."
              : "We take pride in every space delivered and every relationship built over 12+ years of absolute trust."}
          </p>

          <div className="mt-8">
            <a href="#submit-review" className="btn-gold inline-flex items-center gap-2">
              <Sparkles size={16} />
              <span>{lang === "ar" ? "أضف تقييمك وتجربتك" : "Submit Your Experience"}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FBF7F0] text-foreground" dir="rtl">
        <div className="container-luxe">
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {[
              { id: "all", label: lang === "ar" ? "كل التقييمات" : "All Reviews" },
              { id: "5star", label: lang === "ar" ? "٥ نجوم" : "5 Stars" },
              { id: "video", label: lang === "ar" ? "توثيق الفيديو" : "Video Testimonials" },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setFilter(tag.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-serif uppercase tracking-wider transition-all duration-300 ${
                  filter === tag.id
                    ? "bg-teal-deep text-gold shadow-md"
                    : "bg-white border border-border text-muted-foreground hover:border-gold/40"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">
              {lang === "ar" ? "جاري تحميل آراء العملاء..." : "Loading reviews..."}
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 [column-fill:_balance]">
              {filteredReviews.map((r, i) => (
                <Reveal key={r.id + i} delay={(i % 6) * 60}>
                  <div className="bg-white border border-border/60 hover:border-gold/40 p-8 rounded-xl mb-8 break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-500 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <Quote size={28} className="text-gold/40 group-hover:text-gold transition-colors flex-shrink-0" />
                      <div className="flex gap-1 text-gold">
                        {Array.from({ length: r.rating || 5 }).map((_, idx) => (
                          <Star key={idx} size={14} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                    </div>

                    <p className="text-[#0C363A] text-[15px] leading-relaxed italic mb-8 font-serif-ar">
                      "{r.quote}"
                    </p>

                    {r.imageUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(r.imageUrl, "_blank", "noopener,noreferrer")}
                        className="mb-6 block w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30"
                      >
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          loading="lazy"
                          decoding="async"
                          className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </button>
                    )}

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif-ar text-base font-bold text-teal-deep">
                          {r.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.role}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {r.date}
                      </span>
                    </div>

                    {r.videoUrl && (
                      <div className="mt-4 pt-4 border-t border-dashed border-border/60 flex items-center justify-between bg-muted/30 -mx-8 -mb-8 p-4 px-8">
                        <span className="text-xs text-teal-deep font-medium flex items-center gap-1.5">
                          <Play size={12} className="fill-current text-gold" />
                          {lang === "ar" ? "مرفق توثيق مرئي" : "Video attached"}
                        </span>
                        <button 
                          onClick={() => setActiveVideo(r.videoUrl)}
                          className="text-xs text-gold underline hover:text-teal-deep transition-colors"
                        >
                          {lang === "ar" ? "مشاهدة" : "Watch"}
                        </button>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {filteredReviews.length === 0 && !loading && (
            <div className="text-center py-20 text-muted-foreground">
              {lang === "ar" ? "لا توجد تقييمات مطابقة لهذا الفلتر." : "No reviews match this filter."}
            </div>
          )}
        </div>
      </section>

      {/* CLIENT FEEDBACK REAL VIDEO PLAYER SECTION */}
      <section className="py-20 bg-white border-y border-border">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionEyebrow label={lang === "ar" ? "توثيق مرئي فعلي" : "Real Experience Videos"} />
            <h2 className="text-3xl font-serif-ar text-teal-deep mt-3">
              {lang === "ar" ? "فيديوهات آراء ومقابلات العملاء الحقيقية" : "Client Feedback Video Interviews"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {REVIEW_VIDEOS.map((v, i) => (
              <Reveal key={v.id} delay={i * 100}>
                <div 
                  onClick={() => setActiveVideo(v.videoUrl)}
                  className="relative aspect-[4/5] bg-teal-deep rounded-2xl overflow-hidden group cursor-pointer border border-border shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 pointer-events-none" />
                  <img 
                    src={v.cover}
                    alt={v.title} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover image-crisp"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />

                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gold/90 text-teal-deep flex items-center justify-center shadow-[0_0_30px_rgba(193, 133, 86,0.5)] group-hover:bg-gold group-hover:scale-110 transition-all duration-300">
                      <Play size={24} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-6 z-20 text-white text-right">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-mono block mb-1">
                      {v.client}
                    </span>
                    <h4 className="font-serif-ar text-base text-ivory/95 line-clamp-2">
                      {v.title}
                    </h4>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {activeVideo && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="relative w-full max-w-4xl bg-teal-deep rounded-2xl overflow-hidden border border-gold/30 shadow-2xl animate-scale-up">
                <header className="flex items-center justify-between p-4 bg-black/40 border-b border-ivory/10">
                  <span className="font-serif-ar text-sm text-gold">
                    {lang === "ar" ? "رأي العميل الفعلي" : "Client Video Feedback"}
                  </span>
                  <button 
                    onClick={() => setActiveVideo(null)}
                    className="w-8 h-8 rounded-full bg-ivory/10 text-white hover:bg-gold hover:text-black flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                </header>
                <div className="aspect-video w-full bg-black">
                  <video
                    src={activeVideo}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    {lang === "ar" ? "متصفحك لا يدعم تشغيل الفيديو." : "Your browser does not support video playback."}
                  </video>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="submit-review" className="py-24 bg-[#0C363A] text-ivory relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 arch-grid opacity-15" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container-luxe relative z-10 max-w-3xl">
          <div className="text-center mb-12">
            <SectionEyebrow label={lang === "ar" ? "رأيك يهمنا" : "Feedback"} />
            <h2 className="text-3xl md:text-5xl font-serif-ar mt-3 text-gold">
              {lang === "ar" ? "شاركنا تجربة تشطيب وحدتك" : "Rate Your Tact Experience"}
            </h2>
            <p className="text-ivory/70 text-sm mt-3 max-w-lg mx-auto">
              {lang === "ar"
                ? "تساعدنا تقييماتكم على الحفاظ على أعلى معايير الجودة والتطوير المستمر لخدماتنا."
                : "Your review helps us maintain strict architectural standards and excellence."}
            </p>
          </div>

          {submitted ? (
            <div className="bg-white/5 backdrop-blur-md border border-gold/30 rounded-2xl p-12 text-center animate-scale-up">
              <CheckCircle2 size={64} className="text-gold mx-auto mb-6" />
              <h3 className="text-2xl font-serif-ar text-ivory mb-3">
                {lang === "ar" ? "شكرًا لك! تم استلام تقييمك بنجاح." : "Thank You! Review Received."}
              </h3>
              <p className="text-ivory/70 text-sm leading-relaxed max-w-md mx-auto">
                {lang === "ar"
                  ? "سيتم مراجعة التقييم من قِبل إدارة الشركة لإضافته إلى سجل الشرف وقائمة آراء العملاء المعروضة بالموقع."
                  : "Your review will be checked by management before getting displayed on the client wall."}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 text-xs text-gold underline hover:text-white"
              >
                {lang === "ar" ? "إرسال تقييم آخر" : "Submit another review"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="bg-white/5 backdrop-blur-md border border-gold/20 rounded-2xl p-8 md:p-12 grid gap-6 relative">
              <div>
                <label className="text-xs uppercase tracking-widest text-gold block mb-3 text-center md:text-right">
                  {lang === "ar" ? "التقييم العام" : "Overall Rating"}
                </label>
                <div className="flex justify-center md:justify-start gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-2 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          star <= form.rating ? "text-gold fill-current" : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-ivory/70 block mb-2">
                    {lang === "ar" ? "الاسم الكريم" : "Your Name"} *
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "م. أحمد عبد الله" : "John Doe"}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 bg-black/30 border-white/10 text-ivory focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-ivory/70 block mb-2">
                    {lang === "ar" ? "اسم المشروع أو نوع الوحدة" : "Project / Unit Type"}
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "فيلا التجمع الخامس" : "New Cairo Villa"}
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="h-12 bg-black/30 border-white/10 text-ivory focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-ivory/70 block mb-2">
                  {lang === "ar" ? "نص التقييم ورأيك في التجربة" : "Your Review"} *
                </label>
                <Textarea
                  placeholder={lang === "ar" ? "اكتب تجربتك مع فريق العمل وجودة التشطيب والتسليم..." : "Write about execution quality, team communication..."}
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  className="min-h-32 bg-black/30 border-white/10 text-ivory focus:border-gold leading-relaxed font-serif-ar"
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-ivory/40">
                  {lang === "ar" ? "يتم مراجعة التقييمات قبل النشر" : "Reviewed before publishing"}
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold min-w-[140px]"
                >
                  {submitting ? "..." : lang === "ar" ? "إرسال التقييم" : "Submit Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
