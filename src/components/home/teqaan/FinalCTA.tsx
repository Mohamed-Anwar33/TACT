import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { getUnlockedPackageIds, getPackages } from "@/lib/catalog";
import Reveal from "@/components/ui-luxe/Reveal";
import { Check, ArrowLeft, ArrowRight, Star, Crown, Shield, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsSection } from "@/lib/publicCms";

const packageCovers: Record<string, string> = {
  economy: "/real-content/Packages/package-covers/economy.jpg",
  medium: "/real-content/Packages/package-covers/medium.jpg",
  luxury: "/real-content/Packages/package-covers/luxury.jpg",
};

export default function FinalCTA({ section }: { section?: CmsSection }) {
  const { lang } = useLang();
  const { user, profile, loading } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [packages, setPackages] = useState<any[]>(() => [
    {
      id: "economy",
      name_ar: "باقة أساسية",
      name_en: "Basic Package",
      price_label: "6,000",
      description_ar: "باقة مثالية للشركات الناشئة ورواد الأعمال الذين يحتاجون إلى الأدوات الأساسية للانطلاق بثقة.",
      description_en: "Ideal for startups and entrepreneurs who need the essential tools to launch with confidence.",
      featured: false,
      features_ar: ["تصميم 3D متكامل", "إشراف هندسي دقيق", "ضمان جودة الخامات", "تسليم على المفتاح"],
      features_en: ["Full 3D Design", "Strict engineering supervision", "Premium material guarantee", "Turnkey handover"],
      cover_url: ""
    },
    {
      id: "medium",
      name_ar: "باقة متوسطة",
      name_en: "Standard Package",
      price_label: "8,000",
      description_ar: "باقة متوازنة تمنحك جميع الأدوات والمخططات الأساسية لإدارة أعمالك بكفاءة وتحقيق نمو مستدام.",
      description_en: "A balanced package that gives you all the essential tools and designs to manage efficiently.",
      featured: true,
      badge_ar: "الأكثر طلباً",
      badge_en: "Most Popular",
      features_ar: ["تصميم 3D متكامل", "إشراف هندسي دقيق", "ضمان جودة الخامات", "تسليم على المفتاح"],
      features_en: ["Full 3D Design", "Strict engineering supervision", "Premium material guarantee", "Turnkey handover"],
      cover_url: ""
    },
    {
      id: "luxury",
      name_ar: "باقة فاخرة",
      name_en: "Premium Package",
      price_label: "10,000",
      description_ar: "باقة متكاملة مصممة للشركات الكبيرة التي تحتاج إلى حلول متقدمة ودعم مخصص وتجربة احترافية بلا حدود.",
      description_en: "A complete package designed for large enterprises requiring advanced solutions and dedicated support.",
      featured: false,
      features_ar: ["تصميم 3D متكامل", "إشراف هندسي دقيق", "ضمان جودة الخامات", "تسليم على المفتاح"],
      features_en: ["Full 3D Design", "Strict engineering supervision", "Premium material guarantee", "Turnkey handover"],
      cover_url: ""
    }
  ]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [allPackages, unlocked] = await Promise.all([
          getPackages(),
          user?.id ? getUnlockedPackageIds(user.id, !!profile?.packages_unlocked) : Promise.resolve([])
        ]);
        if (!alive) return;
        if (allPackages && allPackages.length > 0) {
          setPackages(allPackages);
        }
        setUnlockedIds(unlocked);
      } catch (err) {
        console.error("Failed to load packages in FinalCTA:", err);
      }
    }
    if (!loading) {
      load();
    }
    return () => {
      alive = false;
    };
  }, [user?.id, profile?.packages_unlocked, loading]);

  const getPackageIcon = (id: string) => {
    if (id === "economy") return Layout;
    if (id === "medium") return Star;
    if (id === "luxury") return Crown;
    return Star;
  };

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#0C363A] via-[#051E20] to-[#031314]" dir={lang === "ar" ? "rtl" : "ltr"}>
      
      {/* Texture background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0" 
           style={{ backgroundImage: `radial-gradient(#C18556 0.7px, transparent 0.7px)`, backgroundSize: '36px 36px' }} />
      
      {/* Luxury vignette and ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(3,19,20,0.85))] pointer-events-none z-0" />
      <div className="absolute top-1/4 left-10 w-[450px] h-[450px] bg-[#C18556]/[0.02] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-[#0F6E66]/[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Decorative vertical blueprint lines */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden max-w-7xl mx-auto px-6 opacity-[0.04]">
        <div className="w-px h-full bg-gradient-to-b from-[#C18556]/30 via-transparent to-[#C18556]/30 absolute left-8" />
        <div className="w-px h-full bg-gradient-to-b from-[#C18556]/30 via-transparent to-[#C18556]/30 absolute right-8" />
      </div>

      <div className="container-luxe relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto px-4">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-[1px] bg-gradient-to-r from-transparent to-[#C18556]/60" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C18556]/80" />
              </div>
              <span className="text-[#C18556] text-[11px] font-bold uppercase tracking-[0.4em]">
                {lang === "ar" ? section?.sectionNameAr || "الباقات" : section?.sectionNameEn || "PACKAGES"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C18556]/80" />
                <div className="w-10 h-[1px] bg-gradient-to-l from-transparent to-[#C18556]/60" />
              </div>
            </div>
          </Reveal>
          
          <Reveal delay={150}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white/95 leading-tight mb-6">
              {(() => {
                const titleText = lang === "ar" ? section?.titleAr : section?.titleEn;
                if (!titleText) {
                  return lang === "ar" ? (
                    <>
                      اختر الباقة <span className="text-[#C18556] font-normal italic">الأنسب</span> لمساحتك
                    </>
                  ) : (
                    <>
                      Choose the <span className="text-[#C18556] font-normal italic">Perfect Package</span> for Your Space
                    </>
                  );
                }
                const separator = titleText.includes("|") ? "|" : titleText.includes(" - ") ? " - " : titleText.includes("\n") ? "\n" : null;
                if (separator) {
                  const parts = titleText.split(separator);
                  const main = parts[0].trim();
                  const sub = parts.slice(1).join(separator).trim();
                  return (
                    <>
                      {main} <span className="text-[#C18556] font-normal italic">{sub}</span>
                    </>
                  );
                }
                return titleText;
              })()}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mx-auto font-light">
              {lang === "ar" 
                ? section?.bodyAr || "باقات مرنة تناسب مراحل مختلفة من التصميم والتنفيذ، مع إمكانية تخصيص العرض حسب احتياج مشروعك وطموحاتك."
                : section?.bodyEn || "Flexible packages catering to different stages of design and execution, with customizable options to match your project needs and ambitions."}
            </p>
          </Reveal>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch max-w-6xl mx-auto px-4 mt-16">
          {packages.map((p, i) => {
            const isFeatured = p.featured;
            const Icon = getPackageIcon(p.id);
            const isUnlocked = unlockedIds.includes(p.id);
            const cardNum = String(i + 1).padStart(2, "0");
            const coverImg = p.cover_url || packageCovers[p.id];

            return (
              <Reveal key={p.id} delay={i * 120} className="h-full">
                <div className={cn(
                  "relative h-full flex flex-col rounded-2xl transition-all duration-500 luxury-motion group overflow-hidden border hover-shine-effect",
                  isFeatured
                    ? "featured-gradient-border shadow-[0_25px_60px_rgba(0,0,0,0.45)] lg:-translate-y-4 hover:shadow-[0_28px_70px_rgba(193,133,86,0.22)]"
                    : "bg-[#06201D]/75 border-white/[0.06] hover:border-[#C18556]/40 shadow-xl backdrop-blur-md hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]",
                  "hover:-translate-y-2"
                )}>
                  
                  {/* Active / Unlocked Status Badge or Featured Ribbon */}
                  {isUnlocked ? (
                    <div className={cn(
                      "absolute top-4 z-30 bg-emerald-700 border border-emerald-500/30 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse",
                      lang === "ar" ? "left-4" : "right-4"
                    )}>
                      <Check size={10} className="stroke-[3] text-emerald-300" />
                      <span>{lang === "ar" ? "مفتوحة ومفعلة" : "ACTIVE / UNLOCKED"}</span>
                    </div>
                  ) : isFeatured ? (
                    <div className={cn(
                      "absolute top-4 z-30 bg-gradient-to-r from-[#C18556] to-[#DDB57C] text-[#0C363A] text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5",
                      lang === "ar" ? "left-4" : "right-4"
                    )}>
                      <Star size={10} fill="currentColor" className="stroke-none" />
                      <span>{lang === "ar" ? p.badge_ar || "الأكثر طلباً" : p.badge_en || "Most Popular"}</span>
                    </div>
                  ) : null}

                  {/* Perfectly scaled cover image container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/25">
                    {coverImg && (
                      <>
                        {/* Blurred backup background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-110 pointer-events-none"
                          style={{ backgroundImage: `url(${coverImg})` }}
                        />
                        
                        {/* Raw main image containing full details */}
                        <img
                          src={coverImg}
                          alt={lang === "ar" ? p.name_ar : p.name_en}
                          loading="lazy"
                          decoding="async"
                          className="relative w-full h-full object-contain image-crisp package-cover-zoom"
                        />
                      </>
                    )}

                    {/* Numeric Badge Pill */}
                    <div className={cn(
                      "absolute top-4 rounded-full border px-3 py-0.5 text-[10px] font-mono font-bold tracking-widest text-white backdrop-blur-md bg-black/35",
                      lang === "ar" ? "right-4" : "left-4",
                      isFeatured ? "border-[#C18556]/40 text-[#C18556]" : "border-white/10 text-white/70"
                    )}>
                      {cardNum}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-8 md:p-9 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Premium Circle Icon */}
                      <div className="flex justify-between items-center mb-5">
                        <div className={cn(
                          "w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-500 luxury-motion",
                          isFeatured 
                            ? "border-[#C18556] bg-[#C18556]/15 text-[#C18556] shadow-[0_0_15px_rgba(193,133,86,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_26px_rgba(193,133,86,0.35)]" 
                            : "border-white/10 bg-white/[0.02] text-white/70 group-hover:border-[#C18556]/50 group-hover:text-[#C18556] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(193,133,86,0.18)]"
                        )}>
                          <Icon size={20} className="stroke-[1.5]" />
                        </div>
                      </div>

                      {/* Package Name */}
                      <h3 className="text-xl font-bold font-serif text-[#C18556] mb-3">
                        {lang === "ar" ? p.name_ar : p.name_en}
                      </h3>

                      {/* Package Price */}
                      <div className="mb-4 flex items-baseline gap-1.5">
                        <span className="font-serif text-5xl font-medium tracking-tight text-white/95">
                          {p.price_label}
                        </span>
                        <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">
                          {lang === "ar" ? p.unit_label_ar || "جنيه / م²" : p.unit_label_en || "EGP / m²"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/60 leading-relaxed mb-6 font-light min-h-[40px] line-clamp-2">
                        {lang === "ar" ? p.description_ar : p.description_en}
                      </p>

                      {/* Divider */}
                      <div className="h-[1px] w-full bg-white/[0.06] mb-6" />

                      {/* Features Checklist */}
                      <ul className="space-y-3.5 flex-1 mb-8">
                        {(lang === "ar" ? p.features_ar : p.features_en)?.map((feat: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-xs text-white/80">
                            <div className="w-4 h-4 rounded-full bg-[#C18556]/15 border border-[#C18556]/30 flex items-center justify-center text-[#C18556] flex-shrink-0 transition-all duration-500 luxury-motion group-hover:scale-125 group-hover:bg-[#C18556] group-hover:text-[#0C363A] group-hover:shadow-[0_0_14px_rgba(193,133,86,0.35)]">
                              <Check size={9} className="stroke-[3]" />
                            </div>
                            <span className="font-light">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Link 
                        to={`/packages/${p.id}/configurator`} 
                        className={cn(
                          "w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.20em] flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95",
                          isUnlocked
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/30"
                            : isFeatured 
                              ? "bg-gradient-to-r from-[#C18556] to-[#DDB57C] text-[#0C363A] hover:brightness-110 shadow-lg shadow-[#C18556]/20 font-bold" 
                              : "border border-[#C18556]/50 text-white hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556]"
                        )}
                      >
                        <span>
                          {isUnlocked 
                            ? (lang === "ar" ? "الباقة مفعلة - ابدأ التخصيص" : "PACKAGE ACTIVE - START CONFIGURING")
                            : (lang === "ar" ? "تخصيص وحساب التكلفة" : "CONFIGURE TIER")
                          }
                        </span>
                        {lang === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      </Link>
                    </div>

                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Note & Custom Bespoke Link */}
        <div className="mt-20 text-center px-4">
          <Reveal delay={400}>
            {/* Note row with Shield icon */}
            <div className="flex items-center justify-center gap-2 mb-4 text-white/50 text-[11px] tracking-widest uppercase">
              <Shield size={14} className="text-[#C18556] flex-shrink-0" />
              <span>
                {lang === "ar" ? "جميع الباقات قابلة للتخصيص حسب طبيعة مشروعك" : "ALL PACKAGES ARE FULLY CUSTOMIZABLE BASED ON YOUR PROJECT TYPE"}
              </span>
            </div>

            {/* Custom Link with horizontal decorative lines */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C18556]/40 hidden sm:block" />
              <Link 
                to={section?.ctaUrl || "/questionnaire"} 
                className="inline-flex items-center gap-2 text-xs text-[#C18556] font-bold uppercase tracking-[0.18em] hover:text-white transition-all underline underline-offset-4 group"
              >
                <span>{lang === "ar" ? section?.ctaLabelAr || "اطلب عرضاً مخصصاً الآن" : section?.ctaLabelEn || "REQUEST A BESPOKE PROPOSAL NOW"}</span>
                {lang === "ar" ? (
                  <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
                ) : (
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </Link>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C18556]/40 hidden sm:block" />
            </div>
          </Reveal>
        </div>

      </div>

      {/* Decorative Elegant Corner Frame Marks */}
      <div className={cn(
        "absolute top-20 opacity-[0.08] pointer-events-none hidden lg:block w-24 h-24 border-t border-[#C18556]",
        lang === "ar" ? "left-20 border-l" : "right-20 border-r"
      )} />
      <div className={cn(
        "absolute bottom-20 opacity-[0.08] pointer-events-none hidden lg:block w-24 h-24 border-b border-[#C18556]",
        lang === "ar" ? "right-20 border-r" : "left-20 border-l"
      )} />

    </section>
  );
}
