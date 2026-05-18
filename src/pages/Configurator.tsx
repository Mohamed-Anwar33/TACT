import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CatalogPackage, CatalogStyle, getPackage, getPackageStyles, isPackageUnlocked } from "@/lib/catalog";

export default function Configurator() {
  const { id } = useParams();
  const packageId = id ?? "economy";
  const { lang } = useLang();
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [pkg, setPkg] = useState<CatalogPackage | null>(null);
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeStyleIdx, setActiveStyleIdx] = useState(0);
  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user) return;
      setChecking(true);
      const [packageData, styleData, unlocked] = await Promise.all([
        getPackage(packageId),
        getPackageStyles(packageId),
        isPackageUnlocked(user.id, packageId, !!profile?.packages_unlocked),
      ]);
      if (!alive) return;
      setPkg(packageData);
      setStyles(styleData);
      setAllowed(unlocked);
      setChecking(false);
    }
    if (!loading && user) load();
    return () => {
      alive = false;
    };
  }, [packageId, user, loading, profile?.packages_unlocked]);

  const activeStyle = styles[activeStyleIdx];
  const sections = activeStyle?.categories ?? [];
  const activeSection = sections[activeSecIdx];

  const currentChoiceObj = useMemo(() => {
    if (!activeSection || !activeStyle) return null;
    const compoundKey = `${activeStyle.id}_${activeSection.name_ar}`;
    return selections[compoundKey]?.choiceObj;
  }, [activeSection, activeStyle, selections]);

  const setSel = (sectionTitle: string, key: string, val: any) => {
    if (!activeStyle) return;
    const compoundKey = `${activeStyle.id}_${sectionTitle}`;
    setSelections((current) => ({
      ...current,
      [compoundKey]: {
        ...(current[compoundKey] ?? {}),
        style: activeStyle.name_ar,
        [key]: val,
      },
    }));
  };

  const submit = async () => {
    if (!user) {
      nav("/auth");
      return;
    }
    if (!allowed) {
      toast.error(lang === "ar" ? "هذه الباقة غير مفعلة لحسابك" : "This package is not active for your account");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("configurator_selections").insert({
      user_id: user.id,
      package_id: packageId,
      selections,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      lang === "ar" 
        ? "تم حفظ واعتماد اختياراتك بنجاح! جاري تحويلك لصفحة حسابك الشخصي..." 
        : "Selections saved and confirmed! Redirecting to your dashboard..."
    );
    setTimeout(() => {
      nav("/customer");
    }, 1800);
  };

  if (loading || checking) {
    return <div className="pt-40 pb-20 text-center container-luxe text-muted-foreground">...</div>;
  }

  if (!allowed) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-teal-deep text-ivory flex items-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-2xl text-center">
          <Lock className="mx-auto text-gold mb-6" size={46} />
          <SectionEyebrow label={lang === "ar" ? "الباقة غير مفعلة" : "Package locked"} />
          <h1 className="display-2 mt-4">{lang === "ar" ? "هذه الباقة لم تُفتح لحسابك بعد" : "This package is not unlocked yet"}</h1>
          <p className="text-ivory/70 mt-5">{lang === "ar" ? "سجل بيانات العربون للباقة المطلوبة وانتظر اعتماد الإدارة." : "Submit the deposit details for this package and wait for admin approval."}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/payment" className="btn-gold">{lang === "ar" ? "تسجيل الدفع" : "Submit Payment"}</Link>
            <Link to="/packages" className="btn-ghost-light">{lang === "ar" ? "باقاتي" : "My Packages"}</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!pkg || !activeSection) {
    return (
      <div className="pt-40 pb-20 text-center container-luxe">
        <h2 className="text-xl text-muted-foreground">{lang === "ar" ? "لا توجد اختيارات متاحة لهذه الباقة حاليًا" : "No options are available for this package yet"}</h2>
      </div>
    );
  }

  const secTitle = lang === "ar" ? activeSection.name_ar : activeSection.name_en;

  return (
    <>
      <section className="pt-40 pb-12 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <SectionEyebrow label={lang === "ar" ? "تخصيص الباقة" : "Interactive Configurator"} />
          <h1 className="display-2 mt-6">{lang === "ar" ? pkg.name_ar : pkg.name_en}</h1>
          <p className="text-ivory/80 mt-2 max-w-xl text-sm leading-relaxed">
            {lang === "ar"
              ? "تصفح الخامات والأنماط المتاحة ضمن باقتك، وحدد اختياراتك ليتم إدراجها في تقرير التنفيذ."
              : "Browse available materials and styles for your active package to include them in your execution report."}
          </p>

          <div className="mt-10 flex flex-wrap gap-2 border-b border-ivory/20 pb-1">
            {styles.map((style, idx) => (
              <button
                key={style.id}
                onClick={() => {
                  setActiveStyleIdx(idx);
                  setActiveSecIdx(0);
                }}
                className={cn(
                  "px-5 py-2.5 rounded-t-lg text-sm font-serif transition-all duration-300 relative",
                  activeStyleIdx === idx ? "bg-ivory text-teal-deep font-bold shadow-lg" : "text-ivory/70 hover:text-ivory hover:bg-ivory/10"
                )}
              >
                {lang === "ar" ? style.name_ar : style.name_en}
                {activeStyleIdx === idx && <span className="absolute bottom-0 inset-x-0 h-1 bg-gold rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#FFFFFF]">
        <div className="container-luxe grid lg:grid-cols-[280px_1fr] gap-10">
          <aside className="lg:sticky lg:top-32 lg:self-start bg-white p-6 rounded-2xl border border-border shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] text-secondary mb-4">
              {lang === "ar" ? "بنود التشطيب المتاحة" : "Finishing Categories"}
            </div>
            <ul className="space-y-1">
              {sections.map((section, i) => {
                const isCompleted = activeStyle ? !!selections[`${activeStyle.id}_${section.name_ar}`]?.choice : false;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSecIdx(i)}
                      className={cn(
                        "w-full text-start px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group",
                        activeSecIdx === i ? "bg-teal-soft/40 text-teal-deep font-bold border-s-4 border-gold" : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">{String(i + 1).padStart(2, "0")}</span>
                        <span className="truncate">{lang === "ar" ? section.name_ar : section.name_en}</span>
                      </div>
                      {isCompleted && (
                        <span className="w-4 h-4 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="stroke-[3]" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 pt-6 border-t border-border">
              <button disabled={busy} onClick={submit} className="btn-gold w-full flex items-center justify-center gap-2 shadow-md hover:shadow-gold/30">
                {busy ? "..." : <><Check size={16} /><span>{lang === "ar" ? "اعتماد الاختيارات وإرسال" : "Confirm Selections"}</span></>}
              </button>
            </div>
          </aside>

          <div className="space-y-8">
            <header className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-gold block mb-1">{lang === "ar" ? activeStyle.name_ar : activeStyle.name_en}</span>
                <h2 className="font-serif-ar text-3xl text-teal-deep">{secTitle}</h2>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-mono">
                {activeSecIdx + 1} / {sections.length}
              </span>
            </header>

            <div className="grid sm:grid-cols-2 gap-6">
              {activeSection.options.map((option, optionIndex) => {
                const isSelected = currentChoiceObj?.id === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSel(activeSection.name_ar, "choiceObj", option);
                      setSel(activeSection.name_ar, "choice", option.name_ar);
                    }}
                    className={cn(
                      "group relative text-start bg-white rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col justify-between",
                      isSelected ? "border-gold shadow-xl shadow-gold/10 ring-2 ring-gold/20" : "border-border hover:border-gold/50 hover:shadow-md"
                    )}
                  >
                    <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                      {option.image_url && (
                        <img
                          src={option.image_url}
                          alt={option.name_en}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                      <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] uppercase font-mono px-2.5 py-1 rounded-full border border-white/10">
                        Opt {String(optionIndex + 1).padStart(2, "0")}
                      </span>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gold flex items-center justify-center text-teal-deep shadow-md animate-scale-up">
                          <Check size={18} className="stroke-[2.5]" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h4 className="font-serif-ar text-base line-clamp-1 drop-shadow-sm">{lang === "ar" ? option.name_ar : option.name_en}</h4>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                        {lang === "ar" ? option.description_ar : option.description_en}
                      </p>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                        <span className={isSelected ? "text-gold font-bold" : "text-secondary"}>
                          {isSelected ? (lang === "ar" ? "تم التحديد" : "Selected") : (lang === "ar" ? "انقر للاختيار" : "Click to select")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm mt-8">
              <h3 className="text-xs uppercase tracking-[0.2em] text-teal-deep font-bold mb-4">
                {lang === "ar" ? "تفاصيل التنفيذ والكميات المطلوبة" : "Execution Details & Quantities"}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">{lang === "ar" ? "مكان الاستخدام" : "Usage Location"}</label>
                  <Input value={activeStyle ? (selections[`${activeStyle.id}_${activeSection.name_ar}`]?.place ?? "") : ""} onChange={(e) => setSel(activeSection.name_ar, "place", e.target.value)} className="h-11 bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">{lang === "ar" ? "الكمية التقديرية" : "Estimated Qty"}</label>
                  <Input value={activeStyle ? (selections[`${activeStyle.id}_${activeSection.name_ar}`]?.qty ?? "") : ""} onChange={(e) => setSel(activeSection.name_ar, "qty", e.target.value)} className="h-11 bg-background" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs text-muted-foreground block mb-1.5">{lang === "ar" ? "ملاحظات إضافية" : "Special Notes"}</label>
                  <Textarea value={activeStyle ? (selections[`${activeStyle.id}_${activeSection.name_ar}`]?.notes ?? "") : ""} onChange={(e) => setSel(activeSection.name_ar, "notes", e.target.value)} className="min-h-20 bg-background resize-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button disabled={activeSecIdx === 0} onClick={() => setActiveSecIdx((current) => current - 1)} className="btn-ghost-light !text-teal-deep !border-teal-deep/30 disabled:opacity-30 flex items-center gap-1.5">
                {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                <span>{lang === "ar" ? "القسم السابق" : "Previous"}</span>
              </button>

              {activeSecIdx < sections.length - 1 ? (
                <button onClick={() => { window.scrollTo({ top: 400, behavior: "smooth" }); setActiveSecIdx((current) => current + 1); }} className="btn-gold flex items-center gap-1.5 px-6">
                  <span>{lang === "ar" ? "القسم التالي" : "Next Category"}</span>
                  {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <button onClick={submit} className="btn-gold flex items-center gap-2 px-8 bg-teal-deep text-white hover:bg-teal-deep/90">
                  <Check size={16} className="text-gold" />
                  <span>{lang === "ar" ? "إنهاء وحفظ التقرير" : "Finish & Save Report"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
