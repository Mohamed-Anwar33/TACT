import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { CatalogPackage, getPackages, getUnlockedPackageIds } from "@/lib/catalog";
import { isInternalPhoneEmail, phoneToDisplay } from "@/lib/phoneAuth";
import { 
  BriefcaseBusiness, FileText, LogOut, Plus, ShieldCheck, Trash2, Search, 
  ChevronLeft, ChevronRight, Wrench, Paintbrush, Sparkles, Sofa, Download, 
  ChevronDown, ChevronUp, Image as ImageIcon, LayoutGrid, CreditCard, 
  User, Building, Clock, MapPin, Phone, Mail, ExternalLink, Check, X, 
  AlertCircle, Calendar, Activity, Clipboard
} from "lucide-react";
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

  // Project Stage Tracking States
  const [projectStages, setProjectStages] = useState<any[]>([]);
  const [stageFiles, setStageFiles] = useState<any[]>([]);
  const [stageNotes, setStageNotes] = useState<any[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loadingStages, setLoadingStages] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [userQuestionnaires, setUserQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaireForView, setSelectedQuestionnaireForView] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "stages" | "files" | "billing">("overview");

  async function fetchAndInitializeStages(clientId: string) {
    setLoadingStages(true);
    try {
      let { data: stages, error } = await (supabase as any)
        .from("project_stages")
        .select("*")
        .eq("user_id", clientId)
        .order("stage_number", { ascending: true });

      if (error) throw error;

      if (!stages || stages.length === 0) {
        // Create 4 default stages
        const defaultStages = [
          { user_id: clientId, stage_number: 1, title_ar: "مرحلة أولى: التأسيسات", title_en: "Stage 1: Foundations", status: "pending" },
          { user_id: clientId, stage_number: 2, title_ar: "مرحلة ثانية: التشطيبات الأساسية", title_en: "Stage 2: Basic Finishes", status: "pending" },
          { user_id: clientId, stage_number: 3, title_ar: "مرحلة ثالثة: التشطيبات النهائية", title_en: "Stage 3: Final Finishes", status: "pending" },
          { user_id: clientId, stage_number: 4, title_ar: "مرحلة رابعة: الديكور والفرش", title_en: "Stage 4: Decor & Furnishing", status: "pending" },
        ];
        const { data: inserted, error: insertError } = await (supabase as any)
          .from("project_stages")
          .insert(defaultStages)
          .select("*")
          .order("stage_number", { ascending: true });

        if (insertError) throw insertError;
        stages = inserted;
      }

      const stage1 = stages?.find(s => s.stage_number === 1);
      const virtualStage0 = {
        id: "virtual_stage_zero",
        user_id: clientId,
        stage_number: 0,
        title_ar: "التصميم والملفات الفنية والـ PDF",
        title_en: "Design & Technical Files (PDF)",
        status: "completed",
        notes_ar: "تحتوي هذه المرحلة على كافة ملفات الـ PDF الخاصة باختيارات العميل للمواد، بالإضافة إلى التصميم النهائي المعتمد للمشروع.",
        notes_en: "This section contains all PDF files of client selections and the final approved project design.",
        stage_1_id: stage1?.id || ""
      };

      const allStages = [virtualStage0, ...(stages || [])];
      setProjectStages(allStages);

      if (stages && stages.length > 0) {
        const stageIds = stages.map(s => s.id);
        
        // Fetch files
        const { data: filesData } = await (supabase as any)
          .from("project_stage_files")
          .select("*")
          .in("stage_id", stageIds)
          .order("created_at", { ascending: false });
        setStageFiles(filesData || []);

        // Fetch notes
        const { data: notesData } = await (supabase as any)
          .from("project_stage_notes")
          .select("*")
          .in("stage_id", stageIds)
          .order("created_at", { ascending: true });
        setStageNotes(notesData || []);
      }
    } catch (err: any) {
      console.error("Error loading stages:", err);
    } finally {
      setLoadingStages(false);
    }
  }

  // Set default expanded stage to the active stage or stage 1
  useEffect(() => {
    if (projectStages.length > 0 && !expandedStage) {
      const active = projectStages.find(s => s.status === "in_progress") || projectStages[0];
      setExpandedStage(active.id);
    }
  }, [projectStages, expandedStage]);

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
        : (supabase as any).from("configurator_selections").select("id,created_at,package_id,client_name,client_phone,client_email").order("created_at", { ascending: false }),
      (supabase as any).from("questionnaires").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    ]).then(([paymentRes, packageList, unlocked, reportsRes, questionnairesRes]) => {
      setPayments(paymentRes.data ?? []);
      setPackages(packageList);
      setUnlockedIds(unlocked);
      setOfficeReports(reportsRes.data ?? []);
      setUserQuestionnaires(questionnairesRes.data ?? []);

      if (!isOfficeConsultant) {
        fetchAndInitializeStages(user.id);
      }
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

  // Calculate stats
  const completedStagesCount = projectStages.filter(s => s.status === "completed" && s.stage_number !== 0).length;
  const overallProgress = Math.round((completedStagesCount / 4) * 100);
  const activeStage = projectStages.filter(s => s.stage_number !== 0).find(s => s.status === "in_progress") || 
                      projectStages.filter(s => s.stage_number !== 0).find(s => s.status === "pending") || 
                      projectStages.find(s => s.stage_number === 4);
  
  // Aggregate all files across all stages for the documents tab
  const allStageFiles = stageFiles;

  return (
    <section className="pt-36 pb-32 min-h-screen bg-[#f6f1e8]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="container-luxe max-w-5xl">
        {/* Page Title & Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#e3d8c9] pb-6 mb-8">
          <div>
            <SectionEyebrow label={lang === "ar" ? "الملف الهندسي للعميل" : "Client Engineering Workspace"} />
            <h1 className="font-serif-ar text-3xl md:text-4xl font-bold text-[#0C363A] mt-2">
              {lang === "ar" ? `ملف العميل: ${userName}` : `Client File: ${userName}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "تابع تفاصيل تشطيب مساحتك، جداول التنفيذ، التقارير الفنية، والمدفوعات" : "Track finishing details, stages timeline, reports, and payments"}
            </p>
          </div>

          <button 
            onClick={async () => { await signOut(); nav("/"); }} 
            className="h-10 px-5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 cursor-pointer self-start md:self-auto"
          >
            <LogOut size={14} />
            <span>{lang === "ar" ? "تسجيل الخروج" : "Sign out"}</span>
          </button>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="bg-white p-2 rounded-2xl border border-[#e3d8c9] shadow-sm flex flex-wrap md:flex-nowrap gap-1 mb-8 sticky top-20 z-30 no-print">
          {[
            { id: "overview", label: lang === "ar" ? "ملخص الحساب" : "Account Summary", icon: LayoutGrid },
            { id: "stages", label: lang === "ar" ? "جدول متابعة التنفيذ" : "Execution Timeline", icon: Activity },
            { id: "files", label: lang === "ar" ? "التقارير والملفات الفنية" : "Reports & Drawings", icon: FileText },
            { id: "billing", label: lang === "ar" ? "الفواتير والمدفوعات" : "Billing & Payments", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                  isSelected 
                    ? "bg-[#0C363A] text-white shadow-sm" 
                    : "text-muted-foreground hover:text-[#0C363A] hover:bg-[#FBF7F0]"
                )}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Progress Greeting Banner */}
              <div className="bg-gradient-to-r from-[#0C363A] to-[#124b51] rounded-3xl p-6 md:p-8 text-white border border-[#C18556]/30 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 arch-grid opacity-10" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <span className="text-[10px] uppercase tracking-widest text-[#C18556] font-extrabold block">متابعة التنفيذ الحي للمشروع</span>
                    <h2 className="font-serif-ar text-2xl font-bold">مرحباً بك في لوحة تحكم ملفك الهندسي</h2>
                    <p className="text-xs text-white/75 leading-relaxed">
                      هنا يمكنك متابعة تقدم أعمال تشطيب وحدتك خطوة بخطوة من الموقع مباشرة، وتحميل تقارير المواد المعتمدة وخامات التشطيب، بالإضافة إلى مراجعة مستندات الدفع والتحصيل.
                    </p>
                  </div>

                  {/* Progress Ring / Bar Display */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shrink-0 min-w-[200px] text-center">
                    <span className="text-[10px] text-white/60 block mb-1">نسبة تقدم أعمال التشطيب</span>
                    <strong className="text-3xl font-serif text-gold block">{overallProgress}%</strong>
                    <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-gold h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                    </div>
                    <span className="text-[9px] text-white/50 mt-1.5 block">تمت تسوية {completedStagesCount} من أصل 4 مراحل رئيسية</span>
                  </div>
                </div>
              </div>

              {/* Summary Information Cards Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Card 1: Client Profile summary */}
                <div className="bg-white rounded-3xl p-6 border border-[#e3d8c9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-wider text-[#C18556] font-bold block border-b pb-2 font-serif-ar">بيانات العميل الشخصية</span>
                    <div className="font-serif-ar text-xl text-[#0C363A] font-bold">{userName}</div>
                    
                    <div className="space-y-3.5 text-xs text-[#0C363A]/90 pt-1">
                      <div className="flex items-center justify-between border-b border-black/[0.03] pb-2">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Phone size={13} /> الهاتف:</span>
                        <span className="font-semibold font-mono">{userPhone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Mail size={13} /> البريد:</span>
                        <span className="font-semibold truncate max-w-[150px]" title={rawEmail}>{userEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[9px] text-muted-foreground pt-6 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-green-600" />
                    <span>ملف عميل معتمد ومسجل</span>
                  </div>
                </div>

                {/* Card 2: Package status */}
                <div className="bg-white rounded-3xl p-6 border border-[#e3d8c9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-wider text-[#C18556] font-bold block border-b pb-2 font-serif-ar">باقة التشطيب وتفعيل الحساب</span>
                    
                    {activePackages.length > 0 ? (
                      <div className="space-y-3">
                        <div className="font-serif-ar text-xl text-green-700 font-bold flex items-center gap-1.5">
                          <Check size={20} className="w-5 h-5 bg-green-100 text-green-700 rounded-full p-0.5 shrink-0" />
                          <span>باقة مفعلة ونشطة</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {activePackages.map((pkg) => lang === "ar" ? pkg.name_ar : pkg.name_en).join("، ")}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="font-serif-ar text-xl text-amber-600 font-bold flex items-center gap-1.5">
                          <Clock size={20} className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full p-0.5 shrink-0 animate-pulse" />
                          <span>بانتظار مراجعة الدفع</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          قم بتسجيل إثبات الدفع والتحويل المصرفي لتفعيل باقات التصاميم الهندسية المعتمدة لحسابك.
                        </p>
                      </div>
                    )}
                  </div>

                  <Link to="/packages" className="btn-gold !py-2 w-full text-center flex items-center justify-center gap-1 text-xs font-bold mt-6 shadow-xs">
                    <ExternalLink size={12} />
                    <span>{lang === "ar" ? "تصفح كتالوج الباقات" : "Browse Packages"}</span>
                  </Link>
                </div>

                {/* Card 3: Current active stage */}
                <div className="bg-white rounded-3xl p-6 border border-[#e3d8c9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-wider text-[#C18556] font-bold block border-b pb-2 font-serif-ar">حالة الأعمال الحالية بالموقع</span>
                    
                    {activeStage ? (
                      <div className="space-y-3">
                        <div className="font-serif-ar text-base font-bold text-[#0C363A]">
                          {lang === "ar" ? activeStage.title_ar : activeStage.title_en}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 bg-[#FBF7F0] px-3 py-1 rounded-full border border-[#e5e0d5] w-fit">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            activeStage.status === "completed" ? "bg-green-500" :
                            activeStage.status === "in_progress" ? "bg-gold animate-pulse" :
                            "bg-slate-300"
                          )} />
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {activeStage.status === "completed" ? "مكتملة" :
                             activeStage.status === "in_progress" ? "جاري العمل" :
                             "بانتظار البدء"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">لا توجد مراحل مسجلة بعد.</div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab("stages")}
                    className="btn-gold !py-2 w-full text-center flex items-center justify-center gap-1 text-xs font-bold mt-6 shadow-xs"
                  >
                    <span>{lang === "ar" ? "تفاصيل جدول المتابعة" : "View Details"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION TIMELINE */}
          {activeTab === "stages" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stages Timeline Header */}
              <div className="bg-white p-6 rounded-3xl border border-[#e3d8c9] shadow-xs">
                <h2 className="font-serif-ar text-xl font-bold text-[#0C363A]">
                  {lang === "ar" ? "جدول متابعة مراحل التنفيذ" : "Project Execution Timeline"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" 
                    ? "تابع تقدم أعمال التشطيب في موقعك خطوة بخطوة، واطلع على الصور والتقارير المرفوعة لكل مرحلة." 
                    : "Track the progress of finishing works at your site step by step, and view photos and reports for each stage."}
                </p>
              </div>

              {/* Loop of stages */}
              <div className="space-y-4">
                {projectStages.map((stage) => {
                    const isExpanded = expandedStage === stage.id;
                    const files = stage.stage_number === 0
                      ? stageFiles.filter((f) => f.stage_id === stage.stage_1_id && f.category === 'statement')
                      : stage.stage_number === 1
                        ? stageFiles.filter((f) => f.stage_id === stage.id && f.category !== 'statement')
                        : stageFiles.filter((f) => f.stage_id === stage.id);
                    const photos = files.filter((f) => f.file_type === "image");
                    const docs = files.filter((f) => f.file_type !== "image");
                    const notes = stage.stage_number === 0 ? [] : stageNotes.filter((n) => n.stage_id === stage.id);

                    return (
                      <div 
                        key={stage.id} 
                        className={cn(
                          "border bg-white rounded-3xl overflow-hidden shadow-xs transition-all duration-300",
                          isExpanded ? "border-[#C18556] shadow-md scale-[1.01]" : "border-[#e3d8c9] hover:border-[#C18556]/40 hover:shadow-sm"
                        )}
                      >
                        {/* Header bar */}
                        <button
                          onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                          className="w-full p-6 text-start flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FBF7F0]/40 transition duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                              stage.status === "completed" ? "bg-green-50 text-green-600 border border-green-200" :
                              stage.status === "in_progress" ? "bg-amber-50 text-[#C18556] border border-amber-200" :
                              "bg-slate-50 text-slate-400 border border-slate-200"
                            )}>
                              {stage.stage_number === 0 ? <FileText size={20} /> :
                               stage.stage_number === 1 ? <Wrench size={20} /> :
                               stage.stage_number === 2 ? <Paintbrush size={20} /> :
                               stage.stage_number === 3 ? <Sparkles size={20} /> :
                               <Sofa size={20} />}
                            </div>
                            <div>
                              <h3 className="font-serif-ar text-base font-bold text-[#0C363A]">
                                {lang === "ar" ? stage.title_ar : stage.title_en}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 bg-[#FBF7F0] px-2.5 py-0.5 rounded-full border border-[#e5e0d5] w-fit">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  stage.status === "completed" ? "bg-green-500" :
                                  stage.status === "in_progress" ? "bg-gold" :
                                  "bg-slate-300"
                                )} />
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  {stage.stage_number === 0 ? (lang === "ar" ? "مستندات معتمدة" : "Approved Documents") :
                                   stage.status === "completed" ? (lang === "ar" ? "تم اكتمال المرحلة بنجاح" : "Phase completed successfully") :
                                   stage.status === "in_progress" ? (lang === "ar" ? "جاري العمل بالموقع حالياً" : "Currently in progress") :
                                   (lang === "ar" ? "بانتظار بدء التأسيسات" : "Phase pending start")}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={18} className="text-[#0C363A]" /> : <ChevronDown size={18} className="text-[#0C363A]" />}
                          </div>
                        </button>

                        {/* Details content */}
                        {isExpanded && (
                          <div className="p-6 border-t border-[#e5e0d5] bg-[#FBF7F0]/10 space-y-6 animate-fade-in">
                            {/* Status Description Notes if any */}
                            {(stage.notes_ar || stage.notes_en) && (
                              <div className="p-4 bg-[#FBF7F0] border-r-4 border-[#C18556] rounded-l-2xl text-xs leading-relaxed text-[#0C363A] shadow-xs">
                                <strong className="block mb-1 text-xs text-[#0C363A] font-serif-ar">
                                  {stage.stage_number === 0
                                    ? (lang === "ar" ? "حول الملفات الفنية للمشروع:" : "About Project Technical Files:")
                                    : (lang === "ar" ? "تفاصيل وتوجيهات الاستشاري للمرحلة:" : "Consultant stage guidelines:")}
                                </strong>
                                <p className="whitespace-pre-line text-muted-foreground leading-relaxed font-bold">{lang === "ar" ? stage.notes_ar : stage.notes_en || stage.notes_ar}</p>
                              </div>
                            )}

                            <div className="grid md:grid-cols-[1fr_280px] gap-6">
                              {/* Left: Photos and Notes */}
                              <div className="space-y-6">
                                {/* Execution site photos */}
                                <div>
                                  <h4 className="text-xs uppercase tracking-wider text-[#0C363A] font-bold flex items-center gap-2 mb-3">
                                    <ImageIcon size={14} className="text-[#C18556]" />
                                    <span>
                                      {stage.stage_number === 0 
                                        ? (lang === "ar" ? "صور وتصاميم هندسية" : "Design Renders & Visuals")
                                        : (lang === "ar" ? "ألبوم صور التنفيذ بالموقع" : "Site Execution Gallery")}
                                    </span>
                                  </h4>
                                  {photos.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground/60 border border-dashed border-[#e5e0d5] rounded-2xl bg-white">
                                      {stage.stage_number === 0
                                        ? (lang === "ar" ? "لا توجد صور تصميم مرفوعة حالياً." : "No design renders uploaded yet.")
                                        : (lang === "ar" ? "لا توجد صور مرفوعة للموقع بهذه المرحلة حالياً." : "No site photos uploaded for this stage yet.")}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {photos.map((p) => (
                                        <div
                                          key={p.id}
                                          onClick={() => setActivePreviewUrl(p.file_url)}
                                          className="aspect-[4/3] rounded-xl overflow-hidden border border-[#e5e0d5] cursor-zoom-in relative group bg-white flex items-center justify-center shadow-xs"
                                        >
                                          <img src={p.file_url} alt={p.file_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Search size={16} className="text-white" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Stage Observation Notes Table */}
                                {stage.stage_number !== 0 && (
                                  <div>
                                    <h4 className="text-xs uppercase tracking-wider text-[#0C363A] font-bold flex items-center gap-2 mb-3">
                                      <FileText size={14} className="text-[#C18556]" />
                                      <span>{lang === "ar" ? "جدول بنود المتابعة والجدول الزمني" : "Observations & Tasks Log"}</span>
                                    </h4>
                                    {notes.length === 0 ? (
                                      <div className="text-center py-6 text-xs text-muted-foreground/60 border border-dashed border-[#e5e0d5] rounded-2xl bg-white">
                                        {lang === "ar" ? "لا توجد بنود متابعة مسجلة حالياً." : "No observations or tasks registered yet."}
                                      </div>
                                    ) : (
                                      <div className="overflow-hidden border border-[#e5e0d5] rounded-2xl bg-white shadow-xs">
                                        <table className="w-full text-right text-xs">
                                          <thead className="bg-[#0C363A]/5 text-[#0C363A] border-b border-[#e5e0d5]">
                                            <tr>
                                              <th className="p-3 font-bold">{lang === "ar" ? "البند / الملاحظة" : "Item / Note"}</th>
                                              <th className="p-3 font-bold w-28">{lang === "ar" ? "حالة البند" : "Status"}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#e5e0d5]">
                                            {notes.map((n) => (
                                              <tr key={n.id} className="hover:bg-[#FBF7F0]/30 transition-colors">
                                                <td className="p-3 text-[#0C363A] font-medium leading-relaxed">
                                                  {lang === "ar" ? n.note_ar : n.note_en || n.note_ar}
                                                </td>
                                                <td className="p-3 whitespace-nowrap">
                                                  <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px]",
                                                    n.status_ar === "تم التنفيذ" || n.status_en === "Done" 
                                                      ? "bg-green-50 text-green-700 border border-green-200" 
                                                      : "bg-amber-50 text-[#C18556] border border-amber-200"
                                                  )}>
                                                    <span className={cn(
                                                      "w-1.5 h-1.5 rounded-full",
                                                      n.status_ar === "تم التنفيذ" || n.status_en === "Done" ? "bg-green-500" : "bg-gold"
                                                    )} />
                                                    {lang === "ar" ? n.status_ar || "جاري العمل" : n.status_en || "In Progress"}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right: Invoices and Documents */}
                              <div className="border-t md:border-t-0 md:border-r border-[#e5e0d5] pt-6 md:pt-0 md:pr-6">
                                <h4 className="text-xs uppercase tracking-wider text-[#0C363A] font-bold flex items-center gap-2 mb-3">
                                  <Download size={14} className="text-[#C18556]" />
                                  <span>
                                    {stage.stage_number === 0 
                                      ? (lang === "ar" ? "ملفات التصميم والمخططات الفنية (PDF)" : "Design Files & Technical Drawings")
                                      : (lang === "ar" ? "الفواتير والمستندات المشتركة" : "Shared Invoices & PDF Files")}
                                  </span>
                                </h4>
                                {docs.length === 0 ? (
                                  <div className="text-center py-8 text-xs text-muted-foreground/60 border border-dashed border-[#e5e0d5] rounded-2xl bg-white">
                                    {stage.stage_number === 0
                                      ? (lang === "ar" ? "لا توجد مستندات فنية مرفوعة حالياً." : "No design documents uploaded yet.")
                                      : (lang === "ar" ? "لا توجد مستندات أو فواتير مرفوعة حالياً." : "No documents uploaded yet.")}
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    {docs.map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-[#e5e0d5] hover:border-[#C18556]/40 transition rounded-2xl shadow-xs gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-[9px] shrink-0">
                                            PDF
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-xs font-bold text-[#0C363A] truncate max-w-[140px]" title={doc.file_name}>
                                              {doc.file_name}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground uppercase">
                                              {doc.file_type === "pdf" ? (lang === "ar" ? "مستند PDF معتمد" : "PDF Document") : (lang === "ar" ? "مستند" : "File")}
                                            </div>
                                          </div>
                                        </div>
                                        <a
                                          href={doc.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-8 h-8 rounded-full bg-amber-50 hover:bg-[#0C363A] hover:text-white text-[#C18556] flex items-center justify-center transition shrink-0 shadow-xs cursor-pointer"
                                          title={lang === "ar" ? "تنزيل" : "Download"}
                                        >
                                          <Download size={13} />
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* TAB 3: TECHNICAL REPORTS & DRAWINGS */}
          {activeTab === "files" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl border border-[#e3d8c9] shadow-xs">
                <h2 className="font-serif-ar text-xl font-bold text-[#0C363A] flex items-center gap-2">
                  <FileText size={20} className="text-[#C18556]" />
                  <span>أرشيف الملفات والتقارير الفنية</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  تحميل ومراجعة كافّة تقارير اختيار الخامات، الاستبيان المعماري المبدئي، والمستندات المشتركة للموقع.
                </p>
              </div>

              {/* Selections & Questionnaire reports */}
              {(officeReports.length > 0 || userQuestionnaires.length > 0) ? (
                <div className="bg-white divide-y divide-[#e5e0d5] overflow-hidden rounded-3xl border border-[#e3d8c9] shadow-sm">
                  {/* Selections Reports */}
                  {officeReports.map((report) => {
                    const pkg = packages.find((p) => p.id === report.package_id);
                    return (
                      <div key={report.id} className="p-5 flex flex-wrap justify-between items-center gap-4 text-sm hover:bg-[#FBF7F0]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#C18556] shrink-0 shadow-xs">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-[#0C363A] text-sm font-serif-ar">
                              {lang === "ar" ? "تقرير اختيار بنود وتشطيب باقة" : "Finishing Selections Report"} - {lang === "ar" ? pkg?.name_ar : pkg?.name_en}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {new Date(report.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")} · CS-{String(report.id).slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <Link to={`/office-session/report/${report.id}`} className="btn-gold !py-2 !px-4.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-all font-bold">
                          <Download size={13} />
                          <span>{lang === "ar" ? "عرض وتحميل PDF" : "View & Save PDF"}</span>
                        </Link>
                      </div>
                    );
                  })}

                  {/* Questionnaire Briefs */}
                  {userQuestionnaires.map((q) => {
                    return (
                      <div key={q.id} className="p-5 flex flex-wrap justify-between items-center gap-4 text-sm hover:bg-[#FBF7F0]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 shadow-xs">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-[#0C363A] text-sm font-serif-ar">
                              {lang === "ar" ? "استبيان متطلبات مساحة العميل" : "Initial Design Brief Questionnaire"}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {new Date(q.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")} · QN-{String(q.id).slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedQuestionnaireForView(q)}
                          className="btn-gold !py-2 !px-4.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-all font-bold"
                        >
                          <Download size={13} />
                          <span>{lang === "ar" ? "عرض وتنزيل الاستبيان" : "View & Print Questionnaire"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-[#e3d8c9] p-8 text-center text-xs text-muted-foreground">
                  لا توجد تقارير أو استبيانات مسجلة حالياً لحسابك.
                </div>
              )}

              {/* Stage Shared Invoices & PDFs List */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#0C363A] font-bold border-b border-[#e3d8c9] pb-2 font-serif-ar">فواتير ومخططات الموقع</h3>
                {allStageFiles.filter(f => f.file_type !== 'image' && f.category !== 'site_photo' && f.category !== 'statement').length === 0 ? (
                  <div className="rounded-3xl bg-white border border-[#e3d8c9] p-8 text-center text-xs text-muted-foreground">
                    لا توجد فواتير أو مستندات مرفوعة من قبل استشاري الموقع لهذه المرحلة.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    {allStageFiles
                      .filter(f => f.file_type !== 'image' && f.category !== 'site_photo' && f.category !== 'statement')
                      .map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-[#e5e0d5] hover:border-[#C18556]/40 transition rounded-2xl shadow-xs gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#0C363A] truncate" title={file.file_name}>
                                {file.file_name}
                              </div>
                              <div className="text-[9px] text-muted-foreground uppercase mt-0.5">
                                {file.file_type === "pdf" ? (lang === "ar" ? "مستند PDF معتمد" : "PDF Document") : (lang === "ar" ? "مستند" : "File")}
                              </div>
                            </div>
                          </div>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full bg-[#FBF7F0] border border-[#e1dbce] hover:bg-[#0C363A] hover:text-white text-[#C18556] flex items-center justify-center transition shrink-0 shadow-xs cursor-pointer"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & PAYMENTS */}
          {activeTab === "billing" && (
            <div className="grid md:grid-cols-[1fr_360px] gap-6 animate-fade-in">
              {/* Payment Proof Submission Form */}
              <div className="space-y-6">

                <div className="bg-white p-6 rounded-3xl border border-[#e3d8c9] shadow-sm space-y-4">
                  <h3 className="font-serif-ar text-base font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                    <Plus size={15} className="text-[#C18556]" />
                    <span>تسجيل إثبات دفع جديد</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    بعد قيامك بتحويل المبلغ، يرجى كتابة البيانات أدناه لمساعدة فريق المحاسبة على تفعيل باقاتك.
                  </p>

                  <Link to="/payment" className="btn-gold !py-2.5 w-full text-center flex items-center justify-center gap-2 text-xs font-bold shadow-sm">
                    <CreditCard size={13} />
                    <span>الذهاب لتعليمات الدفع والتحويل</span>
                  </Link>
                </div>
              </div>

              {/* Payments History List */}
              <div className="bg-white p-6 rounded-3xl border border-[#e3d8c9] shadow-sm space-y-4 h-fit">
                <h3 className="font-serif-ar text-base font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                  <Clock size={15} className="text-[#C18556]" />
                  <span>تاريخ المدفوعات والتحويلات</span>
                </h3>

                {payments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    لا توجد مدفوعات مسجلة بعد.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => {
                      const pkg = packages.find((item) => item.id === payment.package_id);
                      return (
                        <div key={payment.id} className="p-4 bg-[#FBF7F0]/40 border border-[#e5e0d5] rounded-2xl text-xs space-y-2 shadow-xs hover:border-[#C18556]/40 transition-colors">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-[#0C363A]">{payment.method}</span>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold",
                              payment.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
                              payment.status === "pending" ? "bg-amber-50 text-[#C18556] border border-amber-200" :
                              "bg-red-50 text-red-700 border border-red-200"
                            )}>
                              {lang === "ar" 
                                ? (payment.status === "approved" ? "مقبول" : payment.status === "pending" ? "قيد المراجعة" : "مرفوض")
                                : (payment.status === "approved" ? "Approved" : payment.status === "pending" ? "Pending" : "Rejected")
                              }
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            {pkg && <div>الباقة: <strong>{lang === "ar" ? pkg.name_ar : pkg.name_en}</strong></div>}
                            {payment.reference && <div>رقم العملية: <strong className="font-mono">{payment.reference}</strong></div>}
                            {payment.created_at && (
                              <div className="flex items-center gap-1">
                                <Calendar size={11} className="text-[#C18556]/60 shrink-0" />
                                <span>{new Date(payment.created_at).toLocaleString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lightbox / Zoom Dialog Modal for Site Photos */}
        {activePreviewUrl && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out no-print"
            onClick={() => setActivePreviewUrl(null)}
          >
            <img src={activePreviewUrl} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl transition-transform duration-300" />
          </div>
        )}

        {/* Questionnaire Modal Viewer */}
        {selectedQuestionnaireForView && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
              onClick={() => setSelectedQuestionnaireForView(null)} 
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl h-[85vh] flex flex-col bg-[#FBF7F0] shadow-2xl rounded-3xl border border-[#e0d6c7] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Custom Print Stylesheet */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #print-questionnaire-area, #print-questionnaire-area * {
                    visibility: visible;
                  }
                  #print-questionnaire-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white !important;
                    padding: 24px !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Header */}
              <div className="bg-[#0C363A] px-6 py-5 text-white flex items-center justify-between border-b border-[#C18556]/40 shrink-0 no-print">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#C18556] font-extrabold block mb-0.5">استبيان متطلبات العميل</span>
                  <h2 className="text-base font-bold font-serif-ar">{selectedQuestionnaireForView.name || userName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-[#0C363A] hover:bg-white transition"
                  >
                    <Download size={14} />
                    <span>{lang === "ar" ? "طباعة / حفظ PDF" : "Print / Save PDF"}</span>
                  </button>
                  <button 
                    onClick={() => setSelectedQuestionnaireForView(null)}
                    className="rounded-full bg-white/10 p-2 text-white hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="print-questionnaire-area" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {/* Print Only Header */}
                <div className="hidden print:flex items-start justify-between gap-6 border-b-2 border-[#0C363A] pb-5 mb-6">
                  <div>
                    <div className="text-sm font-extrabold text-[#0C363A]">تاكت للاستشارات الهندسية والمقاولات</div>
                    <div className="mt-1 text-xs text-muted-foreground">استبيان متطلبات العميل والتفاصيل المعمارية</div>
                  </div>
                  <img src="/logo.png" alt="TACT" className="h-12 w-12 object-contain" />
                </div>

                {/* Section 1: Customer Contact info */}
                <div className="bg-white p-5 rounded-2xl border border-[#e5e0d5] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                    <User size={14} className="text-[#C18556]" />
                    <span>1. بيانات العميل</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-muted-foreground font-semibold">اسم العميل</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.name || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">رقم الهاتف</span>
                      <strong className="text-[#0C363A] block mt-1" dir="ltr">{selectedQuestionnaireForView.phone || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">البريد الإلكتروني</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.email || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">العنوان / الموقع</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.address || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 2: Project Info */}
                <div className="bg-white p-5 rounded-2xl border border-[#e5e0d5] shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                    <Building size={14} className="text-[#C18556]" />
                    <span>2. تفاصيل المشروع</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-muted-foreground font-semibold">نوع العقار</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.project_type || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">مرحلة البناء</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.stage || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">عدد أفراد الأسرة</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.family || "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold">الخدمات الهندسية المطلوبة</span>
                      <strong className="text-[#0C363A] block mt-1">{selectedQuestionnaireForView.service || "—"}</strong>
                    </div>
                  </div>

                  {/* Render Plan Images */}
                  {Array.isArray(selectedQuestionnaireForView.plan_images) && selectedQuestionnaireForView.plan_images.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#e5e0d5] no-print">
                      <span className="block text-xs font-semibold text-muted-foreground mb-2">الملفات والبلانات المرفقة:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedQuestionnaireForView.plan_images.map((asset, idx) => (
                          <a
                            key={asset.url || idx}
                            href={asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-[#FBF7F0] border border-[#e5e0d5] hover:border-[#C18556]/40 transition rounded-xl text-xs gap-3 shadow-xs"
                          >
                            <span className="font-semibold text-[#0C363A] truncate flex-1" title={asset.name}>{asset.name || `Plan ${idx + 1}`}</span>
                            <span className="text-[10px] font-bold text-gold shrink-0">عرض الملف</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Priorities & expectations */}
                <div className="bg-white p-5 rounded-2xl border border-[#e5e0d5] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                    <Activity size={14} className="text-[#C18556]" />
                    <span>3. التوقعات والعوامل الهامة</span>
                  </h3>
                  <div className="text-xs space-y-2.5 leading-relaxed text-[#0C363A]">
                    <p>
                      <strong>الأولويات والعوامل الهامة:</strong> {selectedQuestionnaireForView.expectations || "—"}
                    </p>
                    <p>
                      <strong>مصدر المعرفة بالشركة:</strong> {selectedQuestionnaireForView.source || "—"}
                    </p>
                    <p>
                      <strong>التحديات والتجربة السابقة:</strong> {selectedQuestionnaireForView.history || "—"}
                    </p>
                  </div>
                </div>

                {/* Section 4: Goals & ambitions */}
                <div className="bg-white p-5 rounded-2xl border border-[#e5e0d5] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-[#0C363A] border-b pb-2 flex items-center gap-2">
                    <Clipboard size={14} className="text-[#C18556]" />
                    <span>4. أهداف المشروع والحلول المطلوبة</span>
                  </h3>
                  <p className="text-xs text-[#0C363A] leading-relaxed whitespace-pre-line">
                    {selectedQuestionnaireForView.goals || "—"}
                  </p>
                </div>

                {/* Section 5: Additional notes */}
                {selectedQuestionnaireForView.notes && (
                  <div className="bg-[#fff8ed] p-5 rounded-2xl border border-amber-100 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-amber-900 border-b border-amber-200/50 pb-2 flex items-center gap-2">
                      <FileText size={14} className="text-gold" />
                      <span>5. ملاحظات إضافية</span>
                    </h3>
                    <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line">
                      {selectedQuestionnaireForView.notes}
                    </p>
                  </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:grid grid-cols-2 gap-12 text-center text-xs pt-12">
                  <div className="border-t border-[#888] pt-3">اعتماد وتوقيع العميل</div>
                  <div className="border-t border-[#888] pt-3">المكتب الفني لشركة TACT</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
