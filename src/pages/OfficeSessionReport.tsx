import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FileText, Printer, Edit } from "lucide-react";
import { toast } from "sonner";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { getPackage, normalizePackageImageUrl } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

type ReportItem = {
  id: string;
  style: string;
  category: string;
  choice: string;
  imageUrl: string | null;
  description: string;
  place: string;
  qty: string;
  note: string;
};

const text = (value: unknown, fallback = "—") => {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
};

function parseReportItems(rawSelections: any): ReportItem[] {
  if (!rawSelections?.sections) return [];

  return Object.values(rawSelections.sections).flatMap((section: any) => {
    return Object.values(section?.selected ?? {}).map((item: any, index) => ({
      id: String(item.id || `${section.style_id}-${section.category_id}-${index}`),
      style: text(section.style, "عام"),
      category: text(item.category || section.category, "غير محدد"),
      choice: text(item.option_name, "غير محدد"),
      imageUrl: normalizePackageImageUrl(item.image_url) || item.image_url || null,
      description: text(item.description, ""),
      place: text(item.place, "غير محدد"),
      qty: text(item.qty, "غير محدد"),
      note: text(item.note, ""),
    }));
  });
}

export default function OfficeSessionReport() {
  const { id } = useParams();
  const { lang } = useLang();
  const { user, profile, isAdmin, isOfficeConsultant, loading } = useAuth();
  const nav = useNavigate();
  const [selection, setSelection] = useState<any | null>(null);
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [packageName, setPackageName] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user || !id) return;
      setBusy(true);

      const { data: selectionData, error: selectionError } = await supabase
        .from("configurator_selections")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!alive) return;

      if (selectionError || !selectionData) {
        toast.error(lang === "ar" ? "تعذر فتح تقرير جلسة المكتب" : "Could not open this office report");
        setBusy(false);
        return;
      }

      setSelection(selectionData);

      if (selectionData.questionnaire_id) {
        const { data: questionnaireData } = await supabase
          .from("questionnaires")
          .select("*")
          .eq("id", selectionData.questionnaire_id)
          .maybeSingle();
        if (alive) setQuestionnaire(questionnaireData ?? null);
      }

      const pkg = await getPackage(selectionData.package_id);
      if (alive) {
        setPackageName(lang === "ar" ? pkg?.name_ar || selectionData.package_id : pkg?.name_en || selectionData.package_id);
        setBusy(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, user, lang, nav]);

  const items = useMemo(() => parseReportItems(selection?.selections), [selection]);
  const clientName = questionnaire?.name || selection?.client_name || selection?.selections?.client_name || "—";
  const clientPhone = questionnaire?.phone || selection?.client_phone || selection?.selections?.client_phone || "—";
  const clientEmail = questionnaire?.email || selection?.client_email || selection?.selections?.client_email || "—";
  const planImages = Array.isArray(questionnaire?.plan_images) ? questionnaire.plan_images : [];

  if (loading || !user) return <div className="pt-40 pb-20 text-center text-muted-foreground">...</div>;

  const isOwner = selection && selection.user_id === user.id;
  const isClientMatch = selection && (
    (profile?.phone && selection.client_phone === profile.phone) ||
    (user.email && selection.client_email === user.email)
  );
  const isAuthorized = isOfficeConsultant || isAdmin || isOwner || isClientMatch;

  if (!isAuthorized) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-[#0C363A] text-ivory flex items-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-2xl text-center">
          <SectionEyebrow label={lang === "ar" ? "غير مسموح" : "Not allowed"} />
          <h1 className="display-2 mt-4">{lang === "ar" ? "ليس لديك صلاحية لعرض هذا التقرير" : "You do not have permission to view this report"}</h1>
        </div>
      </section>
    );
  }

  if (busy) return <div className="pt-40 pb-20 text-center text-muted-foreground">...</div>;

  return (
    <section className="min-h-screen bg-[#f4efe7] pt-36 md:pt-40 lg:pt-32 pb-8 print:py-0 print:bg-white" dir="rtl">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff !important; }
          header, footer, .no-print { display: none !important; }
          .print-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; border: none !important; }
          .print-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 relative z-10">
        {isOfficeConsultant || isAdmin ? (
          <Link to="/office-session" className="inline-flex items-center gap-2 rounded-lg border border-teal-deep/20 bg-white px-4 py-2 text-xs font-bold text-teal-deep">
            <ArrowRight size={15} />
            <span>{lang === "ar" ? "جلسة جديدة" : "New session"}</span>
          </Link>
        ) : (
          <Link to="/customer" className="inline-flex items-center gap-2 rounded-lg border border-teal-deep/20 bg-white px-4 py-2 text-xs font-bold text-teal-deep">
            <ArrowRight size={15} />
            <span>{lang === "ar" ? "العودة لحسابي" : "Back to Account"}</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {selection && (isOfficeConsultant || isAdmin) && (
            <Link 
              to={`/packages/${selection.package_id}/configurator?questionnaireId=${selection.questionnaire_id || ""}&editSelectionId=${selection.id}`} 
              className="inline-flex items-center gap-2 rounded-lg bg-[#0C363A] hover:bg-[#0F4D52] px-5 py-2.5 text-xs font-bold text-white shadow transition-all cursor-pointer border border-white/10"
            >
              <Edit size={15} />
              <span>{lang === "ar" ? "تعديل الاختيارات" : "Edit Selections"}</span>
            </Link>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-xs font-bold text-teal-deep shadow cursor-pointer">
            <Printer size={15} />
            <span>{lang === "ar" ? "طباعة / حفظ PDF" : "Print / Save PDF"}</span>
          </button>
        </div>
      </div>

      <article className="print-sheet mx-auto max-w-[210mm] border border-[#e0d6c7] bg-white p-8 shadow-2xl">
        <header className="mb-8 flex items-start justify-between gap-6 border-b-2 border-teal-deep pb-5">
          <div>
            <div className="text-sm font-extrabold text-teal-deep">تاكت للاستشارات الهندسية والمقاولات</div>
            <div className="mt-1 text-xs text-muted-foreground">تقرير اختيارات بنود التشطيب والمواد المعتمد</div>
          </div>
          <img src="/logo.png" alt="TACT" className="h-14 w-14 object-contain" />
        </header>

        <section className="print-break mb-6 rounded-lg border border-[#e7ded2] bg-[#fbf8f3] p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-extrabold text-teal-deep">
            <FileText size={18} />
            <span>بيانات العميل والجلسة</span>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="اسم العميل" value={clientName} />
            <Info label="الهاتف / واتساب" value={clientPhone} ltr />
            <Info label="البريد الإلكتروني" value={clientEmail} ltr />
            <Info label="الباقة المختارة" value={packageName} />
            <Info label="رقم التقرير" value={`CS-${String(selection?.id || "").slice(0, 8).toUpperCase()}`} ltr />
            <Info label="تاريخ الطباعة" value={new Date().toLocaleDateString("ar-EG")} />
          </div>
        </section>

        {questionnaire && (
          <section className="print-break mb-8 rounded-lg border border-teal-deep/25 p-5">
            <h2 className="mb-4 text-lg font-extrabold text-teal-deep">الاستبيان المبدئي</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="نوع العقار" value={questionnaire.project_type || "—"} />
              <Info label="مرحلة العقار" value={questionnaire.stage || "—"} />
              <Info label="عدد الأفراد" value={questionnaire.family || "—"} />
              <Info label="الخدمات المطلوبة" value={questionnaire.service || "—"} />
              <Info label="العنوان / الموقع" value={questionnaire.address || "—"} wide />
            </div>
            <LongInfo label="التوقعات" value={questionnaire.expectations} />
            <LongInfo label="التجارب أو التحديات السابقة" value={questionnaire.history} />
            <LongInfo label="المشكلات والطموحات" value={questionnaire.goals} />
            <LongInfo label="ملاحظات إضافية" value={questionnaire.notes} />
          </section>
        )}

        {planImages.length > 0 && (
          <section className="print-break mb-8">
            <h2 className="mb-4 text-lg font-extrabold text-teal-deep">{lang === "ar" ? "ملفات البلان المرفوعة" : "Uploaded Layout Plans"}</h2>
            <div className="no-print grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {planImages.map((item: any) => {
                const isImage = typeof item.type === "string" && item.type.startsWith("image/");
                return (
                  <div key={item.url} className="rounded-lg border border-[#e7ded2] bg-[#fbf8f3] overflow-hidden flex flex-col justify-between shadow-sm">
                    {isImage ? (
                      <div className="aspect-video w-full overflow-hidden bg-white flex items-center justify-center border-b border-[#e7ded2]">
                        <img src={item.url} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-[#0C363A]/5 border-b border-[#e7ded2] flex items-center justify-center text-teal-deep font-bold text-xs uppercase tracking-wider font-serif">
                        PDF FILE
                      </div>
                    )}
                    <div className="p-3 flex items-center justify-between gap-2 bg-white">
                      <span className="truncate text-xs font-semibold text-[#0C363A] flex-1" title={item.name}>{item.name}</span>
                      <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-gold hover:underline">
                        {lang === "ar" ? "عرض" : "View"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Printed list fallback */}
            <div className="hidden print:block space-y-2 mt-2">
              {planImages.map((item: any) => (
                <div key={item.url} className="text-xs text-teal-deep">
                  • <strong>{item.name}:</strong> <span className="underline font-mono text-[10px] break-all">{item.url}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-extrabold text-teal-deep">اختيارات التشطيب والملاحظات</h2>
          <div className="grid gap-5">
            {items.map((item, index) => (
              <div key={item.id} className="print-break grid gap-4 rounded-lg border border-[#e7ded2] p-4 md:grid-cols-[170px_1fr]">
                <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-md bg-[#f1eee8]">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.choice} className="max-h-44 w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">بدون صورة</span>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold text-gold">بند {index + 1} · {item.style} · {item.category}</div>
                  <h3 className="text-base font-extrabold text-teal-deep">{item.choice}</h3>
                  {item.description && <p className="mt-2 text-sm leading-relaxed text-[#555]">{item.description}</p>}
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                    <Info label="مكان الاستخدام" value={item.place} />
                    <Info label="الكمية التقريبية" value={item.qty} />
                  </div>
                  {item.note && item.note !== "—" && (
                    <div className="mt-3 rounded-md border-r-4 border-gold bg-[#fff8ed] p-3 text-sm leading-relaxed">
                      <strong className="text-teal-deep">ملاحظة العميل: </strong>
                      {item.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="print-break mt-12 grid grid-cols-2 gap-12 text-center text-sm">
          <div className="border-t border-[#888] pt-3">اعتماد وإمضاء العميل</div>
          <div className="border-t border-[#888] pt-3">اعتماد المكتب الفني لشركة TACT</div>
        </footer>
      </article>
    </section>
  );
}

function Info({ label, value, ltr, wide }: { label: string; value: string; ltr?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <span className="block text-xs font-bold text-muted-foreground">{label}</span>
      <strong dir={ltr ? "ltr" : "rtl"} className="mt-1 block text-teal-deep">{value || "—"}</strong>
    </div>
  );
}

function LongInfo({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-4 rounded-md border border-[#e7ded2] bg-[#fbf8f3] p-3 text-sm leading-relaxed">
      <strong className="mb-1 block text-teal-deep">{label}</strong>
      <span className="whitespace-pre-line text-[#444]">{value}</span>
    </div>
  );
}
