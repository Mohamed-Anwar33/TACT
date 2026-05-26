import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  Globe, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Clock, 
  Sparkles, 
  UserPlus,
  KeyRound
} from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { looksLikePhoneLogin, phoneToAuthEmail, phoneToProfileValue } from "@/lib/phoneAuth";

type AuthMode = "signin" | "signup" | "reset";

type SignupQuestionnaire = {
  address: string;
  projectTypes: string[];
  projectTypeOther: string;
  stages: string[];
  stageOther: string;
  occupants: string[];
  occupantsOther: string;
  services: string[];
  serviceOther: string;
  factors: string[];
  factorOther: string;
  sources: string[];
  sourceOther: string;
  history: string[];
  historyChallenges: string;
  previousProblems: string;
  newGoals: string;
  notes: string;
};

const initialQuestionnaire: SignupQuestionnaire = {
  address: "",
  projectTypes: [],
  projectTypeOther: "",
  stages: [],
  stageOther: "",
  occupants: [],
  occupantsOther: "",
  services: [],
  serviceOther: "",
  factors: [],
  factorOther: "",
  sources: [],
  sourceOther: "",
  history: [],
  historyChallenges: "",
  previousProblems: "",
  newGoals: "",
  notes: "",
};

const questionnaireOptions = {
  ar: {
    projectTypes: ["شقة", "فيلا", "مكتب", "محل تجاري", "أخرى"],
    stages: ["على الطوب الأحمر", "على المحارة", "متشطبة بالفعل", "أخرى"],
    occupants: ["زوج + زوجة", "زوج وزوجة + طفل", "أخرى"],
    services: ["تصميم داخلي", "تنفيذ وتشطيب كامل", "أثاث وديكور", "أخرى"],
    factors: ["الجودة", "الالتزام بالوقت", "السعر المناسب", "خدمة العملاء", "أخرى"],
    sources: ["توصية من صديق", "وسائل التواصل الاجتماعي", "إعلان", "أخرى"],
    history: ["نعم", "لا"],
  },
  en: {
    projectTypes: ["Apartment", "Villa", "Office", "Retail shop", "Other"],
    stages: ["Red brick", "Plastering", "Already finished", "Other"],
    occupants: ["Couple", "Couple + child", "Other"],
    services: ["Interior design", "Full execution and finishing", "Furniture and decor", "Other"],
    factors: ["Quality", "Time commitment", "Suitable price", "Customer service", "Other"],
    sources: ["Friend recommendation", "Social media", "Advertisement", "Other"],
    history: ["Yes", "No"],
  },
};

function joinValues(values: string[], other: string = "") {
  const cleaned = values.filter(Boolean);
  if (other.trim()) cleaned.push(other.trim());
  return cleaned.join("، ");
}

function CheckboxPill({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
      checked
        ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
        : "border-brand-gold/15 bg-brand-dark/30 text-ivory/70 hover:border-brand-gold/45"
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#C18556]" />
      <span>{label}</span>
    </label>
  );
}

export default function Auth() {
  const { lang } = useLang();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRtl = lang === "ar";
  
  // Detect if user has a reset-password flow or query parameter
  const [mode, setMode] = useState<AuthMode>("signin");
  
  useEffect(() => {
    const queryMode = searchParams.get("mode");
    if (queryMode === "reset" || window.location.hash.includes("type=recovery")) {
      setMode("reset");
    } else if (queryMode === "signup") {
      setMode("signup");
    } else {
      setMode("signin");
    }
  }, [searchParams]);

  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "", 
    full_name: "", 
    phone: "" 
  });
  const [questionnaire, setQuestionnaire] = useState<SignupQuestionnaire>(initialQuestionnaire);
  const [busy, setBusy] = useState(false);
  
  // Independent password visibility states
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setSearchParams(newMode === "signin" ? {} : { mode: newMode });
    // Reset passwords for safety
    setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
  };

  const toggleQuestionnaireValue = (key: keyof SignupQuestionnaire, value: string) => {
    setQuestionnaire((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (form.password !== form.confirmPassword) {
          toast.error(isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
          setBusy(false);
          return;
        }
        
        const profilePhone = phoneToProfileValue(form.phone);
        const emailToUse = form.email.trim() || phoneToAuthEmail(form.phone);
        if (!emailToUse) {
          toast.error(isRtl ? "يرجى إدخال البريد الإلكتروني أو رقم الهاتف" : "Please enter an email or phone number");
          setBusy(false);
          return;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: emailToUse,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer`,
            data: { 
              full_name: form.full_name, 
              phone: profilePhone
            },
          },
        });
        if (error) throw error;
        toast.success(isRtl ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!");
        const hasQuestionnaireData = [
          questionnaire.address,
          questionnaire.projectTypeOther,
          questionnaire.stageOther,
          questionnaire.occupantsOther,
          questionnaire.serviceOther,
          questionnaire.factorOther,
          questionnaire.sourceOther,
          questionnaire.historyChallenges,
          questionnaire.previousProblems,
          questionnaire.newGoals,
          questionnaire.notes,
          ...questionnaire.projectTypes,
          ...questionnaire.stages,
          ...questionnaire.occupants,
          ...questionnaire.services,
          ...questionnaire.factors,
          ...questionnaire.sources,
          ...questionnaire.history,
        ].some((value) => value.trim());

        if (hasQuestionnaireData) {
          const expectations = [
            `${isRtl ? "أهم العوامل" : "Important factors"}: ${joinValues(questionnaire.factors, questionnaire.factorOther)}`,
            `${isRtl ? "كيف سمعت عن الشركة" : "Source"}: ${joinValues(questionnaire.sources, questionnaire.sourceOther)}`,
          ].join(" | ");
          const history = [
            `${isRtl ? "هل سبق التعامل مع شركات تشطيب" : "Previous finishing company experience"}: ${questionnaire.history.join("، ")}`,
            `${isRtl ? "التحديات" : "Challenges"}: ${questionnaire.historyChallenges}`,
          ].join(" | ");
          const goals = [
            `${isRtl ? "مشاكل المشروع السابق" : "Previous project problems"}: ${questionnaire.previousProblems}`,
            `${isRtl ? "ما يريد تحقيقه في المشروع الجديد" : "New project goals"}: ${questionnaire.newGoals}`,
          ].join(" | ");

          const { error: questionnaireError } = await supabase.from("questionnaires").insert({
            user_id: signUpData.user?.id ?? null,
            name: form.full_name,
            phone: profilePhone || form.phone,
            email: emailToUse,
            address: questionnaire.address,
            project_type: joinValues(questionnaire.projectTypes, questionnaire.projectTypeOther),
            stage: joinValues(questionnaire.stages, questionnaire.stageOther),
            family: joinValues(questionnaire.occupants, questionnaire.occupantsOther),
            service: joinValues(questionnaire.services, questionnaire.serviceOther),
            expectations,
            source: joinValues(questionnaire.sources, questionnaire.sourceOther),
            history,
            goals,
            notes: questionnaire.notes,
          });

          if (questionnaireError) {
            toast.error(questionnaireError.message);
          }
        }

        nav("/customer");
      } else if (mode === "reset") {
        if (form.password !== form.confirmPassword) {
          toast.error(isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: form.password });
        if (error) throw error;
        toast.success(isRtl ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully");
        handleModeChange("signin");
      } else {
        let emailToUse = form.email.trim();

        if (looksLikePhoneLogin(form.email)) {
          // Lookup email associated with phone number (supports logging in via phone for accounts created with either email or phone)
          const { data: dbEmail, error: lookupError } = await (supabase as any).rpc(
            "get_auth_email_by_phone", 
            { phone_input: form.email }
          );
          
          if (!lookupError && dbEmail) {
            emailToUse = dbEmail;
          } else {
            emailToUse = phoneToAuthEmail(form.email);
          }
        }

        const { error } = await supabase.auth.signInWithPassword({ 
          email: emailToUse, 
          password: form.password 
        });
        if (error) throw error;
        toast.success(isRtl ? "أهلاً بك! تم تسجيل الدخول بنجاح" : "Welcome! Signed in successfully");
        nav("/customer");
      }
    } catch (err: any) {
      toast.error(err.message ?? (isRtl ? "حدث خطأ ما" : "An error occurred"));
    } finally { 
      setBusy(false); 
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.error(isRtl ? "يرجى إدخال بريدك الإلكتروني في الحقل أولاً" : "Please enter your email in the field first");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      toast.success(isRtl 
        ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" 
        : "Password reset link sent to your email"
      );
    } catch (err: any) {
      toast.error(err.message ?? (isRtl ? "حدث خطأ ما" : "An error occurred"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main 
      className="min-h-screen grid lg:grid-cols-12 bg-brand-dark text-ivory overflow-hidden relative font-arabic" 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Scoped style to fix Chrome autofill background colors */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F5F5F3 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0C363A inset !important;
          transition: background-color 5000s ease-in-out 0s;
          border: 1px solid rgba(193, 133, 86, 0.3) !important;
        }
      `}</style>
      
      {/* Subtle architectural background pattern */}
      <div className="absolute inset-0 arch-grid opacity-[0.04] pointer-events-none" />
      
      {/* Luxury dynamic glowing ambient lights */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-teal/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-brand-gold/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] left-[-15%] w-[450px] h-[450px] rounded-full bg-brand-teal/15 blur-[120px] pointer-events-none" />

      {/* LEFT PANEL: Form card (41.6% space on Desktop) */}
      <div className={`${mode === "signup" ? "lg:col-span-7" : "lg:col-span-5"} col-span-12 flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative z-10 min-h-screen`}>
        
        {/* Responsive compact brand header for Mobile devices only */}
        <div className="lg:hidden flex flex-col items-center text-center mb-8 mt-4 space-y-2 animate-fade-in">
          <img 
            src="/logo.png" 
            alt="Tact Logo" 
            className="h-16 w-16 object-contain drop-shadow-[0_0_15px_rgba(193,133,86,0.3)] mb-2"
          />
          <span className="text-[10px] tracking-[0.3em] font-semibold text-brand-gold uppercase">TACT · CUSTOMER</span>
          <h1 className="text-3xl font-serif text-ivory font-bold">{isRtl ? "بوابة العميل" : "Customer Portal"}</h1>
          <p className="text-xs text-ivory/60 max-w-xs">
            {mode === "signin" 
              ? (isRtl ? "تابع طلبك، اختياراتك، وفعّل باقاتك." : "Track your order, configure your package, and access your portal.")
              : (isRtl ? "نرتقي بتجاربك، لنصنع لك التميز" : "Elevating your experiences to make you outstanding.")}
          </p>
        </div>

        {/* Elegant Glassmorphic Card Panel */}
        <div className={`bg-brand-dark/70 backdrop-blur-xl border border-brand-gold/15 rounded-2xl p-7 sm:p-9 lg:p-10 shadow-luxe w-full ${mode === "signup" ? "max-w-3xl" : "max-w-md"} mx-auto space-y-7 animate-scale-in`}>
          
          {/* Top of Card: Logo and elegant localized subtitle */}
          <div className="text-center space-y-4">
            <Link to="/" className="inline-block transform hover:scale-105 transition duration-300">
              <img 
                src="/logo.png" 
                alt="Tact Logo" 
                className="h-20 w-20 mx-auto object-contain drop-shadow-[0_0_18px_rgba(193,133,86,0.25)]" 
              />
            </Link>
            
            {/* Fine line divider with label */}
            <div className="flex items-center justify-center gap-4 py-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold/30" />
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-[0.2em] whitespace-nowrap">
                {mode === "signup" 
                  ? (isRtl ? "إنشاء حساب" : "CREATE ACCOUNT") 
                  : mode === "reset"
                  ? (isRtl ? "إعادة تعيين" : "RESET PASSWORD")
                  : (isRtl ? "تسجيل الدخول" : "SIGN IN")}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold/30" />
            </div>

            {/* Main Title & Description */}
            <div className="space-y-1">
              <h2 className="text-2xl font-serif text-ivory font-bold leading-snug">
                {mode === "signup" 
                  ? (isRtl ? "ابدأ رحلتك معنا" : "Start your journey") 
                  : mode === "reset"
                  ? (isRtl ? "كلمة مرور جديدة" : "New password")
                  : (isRtl ? "أهلاً بعودتك" : "Welcome back")}
              </h2>
              <p className="text-xs text-ivory/60 leading-relaxed max-w-[280px] mx-auto">
                {mode === "signup" 
                  ? (isRtl ? "أنشئ حسابك للوصول إلى بوابة العميل الخاصة بك" : "Create your account to access your premium client portal") 
                  : mode === "reset"
                  ? (isRtl ? "أدخل كلمة المرور الجديدة وتأكيدها لحفظها" : "Enter your new password below to reset and save it")
                  : (isRtl ? "سجّل دخولك للوصول إلى بوابة العميل الخاصة بك" : "Sign in to access your custom client dashboard")
                }
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={submit} className="space-y-5">
            
            {/* Field: Full name (Sign Up only) */}
            {mode === "signup" && (
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-ivory/80 block">
                  {isRtl ? "الاسم الكامل" : "Full Name"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                    <User size={17} strokeWidth={1.5} />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder={isRtl ? "الاسم الكامل" : "Full Name"}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full h-12 pr-11 pl-4 bg-brand-dark/40 border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Field: Phone (Sign Up only) */}
            {mode === "signup" && (
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-ivory/80 block">
                  {isRtl ? "رقم الهاتف" : "Phone Number"}
                </label>
                <div className="relative flex" dir="ltr">
                  <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-brand-gold/20 bg-brand-dark/50 text-brand-gold font-sans text-xs tracking-wider">
                    +20
                  </span>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                      <Phone size={17} strokeWidth={1.5} />
                    </div>
                    <input 
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      pattern="0?1[0-9]{9}"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-12 pr-11 pl-4 bg-brand-dark/40 border border-brand-gold/20 rounded-r-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300 text-left font-sans"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Field: Email / Phone (Sign In / Sign Up only) */}
            {mode !== "reset" && (
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-ivory/80 block">
                  {mode === "signin"
                    ? (isRtl ? "البريد الإلكتروني أو رقم الهاتف" : "Email or Phone Number")
                    : (isRtl ? "البريد الإلكتروني (اختياري)" : "Email Address (Optional)")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                    <Mail size={17} strokeWidth={1.5} />
                  </div>
                  <input 
                    type={mode === "signin" ? "text" : "email"} 
                    required={mode === "signin"}
                    placeholder={mode === "signin"
                      ? (isRtl ? "أدخل البريد الإلكتروني أو رقم الهاتف" : "Email or Phone Number")
                      : (isRtl ? "البريد الإلكتروني (اختياري)" : "Email (Optional)")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-12 pr-11 pl-4 bg-brand-dark/40 border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="rounded-2xl border border-brand-gold/20 bg-brand-dark/35 p-5 text-right space-y-6">
                <div className="border-b border-brand-gold/15 pb-4">
                  <h3 className="text-lg font-serif font-bold text-brand-gold">
                    {isRtl ? "استبيان العملاء الجدد" : "New Client Questionnaire"}
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-ivory/55">
                    {isRtl
                      ? "املأ الاختيارات أثناء إنشاء الحساب حتى تصل بيانات مشروعك للإدارة من أول خطوة."
                      : "Fill these choices while creating the account so the admin team receives your project brief immediately."}
                  </p>
                </div>

                <div className="grid gap-3">
                  <label className="text-sm font-bold text-ivory">{isRtl ? "عنوان الوحدة المراد تشطيبها" : "Unit address"}</label>
                  <input
                    value={questionnaire.address}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, address: e.target.value })}
                    placeholder={isRtl ? "المنطقة / الكمبوند / رقم الوحدة" : "District / compound / unit number"}
                    className="h-11 rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                  />
                </div>

                {[
                  {
                    title: isRtl ? "القسم الأول: معلومات عن المشروع" : "Section 1: Project information",
                    groups: [
                      { key: "projectTypes", label: isRtl ? "نوع العقار" : "Property type", options: isRtl ? questionnaireOptions.ar.projectTypes : questionnaireOptions.en.projectTypes, otherKey: "projectTypeOther" },
                      { key: "stages", label: isRtl ? "المرحلة الحالية من المشروع" : "Current project stage", options: isRtl ? questionnaireOptions.ar.stages : questionnaireOptions.en.stages, otherKey: "stageOther" },
                    ],
                  },
                  {
                    title: isRtl ? "القسم الثاني: عدد الأفراد المستخدمين" : "Section 2: Occupants",
                    groups: [
                      { key: "occupants", label: isRtl ? "عدد الأفراد" : "Users count", options: isRtl ? questionnaireOptions.ar.occupants : questionnaireOptions.en.occupants, otherKey: "occupantsOther" },
                    ],
                  },
                  {
                    title: isRtl ? "القسم الثالث: الخدمات المطلوبة" : "Section 3: Required services",
                    groups: [
                      { key: "services", label: isRtl ? "الخدمات التي ترغب في الحصول عليها" : "Services needed", options: isRtl ? questionnaireOptions.ar.services : questionnaireOptions.en.services, otherKey: "serviceOther" },
                    ],
                  },
                  {
                    title: isRtl ? "القسم الرابع: التوقعات والتجربة" : "Section 4: Expectations and experience",
                    groups: [
                      { key: "factors", label: isRtl ? "أهم العوامل التي تبحث عنها" : "Important factors", options: isRtl ? questionnaireOptions.ar.factors : questionnaireOptions.en.factors, otherKey: "factorOther" },
                      { key: "sources", label: isRtl ? "كيف سمعت عن الشركة؟" : "How did you hear about us?", options: isRtl ? questionnaireOptions.ar.sources : questionnaireOptions.en.sources, otherKey: "sourceOther" },
                      { key: "history", label: isRtl ? "هل سبق التعامل مع شركات تشطيبات أخرى؟" : "Previous finishing company experience?", options: isRtl ? questionnaireOptions.ar.history : questionnaireOptions.en.history },
                    ],
                  },
                ].map((section) => (
                  <div key={section.title} className="space-y-4 border-t border-brand-gold/15 pt-5">
                    <h4 className="text-base font-serif font-bold text-ivory">{section.title}</h4>
                    {section.groups.map((group: any) => (
                      <div key={group.key} className="space-y-3">
                        <p className="text-xs font-bold text-ivory/75">{group.label}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {group.options.map((option: string) => (
                            <CheckboxPill
                              key={option}
                              label={option}
                              checked={(questionnaire[group.key as keyof SignupQuestionnaire] as string[]).includes(option)}
                              onChange={() => toggleQuestionnaireValue(group.key as keyof SignupQuestionnaire, option)}
                            />
                          ))}
                        </div>
                        {group.otherKey && (questionnaire[group.key as keyof SignupQuestionnaire] as string[]).some((value) => value === "أخرى" || value === "Other") && (
                          <input
                            value={questionnaire[group.otherKey as keyof SignupQuestionnaire] as string}
                            onChange={(e) => setQuestionnaire({ ...questionnaire, [group.otherKey]: e.target.value })}
                            placeholder={isRtl ? "اكتب التفاصيل الأخرى..." : "Write other details..."}
                            className="h-10 w-full rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                <div className="grid gap-3 border-t border-brand-gold/15 pt-5">
                  <label className="text-xs font-bold text-ivory/75">
                    {isRtl ? "إذا كانت الإجابة نعم، ما أبرز التحديات التي واجهتها؟" : "If yes, what were the main challenges?"}
                  </label>
                  <textarea
                    value={questionnaire.historyChallenges}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, historyChallenges: e.target.value })}
                    rows={2}
                    className="rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 py-3 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 border-t border-brand-gold/15 pt-5">
                  <h4 className="text-base font-serif font-bold text-ivory">{isRtl ? "القسم الخامس: المشكلات وحلها" : "Section 5: Problems and solutions"}</h4>
                  <textarea
                    value={questionnaire.previousProblems}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, previousProblems: e.target.value })}
                    placeholder={isRtl ? "المشاكل التي واجهتها في المشروع السابق..." : "Previous project problems..."}
                    rows={2}
                    className="rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 py-3 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                  />
                  <textarea
                    value={questionnaire.newGoals}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, newGoals: e.target.value })}
                    placeholder={isRtl ? "إيه الحاجات اللي نفسك تحققها في مشروعك الجديد..." : "What do you want to achieve in your new project..."}
                    rows={2}
                    className="rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 py-3 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 border-t border-brand-gold/15 pt-5">
                  <h4 className="text-base font-serif font-bold text-ivory">{isRtl ? "القسم السادس: ملاحظات إضافية" : "Section 6: Additional notes"}</h4>
                  <textarea
                    value={questionnaire.notes}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, notes: e.target.value })}
                    rows={2}
                    className="rounded-lg border border-brand-gold/20 bg-brand-dark/45 px-4 py-3 text-sm text-ivory placeholder-ivory/30 focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Field: Password (All modes) */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ivory/80 block">
                  {mode === "reset" 
                    ? (isRtl ? "كلمة المرور الجديدة" : "New Password") 
                    : (isRtl ? "كلمة المرور" : "Password")}
                </label>
                
                {/* Forgot password link (Sign In only) */}
                {mode === "signin" && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-brand-gold hover:text-brand-sand transition-colors duration-200"
                  >
                    {isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                  <Lock size={17} strokeWidth={1.5} />
                </div>
                
                {/* Toggle Eye on Left side */}
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 left-3.5 flex items-center text-ivory/40 hover:text-brand-gold transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                
                <input 
                  type={showPass ? "text" : "password"} 
                  required
                  minLength={8}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-12 pr-11 pl-10 bg-brand-dark/40 border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Field: Confirm Password (Sign Up & Reset modes) */}
            {(mode === "signup" || mode === "reset") && (
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-ivory/80 block">
                  {isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                    <Lock size={17} strokeWidth={1.5} />
                  </div>
                  
                  {/* Toggle Eye on Left side */}
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 left-3.5 flex items-center text-ivory/40 hover:text-brand-gold transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  
                  <input 
                    type={showConfirmPass ? "text" : "password"} 
                    required
                    minLength={8}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full h-12 pr-11 pl-10 bg-brand-dark/40 border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Primary Submit CTA Button */}
            <button
              type="submit"
              disabled={busy}
              className="relative w-full h-12 overflow-hidden rounded-lg bg-gradient-gold text-brand-dark font-bold text-sm tracking-wider shadow-gold hover:shadow-[0_0_25px_rgba(193,133,86,0.38)] transition-all duration-500 flex items-center justify-center gap-2 group mt-2"
            >
              {/* Metallic shimmering reflection */}
              <div 
                className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" 
                style={{ animation: 'shimmer 1.8s linear infinite' }}
              />
              
              <span className="relative z-10">
                {busy ? (
                  <span className="inline-block animate-pulse">...</span>
                ) : mode === "signup" ? (
                  (isRtl ? "إنشاء الحساب" : "Create Account")
                ) : mode === "reset" ? (
                  (isRtl ? "حفظ كلمة المرور" : "Save Password")
                ) : (
                  (isRtl ? "دخول" : "Sign In")
                )}
              </span>
              
              {!busy && (
                isRtl ? (
                  <ArrowLeft size={16} className="relative z-10 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
                ) : (
                  <ArrowRight size={16} className="relative z-10 transform group-hover:translate-x-1.5 transition-transform duration-300" />
                )
              )}
            </button>
          </form>

          {/* Secondary Options and Footer Links within the card */}
          <div className="space-y-4 pt-1 border-t border-brand-gold/10">
            
            {/* Toggle Mode Option */}
            {mode === "signin" && (
              <div className="flex items-center justify-between text-xs pt-1">
                <button 
                  type="button" 
                  onClick={() => handleModeChange("signup")}
                  className="flex items-center gap-1.5 text-ivory/60 hover:text-brand-gold transition-colors duration-200"
                >
                  <UserPlus size={14} />
                  <span>{isRtl ? "حساب جديد" : "Create Account"}</span>
                </button>
                
                <Link 
                  to="/" 
                  className="flex items-center gap-1.5 text-ivory/60 hover:text-brand-gold transition-colors duration-200"
                >
                  <Globe size={14} />
                  <span>{isRtl ? "العودة للموقع" : "Back to Site"}</span>
                </Link>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-4 pt-1">
                <div className="text-center text-xs">
                  <span className="text-ivory/55">{isRtl ? "لديك حساب بالفعل؟ " : "Already have an account? "}</span>
                  <button 
                    type="button" 
                    onClick={() => handleModeChange("signin")}
                    className="text-brand-gold hover:text-brand-sand transition-colors font-bold"
                  >
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </button>
                </div>
                
                <div className="flex justify-center text-xs">
                  <Link 
                    to="/" 
                    className="flex items-center gap-1.5 text-ivory/60 hover:text-brand-gold transition-colors duration-200"
                  >
                    <Globe size={14} />
                    <span>{isRtl ? "العودة للموقع" : "Back to Site"}</span>
                  </Link>
                </div>
              </div>
            )}

            {mode === "reset" && (
              <div className="flex justify-center text-xs pt-1">
                <button 
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className="flex items-center gap-1.5 text-brand-gold hover:text-brand-sand transition-colors"
                >
                  <KeyRound size={14} />
                  <span>{isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Hero branding & architectural showcase (58.3% space on Desktop) */}
      <div className={`${mode === "signup" ? "lg:col-span-5" : "lg:col-span-7"} hidden lg:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-brand-dark/95 border-r border-brand-gold/10`}>
        
        {/* Decorative architectural grid lines */}
        <div className="absolute inset-0 arch-grid opacity-[0.06] pointer-events-none" />

        {/* Spacious Branding Text Section */}
        <div className="space-y-4 relative z-10">
          <span className="text-[11px] tracking-[0.4em] font-semibold text-brand-gold uppercase block animate-fade-in">
            TACT · CUSTOMER
          </span>
          <h2 className="text-4xl lg:text-5xl font-serif text-ivory font-bold leading-[1.12] animate-fade-in [animation-delay:200ms]">
            {isRtl ? "بوابة العميل" : "Client Portal"}
          </h2>
          <div className="flex items-center gap-4 animate-fade-in [animation-delay:350ms]">
            <div className="h-[2px] w-12 bg-brand-gold rounded-full" />
            <p className="text-ivory/80 text-sm font-light">
              {mode === "signup" 
                ? (isRtl ? "نرتقي بتجاربك، لنصنع لك التميز" : "We elevate your experiences to craft exceptional value")
                : (isRtl ? "تابع طلبك، اختياراتك، وفعّل باقاتك." : "Track requests, manage options, and activate packages.")
              }
            </p>
          </div>
        </div>

        {/* Architectural Arch Composition */}
        <div className="relative flex-1 my-6 flex items-center justify-center z-10 animate-scale-in">
          {/* Abstract golden luxury orbits overlay */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-brand-gold/15 -translate-x-12 -translate-y-6 pointer-events-none" />
          <div className="absolute w-[450px] h-[450px] rounded-full border border-brand-gold/5 translate-x-8 translate-y-12 pointer-events-none" />

          {/* Golden Arch Frame wrapping our rendered image */}
          <div className="relative w-[340px] h-[400px] rounded-t-[170px] border border-brand-gold/25 overflow-hidden shadow-luxe bg-brand-dark/75 group">
            {/* Inner gloss overlay */}
            <div className="absolute inset-0 rounded-t-[170px] ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
            
            {/* Premium luxury interior image */}
            <img 
              src="/luxury-interior.png" 
              alt="Tact Luxury Architectural Interior" 
              className="w-full h-full object-cover image-crisp select-none"
              loading="eager"
              decoding="async"
            />
            
            {/* Bottom fading shadow for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/15 to-transparent z-15 pointer-events-none" />
          </div>

          {/* Corner subtle dot matrix grid */}
          <div 
            className="absolute bottom-6 right-6 w-24 h-24 opacity-25 pointer-events-none" 
            style={{ 
              backgroundImage: 'radial-gradient(hsl(var(--brand-gold)) 1.2px, transparent 1.2px)', 
              backgroundSize: '12px 12px' 
            }} 
          />
        </div>

        {/* Premium Horizontal Features Strip */}
        <div className="bg-brand-dark/50 backdrop-blur-md border border-brand-gold/15 rounded-xl p-5 relative z-10 flex items-center justify-between gap-4 animate-fade-in [animation-delay:500ms]">
          
          {/* Feature 1 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-1.5">
            <div className="p-2 rounded-full bg-brand-gold/10 text-brand-gold">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-ivory block">
              {isRtl ? "أمان وخصوصية" : "Secure & Private"}
            </span>
            <span className="text-[10px] text-ivory/60 block leading-tight">
              {isRtl ? "حماية متقدمة لبياناتك" : "Advanced safety for details"}
            </span>
          </div>

          <div className="w-px h-12 bg-brand-gold/15 shrink-0" />

          {/* Feature 2 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-1.5">
            <div className="p-2 rounded-full bg-brand-gold/10 text-brand-gold">
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-ivory block">
              {isRtl ? "متابعة لحظية" : "Real-time Updates"}
            </span>
            <span className="text-[10px] text-ivory/60 block leading-tight">
              {isRtl ? "تحديثات فورية لمشاريعك" : "Instant track on projects"}
            </span>
          </div>

          <div className="w-px h-12 bg-brand-gold/15 shrink-0" />

          {/* Feature 3 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-1.5">
            <div className="p-2 rounded-full bg-brand-gold/10 text-brand-gold">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-ivory block">
              {isRtl ? "تجربة مخصصة" : "Bespoke Styling"}
            </span>
            <span className="text-[10px] text-ivory/60 block leading-tight">
              {mode === "signup"
                ? (isRtl ? "خدمات مصممة لأسلوبك" : "Services for your style")
                : (isRtl ? "خدمات مصممة لتناسبك" : "Designed just for you")
              }
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
