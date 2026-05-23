import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { isStaff } from "@/auth/adminPermissions";
import { useAuth } from "@/auth/AuthProvider";

export default function AdminLogin() {
  const { lang } = useLang();
  const nav = useNavigate();
  const { user, isStaff: authIsStaff } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user && authIsStaff) {
      nav("/admin");
    }
  }, [user, authIsStaff, nav]);

  const isRtl = lang === "ar";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = pw.trim();
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
      if (error) throw error;
      if (!data.user) throw new Error("Could not read signed-in user");
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (rolesError) throw rolesError;
      const roleList = roles?.map((r: any) => String(r.role)) ?? [];
      if (!isStaff(roleList)) {
        await supabase.auth.signOut();
        throw new Error(lang === "ar" ? "هذا الحساب ليس مديراً" : "Account is not an admin");
      }
      toast.success(lang === "ar" ? "أهلاً بك! تم تسجيل الدخول بنجاح" : "Welcome! Signed in successfully");
      nav("/admin");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-12 bg-[#061d20] text-ivory relative overflow-hidden font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* Glow spots */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-teal/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Left side / Form area */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 md:p-12 relative z-10 min-h-screen bg-gradient-to-b from-[#0a2c30] to-[#05181a] border-r border-brand-gold/10">
        {/* Header link */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border border-brand-gold/30 bg-brand-dark/50 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-dark transition-all duration-300">
              <ArrowLeft size={16} className={isRtl ? "rotate-0" : "rotate-180"} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory/60 group-hover:text-brand-gold transition-colors duration-300">
              {lang === "ar" ? "الموقع الرئيسي" : "Home"}
            </span>
          </Link>
        </div>

        {/* Center Card Form */}
        <div className="w-full max-w-sm mx-auto my-auto space-y-8 bg-brand-dark/30 border border-brand-gold/15 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative">
          <div className="flex flex-col items-center text-center space-y-4 mb-2">
            <img src="/logo.png" alt="TACT Logo" className="h-12 object-contain" />
            <div className="flex items-center gap-2 justify-center w-full">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-gold/30" />
              <span className="text-[9px] uppercase tracking-[0.35em] text-brand-gold font-bold">
                {lang === "ar" ? "لوحة الإدارة الرسمية" : "Official Admin Panel"}
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-gold/30" />
            </div>
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-serif text-ivory font-bold leading-snug">
              {lang === "ar" ? "تسجيل دخول المديرين" : "Staff Authentication"}
            </h2>
            <p className="text-xs text-ivory/50 leading-relaxed max-w-[280px] mx-auto">
              {lang === "ar" ? "أدخل بريدك الإلكتروني والرقم السري للوصول للوحة التحكم" : "Enter admin credentials to access workspace dashboard"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Field: Email */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-ivory/80 block">
                {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                  <Mail size={17} strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@tact.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pr-11 pl-4 bg-[#0a282c] border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300 font-sans"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-semibold text-ivory/80 block">
                {lang === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-brand-gold/60">
                  <Lock size={17} strokeWidth={1.5} />
                </div>
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
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full h-12 pr-11 pl-10 bg-[#0a282c] border border-brand-gold/20 rounded-lg text-ivory placeholder-ivory/30 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all duration-300 font-sans"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="relative w-full h-12 rounded-lg bg-gradient-to-r from-brand-gold to-brand-sand hover:from-brand-sand hover:to-brand-gold text-brand-dark font-semibold text-sm tracking-wide shadow-lg shadow-brand-gold/15 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 mt-6"
            >
              {busy ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{lang === "ar" ? "دخول لوحة التحكم" : "Access Dashboard"}</span>
                  <ArrowLeft size={16} className={`group-hover:${isRtl ? "-translate-x-1" : "translate-x-1"} transition-transform duration-300 ${isRtl ? "" : "rotate-180"}`} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-ivory/40">
          🔒 {lang === "ar" ? "نظام أمان تاكت مشفر بالكامل" : "Tact security system is fully encrypted"}
        </div>
      </div>

      {/* Right side / Hero Branding area */}
      <div className="lg:col-span-7 hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-brand-dark/20">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/luxury-interior.png')` }} />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#061d20]/95 via-[#061d20]/80 to-[#061d20]/50" />
        <div className="absolute inset-0 z-10 bg-radial-at-tr from-brand-gold/10 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 z-20 arch-grid opacity-15" />

        <div className="relative z-30 flex flex-col justify-between h-full max-w-xl">
          <div>
            <SectionEyebrow label="TACT · WORKSPACE" />
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-extrabold mt-6 leading-tight">
              {lang === "ar" ? "لوحة الإشراف والمتابعة" : "Workspace Control Center"}
            </h1>
            <div className="h-0.5 w-24 bg-brand-gold my-6" />
            <p className="text-sm md:text-base text-ivory/70 leading-relaxed">
              {lang === "ar"
                ? "نظام إدارة تجربة عملاء تاكت. تتبع مشاريع التشطيب، قم بتأكيد الدفعات، وأشرف على مصمم الغرف التفاعلي باحترافية."
                : "Tact experience manager. Monitor interior execution steps, approve payments, and oversee interactive config selections."}
            </p>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-brand-gold/60 font-semibold">
            © {new Date().getFullYear()} TACT ARCHITECTS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>

      {/* Chrome Autofill style overrides */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F5F5F3 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0a282c inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>
    </main>
  );
}
