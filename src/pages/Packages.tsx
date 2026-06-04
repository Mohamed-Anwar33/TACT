import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { whatsappLink } from "@/data/site";
import Reveal from "@/components/ui-luxe/Reveal";
import SEO from "@/components/layout/SEO";
import { Lock, Check, Diamond, ArrowRight, ArrowLeft, Layout, Star, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CatalogPackage, getPackages, getUnlockedPackageIds } from "@/lib/catalog";

const packageCovers: Record<string, string> = {
  economy: "/real-content/Packages/package-covers/economy.jpg",
  medium: "/real-content/Packages/package-covers/medium.jpg",
  luxury: "/real-content/Packages/package-covers/luxury.jpg",
};

export default function Packages() {
  const { lang } = useLang();
  const { user, profile, isOfficeConsultant, loading } = useAuth();
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setBusy(true);
      const [allPackages, unlocked] = await Promise.all([
        getPackages(),
        getUnlockedPackageIds(user?.id, !!profile?.packages_unlocked),
      ]);
      if (!alive) return;
      setPackages(allPackages);
      if (isOfficeConsultant) {
        setUnlockedIds(allPackages.map((pkg) => pkg.id));
      } else {
        setUnlockedIds(unlocked);
      }
      setBusy(false);
    }
    if (!loading) load();
    return () => {
      alive = false;
    };
  }, [user?.id, profile?.packages_unlocked, isOfficeConsultant, loading]);

  const getPackageIcon = (id: string) => {
    if (id === "economy") return Layout;
    if (id === "medium") return Star;
    if (id === "luxury") return Crown;
    return Star;
  };

  const getPackageNum = (index: number) => {
    return String(index + 1).padStart(2, "0");
  };

  if (loading || busy) {
    return (
      <div className="pt-40 pb-32 min-h-screen bg-[#0C363A] text-ivory flex flex-col items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 arch-grid opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-[#0C363A] via-[#051E20] to-[#031314] pointer-events-none z-0" />
        <div className="relative z-10 animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#C18556] border-t-transparent animate-spin" />
          <div className="text-[#C18556] text-xs uppercase tracking-widest font-mono">
            {lang === "ar" ? "جاري تحميل الباقات الراقية..." : "Loading elite packages..."}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="pt-40 pb-32 min-h-screen flex items-center bg-gradient-to-b from-[#0C363A] via-[#051E20] to-[#031314] text-ivory relative overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Texture background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0" 
             style={{ backgroundImage: `radial-gradient(#C18556 0.7px, transparent 0.7px)`, backgroundSize: '36px 36px' }} />
        
        {/* Luxury vignette and ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(3,19,20,0.85))] pointer-events-none z-0" />
        <div className="absolute top-1/4 left-10 w-[450px] h-[450px] bg-[#C18556]/[0.02] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-[#0F6E66]/[0.03] blur-[150px] rounded-full pointer-events-none" />
        
        {/* Architectural Frame */}
        <div className="absolute inset-6 border border-[#C18556]/20 pointer-events-none z-10 hidden md:block">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C18556]/60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C18556]/60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C18556]/60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C18556]/60" />
        </div>

        <div className="container-luxe relative max-w-2xl text-center z-20">
          <Reveal>
            <div className="w-24 h-24 rounded-full border border-[#C18556] bg-[#C18556]/15 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(193,133,86,0.2)] group hover:scale-105 transition-transform duration-500">
              <Lock className="text-[#C18556]" size={36} />
            </div>
          </Reveal>
          
          <Reveal delay={100}>
            <div className="text-[#C18556] text-[10px] uppercase tracking-[0.4em] mb-4 font-bold">
              {lang === "ar" ? "محتوى مخصص للعملاء" : "Client-only content"}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-4xl md:text-5xl font-serif leading-tight text-white mb-6">
              {lang === "ar" ? "الباقات تفتح بعد مراجعة العربون" : "Packages unlock after deposit review"}
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-white/60 mb-10 leading-relaxed font-light text-base md:text-lg max-w-lg mx-auto">
              {lang === "ar"
                ? "سجل الدخول، اختر الباقة من صفحة الدفع، ثم ارفع بيانات التحويل. بعد اعتماد الإدارة ستظهر الباقة المفتوحة هنا فقط."
                : "Sign in, choose the package on the payment page, and submit transfer details. Once approved, your unlocked package appears here."}
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <Link 
                to="/auth" 
                className="px-10 py-4 bg-[#C18556] text-[#0C363A] rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#DDB57C] hover:scale-105 active:scale-95 shadow-lg shadow-[#C18556]/20"
              >
                {lang === "ar" ? "إنشاء حساب / دخول" : "Sign in / Sign up"}
              </Link>
              <Link 
                to="/payment" 
                className="px-10 py-4 border border-[#C18556]/60 text-white rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#C18556]/10 backdrop-blur-sm"
              >
                {lang === "ar" ? "تعليمات الدفع والتحويل" : "Payment Instructions"}
              </Link>
              <a 
                href={whatsappLink()} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[#C18556] hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 transition-all group font-bold underline underline-offset-4"
              >
                {lang === "ar" ? "تواصل واتساب" : "Contact WhatsApp"}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  const seoTitle = lang === "ar"
    ? "باقات التشطيب الفاخرة"
    : "Premium Finishing Tiers";

  const seoDesc = lang === "ar"
    ? "تصفح باقات التشطيب المتكاملة من تاكت (الاقتصادية، المميزة، والراقية). قارن بين الخدمات والميزات واختر الأنسب لمنزلك."
    : "Explore custom finishing tiers by Tact (Economy, Medium, Luxury). Compare features, specifications, and select the best fit.";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0C363A] via-[#051E20] to-[#031314] text-ivory overflow-hidden pb-24" dir={lang === "ar" ? "rtl" : "ltr"}>
      <SEO 
        title={seoTitle} 
        description={seoDesc} 
        keywords={lang === "ar" ? "باقات تشطيب, أسعار تشطيب شقق, تشطيب اقتصادي, تشطيب فيلات مصر" : "finishing packages, home renovation egypt, luxury design cost, interior contracting"}
      />
      {/* Texture background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0" 
           style={{ backgroundImage: `radial-gradient(#C18556 0.7px, transparent 0.7px)`, backgroundSize: '36px 36px' }} />
      
      {/* Luxury vignette and ambient glows */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(3,19,20,0.85))] pointer-events-none z-0" />
      <div className="fixed top-1/4 left-10 w-[450px] h-[450px] bg-[#C18556]/[0.02] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-10 w-[450px] h-[450px] bg-[#0F6E66]/[0.03] blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Decorative vertical blueprint lines */}
      <div className="fixed inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden max-w-7xl mx-auto px-6 opacity-[0.04] z-0">
        <div className="w-px h-full bg-gradient-to-b from-[#C18556]/30 via-transparent to-[#C18556]/30 absolute left-8" />
        <div className="w-px h-full bg-gradient-to-b from-[#C18556]/30 via-transparent to-[#C18556]/30 absolute right-8" />
      </div>

      {/* Standalone header */}
      <section className="relative pt-44 pb-12 z-10">
        <div className="container-luxe text-center relative px-4">
          <Reveal>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-10 h-[1px] bg-gradient-to-r from-transparent to-[#C18556]/60" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C18556]/80" />
                <span className="text-[#C18556] text-[11px] font-bold uppercase tracking-[0.4em]">
                  {lang === "ar" ? "باقات التشطيب" : "FINISHING PACKAGES"}
                </span>
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C18556]/80" />
                <div className="w-10 h-[1px] bg-gradient-to-l from-transparent to-[#C18556]/60" />
              </div>
              <h1 className="text-4xl md:text-6xl font-serif text-white/95 leading-tight mb-6">
                {lang === "ar" ? (
                  <>
                    باقات التشطيب <span className="text-[#C18556] font-normal italic">الراقية</span>
                  </>
                ) : (
                  <>
                    Elite <span className="text-[#C18556] font-normal italic">Finishing Tiers</span>
                  </>
                )}
              </h1>
              <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
                {lang === "ar"
                  ? "تصفح باقاتنا المصممة لتلائم تطلعاتك. الباقات المفعلة لحسابك تتيح لك تخصيص خاماتك وتفاصيلك التفاعلية فوراً."
                  : "Explore our masterfully crafted packages. Unlocked packages allow you to begin customizing your materials and details instantly."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Grid of Dynamic Packages */}
      <section className="relative z-10 px-4">
        <div className="container-luxe max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
            {packages.map((pkg, i) => {
              const isUnlocked = unlockedIds.includes(pkg.id);
              const isFeatured = pkg.featured;
              const Icon = getPackageIcon(pkg.id);
              const cardNum = getPackageNum(i);
              const coverImg = pkg.cover_url || packageCovers[pkg.id];

              return (
                <Reveal key={pkg.id} delay={i * 120} className="h-full">
                  <div className={cn(
                    "relative h-full flex flex-col rounded-2xl transition-all duration-500 luxury-motion group overflow-hidden border hover-shine-effect",
                    isFeatured
                      ? "featured-gradient-border shadow-[0_25px_60px_rgba(0,0,0,0.45)] lg:-translate-y-4 hover:shadow-[0_28px_70px_rgba(193,133,86,0.22)]"
                      : "bg-[#06201D]/75 border-white/[0.06] hover:border-[#C18556]/40 shadow-xl backdrop-blur-md hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]",
                    "hover:-translate-y-2",
                    !isUnlocked && "opacity-90 hover:opacity-100"
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
                        <span>{lang === "ar" ? pkg.badge_ar || "الأكثر طلباً" : pkg.badge_en || "Most Popular"}</span>
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
                            alt={lang === "ar" ? pkg.name_ar : pkg.name_en}
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
                          {lang === "ar" ? pkg.name_ar : pkg.name_en}
                        </h3>

                        {/* Package Price */}
                        <div className="mb-4 flex items-baseline gap-1.5">
                          <span className="font-serif text-5xl font-medium tracking-tight text-white/95">
                            {pkg.price_label}
                          </span>
                          <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">
                            {lang === "ar" ? pkg.unit_label_ar || "جنيه / م²" : pkg.unit_label_en || "EGP / m²"}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-white/60 leading-relaxed mb-6 font-light min-h-[40px] line-clamp-2">
                          {lang === "ar" ? pkg.description_ar : pkg.description_en}
                        </p>

                        {/* Divider */}
                        <div className="h-[1px] w-full bg-white/[0.06] mb-6" />

                        {/* Features Checklist */}
                        <ul className="space-y-3.5 flex-1 mb-8 flex-grow">
                          {(lang === "ar" ? pkg.features_ar : pkg.features_en).map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-xs text-white/80 group/item">
                              <div className="w-4 h-4 rounded-full bg-[#C18556]/15 border border-[#C18556]/30 flex items-center justify-center text-[#C18556] flex-shrink-0 transition-all duration-500 luxury-motion group-hover/item:scale-125 group-hover/item:bg-[#C18556] group-hover/item:text-[#0C363A] group-hover/item:shadow-[0_0_14px_rgba(193,133,86,0.35)]">
                                <Check size={9} className="stroke-[3]" />
                              </div>
                              <span className="font-light group-hover/item:text-white transition-colors">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isUnlocked ? (
                          <Link 
                            to={`/packages/${pkg.id}/configurator`} 
                            className="w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.20em] flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/30"
                          >
                            <span>
                              {lang === "ar" ? "ابدأ التخصيص" : "START CONFIGURING"}
                            </span>
                            {lang === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                          </Link>
                        ) : (
                          <button 
                            onClick={() => {
                              toast.info(
                                lang === "ar"
                                  ? `بانتظار تفعيل باقة (${pkg.name_ar}) من قِبل الإدارة. يرجى التأكد من تحويل العربون عبر إينستاباي لتفعيل الباقة فوراً.`
                                  : `Waiting for admin activation of (${pkg.name_en}). Please ensure you have transferred the deposit via InstaPay to unlock immediately.`
                              );
                            }}
                            className="w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.20em] flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 bg-white/5 border border-white/10 text-ivory/60 hover:text-[#C18556] hover:border-[#C18556]/30 hover:bg-[#C18556]/5 shadow-md cursor-pointer"
                          >
                            <Lock size={12} className="text-[#C18556]" />
                            <span>
                              {lang === "ar" ? "بانتظار تفعيل الباقة" : "PENDING ACTIVATION"}
                            </span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Payment & Activation Guide Card */}
          <Reveal delay={200}>
            <div className="mt-24 max-w-4xl mx-auto text-center border border-[#C18556]/15 bg-[#06201D]/75 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-[#C18556]/30 transition-all duration-500">
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#C18556]/5 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#C18556]/5 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="text-[#C18556] text-[10px] uppercase tracking-[0.3em] mb-4 font-bold">
                {lang === "ar" ? "دليل الدفع وتفعيل الباقات" : "PAYMENT & ACTIVATION GUIDE"}
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                {lang === "ar" ? "طريقة دفع عربون التعاقد لتفعيل باقتك" : "How to Transfer the Deposit & Unlock Your Package"}
              </h3>
              <p className="text-sm text-white/60 mb-8 leading-relaxed max-w-2xl mx-auto font-light">
                {lang === "ar" 
                  ? "لتفعيل باقة التشطيب الراقية والبدء في استخدام مصمم الغرف التفاعلي واختيار الخامات، يرجى مراجعة تفاصيل التحويل البنكي أو الدفع الفوري عبر إينستاباي، مع طريقة رفع إيصال الدفع للإدارة."
                  : "To activate your premium finishing package and access the interactive room configurator, review the bank transfer details, InstaPay instructions, and upload your payment receipt."}
              </p>
              <Link 
                to="/payment" 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#C18556] to-[#DDB57C] text-[#0C363A] hover:brightness-110 shadow-lg shadow-[#C18556]/15 transition-all duration-500 group-hover:scale-[1.02] cursor-pointer"
              >
                <span>{lang === "ar" ? "عرض تعليمات الدفع وطرق التحويل" : "View Payment & Transfer Instructions"}</span>
                {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Decorative Elegant Corner Frame Marks */}
      <div className={cn(
        "absolute top-20 opacity-[0.08] pointer-events-none hidden lg:block w-24 h-24 border-t border-[#C18556]",
        lang === "ar" ? "left-20 border-l" : "right-20 border-r"
      )} />
      <div className={cn(
        "absolute bottom-20 opacity-[0.08] pointer-events-none hidden lg:block w-24 h-24 border-b border-[#C18556]",
        lang === "ar" ? "right-20 border-r" : "left-20 border-l"
      )} />
    </div>
  );
}

function ArrowUpRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
