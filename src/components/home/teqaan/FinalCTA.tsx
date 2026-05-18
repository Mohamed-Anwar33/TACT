import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { PACKAGES } from "@/data/site";
import Reveal from "@/components/ui-luxe/Reveal";
import { Check, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinalCTA() {
  const { lang } = useLang();

  const features = lang === "ar"
    ? ["تصميم 3D متكامل", "إشراف هندسي دقيق", "ضمان جودة الخامات", "تسليم على المفتاح"]
    : ["Full 3D Design", "Strict engineering supervision", "Premium material guarantee", "Turnkey handover"];

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-[#0C363A]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Architectural Background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#C18556 0.5px, transparent 0.5px)`, backgroundSize: '40px 40px' }} />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className={cn("absolute top-0 w-px h-full bg-gradient-to-b from-[#C18556]/20 via-[#C18556]/10 to-transparent", lang === "ar" ? "right-12" : "left-12")} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C18556]/5 blur-[120px] rounded-full" />
      </div>

      <div className="container-luxe relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#C18556]/40" />
              <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                {lang === "ar" ? "الباقات" : "PACKAGES"}
              </span>
              <div className="w-12 h-px bg-[#C18556]/40" />
            </div>
          </Reveal>
          
          <Reveal delay={150}>
            <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-8">
              {lang === "ar" ? (
                <>اختر الباقة <span className="text-[#C18556] italic">الأنسب لمساحتك</span></>
              ) : (
                <>Choose The Package <span className="text-[#C18556] italic">That Fits Your Space</span></>
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-base md:text-lg text-white/60 leading-relaxed mx-auto max-w-2xl">
              {lang === "ar" 
                ? "باقات مرنة تناسب مراحل مختلفة من التصميم والتنفيذ، مع إمكانية تخصيص العرض حسب احتياج مشروعك وطموحاتك."
                : "Flexible packages catering to different stages of design and execution, with customizable options to match your project needs and ambitions."}
            </p>
          </Reveal>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {PACKAGES.map((p, i) => {
            const isFeatured = p.featured;
            const num = (i + 1).toString().padStart(2, '0');

            return (
              <Reveal key={p.id} delay={i * 120} className="h-full">
                <div className={cn(
                  "relative h-full flex flex-col rounded-lg p-8 md:p-10 transition-all duration-500 group overflow-hidden border",
                  isFeatured 
                    ? "bg-[#C18556] border-[#FFFFFF]/30 shadow-2xl shadow-[#C18556]/20 lg:-translate-y-4" 
                    : "bg-white/[0.05] border-[#C18556]/20 hover:border-[#C18556]/50 hover:bg-white/[0.08]"
                )}>
                  {/* Decorative Number */}
                  <div className={cn(
                    "absolute top-6 text-[10px] font-bold tracking-widest z-20",
                    isFeatured ? "text-[#0C363A]/30" : "text-[#C18556]/30",
                    lang === "ar" ? "left-8" : "right-8"
                  )}>
                    {num}
                  </div>

                  {/* Ribbon for Featured Package */}
                  {isFeatured && (
                    <div className={cn(
                      "absolute top-0 bg-white text-[#0C363A] text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-sm shadow-md flex items-center gap-1",
                      lang === "ar" ? "right-0" : "left-0"
                    )}>
                      <Sparkles size={10} fill="currentColor" />
                      <span>{lang === "ar" ? "الأكثر طلباً" : "MOST POPULAR"}</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className={cn(
                      "text-xl font-serif mb-6",
                      isFeatured ? "text-[#0C363A]" : "text-[#C18556]"
                    )}>
                      {lang === "ar" ? p.nameAr : p.name}
                    </h3>
                    
                    <div className="mb-8 flex items-baseline gap-2">
                      <span className={cn(
                        "font-serif text-5xl font-medium tracking-tight",
                        isFeatured ? "text-white" : "text-white"
                      )}>
                        {p.price}
                      </span>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        isFeatured ? "text-[#0C363A]/60" : "text-white/40"
                      )}>
                        {lang === "ar" ? "جنيه / م²" : "EGP / m²"}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm leading-relaxed mb-8",
                      isFeatured ? "text-[#0C363A]/80" : "text-white/60"
                    )}>
                      {lang === "ar" ? p.descAr : p.desc}
                    </p>

                    <div className={cn(
                      "h-px w-full mb-8",
                      isFeatured ? "bg-[#0C363A]/10" : "bg-white/10"
                    )} />

                    <ul className="space-y-4">
                      {features.map((f, idx) => (
                        <li key={idx} className={cn(
                          "flex items-center gap-3 text-xs font-medium",
                          isFeatured ? "text-[#0C363A]/90" : "text-white/80"
                        )}>
                          <Check size={14} className={cn("flex-shrink-0", isFeatured ? "text-[#0C363A]" : "text-[#C18556]")} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-12">
                    <Link 
                      to={`/packages/${p.id}/configurator`} 
                      className={cn(
                        "w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300",
                        isFeatured 
                          ? "bg-white text-[#0C363A] hover:bg-[#0C363A] hover:text-white" 
                          : "border border-[#C18556]/50 text-white hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556]"
                      )}
                    >
                      <span>{lang === "ar" ? "تخصيص وحساب التكلفة" : "CONFIGURE TIER"}</span>
                      {lang === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Note & Custom Link */}
        <div className="mt-16 text-center">
          <Reveal delay={400}>
            <p className="text-[11px] text-white/40 mb-3 uppercase tracking-widest">
              {lang === "ar" ? "جميع الباقات قابلة للتخصيص حسب طبيعة مشروعك" : "ALL PACKAGES ARE CUSTOMIZABLE BASED ON YOUR PROJECT NATURE"}
            </p>
            <Link 
              to="/questionnaire" 
              className="inline-flex items-center gap-2 text-xs text-[#C18556] font-bold uppercase tracking-widest hover:text-white transition-all underline underline-offset-4"
            >
              <span>{lang === "ar" ? "اطلب عرضاً مخصصاً الآن" : "REQUEST A BESPOKE PROPOSAL NOW"}</span>
              {lang === "ar" ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Decorative Corner Marks */}
      <div className={cn(
        "absolute top-20 opacity-10 pointer-events-none hidden lg:block w-24 h-24 border-t border-[#C18556]",
        lang === "ar" ? "left-20 border-l" : "right-20 border-r"
      )} />
    </section>
  );
}
