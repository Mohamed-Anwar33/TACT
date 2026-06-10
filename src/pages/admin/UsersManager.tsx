import { useEffect, useMemo, useState } from "react";
import { 
  Search, Users, CheckCircle2, Clock, PackageCheck, Activity, X, 
  Upload, Trash2, Wrench, Paintbrush, Sparkles, Sofa, Download, Save, 
  Check, Loader2, Plus, Image as ImageIcon, Clipboard, FileText, Edit2
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { phoneToDisplay } from "@/lib/phoneAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;

export default function UsersManager() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [unlocks, setUnlocks] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(true);

  // Stage Tracking Admin States
  const [selectedUserForTracking, setSelectedUserForTracking] = useState<any | null>(null);
  const [adminStages, setAdminStages] = useState<any[]>([]);
  const [adminStageFiles, setAdminStageFiles] = useState<any[]>([]);
  const [adminStageNotes, setAdminStageNotes] = useState<any[]>([]);
  const [adminSelectedStage, setAdminSelectedStage] = useState<any | null>(null);
  const [loadingAdminStages, setLoadingAdminStages] = useState(false);

  // General notes state
  const [generalStageNotesAr, setGeneralStageNotesAr] = useState("");
  const [generalStageNotesEn, setGeneralStageNotesEn] = useState("");
  const [selectedStageStatus, setSelectedStageStatus] = useState("pending");
  const [stageTitleAr, setStageTitleAr] = useState("");
  const [stageTitleEn, setStageTitleEn] = useState("");

  // New note fields
  const [newNoteAr, setNewNoteAr] = useState("");
  const [newNoteEn, setNewNoteEn] = useState("");
  const [newNoteStatusAr, setNewNoteStatusAr] = useState("جاري العمل");
  const [newNoteStatusEn, setNewNoteStatusEn] = useState("In Progress");

  // Editing note states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteAr, setEditingNoteAr] = useState("");
  const [editingNoteEn, setEditingNoteEn] = useState("");
  const [editingNoteStatusAr, setEditingNoteStatusAr] = useState("");
  const [editingNoteStatusEn, setEditingNoteStatusEn] = useState("");

  // File uploading state
  const [uploadingFile, setUploadingFile] = useState(false);

  // Sync general notes when stage changes
  useEffect(() => {
    if (adminSelectedStage) {
      setGeneralStageNotesAr(adminSelectedStage.notes_ar || "");
      setGeneralStageNotesEn(adminSelectedStage.notes_en || "");
      setSelectedStageStatus(adminSelectedStage.status || "pending");
      setStageTitleAr(adminSelectedStage.title_ar || "");
      setStageTitleEn(adminSelectedStage.title_en || "");
    } else {
      setGeneralStageNotesAr("");
      setGeneralStageNotesEn("");
      setSelectedStageStatus("pending");
      setStageTitleAr("");
      setStageTitleEn("");
    }
  }, [adminSelectedStage]);

  // Load stages when client is selected
  useEffect(() => {
    if (selectedUserForTracking) {
      loadAdminStagesForUser(selectedUserForTracking.id);
    } else {
      setAdminStages([]);
      setAdminStageFiles([]);
      setAdminStageNotes([]);
      setAdminSelectedStage(null);
    }
  }, [selectedUserForTracking]);

  async function loadAdminStagesForUser(userId: string) {
    setLoadingAdminStages(true);
    try {
      let { data: stages, error } = await db
        .from("project_stages")
        .select("*")
        .eq("user_id", userId)
        .order("stage_number", { ascending: true });

      if (error) throw error;

      if (!stages || stages.length === 0) {
        // Initialize default stages
        const defaultStages = [
          { user_id: userId, stage_number: 1, title_ar: "مرحلة أولى: التأسيسات", title_en: "Stage 1: Foundations", status: "pending" },
          { user_id: userId, stage_number: 2, title_ar: "مرحلة ثانية: التشطيبات الأساسية", title_en: "Stage 2: Basic Finishes", status: "pending" },
          { user_id: userId, stage_number: 3, title_ar: "مرحلة ثالثة: التشطيبات النهائية", title_en: "Stage 3: Final Finishes", status: "pending" },
          { user_id: userId, stage_number: 4, title_ar: "مرحلة رابعة: الديكور والفرش", title_en: "Stage 4: Decor & Furnishing", status: "pending" },
        ];
        const { data: inserted, error: insertError } = await db
          .from("project_stages")
          .insert(defaultStages)
          .select("*")
          .order("stage_number", { ascending: true });

        if (insertError) throw insertError;
        stages = inserted;
      }

      // Create virtual Stage 0 linked to Stage 1's ID for file storage
      const stage1 = stages.find(s => s.stage_number === 1);
      const virtualStage0 = {
        id: "virtual_stage_zero",
        user_id: userId,
        stage_number: 0,
        title_ar: "التصميم والملفات الفنية والـ PDF",
        title_en: "Design & Technical Files (PDF)",
        status: "completed",
        notes_ar: "تحتوي هذه المرحلة على كافة ملفات الـ PDF الخاصة باختيارات العميل للمواد، بالإضافة إلى التصميم النهائي المعتمد للمشروع.",
        notes_en: "This section contains all PDF files of client selections and the final approved project design.",
        stage_1_id: stage1?.id || ""
      };

      const allStages = [virtualStage0, ...(stages || [])];
      setAdminStages(allStages);
      setAdminSelectedStage(virtualStage0);

      if (stages && stages.length > 0) {
        const stageIds = stages.map(s => s.id);
        
        // Fetch files
        const { data: filesData } = await db
          .from("project_stage_files")
          .select("*")
          .in("stage_id", stageIds)
          .order("created_at", { ascending: false });
        setAdminStageFiles(filesData || []);

        // Fetch notes
        const { data: notesData } = await db
          .from("project_stage_notes")
          .select("*")
          .in("stage_id", stageIds)
          .order("created_at", { ascending: true });
        setAdminStageNotes(notesData || []);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load project stages");
    } finally {
      setLoadingAdminStages(false);
    }
  }

  async function saveStageChanges(stageId: string) {
    if (adminSelectedStage?.stage_number === 0) {
      toast.error("هذه مرحلة ملفات فنية افتراضية، لا يمكن تعديل بياناتها الهيكلية");
      return;
    }
    const { error } = await db
      .from("project_stages")
      .update({
        title_ar: stageTitleAr || adminSelectedStage.title_ar,
        title_en: stageTitleEn || adminSelectedStage.title_en,
        notes_ar: generalStageNotesAr || null,
        notes_en: generalStageNotesEn || null,
        status: selectedStageStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", stageId);
      
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم حفظ تغييرات المرحلة بنجاح");
      setAdminStages(prev => prev.map(s => s.id === stageId ? { 
        ...s, 
        title_ar: stageTitleAr,
        title_en: stageTitleEn,
        notes_ar: generalStageNotesAr, 
        notes_en: generalStageNotesEn,
        status: selectedStageStatus 
      } : s));
      if (adminSelectedStage?.id === stageId) {
        setAdminSelectedStage(prev => ({ 
          ...prev, 
          title_ar: stageTitleAr,
          title_en: stageTitleEn,
          notes_ar: generalStageNotesAr, 
          notes_en: generalStageNotesEn,
          status: selectedStageStatus 
        }));
      }
    }
  }

  async function addStageNote(stageId: string) {
    if (!newNoteAr.trim()) {
      toast.error("أدخل نص الملاحظة بالعربية أولاً");
      return;
    }
    const { data, error } = await db
      .from("project_stage_notes")
      .insert({
        stage_id: stageId,
        note_ar: newNoteAr,
        note_en: newNoteEn || null,
        status_ar: newNoteStatusAr || null,
        status_en: newNoteStatusEn || null,
      })
      .select()
      .single();
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تمت إضافة الملاحظة");
      setAdminStageNotes(prev => [...prev, data]);
      setNewNoteAr("");
      setNewNoteEn("");
    }
  }

  async function updateStageNote(noteId: string) {
    if (!editingNoteAr.trim()) {
      toast.error("أدخل نص الملاحظة بالعربية أولاً");
      return;
    }
    const { error } = await db
      .from("project_stage_notes")
      .update({
        note_ar: editingNoteAr,
        note_en: editingNoteEn || null,
        status_ar: editingNoteStatusAr,
        status_en: editingNoteStatusEn,
      })
      .eq("id", noteId);
      
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم تحديث البند بنجاح");
      setAdminStageNotes(prev => prev.map(n => n.id === noteId ? {
        ...n,
        note_ar: editingNoteAr,
        note_en: editingNoteEn || null,
        status_ar: editingNoteStatusAr,
        status_en: editingNoteStatusEn
      } : n));
      setEditingNoteId(null);
    }
  }

  async function deleteStageNote(noteId: string) {
    const { error } = await db
      .from("project_stage_notes")
      .delete()
      .eq("id", noteId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم حذف الملاحظة");
      setAdminStageNotes(prev => prev.filter(n => n.id !== noteId));
    }
  }

  async function uploadStageFile(event: React.ChangeEvent<HTMLInputElement>, stageId: string, category: 'site_photo' | 'invoice' | 'statement') {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const safeName = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
          const storagePath = `projects/stages/${stageId}/${Date.now()}-${safeName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("tact-media")
            .upload(storagePath, file, { contentType: file.type, upsert: false });
            
          if (uploadError) throw uploadError;
          
          const { data: publicData } = supabase.storage.from("tact-media").getPublicUrl(storagePath);
          const fileUrl = publicData.publicUrl;
          
          const fileType = file.type.startsWith("image/") ? "image" : file.type.includes("pdf") ? "pdf" : "other";
          
          let finalCategory = category;
          if (fileType === 'pdf' && category === 'site_photo') {
            finalCategory = 'invoice';
          }
          
          const { data, error: dbError } = await db
            .from("project_stage_files")
            .insert({
              stage_id: stageId,
              file_url: fileUrl,
              file_name: file.name,
              file_type: fileType,
              category: finalCategory,
            })
            .select()
            .single();
            
          if (dbError) throw dbError;
          successCount++;
          return data;
        } catch (err) {
          console.error("Failed to upload file:", file.name, err);
          failCount++;
          return null;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      const added = results.filter((f): f is any => f !== null);
      if (added.length > 0) {
        setAdminStageFiles(prev => [...added, ...prev]);
      }
      
      if (successCount > 0) {
        toast.success(`تم رفع ${successCount} ملف بنجاح`);
      }
      if (failCount > 0) {
        toast.error(`فشل رفع ${failCount} ملف`);
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الرفع");
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  }

  async function deleteStageFile(fileId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;
    const { error } = await db
      .from("project_stage_files")
      .delete()
      .eq("id", fileId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم حذف الملف");
      setAdminStageFiles(prev => prev.filter(f => f.id !== fileId));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setBusy(true);
    const [profileRes, paymentRes, unlockRes, questionnaireRes, selectionRes] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("payment_submissions").select("*").order("created_at", { ascending: false }),
      db.from("package_unlocks").select("*"),
      db.from("questionnaires").select("id,user_id,email,phone"),
      db.from("configurator_selections").select("id,user_id"),
    ]);
    setProfiles(profileRes.data || []);
    setPayments(paymentRes.data || []);
    setUnlocks(unlockRes.data || []);
    setQuestionnaires(questionnaireRes.data || []);
    setSelections(selectionRes.data || []);
    setBusy(false);
  }

  const rows = useMemo(() => {
    return profiles.map((profile) => {
      const userPayments = payments.filter((payment) => payment.user_id === profile.id);
      const activeUnlocks = unlocks.filter((unlock) => unlock.user_id === profile.id && unlock.status === "active");
      const userQuestionnaires = questionnaires.filter((item) => item.user_id === profile.id || item.email === profile.email || item.phone === profile.phone);
      const userSelections = selections.filter((item) => item.user_id === profile.id);
      const latestPayment = userPayments[0];
      return {
        ...profile,
        phoneDisplay: phoneToDisplay(profile.phone) || profile.phone || "-",
        paymentsCount: userPayments.length,
        hasPayment: userPayments.length > 0,
        latestPaymentStatus: latestPayment?.status || "none",
        activeUnlocks,
        questionnairesCount: userQuestionnaires.length,
        selectionsCount: userSelections.length,
      };
    });
  }, [profiles, payments, unlocks, questionnaires, selections]);

  const filtered = search
    ? rows.filter((row) => {
        const term = search.toLowerCase();
        return (
          (row.full_name || "").toLowerCase().includes(term) ||
          (row.email || "").toLowerCase().includes(term) ||
          (row.phone || "").toLowerCase().includes(term) ||
          (row.phoneDisplay || "").toLowerCase().includes(term)
        );
      })
    : rows;

  const pendingUsers = rows.filter((row) => !row.hasPayment && row.activeUnlocks.length === 0).length;
  const paidUsers = rows.filter((row) => row.hasPayment).length;
  const activeUsers = rows.filter((row) => row.activeUnlocks.length > 0 || row.packages_unlocked).length;

  return (
    <>
      <AdminHeader title="المستخدمين المسجلين" subtitle="كل الحسابات التي سجلت في الموقع مع حالة الدفع والتفعيل" />
      <div className="admin-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
          {[
            { label: "إجمالي المستخدمين", value: rows.length, icon: Users, color: "#6366f1" },
            { label: "لم يدفعوا بعد", value: pendingUsers, icon: Clock, color: "#f59e0b" },
            { label: "أرسلوا دفعة", value: paidUsers, icon: PackageCheck, color: "#0ea5e9" },
            { label: "مفعلين", value: activeUsers, icon: CheckCircle2, color: "#059669" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${stat.color}10`, color: stat.color }}><Icon size={20} /></div>
                <div><div className="stat-value">{stat.value}</div><div className="stat-label">{stat.label}</div></div>
              </div>
            );
          })}
        </div>

        <div className="admin-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#999" }} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الهاتف..." style={{ paddingInlineStart: 36 }} />
          </div>
        </div>

        <div className="admin-card">
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>الهاتف</th>
                  <th>تاريخ التسجيل</th>
                  <th>الدفع</th>
                  <th>التفعيل</th>
                  <th>استبيانات</th>
                  <th>اختيارات</th>
                  <th>المتابعة</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>جاري التحميل...</td></tr>
                ) : filtered.length ? filtered.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 700 }}>{row.full_name || "بدون اسم"}</td>
                    <td dir="ltr" style={{ fontSize: "0.8rem" }}>{row.email || "-"}</td>
                    <td dir="ltr" style={{ fontSize: "0.8rem" }}>{row.phoneDisplay}</td>
                    <td style={{ fontSize: "0.75rem", color: "#777" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "-"}</td>
                    <td>
                      {(() => {
                        const isActivated = row.activeUnlocks.length > 0 || row.packages_unlocked;
                        if (isActivated) {
                          if (row.hasPayment) {
                            const statusText = row.latestPaymentStatus === "approved" ? "تم تأكيد الدفع (مفعل)" : 
                                               row.latestPaymentStatus === "pending" ? "قيد المراجعة (مفعل)" : 
                                               row.latestPaymentStatus === "rejected" ? "مرفوض (مفعل)" : `مفعل (${row.latestPaymentStatus})`;
                            return (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>
                                {statusText}
                              </span>
                            );
                          } else {
                            return (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>
                                مفعل (يدوي)
                              </span>
                            );
                          }
                        } else {
                          if (row.hasPayment) {
                            if (row.latestPaymentStatus === "pending") {
                              return (
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b" }}>
                                  قيد المراجعة ({row.paymentsCount} دفعة)
                                </span>
                              );
                            } else if (row.latestPaymentStatus === "rejected") {
                              return (
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444" }}>
                                  مرفوض ({row.paymentsCount} دفعة)
                                </span>
                              );
                            } else {
                              return (
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b" }}>
                                  لم يفعل ({row.latestPaymentStatus})
                                </span>
                              );
                            }
                          } else {
                            return (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#777" }}>
                                لم يدفع
                              </span>
                            );
                          }
                        }
                      })()}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: row.activeUnlocks.length || row.packages_unlocked ? "#059669" : "#999" }}>
                        {row.activeUnlocks.length || row.packages_unlocked ? "مفعل" : "غير مفعل"}
                      </span>
                    </td>
                    <td>{row.questionnairesCount}</td>
                    <td>{row.selectionsCount}</td>
                    <td>
                      <button
                        onClick={() => setSelectedUserForTracking(row)}
                        className="btn-gold !py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Activity size={12} />
                        <span>متابعة المشروع</span>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا يوجد مستخدمون مطابقون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Stage Manager Modal */}
      {selectedUserForTracking && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={() => setSelectedUserForTracking(null)} 
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col bg-[#FBF7F0] shadow-2xl rounded-3xl border border-[#e0d9cc] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0C363A] px-6 py-5 text-white flex items-center justify-between border-b border-[#C18556]/40 shrink-0">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#C18556] font-extrabold block mb-0.5">إدارة مراحل المشروع وتفاصيل التنفيذ</span>
                <h2 className="text-xl font-bold font-serif-ar">{selectedUserForTracking.full_name || "عميل"}</h2>
              </div>
              <button 
                onClick={() => setSelectedUserForTracking(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingAdminStages ? (
                <div className="h-64 flex items-center justify-center text-teal-deep font-bold gap-2">
                  <Loader2 className="animate-spin text-gold" />
                  <span>جاري تحميل مراحل المشروع...</span>
                </div>
              ) : (
                <>
                  {/* Stages Selector Tabs */}
                  <div className="grid grid-cols-5 gap-2 md:gap-3 border-b border-[#e1dbce] pb-5">
                    {adminStages.map((stage) => {
                      const isSelected = adminSelectedStage?.id === stage.id;
                      const statusColor = 
                        stage.status === "completed" ? "bg-green-500" :
                        stage.status === "in_progress" ? "bg-gold" :
                        "bg-slate-300";
                      const statusLabel = 
                        stage.status === "completed" ? "مكتملة" :
                        stage.status === "in_progress" ? "جاري العمل" :
                        "بانتظار البدء";

                      return (
                        <button
                          key={stage.id}
                          onClick={() => setAdminSelectedStage(stage)}
                          className={cn(
                            "py-2 md:py-3.5 px-1.5 md:px-3 rounded-2xl text-[10px] md:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 md:gap-2 cursor-pointer border relative",
                            isSelected 
                              ? "bg-[#0C363A] text-white border-[#0C363A] shadow-lg scale-[1.02]"
                              : "bg-white text-[#0C363A] border-[#e5e0d5] hover:border-[#C18556]/60 hover:bg-[#FBF7F0]"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-[#C18556] rounded-t-2xl" />
                          )}
                          
                          {stage.stage_number === 0 ? <FileText size={18} className={isSelected ? "text-[#C18556]" : "text-[#0C363A]/80"} /> :
                           stage.stage_number === 1 ? <Wrench size={18} className={isSelected ? "text-[#C18556]" : "text-[#0C363A]/80"} /> :
                           stage.stage_number === 2 ? <Paintbrush size={18} className={isSelected ? "text-[#C18556]" : "text-[#0C363A]/80"} /> :
                           stage.stage_number === 3 ? <Sparkles size={18} className={isSelected ? "text-[#C18556]" : "text-[#0C363A]/80"} /> :
                           <Sofa size={18} className={isSelected ? "text-[#C18556]" : "text-[#0C363A]/80"} />}
                          
                          <div className="flex flex-col items-center">
                            <span className="font-serif-ar font-bold text-[10px] md:text-xs">
                              {stage.stage_number === 0 ? "الملفات الفنية" : `مرحلة ${stage.stage_number}`}
                            </span>
                            <div className="flex items-center gap-1 mt-1 bg-black/5 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-normal">
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColor)} />
                              <span className={isSelected ? "text-white/70" : "text-muted-foreground"}>{statusLabel}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Stage Detail Panel */}
                  {adminSelectedStage && (
                    <div className="space-y-6">
                      {/* Title & Status */}
                      <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0",
                            adminSelectedStage.status === "completed" ? "bg-green-50 text-green-600 border border-green-200" :
                            adminSelectedStage.status === "in_progress" ? "bg-amber-50 text-[#C18556] border border-amber-200" :
                            "bg-slate-50 text-slate-400 border border-slate-200"
                          )}>
                            {adminSelectedStage.stage_number === 0 ? <FileText size={22} /> :
                             adminSelectedStage.stage_number === 1 ? <Wrench size={22} /> :
                             adminSelectedStage.stage_number === 2 ? <Paintbrush size={22} /> :
                             adminSelectedStage.stage_number === 3 ? <Sparkles size={22} /> :
                             <Sofa size={22} />}
                          </div>

                          {adminSelectedStage.stage_number === 0 ? (
                            <div>
                              <h3 className="font-serif-ar text-xl font-bold text-[#0C363A]">
                                {adminSelectedStage.title_ar}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                                {adminSelectedStage.title_en}
                              </p>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col md:flex-row gap-3">
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[10px] text-muted-foreground block mb-1 font-bold">اسم المرحلة بالعربية</label>
                                <Input 
                                  value={stageTitleAr} 
                                  onChange={(e) => setStageTitleAr(e.target.value)} 
                                  className="h-9 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 font-bold text-[#0C363A]"
                                />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[10px] text-muted-foreground block mb-1 font-bold">Stage Title in English</label>
                                <Input 
                                  value={stageTitleEn} 
                                  onChange={(e) => setStageTitleEn(e.target.value)} 
                                  className="h-9 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 text-[#0C363A]"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {adminSelectedStage.stage_number !== 0 && (
                          <div className="flex items-center gap-3 bg-[#FBF7F0] px-4 py-2 rounded-2xl border border-[#e5e0d5]">
                            <span className="text-xs text-[#0C363A] font-bold">حالة المرحلة:</span>
                            <select
                              value={selectedStageStatus}
                              onChange={(e) => setSelectedStageStatus(e.target.value)}
                              className="h-9 px-3 border border-[#e1dbce] rounded-xl text-xs bg-white focus:outline-none focus:border-[#C18556] text-[#0C363A] font-extrabold cursor-pointer transition-all"
                            >
                              <option value="pending">بانتظار البدء (Pending)</option>
                              <option value="in_progress">جاري العمل بها (In Progress)</option>
                              <option value="completed">مكتملة (Completed)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Phase general description/observations */}
                      {adminSelectedStage.stage_number !== 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-[#e5e0d5] pb-3">
                            <h4 className="text-xs font-bold text-[#0C363A] uppercase tracking-wider flex items-center gap-2">
                              <Clipboard size={14} className="text-[#C18556]" />
                              <span>الملاحظات والتوجيهات العامة للمرحلة</span>
                            </h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1.5 font-bold">الملاحظات بالعربية</label>
                              <Textarea
                                value={generalStageNotesAr}
                                onChange={(e) => setGeneralStageNotesAr(e.target.value)}
                                placeholder="اكتب التوجيهات العامة للعميل لهذه المرحلة..."
                                className="min-h-24 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 placeholder:text-muted-foreground/50 resize-y"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1.5 font-bold">الملاحظات بالإنجليزية (اختياري)</label>
                              <Textarea
                                value={generalStageNotesEn}
                                onChange={(e) => setGeneralStageNotesEn(e.target.value)}
                                placeholder="Stage guidelines/info in English..."
                                className="min-h-24 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 placeholder:text-muted-foreground/50 resize-y"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Files Panel */}
                      {adminSelectedStage.stage_number === 0 ? (
                        /* Virtual Stage 0: Unified Documents & Files Panel */
                        <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm space-y-4">
                          <h4 className="text-xs font-bold text-[#0C363A] uppercase tracking-wider border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                            <FileText size={14} className="text-[#C18556]" />
                            <span>ملفات التصميم والمخططات الفنية (PDF / صور)</span>
                          </h4>

                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#C18556]/30 hover:border-[#C18556] bg-amber-50/[0.08] hover:bg-amber-50/[0.15] rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group">
                            <Upload size={20} className="text-[#C18556]/60 group-hover:text-[#C18556] transition-colors mb-2" />
                            <span className="text-xs font-bold text-[#0C363A] block">اضغط هنا لرفع الملفات الفنية للمشروع</span>
                            <span className="text-[10px] text-muted-foreground mt-1 block">الملفات المدعومة: PDF والمخططات الهندسية والصور</span>
                            <input
                              type="file"
                              accept="*/*"
                              multiple
                              className="hidden"
                              disabled={uploadingFile}
                              onChange={(e) => uploadStageFile(e, adminSelectedStage.stage_1_id, 'statement')}
                            />
                          </label>

                          {uploadingFile && (
                            <div className="text-center py-2 text-xs text-[#C18556] flex items-center justify-center gap-1.5 font-bold animate-pulse">
                              <Loader2 className="animate-spin text-gold" size={13} />
                              <span>جاري رفع الملف للموقع...</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {adminStageFiles
                              .filter(f => f.stage_id === adminSelectedStage.stage_1_id && f.category === 'statement')
                              .map(file => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-[#e5e0d5] hover:border-[#C18556]/40 transition-colors rounded-xl text-xs gap-3 shadow-xs">
                                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[9px] shrink-0",
                                      file.file_type === 'image' ? "bg-amber-50 text-[#C18556] border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"
                                    )}>
                                      {file.file_type === 'image' ? "IMG" : "PDF"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-[#0C363A] truncate" title={file.file_name}>{file.file_name}</div>
                                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">
                                        {file.file_type === 'image' ? "صورة مخطط هندسي" : "مستند PDF معتمد"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <a
                                      href={file.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-teal-600 hover:text-teal-800 p-1.5 rounded-lg hover:bg-teal-50 transition"
                                      title="تحميل"
                                    >
                                      <Download size={13} />
                                    </a>
                                    <button
                                      onClick={() => deleteStageFile(file.id)}
                                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                      title="حذف"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {adminStageFiles.filter(f => f.stage_id === adminSelectedStage.stage_1_id && f.category === 'statement').length === 0 && (
                              <div className="col-span-2 text-center py-6 text-xs text-muted-foreground/60 bg-slate-50/50 rounded-xl border border-dashed border-[#e5e0d5]">
                                لا توجد ملفات فنية مرفوعة بعد.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Normal Stages 1-4: Photos & Invoices Split */
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Site Photos Upload */}
                          <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm space-y-4">
                            <h4 className="text-xs font-bold text-[#0C363A] uppercase tracking-wider border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                              <ImageIcon size={14} className="text-[#C18556]" />
                              <span>صور الموقع والتنفيذ</span>
                            </h4>

                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#C18556]/30 hover:border-[#C18556] bg-amber-50/[0.08] hover:bg-amber-50/[0.15] rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group">
                              <Upload size={20} className="text-[#C18556]/60 group-hover:text-[#C18556] transition-colors mb-2" />
                              <span className="text-xs font-bold text-[#0C363A] block">اضغط هنا لرفع صور أو ملفات الموقع</span>
                              <span className="text-[10px] text-muted-foreground mt-1 block">يدعم الصور وملفات PDF</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                                disabled={uploadingFile}
                                onChange={(e) => uploadStageFile(e, adminSelectedStage.id, 'site_photo')}
                              />
                            </label>

                            {uploadingFile && (
                              <div className="text-center py-2 text-xs text-[#C18556] flex items-center justify-center gap-1.5 font-bold animate-pulse">
                                <Loader2 className="animate-spin text-gold" size={13} />
                                <span>جاري رفع الملف للموقع...</span>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 mt-4">
                              {adminStageFiles
                                .filter(f => f.stage_id === adminSelectedStage.id && f.file_type === 'image' && f.category !== 'statement')
                                .map(file => (
                                  <div key={file.id} className="aspect-[4/3] rounded-xl border border-[#e5e0d5] overflow-hidden relative group bg-[#FBF7F0] shadow-xs">
                                    <img src={file.file_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <button
                                      onClick={() => deleteStageFile(file.id)}
                                      className="absolute inset-0 bg-red-600/90 text-white font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                      <span>حذف</span>
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Invoices & Statements Upload */}
                          <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm space-y-4">
                            <h4 className="text-xs font-bold text-[#0C363A] uppercase tracking-wider border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                              <FileText size={14} className="text-[#C18556]" />
                              <span>الفواتير وكشف الحساب (PDF)</span>
                            </h4>

                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#0C363A]/20 hover:border-teal-deep bg-teal-50/[0.04] hover:bg-teal-50/[0.08] rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group">
                              <Upload size={20} className="text-teal-deep/60 group-hover:text-teal-deep transition-colors mb-2" />
                              <span className="text-xs font-bold text-[#0C363A] block">اضغط هنا لرفع فواتير وكشوف حساب</span>
                              <span className="text-[10px] text-muted-foreground mt-1 block">الملفات المدعومة (PDF فقط)</span>
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                multiple
                                className="hidden"
                                disabled={uploadingFile}
                                onChange={(e) => uploadStageFile(e, adminSelectedStage.id, 'invoice')}
                              />
                            </label>

                            <div className="space-y-2 mt-4 max-h-[180px] overflow-y-auto pr-1">
                              {adminStageFiles
                                .filter(f => f.stage_id === adminSelectedStage.id && f.file_type !== 'image' && f.category !== 'statement')
                                .map(file => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-[#e5e0d5] hover:border-[#C18556]/40 transition-colors rounded-xl text-xs gap-3 shadow-xs">
                                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-[9px] shrink-0">
                                        PDF
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-[#0C363A] truncate" title={file.file_name}>{file.file_name}</div>
                                        <div className="text-[8px] text-muted-foreground uppercase mt-0.5">مستند PDF معتمد</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteStageFile(file.id)}
                                      className="text-red-500 hover:text-red-700 shrink-0 cursor-pointer p-1.5 rounded-lg hover:bg-red-50 transition"
                                      title="حذف"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stage Notes Table Controls */}
                      {adminSelectedStage.stage_number !== 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-[#e5e0d5] shadow-sm space-y-5">
                          <h4 className="text-xs font-bold text-[#0C363A] uppercase tracking-wider border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                            <Plus size={14} className="text-[#C18556]" />
                            <span>إضافة بنود للمتابعة وجدول الملاحظات</span>
                          </h4>
                          
                          {/* Inline Notes Form */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1.5 font-bold">الملاحظة / البند (عربي)</label>
                              <Input
                                placeholder="اكتب الملاحظة أو اسم البند بالعربية..."
                                value={newNoteAr}
                                onChange={(e) => setNewNoteAr(e.target.value)}
                                className="h-11 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 text-[#0C363A]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1.5 font-bold">Note / Observation (English)</label>
                              <Input
                                placeholder="Write the note in English (Optional)..."
                                value={newNoteEn}
                                onChange={(e) => setNewNoteEn(e.target.value)}
                                className="h-11 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-xl bg-[#FBF7F0]/40 text-[#0C363A]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-[#FBF7F0] mt-2">
                            <div className="flex items-center gap-3 bg-[#FBF7F0] px-4 py-1.5 rounded-xl border border-[#e5e0d5]">
                              <span className="text-[10px] text-[#0C363A] font-extrabold">الحالة:</span>
                              <select
                                value={newNoteStatusAr}
                                onChange={(e) => {
                                  setNewNoteStatusAr(e.target.value);
                                  setNewNoteStatusEn(e.target.value === "تم التنفيذ" ? "Done" : "In Progress");
                                }}
                                className="h-8 px-2 border border-[#e1dbce] rounded-lg text-xs bg-white focus:outline-none focus:border-[#C18556] text-[#0C363A] font-bold cursor-pointer"
                              >
                                <option value="جاري العمل">جاري العمل (In Progress)</option>
                                <option value="تم التنفيذ">تم التنفيذ (Done)</option>
                              </select>
                            </div>

                            <button
                              onClick={() => addStageNote(adminSelectedStage.id)}
                              className="btn-gold !py-2.5 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <Plus size={14} />
                              <span>إضافة البند للمتابعة</span>
                            </button>
                          </div>

                          {/* Admin Notes list */}
                          <div className="overflow-hidden border border-[#e5e0d5] rounded-2xl mt-4 shadow-xs">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-[#0C363A]/5 text-[#0C363A] border-b border-[#e5e0d5]">
                                <tr>
                                  <th className="p-3.5 font-bold">البند / الملاحظة</th>
                                  <th className="p-3.5 font-bold w-32">الحالة</th>
                                  <th className="p-3.5 font-bold w-20 text-center">إجراء</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5e0d5] bg-white">
                                {adminStageNotes
                                  .filter(n => n.stage_id === adminSelectedStage.id)
                                  .map((n) => {
                                    const isEditing = editingNoteId === n.id;
                                    return (
                                      <tr key={n.id} className="hover:bg-[#FBF7F0]/30 transition-colors">
                                        <td className="p-3.5 leading-relaxed text-[#0C363A] font-medium">
                                          {isEditing ? (
                                            <div className="space-y-1.5 max-w-lg">
                                              <Input
                                                value={editingNoteAr}
                                                onChange={(e) => setEditingNoteAr(e.target.value)}
                                                className="h-8 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-lg bg-[#FBF7F0]/40 font-bold text-[#0C363A]"
                                                placeholder="البند بالعربية..."
                                              />
                                              <Input
                                                value={editingNoteEn}
                                                onChange={(e) => setEditingNoteEn(e.target.value)}
                                                className="h-8 text-xs border-[#e1dbce] focus-visible:ring-[#C18556] rounded-lg bg-[#FBF7F0]/40 text-[#0C363A]"
                                                placeholder="Note in English..."
                                              />
                                            </div>
                                          ) : (
                                            <>
                                              <div className="text-xs">{n.note_ar}</div>
                                              {n.note_en && <div className="text-[10px] text-muted-foreground/80 mt-1 font-sans" dir="ltr" style={{ textAlign: "right" }}>{n.note_en}</div>}
                                            </>
                                          )}
                                        </td>
                                        <td className="p-3.5 whitespace-nowrap">
                                          {isEditing ? (
                                            <select
                                              value={editingNoteStatusAr}
                                              onChange={(e) => {
                                                setEditingNoteStatusAr(e.target.value);
                                                setEditingNoteStatusEn(e.target.value === "تم التنفيذ" ? "Done" : "In Progress");
                                              }}
                                              className="h-8 px-2 border border-[#e1dbce] rounded-lg text-xs bg-white focus:outline-none focus:border-[#C18556] text-[#0C363A] font-bold cursor-pointer"
                                            >
                                              <option value="جاري العمل">جاري العمل</option>
                                              <option value="تم التنفيذ">تم التنفيذ</option>
                                            </select>
                                          ) : (
                                            <span className={cn(
                                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px]",
                                              n.status_ar === "تم التنفيذ" || n.status_en === "Done" 
                                                ? "bg-green-50 text-green-700 border border-green-200" 
                                                : "bg-amber-50 text-[#C18556] border border-amber-200"
                                            )}>
                                              <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                n.status_ar === "تم التنفيذ" || n.status_en === "Done" ? "bg-green-500" : "bg-gold"
                                              )} />
                                              {n.status_ar || "جاري العمل"}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3.5 text-center">
                                          {isEditing ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <button
                                                onClick={() => updateStageNote(n.id)}
                                                className="text-green-600 hover:text-green-800 hover:bg-green-50 cursor-pointer p-1.5 rounded-lg transition-all"
                                                title="حفظ"
                                              >
                                                <Check size={14} />
                                              </button>
                                              <button
                                                onClick={() => setEditingNoteId(null)}
                                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer p-1.5 rounded-lg transition-all"
                                                title="إلغاء"
                                              >
                                                <X size={14} />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center gap-1">
                                              <button
                                                onClick={() => {
                                                  setEditingNoteId(n.id);
                                                  setEditingNoteAr(n.note_ar);
                                                  setEditingNoteEn(n.note_en || "");
                                                  setEditingNoteStatusAr(n.status_ar || "جاري العمل");
                                                  setEditingNoteStatusEn(n.status_en || "In Progress");
                                                }}
                                                className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 cursor-pointer p-1.5 rounded-lg transition-all"
                                                title="تعديل البند"
                                              >
                                                <Edit2 size={13} />
                                              </button>
                                              <button
                                                onClick={() => deleteStageNote(n.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer p-1.5 rounded-lg transition-all"
                                                title="حذف البند"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                {adminStageNotes.filter(n => n.stage_id === adminSelectedStage.id).length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="p-8 text-center text-xs text-muted-foreground/60">
                                      لا توجد بنود متابعة مسجلة لهذه المرحلة بعد.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0C363A]/5 border-t border-[#e5e0d5] px-6 py-4 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-muted-foreground font-serif-ar">
                {adminSelectedStage && adminSelectedStage.stage_number !== 0 && "تذكر حفظ التعديلات بعد تعديل الملاحظات العامة أو حالة المرحلة."}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserForTracking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-[#0C363A] transition cursor-pointer"
                >
                  إغلاق
                </button>
                {adminSelectedStage && adminSelectedStage.stage_number !== 0 && (
                  <button
                    onClick={() => saveStageChanges(adminSelectedStage.id)}
                    className="btn-gold !py-2.5 px-8 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Save size={14} />
                    <span>حفظ تغييرات المرحلة</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
