import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, FileText, Lock, Plus, Upload, X, User, Home, Layers, Users, Heart, Lightbulb, FileImage, Sparkles, Layout, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { CatalogPackage, getPackages } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type PlanImage = {
  url: string;
  name: string;
  type: string;
};

const STEPS_META = [
  { id: "basic", labelAr: "المعلومات الأساسية", labelEn: "Basic Info", icon: User },
  { id: "project", labelAr: "معلومات عن المشروع", labelEn: "Project Details", icon: Home },
  { id: "family", labelAr: "عدد الأفراد المستخدمين", labelEn: "Family Size", icon: Users },
  { id: "services", labelAr: "الخدمات المطلوبة", labelEn: "Required Services", icon: Layers },
  { id: "expectations", labelAr: "التوقعات والتجربة", labelEn: "Expectations & History", icon: Heart },
  { id: "problems", labelAr: "المشكلات والطموحات", labelEn: "Goals & Notes", icon: Lightbulb },
];

const packageCovers: Record<string, string> = {
  economy: "/real-content/Packages/package-covers/economy.jpg",
  medium: "/real-content/Packages/package-covers/medium.jpg",
  luxury: "/real-content/Packages/package-covers/luxury.jpg",
};

const getPackageIcon = (id: string) => {
  if (id === "economy") return Layout;
  if (id === "medium") return Star;
  if (id === "luxury") return Crown;
  return Star;
};

export default function OfficeSession() {
  const { lang } = useLang();
  const { user, isOfficeConsultant, loading } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuestionnaireId = searchParams.get("questionnaireId");

  const [step, setStep] = useState(0);
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form structured state matching exact columns
  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    project_type: "",
    project_type_custom: "",
    stage: "",
    stage_custom: "",
    plan_images: [] as PlanImage[],
    family: "",
    family_custom: "",
    service: [] as string[],
    service_custom: "",
    expectations_factor: [] as string[],
    expectations_factor_custom: "",
    source: "",
    source_custom: "",
    history: "",
    history_challenges: "",
    prev_problems: "",
    new_ambitions: "",
    notes: "",
  });

  const [loaded, setLoaded] = useState(false);

  // On mount: load from localStorage if no urlQuestionnaireId is active
  useEffect(() => {
    if (urlQuestionnaireId) return;

    const savedData = localStorage.getItem("tact_office_session_data");
    const savedStep = localStorage.getItem("tact_office_session_step");
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse saved office session data", e);
      }
    }
    if (savedStep) {
      const parsedStep = parseInt(savedStep, 10);
      if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < STEPS_META.length) {
        setStep(parsedStep);
      }
    }
    setLoaded(true);
  }, [urlQuestionnaireId]);

  // Save to localStorage when step or data changes (if no questionnaireId is active)
  useEffect(() => {
    if (!loaded || questionnaireId || urlQuestionnaireId) return;

    localStorage.setItem("tact_office_session_data", JSON.stringify(data));
    localStorage.setItem("tact_office_session_step", step.toString());
  }, [data, step, questionnaireId, urlQuestionnaireId, loaded]);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user || !isOfficeConsultant) return;
    getPackages().then(setPackages);
  }, [user, isOfficeConsultant]);

  useEffect(() => {
    if (urlQuestionnaireId) {
      setQuestionnaireId(urlQuestionnaireId);
      supabase
        .from("questionnaires")
        .select("*")
        .eq("id", urlQuestionnaireId)
        .maybeSingle()
        .then(({ data: q }) => {
          if (q) {
            // Parse combined fields back to form state
            let expectationsFactor: string[] = [];
            let expectationsFactorCustom = "";
            if (q.expectations && q.expectations.startsWith("أهم عوامل: ")) {
              const val = q.expectations.replace("أهم عوامل: ", "");
              expectationsFactor = val.split(", ").map((s: string) => s.trim());
              const standard = ["الجودة", "الالتزام بالوقت", "السعر المناسب", "خدمة العملاء", "Quality", "Time commitment", "Reasonable price", "Customer service"];
              const customItems = expectationsFactor.filter(f => !standard.includes(f));
              if (customItems.length > 0) {
                expectationsFactorCustom = customItems.join(", ");
                expectationsFactor = [...expectationsFactor.filter(f => standard.includes(f)), "أخرى"];
              }
            }

            let historyVal = "";
            let historyChallengesVal = "";
            if (q.history) {
              const parts = q.history.split(" | ");
              const histPart = parts.find((p: string) => p.startsWith("هل سبق التعامل: "));
              const chalPart = parts.find((p: string) => p.startsWith("التحديات المتوقعة: "));
              if (histPart) historyVal = histPart.replace("هل سبق التعامل: ", "").trim();
              if (chalPart) historyChallengesVal = chalPart.replace("التحديات المتوقعة: ", "").trim();
            }

            let prevProblemsVal = "";
            let newAmbitionsVal = "";
            if (q.goals) {
              const parts = q.goals.split(" | ");
              const prevPart = parts.find((p: string) => p.startsWith("المشكلات السابقة: "));
              const newPart = parts.find((p: string) => p.startsWith("الطموحات الجديدة: "));
              if (prevPart) prevProblemsVal = prevPart.replace("المشكلات السابقة: ", "").trim();
              if (newPart) newAmbitionsVal = newPart.replace("الطموحات الجديدة: ", "").trim();
            }

            let serviceVal: string[] = [];
            let serviceCustomVal = "";
            if (q.service) {
              serviceVal = q.service.split(", ").map((s: string) => s.trim());
              const standard = ["تصميم داخلي", "تنفيذ وتشطيب كامل", "أثاث وديكور", "Interior Design", "Full Execution and Finishing", "Furniture & Decor"];
              const customItems = serviceVal.filter(s => !standard.includes(s));
              if (customItems.length > 0) {
                serviceCustomVal = customItems.join(", ");
                serviceVal = [...serviceVal.filter(s => standard.includes(s)), "أخرى"];
              }
            }

            const stdTypes = ["شقة", "فيلا", "مكتب", "محل تجاري", "Apartment", "Villa", "Office", "Retail Shop"];
            const projectTypeCustomVal = q.project_type && !stdTypes.includes(q.project_type) && q.project_type !== "أخرى" && q.project_type !== "Other" ? q.project_type : "";
            const projectTypeVal = projectTypeCustomVal ? "أخرى" : q.project_type;

            const stdStages = ["على الطوب الأحمر", "على المحارة", "متشطبه بالفعل", "Red Brick", "Plastered", "Already finished"];
            const stageCustomVal = q.stage && !stdStages.includes(q.stage) && q.stage !== "أخرى" && q.stage !== "Other" ? q.stage : "";
            const stageVal = stageCustomVal ? "أخرى" : q.stage;

            const stdFamilies = ["زوج + زوجة", "زوج وزوجة + طفل", "Couple", "Family with Kid"];
            const familyCustomVal = q.family && !stdFamilies.includes(q.family) && q.family !== "أخرى" && q.family !== "Other" ? q.family : "";
            const familyVal = familyCustomVal ? "أخرى" : q.family;

            const stdSources = ["توصية من صديق", "وسائل التواصل الاجتماعي", "إعلان", "Friend recommendation", "Social media", "Advertisement"];
            const sourceCustomVal = q.source && !stdSources.includes(q.source) && q.source !== "أخرى" && q.source !== "Other" ? q.source : "";
            const sourceVal = sourceCustomVal ? "أخرى" : q.source;

            setData({
              name: q.name || "",
              phone: q.phone || "",
              email: q.email || "",
              address: q.address || "",
              project_type: projectTypeVal || "",
              project_type_custom: projectTypeCustomVal || "",
              stage: stageVal || "",
              stage_custom: stageCustomVal || "",
              plan_images: (q.plan_images as any) || [],
              family: familyVal || "",
              family_custom: familyCustomVal || "",
              service: serviceVal,
              service_custom: serviceCustomVal || "",
              expectations_factor: expectationsFactor,
              expectations_factor_custom: expectationsFactorCustom || "",
              source: sourceVal || "",
              source_custom: sourceCustomVal || "",
              history: historyVal || "",
              history_challenges: historyChallengesVal || "",
              prev_problems: prevProblemsVal || "",
              new_ambitions: newAmbitionsVal || "",
              notes: q.notes || "",
            });
          }
        });
    }
  }, [urlQuestionnaireId]);

  const update = (k: string, v: any) => setData((prev) => ({ ...prev, [k]: v }));

  const uploadPlanFiles = async (files: FileList | null) => {
    const fileList = Array.from(files ?? []);
    if (!fileList.length || !user) return;

    setUploading(true);
    try {
      const uploaded: PlanImage[] = [];
      for (const file of fileList) {
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          toast.error(lang === "ar" ? "ارفع صور أو PDF فقط" : "Only images or PDFs are allowed");
          continue;
        }

        const safeName = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
        const path = `questionnaires/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { error } = await supabase.storage
          .from("tact-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from("tact-media").getPublicUrl(path);
        uploaded.push({ url: publicUrlData.publicUrl, name: file.name, type: file.type });
      }

      if (uploaded.length) {
        update("plan_images", [...data.plan_images, ...uploaded]);
        toast.success(lang === "ar" ? "تم رفع ملفات البلان" : "Plan files uploaded");
      }
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "فشل رفع الملفات" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const removePlanImage = (url: string) => {
    update("plan_images", data.plan_images.filter((item) => item.url !== url));
  };

  const nextStep = () => {
    if (step === 0) {
      if (!data.name.trim() || !data.phone.trim()) {
        toast.error(lang === "ar" ? "اسم العميل ورقم الهاتف مطلوبان" : "Client name and phone are required");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS_META.length - 1));
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const submitQuestionnaire = async () => {
    if (!user) return;
    if (!data.name.trim() || !data.phone.trim()) {
      toast.error(lang === "ar" ? "اسم العميل ورقم الهاتف مطلوبان" : "Client name and phone are required");
      return;
    }

    setBusy(true);

    // Combine fields for DB
    const finalType = data.project_type === "أخرى" || data.project_type === "Other" ? data.project_type_custom || data.project_type : data.project_type;
    const finalStage = data.stage === "أخرى" || data.stage === "Other" ? data.stage_custom || data.stage : data.stage;
    const finalFamily = data.family === "أخرى" || data.family === "Other" ? data.family_custom || data.family : data.family;
    
    const serviceArr = Array.isArray(data.service) ? data.service : [data.service].filter(Boolean);
    const hasServiceOther = serviceArr.includes("أخرى") || serviceArr.includes("Other");
    const finalService = hasServiceOther && data.service_custom
      ? [...serviceArr.filter(s => s !== "أخرى" && s !== "Other"), data.service_custom].join(", ")
      : serviceArr.join(", ");

    const factorArr = Array.isArray(data.expectations_factor) ? data.expectations_factor : [data.expectations_factor].filter(Boolean);
    const hasFactorOther = factorArr.includes("أخرى") || factorArr.includes("Other");
    const finalExpectationsFactor = hasFactorOther && data.expectations_factor_custom
      ? [...factorArr.filter(s => s !== "أخرى" && s !== "Other"), data.expectations_factor_custom].join(", ")
      : factorArr.join(", ");

    const finalSource = data.source === "أخرى" || data.source === "Other" ? data.source_custom || data.source : data.source;
    const combinedExpectations = `أهم عوامل: ${finalExpectationsFactor}`;
    const combinedHistory = `هل سبق التعامل: ${data.history} | التحديات المتوقعة: ${data.history_challenges}`;
    const combinedGoals = `المشكلات السابقة: ${data.prev_problems} | الطموحات الجديدة: ${data.new_ambitions}`;

    const activeQid = questionnaireId || urlQuestionnaireId;
    let queryPromise;

    if (activeQid) {
      queryPromise = supabase
        .from("questionnaires")
        .update({
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          project_type: finalType,
          stage: finalStage,
          family: finalFamily,
          service: finalService,
          expectations: combinedExpectations,
          source: finalSource,
          history: combinedHistory,
          goals: combinedGoals,
          notes: data.notes.trim(),
          plan_images: data.plan_images,
        })
        .eq("id", activeQid)
        .select("id")
        .single();
    } else {
      queryPromise = supabase
        .from("questionnaires")
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          project_type: finalType,
          stage: finalStage,
          family: finalFamily,
          service: finalService,
          expectations: combinedExpectations,
          source: finalSource,
          history: combinedHistory,
          goals: combinedGoals,
          notes: data.notes.trim(),
          plan_images: data.plan_images,
        })
        .select("id")
        .single();
    }

    const { data: created, error } = await queryPromise;
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const savedId = created.id;
    setQuestionnaireId(savedId);
    setIsEditing(false);
    nav(`/office-session?questionnaireId=${savedId}`, { replace: true });
    toast.success(lang === "ar" ? "تم حفظ استبيان العميل. اختر الباقة الآن." : "Questionnaire saved. Choose a package now.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewSession = () => {
    localStorage.removeItem("tact_office_session_data");
    localStorage.removeItem("tact_office_session_step");
    setData({
      name: "",
      phone: "",
      email: "",
      address: "",
      project_type: "",
      project_type_custom: "",
      stage: "",
      stage_custom: "",
      plan_images: [] as PlanImage[],
      family: "",
      family_custom: "",
      service: [] as string[],
      service_custom: "",
      expectations_factor: [] as string[],
      expectations_factor_custom: "",
      source: "",
      source_custom: "",
      history: "",
      history_challenges: "",
      prev_problems: "",
      new_ambitions: "",
      notes: "",
    });
    setStep(0);
    setQuestionnaireId(null);
    setIsEditing(false);
    nav("/office-session", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading || !user) {
    return <div className="pt-40 pb-20 text-center text-muted-foreground">...</div>;
  }

  if (!isOfficeConsultant) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-[#0C363A] text-ivory flex items-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-2xl text-center">
          <Lock className="mx-auto mb-6 text-gold" size={44} />
          <SectionEyebrow label={lang === "ar" ? "جلسات المكتب" : "Office sessions"} />
          <h1 className="display-2 mt-4">{lang === "ar" ? "هذا المسار مخصص لحساب التابلت فقط" : "This route is only for the tablet account"}</h1>
          <p className="mt-5 text-ivory/70">{lang === "ar" ? "اطلب من الأدمن إضافة دور office_consultant لهذا الحساب." : "Ask an admin to assign the office_consultant role to this account."}</p>
        </div>
      </section>
    );
  }

  if (questionnaireId && !isEditing) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-[#FBF7F0]" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionEyebrow label={lang === "ar" ? "جلسة مكتب محفوظة" : "Saved office session"} />
              <h1 className="display-2 mt-4 text-teal-deep">{data.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{lang === "ar" ? "اختر الباقة التي سيتم تطبيقها على تقرير العميل." : "Choose the package to use for this client report."}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(true);
                  setStep(0);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="btn-ghost-light !text-teal-deep !border-teal-deep/25 flex items-center gap-2"
              >
                <span>{lang === "ar" ? "تعديل الاستبيان" : "Edit Questionnaire"}</span>
              </button>
              <button type="button" onClick={startNewSession} className="btn-ghost-light !text-teal-deep !border-teal-deep/25 flex items-center gap-2 bg-teal-deep/5">
                <Plus size={16} />
                <span>{lang === "ar" ? "جلسة جديدة" : "New session"}</span>
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {packages.map((pkg, i) => {
              const isFeatured = pkg.featured;
              const Icon = getPackageIcon(pkg.id);
              const cardNum = String(i + 1).padStart(2, "0");
              const coverImg = pkg.cover_url || packageCovers[pkg.id];

              return (
                <Link
                  key={pkg.id}
                  to={`/packages/${pkg.id}/configurator?questionnaireId=${questionnaireId}`}
                  className={cn(
                    "relative flex flex-col rounded-2xl transition-all duration-500 luxury-motion group overflow-hidden border hover-shine-effect text-ivory",
                    isFeatured
                      ? "featured-gradient-border shadow-[0_25px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_70px_rgba(193,133,86,0.22)]"
                      : "bg-[#06201D]/90 border-white/[0.06] hover:border-[#C18556]/40 shadow-xl hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]",
                    "hover:-translate-y-2"
                  )}
                >
                  {/* Featured Ribbon / Badge */}
                  {isFeatured && (
                    <div className={cn(
                      "absolute top-4 z-30 bg-gradient-to-r from-[#C18556] to-[#DDB57C] text-[#0C363A] text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5",
                      lang === "ar" ? "left-4" : "right-4"
                    )}>
                      <Star size={10} fill="currentColor" className="stroke-none" />
                      <span>{lang === "ar" ? pkg.badge_ar || "الأكثر طلباً" : pkg.badge_en || "Most Popular"}</span>
                    </div>
                  )}

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
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Premium Circle Icon */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 luxury-motion",
                          isFeatured 
                            ? "border-[#C18556] bg-[#C18556]/15 text-[#C18556] shadow-[0_0_15px_rgba(193,133,86,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_26px_rgba(193,133,86,0.35)]" 
                            : "border-white/10 bg-white/[0.02] text-white/70 group-hover:border-[#C18556]/50 group-hover:text-[#C18556] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(193,133,86,0.18)]"
                        )}>
                          <Icon size={18} className="stroke-[1.5]" />
                        </div>
                      </div>

                      {/* Package Name */}
                      <h3 className="text-lg font-bold font-serif text-[#C18556] mb-2">
                        {lang === "ar" ? pkg.name_ar : pkg.name_en}
                      </h3>

                      {/* Package Price */}
                      <div className="mb-3 flex items-baseline gap-1.5">
                        <span className="font-serif text-3xl font-medium tracking-tight text-white/95">
                          {pkg.price_label}
                        </span>
                        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">
                          {lang === "ar" ? pkg.unit_label_ar || "جنيه / م²" : pkg.unit_label_en || "EGP / m²"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-white/60 leading-relaxed mb-4 font-light min-h-[36px] line-clamp-2">
                        {lang === "ar" ? pkg.description_ar : pkg.description_en}
                      </p>

                      {/* Divider */}
                      <div className="h-[1px] w-full bg-white/[0.06] mb-4" />

                      {/* Features Checklist */}
                      <ul className="space-y-2.5 flex-1 mb-6 flex-grow">
                        {(lang === "ar" ? pkg.features_ar : pkg.features_en).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-[11px] text-white/80 group/item">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#C18556]/15 border border-[#C18556]/30 flex items-center justify-center text-[#C18556] flex-shrink-0 transition-all duration-500 luxury-motion group-hover/item:scale-125 group-hover/item:bg-[#C18556] group-hover/item:text-[#0C363A] group-hover/item:shadow-[0_0_14px_rgba(193,133,86,0.35)]">
                              <Check size={8} className="stroke-[3]" />
                            </div>
                            <span className="font-light group-hover/item:text-white transition-colors">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div>
                      <div 
                        className="w-full py-3 rounded-sm font-bold text-[9px] uppercase tracking-[0.20em] flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/30"
                      >
                        <span>
                          {lang === "ar" ? "ابدأ التخصيص" : "START CONFIGURING"}
                        </span>
                        {lang === "ar" ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const currentMeta = STEPS_META[step];
  const StepIcon = currentMeta.icon;

  return (
    <section className="pt-36 pb-24 min-h-screen bg-[#FBF7F0]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="container-luxe max-w-4xl">
        <SectionEyebrow label={lang === "ar" ? "جلسة مكتب جديدة" : "New office session"} />
        <h1 className="display-2 mt-4 text-teal-deep">{lang === "ar" ? "استبيان عميل داخل المكتب" : "In-office client questionnaire"}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground mb-10">
          {lang === "ar"
            ? "املأ بيانات العميل الحالي خطوة بخطوة، ثم اختر الباقة وافتح الكتالوج التفاعلي."
            : "Fill the current client details step-by-step, then choose the package and open the configurator."}
        </p>

        {/* Header Dashboard Steps Indicators */}
        <div className="hidden md:flex items-center justify-between border-b border-border/80 pb-8 mb-12">
          {STEPS_META.map((m, idx) => {
            const Icon = m.icon;
            const isActive = idx === step;
            const isPassed = idx < step;
            return (
              <div key={m.id} className="flex flex-col items-center gap-2 relative flex-1 text-center">
                <div
                  onClick={() => idx <= step && setStep(idx)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    idx <= step ? "cursor-pointer" : "cursor-default"
                  } ${
                    isActive
                      ? "bg-teal-deep text-gold shadow-lg scale-110 border border-gold"
                      : isPassed
                      ? "bg-gold text-teal-deep"
                      : "bg-white border border-border text-muted-foreground/50"
                  }`}
                >
                  {isPassed ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </div>
                <span
                  className={`text-[11px] font-serif font-medium transition-colors ${
                    isActive ? "text-teal-deep font-bold" : "text-muted-foreground/70"
                  }`}
                >
                  {lang === "ar" ? m.labelAr : m.labelEn}
                </span>
                {/* Connector Line */}
                {idx < STEPS_META.length - 1 && (
                  <div className="absolute top-5 left-0 w-full h-[2px] bg-border/60 -z-10 transform -translate-x-1/2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Status */}
        <div className="md:hidden flex items-center justify-between text-xs font-serif uppercase tracking-wider text-teal-deep mb-3">
          <span className="flex items-center gap-1.5 font-bold">
            <StepIcon size={14} className="text-gold" />
            {lang === "ar" ? currentMeta.labelAr : currentMeta.labelEn}
          </span>
          <span>
            {step + 1} / {STEPS_META.length}
          </span>
        </div>

        {/* Progress Bar */}
        <Progress value={((step + 1) / STEPS_META.length) * 100} className="h-1.5 mb-10 bg-border" />

        {/* FORM CONTAINER */}
        <div className="bg-white border border-border/80 rounded-2xl p-6 md:p-12 shadow-xl shadow-teal-deep/5 transition-all duration-300">
          
          {/* STEP 1: المعلومات الأساسية */}
          {step === 0 && (
            <div className="grid gap-6 animate-fade-in">
              <div className="border-b border-border pb-4 mb-2">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "المعلومات الأساسية للعميل" : "Basic Contact Information"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "يرجى كتابة بيانات الاتصال الخاصة بالعميل." : "Please fill out the client credentials."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2 font-bold">
                    {lang === "ar" ? "الاسم الكامل" : "Full Name"} *
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "اسم العميل الكريم" : "John Doe"}
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="h-12 border-border focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2 font-bold">
                    {lang === "ar" ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"} *
                  </label>
                  <Input
                    placeholder="01xxxxxxxxx"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="h-12 border-border focus:border-gold"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2">
                    {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="h-12 border-border focus:border-gold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2">
                    {lang === "ar" ? "عنوان الوحدة المراد تشطيبها" : "Unit Location / District"}
                  </label>
                  <Input
                    placeholder={lang === "ar" ? "التجمع الخامس، الشيخ زايد، إلخ" : "District / City"}
                    value={data.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="h-12 border-border focus:border-gold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: معلومات عن المشروع */}
          {step === 1 && (
            <div className="grid gap-8 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "معلومات عن المشروع" : "Project Details"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "حدد نوع العقار ومرحلة المشروع الحالية." : "Select property type and current stage."}
                </p>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-3 font-bold">
                  {lang === "ar" ? "نوع العقار" : "Property Type"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(lang === "ar" ? ["شقة", "فيلا", "مكتب", "محل تجاري", "أخرى"] : ["Apartment", "Villa", "Office", "Retail Shop", "Other"]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => update("project_type", t)}
                      className={`p-4 rounded-xl text-sm font-serif-ar border transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 ${
                        data.project_type === t
                          ? "border-gold bg-gold/10 text-teal-deep font-bold shadow-sm"
                          : "border-border bg-background hover:border-gold/40 text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {(data.project_type === "أخرى" || data.project_type === "Other") && (
                  <div className="mt-3 animate-fade-in">
                    <Input
                      placeholder={lang === "ar" ? "يرجى تحديد نوع العقار..." : "Specify property type..."}
                      value={data.project_type_custom}
                      onChange={(e) => update("project_type_custom", e.target.value)}
                      className="h-11 border-gold/40 focus:border-gold"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Current Stage */}
              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-3 font-bold">
                  {lang === "ar" ? "المرحلة الحالية من المشروع" : "Current Condition"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(lang === "ar" ? ["على الطوب الأحمر", "على المحارة", "متشطبه بالفعل", "أخرى"] : ["Red Brick", "Plastered", "Already finished", "Other"]).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => update("stage", s)}
                      className={`p-4 rounded-xl text-sm font-serif-ar border transition-all duration-300 text-center ${
                        data.stage === s
                          ? "border-gold bg-gold/10 text-teal-deep font-bold shadow-sm"
                          : "border-border bg-background hover:border-gold/40 text-muted-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {(data.stage === "أخرى" || data.stage === "Other") && (
                  <div className="mt-3 animate-fade-in">
                    <Input
                      placeholder={lang === "ar" ? "يرجى تحديد المرحلة الحالية..." : "Specify condition..."}
                      value={data.stage_custom}
                      onChange={(e) => update("stage_custom", e.target.value)}
                      className="h-11 border-gold/40 focus:border-gold"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-gold/45 bg-[#FBF7F0] p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2 font-bold">
                      {lang === "ar" ? "صور رسم الشقة أو تقسيم الغرف" : "Apartment drawings or layout"}
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      {lang === "ar"
                        ? "ارفع رسم تقسيم الشقة أو الفيلا أو أماكن الغرف المتاحة حاليًا."
                        : "Upload drawing/layout showing rooms, kitchen or bathroom locations."}
                    </p>
                  </div>
                  <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-gold bg-gold px-5 py-3 text-xs font-bold text-teal-deep transition hover:bg-transparent hover:text-gold">
                    <Upload size={15} />
                    <span>{uploading ? "..." : lang === "ar" ? "رفع البلانات" : "Upload plans"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        uploadPlanFiles(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                {data.plan_images.length > 0 && (
                  <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.plan_images.map((asset) => (
                      <div key={asset.url} className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                        {asset.type.startsWith("image/") ? (
                          <img src={asset.url} alt={asset.name} className="h-32 w-full object-contain bg-white" />
                        ) : (
                          <a href={asset.url} target="_blank" rel="noreferrer" className="h-32 w-full grid place-items-center bg-white text-teal-deep">
                            <FileImage size={30} />
                          </a>
                        )}
                        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                          <span className="truncate text-[11px] text-muted-foreground" title={asset.name}>{asset.name}</span>
                          <button
                            type="button"
                            onClick={() => removePlanImage(asset.url)}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: عدد الأفراد المستخدمين */}
          {step === 2 && (
            <div className="grid gap-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "عدد الأفراد المستخدمين" : "Target Occupants"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "يساعدنا في توزيع الفراغات واختيار الخامات المناسبة." : "Helps optimize space distribution."}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {(lang === "ar" ? ["زوج + زوجة", "زوج وزوجة + طفل", "أخرى"] : ["Couple", "Family with Kid", "Other"]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => update("family", f)}
                    className={`p-5 rounded-xl text-base font-serif-ar border transition-all duration-300 text-center ${
                      data.family === f
                        ? "border-gold bg-gold/10 text-teal-deep font-bold shadow-md"
                        : "border-border bg-background hover:border-gold/40 text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {(data.family === "أخرى" || data.family === "Other") && (
                <div className="mt-2 animate-fade-in">
                  <Input
                    placeholder={lang === "ar" ? "تفاصيل المستخدمين..." : "Custom occupant structure..."}
                    value={data.family_custom}
                    onChange={(e) => update("family_custom", e.target.value)}
                    className="h-12 border-gold/40 focus:border-gold"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: الخدمات المطلوبة */}
          {step === 3 && (
            <div className="grid gap-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "الخدمات المطلوبة" : "Required Services"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "اختر الخدمات التي يبحث عنها العميل (يمكن تحديد أكثر من خدمة)" : "You can select multiple services"}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(lang === "ar" 
                  ? ["تصميم داخلي", "تنفيذ وتشطيب كامل", "أثاث وديكور", "أخرى"] 
                  : ["Interior Design", "Full Execution and Finishing", "Furniture & Decor", "Other"]
                ).map((srv) => {
                  const selected = Array.isArray(data.service) ? data.service.includes(srv) : false;
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => {
                        const arr = Array.isArray(data.service) ? [...data.service] : [];
                        if (arr.includes(srv)) {
                          update("service", arr.filter(s => s !== srv));
                        } else {
                          update("service", [...arr, srv]);
                        }
                      }}
                      className={`p-6 rounded-xl text-right md:text-center text-sm md:text-base font-serif-ar border transition-all duration-300 flex items-center justify-between gap-2 ${
                        selected
                          ? "border-gold bg-gold/10 text-teal-deep font-bold shadow-md"
                          : "border-border bg-background hover:border-gold/40 text-muted-foreground"
                      }`}
                    >
                      <span>{srv}</span>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? "border-gold bg-gold" : "border-border"
                      }`}>
                        {selected && <Check size={10} strokeWidth={3} className="text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(Array.isArray(data.service) && (data.service.includes("أخرى") || data.service.includes("Other"))) && (
                <div className="mt-2 animate-fade-in">
                  <Input
                    placeholder={lang === "ar" ? "حدد الخدمة المخصصة..." : "Specify customized scope..."}
                    value={data.service_custom}
                    onChange={(e) => update("service_custom", e.target.value)}
                    className="h-12 border-gold/40 focus:border-gold"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: التوقعات والتجربة */}
          {step === 4 && (
            <div className="grid gap-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "التوقعات والتجربة" : "Expectations & Experience"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "ما هي أولويات العميل وتوقعاته؟" : "What is the critical factor for the client?"}
                </p>
              </div>

              {/* Important Factor - MULTI SELECT */}
              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-3 font-bold">
                  {lang === "ar" ? "1. ما أهم العوامل التي يبحث عنها العميل في شركة التشطيبات؟" : "1. What are the most important factors the client looks for?"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(lang === "ar" ? ["الجودة", "الالتزام بالوقت", "السعر المناسب", "خدمة العملاء", "أخرى"] : ["Quality", "Time commitment", "Reasonable price", "Customer service", "Other"]).map((fac) => {
                    const selected = Array.isArray(data.expectations_factor) ? data.expectations_factor.includes(fac) : false;
                    return (
                      <button
                        type="button"
                        key={fac}
                        onClick={() => {
                          const arr = Array.isArray(data.expectations_factor) ? [...data.expectations_factor] : [];
                          if (arr.includes(fac)) {
                            update("expectations_factor", arr.filter(f => f !== fac));
                          } else {
                            update("expectations_factor", [...arr, fac]);
                          }
                        }}
                        className={`p-3.5 rounded-xl text-xs md:text-sm font-serif-ar border transition-all duration-300 text-center relative ${
                          selected
                            ? "border-gold bg-gold/10 text-teal-deep font-bold shadow-sm"
                            : "border-border bg-background hover:border-gold/40 text-muted-foreground"
                        }`}
                      >
                        {selected && (
                          <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                            <Check size={9} strokeWidth={3} className="text-white" />
                          </span>
                        )}
                        {fac}
                      </button>
                    );
                  })}
                </div>
                {(Array.isArray(data.expectations_factor) && (data.expectations_factor.includes("أخرى") || data.expectations_factor.includes("Other"))) && (
                  <div className="mt-3 animate-fade-in">
                    <Input
                      placeholder={lang === "ar" ? "يرجى تحديد العامل المخصص..." : "Specify custom factor..."}
                      value={data.expectations_factor_custom}
                      onChange={(e) => update("expectations_factor_custom", e.target.value)}
                      className="h-11 border-gold/40 focus:border-gold"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Source */}
              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-3 font-bold">
                  {lang === "ar" ? "2. كيف عرف العميل الشركة؟" : "2. How did they hear about the company?"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(lang === "ar" ? ["توصية من صديق", "وسائل التواصل الاجتماعي", "إعلان", "أخرى"] : ["Friend recommendation", "Social media", "Advertisement", "Other"]).map((src) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => update("source", src)}
                      className={`p-3 rounded-lg text-xs font-serif-ar border transition-all text-center ${
                        data.source === src
                          ? "border-gold bg-gold/10 text-teal-deep font-bold"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
                {(data.source === "أخرى" || data.source === "Other") && (
                  <Input
                    placeholder={lang === "ar" ? "حدد المصدر..." : "Specify source..."}
                    value={data.source_custom}
                    onChange={(e) => update("source_custom", e.target.value)}
                    className="h-10 mt-2 border-gold/40 text-xs"
                    autoFocus
                  />
                )}
              </div>

              {/* Previous interaction */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-teal-deep block mb-2 font-bold">
                    {lang === "ar" ? "3. هل سبق للعميل التعامل مع شركات تشطيبات أخرى؟" : "3. Have they dealt with other companies before?"}
                  </label>
                  <div className="flex gap-3">
                    {(lang === "ar" ? ["نعم", "لا"] : ["Yes", "No"]).map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => update("history", opt)}
                        className={`flex-1 py-2.5 border rounded-lg text-xs font-serif-ar text-center ${
                          data.history === opt ? "border-gold bg-gold/10 text-teal-deep font-bold" : "border-border text-muted-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {(data.history === "نعم" || data.history === "Yes") && (
                    <div className="animate-fade-in">
                      <label className="text-xs text-teal-deep block mb-2 font-bold">
                        {lang === "ar" ? "إذا كانت الإجابة نعم، ما أبرز التحديات التي واجهته؟" : "If yes, what challenges did they face?"}
                      </label>
                      <Input
                        placeholder={lang === "ar" ? "تأخر التسليم، زيادة الميزانية، إلخ" : "Delays, over-budgeting..."}
                        value={data.history_challenges}
                        onChange={(e) => update("history_challenges", e.target.value)}
                        className="h-10 text-xs border-gold/40 focus:border-gold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: المشكلات والطموحات وملاحظات إضافية */}
          {step === 5 && (
            <div className="grid gap-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-serif-ar text-xl text-teal-deep font-bold">
                  {lang === "ar" ? "المشكلات والطموحات والملاحظات" : "Goals, Problems & Notes"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "أخبرنا عن طموحات العميل والمشكلات التي يود تفاديها." : "Tell us about expectations, worries, or general notes."}
                </p>
              </div>

              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2 font-bold">
                  {lang === "ar" ? "المشكلات وحلها" : "Problems & Solutions"}
                </label>
                <div className="grid gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">
                      {lang === "ar" ? "1. المشاكل التي واجهها العميل في مشروع سابق" : "1. Problems faced in previous project"}
                    </span>
                    <Textarea
                      placeholder={lang === "ar" ? "مثل: سوء السباكة، عدم التناسق، خامات رديئة..." : "Example: plumbing issues, bad alignment..."}
                      value={data.prev_problems}
                      onChange={(e) => update("prev_problems", e.target.value)}
                      className="min-h-24 leading-relaxed font-serif-ar text-sm"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">
                      {lang === "ar" ? "2. الأشياء التي يتمنى تحقيقها في مشروعه الجديد" : "2. Expectations for the new project"}
                    </span>
                    <Textarea
                      placeholder={lang === "ar" ? "مثل: إضاءة ذكية، ألوان هادئة، مساحات مفتوحة..." : "Example: smart lighting, cozy layout..."}
                      value={data.new_ambitions}
                      onChange={(e) => update("new_ambitions", e.target.value)}
                      className="min-h-24 leading-relaxed font-serif-ar text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-serif uppercase tracking-wider text-teal-deep block mb-2 font-bold">
                  {lang === "ar" ? "ملاحظات إضافية" : "Additional Notes"}
                </label>
                <Textarea
                  placeholder={lang === "ar" ? "أي ملاحظات خاصة أو روابط ملفات إضافية..." : "Any other raw notes or feedback..."}
                  value={data.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  className="min-h-20 leading-relaxed font-serif-ar text-sm"
                />
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-border/40 text-center">
            <p className="text-xs md:text-sm font-serif-ar text-gold italic font-bold">
              {lang === "ar" ? "شكراً لثقتكم في تاكت... رحلة تميز جديدة تبدأ الآن" : "Thank you for your trust... a new journey of excellence begins"}
            </p>
          </div>
        </div>

        {/* Bottom Action Controllers */}
        <div className="flex items-center justify-between mt-10 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className="btn-ghost-light !text-teal-deep !border-teal-deep/30 disabled:opacity-30 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>{lang === "ar" ? "الخطوة السابقة" : "Back"}</span>
          </button>

          {step < STEPS_META.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-gold flex items-center gap-2 px-8 py-3.5 font-bold"
            >
              <span>{lang === "ar" ? "الخطوة التالية" : "Continue"}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitQuestionnaire}
              disabled={busy}
              className="btn-gold flex items-center gap-2 px-10 py-3.5 font-bold shadow-lg shadow-gold/20 disabled:opacity-50"
            >
              <span>
                {busy 
                  ? "..." 
                  : lang === "ar" 
                    ? (isEditing ? "حفظ التعديلات والعودة للباقات" : "حفظ الاستبيان واختيار الباقة") 
                    : (isEditing ? "Save Changes & Return to Packages" : "Save and Choose Package")}
              </span>
              <Check size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
