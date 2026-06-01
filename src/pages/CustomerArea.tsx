import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { CatalogPackage, getPackages, getUnlockedPackageIds } from "@/lib/catalog";
import { isInternalPhoneEmail, phoneToDisplay } from "@/lib/phoneAuth";
import { BriefcaseBusiness, FileText, LogOut, Plus, ShieldCheck, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomerArea() {
  const { lang } = useLang();
  const { user, profile, isAdmin, isOfficeConsultant, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [officeReports, setOfficeReports] = useState<any[]>([]);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredReports = officeReports.filter((report) => {
    const term = searchQuery.toLowerCase();
    return (
      (report.client_name || "").toLowerCase().includes(term) ||
      (report.client_phone || "").toLowerCase().includes(term) ||
      (report.package_id || "").toLowerCase().includes(term)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteReport = (reportId: string, name: string) => {
    toast(lang === "ar" ? `حذف تقرير العميل: ${name}` : `Delete report for: ${name}`, {
      description: lang === "ar" ? "هل أنت متأكد من رغبتك في حذف هذا التقرير نهائياً؟ لا يمكن التراجع." : "Are you sure you want to delete this report permanently? This action is irreversible.",
      action: {
        label: lang === "ar" ? "حذف" : "Delete",
        onClick: async () => {
          try {
            const { error } = await (supabase as any).from("configurator_selections").delete().eq("id", reportId);
            if (error) throw error;
            setOfficeReports((prev) => prev.filter((r) => r.id !== reportId));
            toast.success(lang === "ar" ? "تم حذف التقرير بنجاح" : "Report deleted successfully");
          } catch (e: any) {
            toast.error(e.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"));
          }
        }
      },
      cancel: {
        label: lang === "ar" ? "إلغاء" : "Cancel",
        onClick: () => {},
      }
    });
  };

  const handleDeleteAllReports = () => {
    toast(lang === "ar" ? "حذف جميع التقارير" : "Delete All Reports", {
      description: lang === "ar" ? "تنبيه! سيتم حذف كافة التقارير نهائياً من قاعدة البيانات. هل أنت متأكد؟" : "Warning! All reports will be permanently deleted from the database. Are you sure?",
      action: {
        label: lang === "ar" ? "حذف الكل" : "Delete All",
        onClick: async () => {
          try {
            const reportIds = officeReports.map(r => r.id);
            if (reportIds.length === 0) return;
            const { error } = await (supabase as any).from("configurator_selections").delete().in("id", reportIds);
            if (error) throw error;
            setOfficeReports([]);
            toast.success(lang === "ar" ? "تم حذف جميع التقارير بنجاح" : "All reports deleted successfully");
          } catch (e: any) {
            toast.error(e.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"));
          }
        }
      },
      cancel: {
        label: lang === "ar" ? "إلغاء" : "Cancel",
        onClick: () => {},
      }
    });
  };

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
      isOfficeConsultant
        ? (supabase as any).from("configurator_selections").select("id,created_at,package_id,client_name,client_phone").eq("user_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]).then(([paymentRes, packageList, unlocked, reportsRes]) => {
      setPayments(paymentRes.data ?? []);
      setPackages(packageList);
      setUnlockedIds(unlocked);
      setOfficeReports(reportsRes.data ?? []);
    });
  }, [user, profile?.packages_unlocked, isOfficeConsultant]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">...</div>;

  const activePackages = packages.filter((pkg) => unlockedIds.includes(pkg.id));
  const userName = profile?.full_name ?? user?.user_metadata?.full_name ?? (lang === "ar" ? "عميل مميز" : "Valued Client");
  const rawPhone = profile?.phone ?? user?.user_metadata?.phone ?? "";
  const userPhone = phoneToDisplay(rawPhone) || (lang === "ar" ? "غير مسجل" : "Not Provided");
  const rawEmail = user?.email || "";
  const isDummyEmail = isInternalPhoneEmail(rawEmail);
  const userEmail = isDummyEmail ? (lang === "ar" ? "مسجل برقم الهاتف" : "Registered via Phone") : rawEmail;

  if (isOfficeConsultant) {
    return (
      <section className="min-h-screen bg-[#f6f1e8] pt-32 pb-20" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-6xl">
          <div className="rounded-2xl border border-[#d9c9b7] bg-[#0C363A] p-7 text-ivory shadow-2xl md:p-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                  <BriefcaseBusiness size={15} />
                  <span>{lang === "ar" ? "حساب المكتب" : "Office account"}</span>
                </div>
                <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">{userName}</h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/70">
                  {lang === "ar"
                    ? "ابدأ جلسة عميل جديدة من التابلت، سجل الاستبيان، اختر الباقة، ثم اطبع تقرير PDF مباشرة بدون إنشاء حساب جديد لكل عميل."
                    : "Start an in-office client session, capture the questionnaire, choose a package, then print the PDF report without creating a new account for every client."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <Link to="/office-session" className="rounded-xl bg-gold px-5 py-4 text-center text-sm font-extrabold text-[#0C363A] shadow-lg transition hover:bg-white">
                  <Plus className="mx-auto mb-2" size={24} />
                  {lang === "ar" ? "جلسة عميل جديدة" : "New client session"}
                </Link>
                <button onClick={async () => { await signOut(); nav("/"); }} className="rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-white/10">
                  <LogOut className="mx-auto mb-2" size={24} />
                  {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-[#e3d8c9] bg-white p-6 shadow-sm">
              <ShieldCheck className="mb-4 text-gold" size={28} />
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">{lang === "ar" ? "الصلاحية" : "Access"}</div>
              <div className="mt-2 font-serif text-2xl font-bold text-[#0C363A]">{lang === "ar" ? "جلسات مكتب فقط" : "Office sessions only"}</div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {lang === "ar" ? "هذا الحساب لا يفتح لوحة الإدارة، لكنه يفتح مسار جلسات العملاء والباقات." : "This account does not open admin tools; it only runs office sessions and packages."}
              </p>
            </div>

            <div className="rounded-xl border border-[#e3d8c9] bg-white p-6 shadow-sm">
              <FileText className="mb-4 text-gold" size={28} />
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">{lang === "ar" ? "التقارير الأخيرة" : "Recent reports"}</div>
              <div className="mt-2 font-serif text-3xl font-bold text-[#0C363A]">{officeReports.length}</div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {lang === "ar" ? "آخر التقارير المحفوظة من هذا التابلت." : "Latest reports saved from this tablet."}
              </p>
            </div>

            <div className="rounded-xl border border-[#e3d8c9] bg-white p-6 shadow-sm">
              <BriefcaseBusiness className="mb-4 text-gold" size={28} />
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">{lang === "ar" ? "بيانات الدخول" : "Login details"}</div>
              <div className="mt-3 space-y-2 text-xs text-[#0C363A]">
                <div className="flex justify-between gap-3 border-b border-black/5 pb-2"><span className="text-muted-foreground">{lang === "ar" ? "الإيميل" : "Email"}</span><strong dir="ltr">{userEmail}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{lang === "ar" ? "الهاتف" : "Phone"}</span><strong dir="ltr">{userPhone}</strong></div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-[#e3d8c9] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <SectionEyebrow label={lang === "ar" ? "آخر جلسات المكتب" : "Recent office sessions"} />
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#0C363A]">{lang === "ar" ? "تقارير العملاء" : "Client reports"}</h2>
              </div>
              <Link to="/office-session" className="btn-gold flex items-center gap-2">
                <Plus size={16} />
                <span>{lang === "ar" ? "جديد" : "New"}</span>
              </Link>
            </div>

            {officeReports.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#d9c9b7] p-8 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لسه مفيش تقارير محفوظة من حساب المكتب." : "No office reports have been saved yet."}
              </div>
            ) : (
              <>
                {/* Search & Actions Row */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <input
                      type="text"
                      placeholder={lang === "ar" ? "ابحث باسم العميل أو الهاتف..." : "Search by client name or phone..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border/80 text-xs focus:outline-none focus:border-gold bg-[#FBF7F0] pr-10"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    />
                    <span className={cn("absolute top-3.5 text-muted-foreground", lang === "ar" ? "left-3.5" : "right-3.5")}>
                      <Search size={14} />
                    </span>
                  </div>

                  <button 
                    onClick={handleDeleteAllReports}
                    className="h-11 px-5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold flex items-center gap-2 border border-red-200"
                  >
                    <Trash2 size={14} />
                    <span>{lang === "ar" ? "حذف الكل" : "Delete All"}</span>
                  </button>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#d9c9b7] p-8 text-center text-sm text-muted-foreground">
                    {lang === "ar" ? "لا توجد نتائج تطابق بحثك." : "No matching reports found."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {paginatedReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between gap-3 py-4 text-sm transition hover:bg-[#FBF7F0]/30 px-2 rounded-lg group">
                        <Link to={`/office-session/report/${report.id}`} className="flex-1 flex flex-wrap items-center justify-between gap-3 hover:text-gold">
                          <div>
                            <div className="font-bold text-[#0C363A]">{report.client_name || (lang === "ar" ? "عميل مكتب" : "Office client")}</div>
                            <div className="mt-1 text-xs text-muted-foreground font-mono" dir="ltr">{report.client_phone || "-"}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</div>
                        </Link>

                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteReport(report.id, report.client_name || (lang === "ar" ? "عميل مكتب" : "Office client"));
                          }}
                          className="p-2 rounded-lg text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 ms-2"
                          title={lang === "ar" ? "حذف التقرير" : "Delete report"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2 select-none border-t border-border/40 pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white text-teal-deep hover:bg-[#FBF7F0] disabled:opacity-40 transition"
                    >
                      {lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    
                    <span className="text-xs font-mono font-bold text-teal-deep">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white text-teal-deep hover:bg-[#FBF7F0] disabled:opacity-40 transition"
                    >
                      {lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

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
