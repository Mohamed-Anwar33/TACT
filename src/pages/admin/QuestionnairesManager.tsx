import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Calendar,
  User,
  Phone,
  MapPin,
  Building,
  Clock,
  Clipboard,
  Activity,
  FileText,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const db = supabase as any;

export default function QuestionnairesManager() {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setBusy(true);
    try {
      const { data, error } = await db
        .from("questionnaires")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setQuestionnaires(data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load questionnaires");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الاستبيان نهائياً؟")) return;
    setBusy(true);
    try {
      const { error } = await db.from("questionnaires").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الاستبيان بنجاح");
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  // Filter based on search
  const filtered = questionnaires.filter((q) => {
    const term = search.toLowerCase();
    return (
      (q.name || "").toLowerCase().includes(term) ||
      (q.phone || "").toLowerCase().includes(term) ||
      (q.address || "").toLowerCase().includes(term) ||
      (q.email || "").toLowerCase().includes(term)
    );
  });

  // Default selection
  useEffect(() => {
    if (filtered.length > 0 && !selected) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected]);

  return (
    <>
      <AdminHeader
        title="استبيانات العملاء"
        subtitle="متابعة وتحليل متطلبات العملاء بالتفصيل"
        previewUrl="/questionnaire"
      />
      <div className="admin-content">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Sidebar List */}
          <div className="admin-card p-5 flex flex-col h-[calc(100vh-220px)]">
            <h3 className="text-[#0C363A] font-bold text-base mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#C18556]" />
              الاستبيانات الواردة ({filtered.length})
            </h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 h-4 w-4 text-[#C18556]/60" />
              <Input
                placeholder="البحث بالاسم، الهاتف، العنوان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-10 border-[#e1dbce] bg-[#FBF7F0] focus-visible:ring-[#C18556] text-right"
              />
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {busy && questionnaires.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">جاري تحميل البيانات...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">لا توجد استبيانات تطابق البحث</div>
              ) : (
                filtered.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelected(q)}
                    className={cn(
                      "w-full text-right p-4 rounded-xl border transition-all duration-200 flex flex-col gap-1.5",
                      selected?.id === q.id
                        ? "border-[#C18556] bg-[#C18556]/5 text-[#0C363A] shadow-sm font-semibold"
                        : "border-[#e5e0d5] bg-white hover:border-[#C18556]/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm text-[#0C363A]">{q.name || "عميل بدون اسم"}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                        <Calendar className="h-3 w-3 text-[#C18556]" />
                        {new Date(q.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#C18556]/60" />
                      <span dir="ltr">{q.phone}</span>
                    </div>
                    {q.address && (
                      <div className="text-xs truncate flex items-center gap-1 w-full">
                        <MapPin className="h-3 w-3 text-[#C18556]/60 shrink-0" />
                        <span className="truncate">{q.address}</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Details Panel View */}
          {selected ? (
            <div className="admin-card overflow-hidden flex flex-col h-[calc(100vh-220px)] border border-[#e1dbce]">
              {/* Card Header */}
              <div className="p-6 border-b border-[#e1dbce] bg-[#0C363A] text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#C18556] font-semibold">استبيان عميل جديد</p>
                  <h2 className="text-xl font-bold mt-1 text-[#FBF7F0]">{selected.name}</h2>
                </div>
                <button
                  onClick={() => remove(selected.id)}
                  disabled={busy}
                  className="p-2.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 transition-all"
                  title="حذف الاستبيان"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content body formatted beautifully */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#FBF7F0]">
                {/* Step 1: Basic Info */}
                <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                  <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    1. المعلومات الأساسية للتواصل
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">الاسم الكامل</span>
                      <span className="font-semibold text-[#0C363A]">{selected.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">رقم الهاتف</span>
                      <span className="font-semibold text-[#0C363A]" dir="ltr">{selected.phone}</span>
                    </div>
                    {selected.email && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">البريد الإلكتروني</span>
                        <span className="font-semibold text-[#0C363A]">{selected.email}</span>
                      </div>
                    )}
                    {selected.address && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">عنوان الوحدة المراد تشطيبها</span>
                        <span className="font-semibold text-[#0C363A]">{selected.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 & 3: Project & Occupants */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Project Info */}
                  <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      2. تفاصيل المشروع
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">نوع العقار</span>
                        <span className="font-semibold text-[#0C363A] bg-[#C18556]/10 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">
                          {selected.project_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">المرحلة الحالية من المشروع</span>
                        <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">
                          {selected.stage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Occupants & Services */}
                  <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      3. الأسرة والخدمات المطلوبة
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">عدد الأفراد المستخدمين للوحدة</span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">
                          {selected.family}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">الخدمات المطلوبة</span>
                        <span className="font-semibold text-[#0C363A] bg-[#0C363A]/10 px-2.5 py-1 rounded-full text-xs inline-block mt-0.5">
                          {selected.service}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Expectations & Prioritized experience */}
                <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                  <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    4. التوقعات والتجربة السابقة
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">العامل الأهم / التوقعات</span>
                        <span className="font-medium text-[#0C363A]">{selected.expectations || "غير محدد"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">كيف سمعت عن الشركة؟</span>
                        <span className="font-medium text-[#0C363A]">{selected.source || "غير محدد"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">التجربة السابقة والتحديات</span>
                      <div className="p-3 bg-red-50/50 rounded-lg border border-red-100/60 text-xs text-red-800 leading-relaxed font-sans">
                        {selected.history || "لا توجد تفاصيل تعاقدات سابقة"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Problems faced & Ambitions */}
                <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                  <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                    <Clipboard className="h-4 w-4" />
                    5. المشكلات وحلها (الأهداف والطموحات)
                  </h3>
                  <div className="p-4 bg-[#FBF7F0] rounded-xl border border-[#e1dbce] text-sm text-[#0C363A] leading-relaxed whitespace-pre-line font-sans">
                    {selected.goals || "لا توجد تفاصيل مضافة للمشكلات أو الطموحات"}
                  </div>
                </div>

                {/* Step 6: Notes */}
                {selected.notes && (
                  <div className="bg-white rounded-xl p-5 border border-[#e5e0d5] shadow-sm space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-[#C18556] font-bold border-b border-[#e5e0d5] pb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      6. ملاحظات إضافية
                    </h3>
                    <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-100/50 text-sm text-amber-900 leading-relaxed whitespace-pre-line font-sans">
                      {selected.notes}
                    </div>
                  </div>
                )}

                {/* Timestamp Footer */}
                <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 pt-4">
                  <Clock className="h-3 w-3 text-[#C18556]" />
                  <span>تاريخ الاستلام:</span>
                  <span>{new Date(selected.created_at).toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card h-[calc(100vh-220px)] border border-[#e1dbce] bg-white grid place-items-center p-8 text-center text-muted-foreground">
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-[#C18556]/40 animate-pulse" />
                <h3 className="font-semibold text-lg text-[#0C363A]">الرجاء اختيار استبيان</h3>
                <p className="text-sm">اختر استبياناً من القائمة الجانبية لقراءة تفاصيل متطلبات العميل كاملة.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
