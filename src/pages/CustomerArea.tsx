import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { CatalogPackage, getPackages, getUnlockedPackageIds } from "@/lib/catalog";

export default function CustomerArea() {
  const { lang } = useLang();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      nav("/auth");
    } else if (!loading && user && isAdmin) {
      nav("/admin");
    }
  }, [user, isAdmin, loading, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      (supabase as any).from("payment_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      getPackages(),
      getUnlockedPackageIds(user.id, !!profile?.packages_unlocked),
    ]).then(([paymentRes, packageList, unlocked]) => {
      setPayments(paymentRes.data ?? []);
      setPackages(packageList);
      setUnlockedIds(unlocked);
    });
  }, [user, profile?.packages_unlocked]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">...</div>;

  const activePackages = packages.filter((pkg) => unlockedIds.includes(pkg.id));
  const userName = profile?.full_name ?? user?.user_metadata?.full_name ?? (lang === "ar" ? "عميل مميز" : "Valued Client");
  const rawPhone = profile?.phone ?? user?.user_metadata?.phone ?? "";
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return (lang === "ar" ? "غير مسجل" : "Not Provided");
    let clean = phone.trim();
    if (clean.startsWith("+20")) {
      return "0" + clean.substring(3);
    }
    if (clean.startsWith("20")) {
      return "0" + clean.substring(2);
    }
    return clean;
  };
  const userPhone = formatPhoneForDisplay(rawPhone);
  const rawEmail = user?.email || "";
  const isDummyEmail = rawEmail.endsWith("@tact-client.com");
  const userEmail = isDummyEmail ? (lang === "ar" ? "مسجل برقم الهاتف" : "Registered via Phone") : rawEmail;

  return (
    <section className="pt-40 pb-32 min-h-screen">
      <div className="container-luxe max-w-5xl">
        <SectionEyebrow label={lang === "ar" ? "حسابك" : "Your Account"} />
        <h1 className="display-2 mt-5 mb-4">{lang === "ar" ? `أهلًا، ${userName}` : `Welcome, ${userName}`}</h1>
        <p className="text-muted-foreground leading-relaxed">
          {lang === "ar" ? "هنا تجد حالة مدفوعاتك والباقات التي تم تفعيلها لحسابك بعد مراجعة الإدارة." : "Find your payment status and package access after admin confirmation."}
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {/* Card 1: Client Profile */}
          <div className="card-luxe p-8 flex flex-col justify-between hover:border-brand-gold/30 transition-all duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">{lang === "ar" ? "ملف العميل" : "Client Profile"}</div>
              <div className="font-serif text-2xl mt-3 text-brand-dark font-bold border-b border-black/5 pb-3 mb-4">{userName}</div>
              
              <div className="space-y-3.5 text-xs text-brand-dark/80">
                <div className="flex items-center justify-between gap-4 border-b border-black/[0.03] pb-2">
                  <span className="text-muted-foreground">{lang === "ar" ? "رقم الهاتف:" : "Phone:"}</span>
                  <span className="font-semibold text-brand-dark font-mono">{userPhone}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{lang === "ar" ? "البريد الإلكتروني:" : "Email:"}</span>
                  <span className="font-semibold text-brand-dark truncate max-w-[170px]" title={rawEmail}>{userEmail}</span>
                </div>
              </div>
            </div>
            
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-6 font-semibold">
              {lang === "ar" ? "بيانات الحساب الرسمية" : "Official account details"}
            </div>
          </div>

          {/* Card 2: Packages access */}
          <div className="card-luxe p-8 flex flex-col justify-between hover:border-brand-gold/30 transition-all duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">{lang === "ar" ? "حالة الباقات" : "Packages access"}</div>
              <div className="font-serif text-3xl mt-3 text-brand-dark font-bold">{activePackages.length > 0 ? (lang === "ar" ? "مفعّلة" : "Active") : (lang === "ar" ? "بانتظار التفعيل" : "Pending")}</div>
              {activePackages.length > 0 && (
                <div className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {activePackages.map((pkg) => lang === "ar" ? pkg.name_ar : pkg.name_en).join("، ")}
                </div>
              )}
            </div>
            <Link to="/packages" className="btn-gold mt-6 w-full text-center flex items-center justify-center">{lang === "ar" ? "اذهب للباقات" : "Open packages"}</Link>
          </div>

          {/* Card 3: Next steps */}
          <div className="card-luxe p-8 flex flex-col justify-between hover:border-brand-gold/30 transition-all duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">{lang === "ar" ? "الخطوات التالية" : "Next steps"}</div>
              <div className="font-serif text-2xl mt-3 text-brand-dark font-bold">{lang === "ar" ? "سجل بيانات الدفع" : "Submit payment proof"}</div>
            </div>
            <Link to="/payment" className="btn-ghost-light mt-6 w-full text-center flex items-center justify-center !text-brand-dark !border-brand-dark/20 hover:!border-brand-gold">{lang === "ar" ? "تعليمات الدفع" : "Payment instructions"}</Link>
          </div>
        </div>

        <div className="mt-12">
          <SectionEyebrow label={lang === "ar" ? "مدفوعاتي" : "My Payments"} />
          <div className="card-luxe mt-4 divide-y divide-border">
            {payments.length === 0 && <div className="p-6 text-muted-foreground text-sm">-</div>}
            {payments.map((payment) => {
              const pkg = packages.find((item) => item.id === payment.package_id);
              return (
                <div key={payment.id} className="p-5 flex justify-between items-center gap-4 text-sm">
                  <div>
                    <div>{payment.method} · {payment.reference || "-"}</div>
                    {pkg && <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? pkg.name_ar : pkg.name_en}</div>}
                  </div>
                  <div className={payment.status === "approved" ? "text-gold" : "text-muted-foreground"}>{payment.status}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={async () => { await signOut(); nav("/"); }} className="mt-10 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-gold link-underline">
          {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
        </button>
      </div>
    </section>
  );
}
