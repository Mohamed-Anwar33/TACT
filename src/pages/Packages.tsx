import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { whatsappLink } from "@/data/site";
import Reveal from "@/components/ui-luxe/Reveal";
import { Lock, Check, Diamond, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CatalogPackage, getPackages, getUnlockedPackageIds } from "@/lib/catalog";

export default function Packages() {
  const { lang } = useLang();
  const { user, profile, loading } = useAuth();
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
      setUnlockedIds(unlocked);
      setBusy(false);
    }
    if (!loading) load();
    return () => {
      alive = false;
    };
  }, [user?.id, profile?.packages_unlocked, loading]);

  const visiblePackages = packages.filter((pkg) => unlockedIds.includes(pkg.id));

  if (loading || busy) {
    return <section className="pt-40 pb-32 min-h-screen bg-[#0C363A] text-ivory flex items-center justify-center">...</section>;
  }

  if (!user) {
    return (
      <section className="pt-40 pb-32 min-h-screen flex items-center bg-[#0C363A] text-ivory relative overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="absolute inset-0 arch-grid opacity-20" />
        <div className="container-luxe relative max-w-2xl text-center">
          <div className="w-24 h-24 rounded-full border border-gold flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(193, 133, 86,0.2)]">
            <Lock className="text-gold" size={36} />
          </div>
          <div className="text-gold text-[10px] uppercase tracking-[0.4em] mb-4 font-bold">
            {lang === "ar" ? "محتوى مخصص للعملاء" : "Client-only content"}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif-ar font-bold mb-6">
            {lang === "ar" ? "الباقات تفتح بعد مراجعة العربون" : "Packages unlock after deposit review"}
          </h1>
          <p className="text-ivory/60 mb-10 leading-relaxed font-serif-ar text-lg">
            {lang === "ar"
              ? "سجل الدخول، اختر الباقة من صفحة الدفع، ثم ارفع بيانات التحويل. بعد اعتماد الإدارة ستظهر الباقة المفتوحة هنا فقط."
              : "Sign in, choose the package on the payment page, and submit transfer details. Once approved, your unlocked package appears here."}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/auth" className="btn-gold !px-10">{lang === "ar" ? "إنشاء حساب / دخول" : "Sign in / Sign up"}</Link>
            <Link to="/payment" className="btn-ghost-light !px-10 !text-white !border-white/20 hover:!border-gold hover:!text-gold">
              {lang === "ar" ? "تعليمات الدفع والتحويل" : "Payment Instructions"}
            </Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="text-ivory/50 hover:text-gold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
              {lang === "ar" ? "تواصل واتساب" : "Contact WhatsApp"}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-[#0C363A] text-ivory min-h-screen overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="fixed inset-0 arch-grid opacity-10 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-[#0C363A] via-[#0C363A] to-[#0C363A] pointer-events-none" />

      <section className="relative pt-48 pb-20">
        <div className="container-luxe text-center relative z-10">
          <Reveal>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-[1px] bg-gold/30" />
                <Diamond size={12} className="text-gold" />
                <div className="w-12 h-[1px] bg-gold/30" />
              </div>
              <h1 className="text-5xl md:text-7xl font-serif-ar font-bold text-white mb-6">
                {lang === "ar" ? "باقات التشطيب الراقية" : "Elite Finishing Packages"}
              </h1>
              <p className="text-ivory/60 max-w-2xl mx-auto text-lg md:text-xl font-serif-ar leading-relaxed">
                {lang === "ar"
                  ? "تصفح باقاتنا المصممة لتلائم تطلعاتك. الباقات المفعلة لحسابك تتيح لك تخصيص خاماتك وتفاصيلك التفاعلية فوراً."
                  : "Explore our masterfully crafted packages. Unlocked packages allow you to begin customizing your materials and details instantly."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-24 z-10">
        <div className="container-luxe max-w-[1320px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
            {packages.map((pkg, i) => {
              const isUnlocked = unlockedIds.includes(pkg.id);
              return (
                <Reveal key={pkg.id} delay={i * 150}>
                  <div className={cn(
                    "relative rounded-lg p-10 transition-all duration-700 group border overflow-hidden",
                    pkg.featured
                      ? "bg-[#0C363A]/40 backdrop-blur-2xl border-gold/40 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(193, 133, 86,0.1)] scale-105 z-20"
                      : "bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-gold/30 hover:bg-white/[0.05]",
                    !isUnlocked && "opacity-80 hover:opacity-100"
                  )}>
                    {pkg.featured && <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-[60px]" />}
                    
                    {/* Locked Status Indicator Badge */}
                    {!isUnlocked ? (
                      <div className="absolute top-6 right-8 bg-brand-dark/95 border border-brand-gold/30 text-brand-gold text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                        <Lock size={10} className="stroke-[3]" />
                        <span>{lang === "ar" ? "بانتظار التفعيل" : "PENDING ACTIVATION"}</span>
                      </div>
                    ) : (pkg.badge_ar || pkg.badge_en) ? (
                      <div className="absolute top-6 right-8 bg-gold text-brand-dark text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                        {lang === "ar" ? pkg.badge_ar : pkg.badge_en}
                      </div>
                    ) : null}

                    <div className="flex flex-col h-full">
                      {pkg.cover_url && (
                        <div className="mb-8 -mx-4 -mt-4 rounded-lg overflow-hidden border border-white/10 bg-black/20 aspect-[16/10] relative">
                          <img
                            src={pkg.cover_url}
                            alt={lang === "ar" ? pkg.name_ar : pkg.name_en}
                            className="w-full h-full image-no-upscale opacity-95 p-3"
                            loading={i === 0 ? "eager" : "lazy"}
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A]/80 via-transparent to-transparent" />
                          <div className="absolute bottom-4 inset-x-4 h-[1px] bg-gold/40 origin-center scale-x-50 transition-transform duration-700 group-hover:scale-x-100" />
                        </div>
                      )}
                      <div className="text-gold text-xs uppercase tracking-[0.4em] mb-4 font-bold flex items-center gap-2">
                        <Diamond size={10} className="fill-current" />
                        {lang === "ar" ? pkg.name_ar : pkg.name_en}
                      </div>

                      <div className="mb-8">
                        <div className="text-ivory/40 text-[10px] uppercase tracking-widest mb-1">
                          {lang === "ar" ? "ابتداء من" : "Starting From"}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter">
                            {pkg.price_label}
                          </span>
                          <span className="text-sm text-ivory/40 uppercase tracking-widest">
                            {lang === "ar" ? pkg.unit_label_ar : pkg.unit_label_en}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-ivory/60 leading-relaxed mb-10 font-serif-ar min-h-12">
                        {lang === "ar" ? pkg.description_ar : pkg.description_en}
                      </p>

                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-10" />

                      <ul className="space-y-5 mb-12 flex-grow">
                        {(lang === "ar" ? pkg.features_ar : pkg.features_en).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-4 text-sm group/item">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 bg-white/5 text-gold border border-gold/20 group-hover/item:bg-gold/20">
                              <Check size={10} strokeWidth={4} />
                            </div>
                            <span className="text-ivory/80 group-hover/item:text-white transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isUnlocked ? (
                        <Link
                          to={`/packages/${pkg.id}/configurator`}
                          className="w-full py-5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 bg-gold text-brand-dark hover:bg-white hover:shadow-gold/20 shadow-xl"
                        >
                          {lang === "ar" ? "ابدأ التخصيص" : "Start Configuring"}
                          {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
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
                          className="w-full py-5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-ivory/60 hover:text-brand-gold hover:border-brand-gold/30 hover:bg-brand-gold/5 shadow-md cursor-pointer"
                        >
                          <Lock size={12} className="text-brand-gold" />
                          <span>{lang === "ar" ? "بانتظار تفعيل الباقة" : "Pending Activation"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Payment Instructions CTA at the bottom of the packages list */}
          <Reveal delay={200}>
            <div className="mt-20 max-w-4xl mx-auto text-center border border-gold/15 bg-white/[0.02] backdrop-blur-2xl rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-gold/30 transition-all duration-500">
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold/5 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4 font-bold">
                {lang === "ar" ? "دليل الدفع وتفعيل الباقات" : "PAYMENT & ACTIVATION GUIDE"}
              </div>
              <h3 className="text-2xl md:text-3xl font-serif-ar font-bold text-white mb-4">
                {lang === "ar" ? "طريقة دفع عربون التعاقد لتفعيل باقتك" : "How to Transfer the Deposit & Unlock Your Package"}
              </h3>
              <p className="text-sm text-ivory/60 mb-8 leading-relaxed max-w-2xl mx-auto font-serif-ar">
                {lang === "ar" 
                  ? "لتفعيل باقة التشطيب الراقية والبدء في استخدام مصمم الغرف التفاعلي واختيار الخامات، يرجى مراجعة تفاصيل التحويل البنكي أو الدفع الفوري عبر إينستاباي، مع طريقة رفع إيصال الدفع للإدارة."
                  : "To activate your premium finishing package and access the interactive room configurator, review the bank transfer details, InstaPay instructions, and upload your payment receipt."}
              </p>
              <Link 
                to="/payment" 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] bg-gold text-brand-dark hover:bg-white hover:text-brand-dark shadow-lg shadow-gold/15 transition-all duration-500 group-hover:scale-[1.02] cursor-pointer"
              >
                <span>{lang === "ar" ? "عرض تعليمات الدفع وطرق التحويل" : "View Payment & Transfer Instructions"}</span>
                {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
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
