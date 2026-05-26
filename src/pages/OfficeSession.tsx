import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, FileText, Lock, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/AuthProvider";
import { useLang } from "@/i18n/LanguageProvider";
import { CatalogPackage, getPackages } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

type PlanImage = {
  url: string;
  name: string;
  type: string;
};

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  project_type: "",
  stage: "",
  family: "",
  service: "",
  expectations: "",
  source: "",
  history: "",
  goals: "",
  notes: "",
  plan_images: [] as PlanImage[],
};

export default function OfficeSession() {
  const { lang } = useLang();
  const { user, isOfficeConsultant, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user || !isOfficeConsultant) return;
    getPackages().then(setPackages);
  }, [user, isOfficeConsultant]);

  const update = (key: keyof typeof initialForm, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

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

        const { data } = supabase.storage.from("tact-media").getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, name: file.name, type: file.type });
      }

      if (uploaded.length) {
        update("plan_images", [...form.plan_images, ...uploaded]);
        toast.success(lang === "ar" ? "تم رفع ملفات البلان" : "Plan files uploaded");
      }
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "فشل رفع الملفات" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const removePlanImage = (url: string) => {
    update("plan_images", form.plan_images.filter((item) => item.url !== url));
  };

  const submitQuestionnaire = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(lang === "ar" ? "اسم العميل ورقم الهاتف مطلوبان" : "Client name and phone are required");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase
      .from("questionnaires")
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        project_type: form.project_type.trim(),
        stage: form.stage.trim(),
        family: form.family.trim(),
        service: form.service.trim(),
        expectations: form.expectations.trim(),
        source: form.source.trim(),
        history: form.history.trim(),
        goals: form.goals.trim(),
        notes: form.notes.trim(),
        plan_images: form.plan_images,
      })
      .select("id")
      .single();
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setQuestionnaireId(data.id);
    toast.success(lang === "ar" ? "تم حفظ استبيان العميل. اختر الباقة الآن." : "Questionnaire saved. Choose a package now.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewSession = () => {
    setForm(initialForm);
    setQuestionnaireId(null);
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

  if (questionnaireId) {
    return (
      <section className="pt-40 pb-32 min-h-screen bg-[#FBF7F0]" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="container-luxe max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionEyebrow label={lang === "ar" ? "جلسة مكتب محفوظة" : "Saved office session"} />
              <h1 className="display-2 mt-4 text-teal-deep">{form.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{lang === "ar" ? "اختر الباقة التي سيتم تطبيقها على تقرير العميل." : "Choose the package to use for this client report."}</p>
            </div>
            <button type="button" onClick={startNewSession} className="btn-ghost-light !text-teal-deep !border-teal-deep/25 flex items-center gap-2">
              <Plus size={16} />
              <span>{lang === "ar" ? "جلسة جديدة" : "New session"}</span>
            </button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                to={`/packages/${pkg.id}/configurator?questionnaireId=${questionnaireId}`}
                className="group rounded-xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold hover:shadow-xl"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold">{pkg.id}</div>
                <h2 className="mt-3 font-serif text-2xl font-bold text-teal-deep">{lang === "ar" ? pkg.name_ar : pkg.name_en}</h2>
                <p className="mt-3 min-h-12 text-xs leading-relaxed text-muted-foreground">{lang === "ar" ? pkg.description_ar : pkg.description_en}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-teal-deep group-hover:text-gold">
                  <span>{lang === "ar" ? "فتح الاختيارات" : "Open configurator"}</span>
                  {lang === "ar" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-36 pb-24 min-h-screen bg-[#FBF7F0]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="container-luxe max-w-4xl">
        <SectionEyebrow label={lang === "ar" ? "جلسة مكتب جديدة" : "New office session"} />
        <h1 className="display-2 mt-4 text-teal-deep">{lang === "ar" ? "استبيان عميل داخل المكتب" : "In-office client questionnaire"}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {lang === "ar"
            ? "املأ بيانات العميل الحالي، ثم اختر الباقة وافتح الكتالوج التفاعلي. كل جلسة تحفظ تقريرها منفصلًا حتى لو نفس حساب التابلت مستخدم دائمًا."
            : "Fill the current client details, then choose the package and open the configurator. Each session saves a separate report under this tablet account."}
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-white p-6 shadow-xl md:p-10">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={lang === "ar" ? "اسم العميل" : "Client name"} required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={lang === "ar" ? "مثال: محمد أحمد" : "Client name"} />
            </Field>
            <Field label={lang === "ar" ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"} required>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" placeholder="01xxxxxxxxx" />
            </Field>
            <Field label={lang === "ar" ? "البريد الإلكتروني" : "Email"}>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} dir="ltr" placeholder="name@example.com" />
            </Field>
            <Field label={lang === "ar" ? "الموقع / عنوان الوحدة" : "Unit location"}>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder={lang === "ar" ? "التجمع، زايد، العاصمة..." : "District / city"} />
            </Field>
            <Field label={lang === "ar" ? "نوع العقار" : "Property type"}>
              <Input value={form.project_type} onChange={(e) => update("project_type", e.target.value)} placeholder={lang === "ar" ? "شقة، فيلا، مكتب..." : "Apartment, villa, office..."} />
            </Field>
            <Field label={lang === "ar" ? "مرحلة العقار" : "Project stage"}>
              <Input value={form.stage} onChange={(e) => update("stage", e.target.value)} placeholder={lang === "ar" ? "طوب أحمر، محارة، متشطب..." : "Red brick, plastering, finished..."} />
            </Field>
            <Field label={lang === "ar" ? "عدد الأفراد / المستخدمين" : "Occupants"}>
              <Input value={form.family} onChange={(e) => update("family", e.target.value)} placeholder={lang === "ar" ? "زوج وزوجة، 3 أفراد..." : "Couple, family of 3..."} />
            </Field>
            <Field label={lang === "ar" ? "الخدمات المطلوبة" : "Required services"}>
              <Input value={form.service} onChange={(e) => update("service", e.target.value)} placeholder={lang === "ar" ? "تصميم، تنفيذ، أثاث..." : "Design, execution, furniture..."} />
            </Field>
          </div>

          <div className="mt-5 grid gap-5">
            <Field label={lang === "ar" ? "التوقعات وأولويات النجاح" : "Expectations and priorities"}>
              <Textarea value={form.expectations} onChange={(e) => update("expectations", e.target.value)} rows={3} />
            </Field>
            <Field label={lang === "ar" ? "كيف عرف العميل الشركة؟" : "Source"}>
              <Input value={form.source} onChange={(e) => update("source", e.target.value)} />
            </Field>
            <Field label={lang === "ar" ? "تجارب أو تحديات سابقة" : "Previous challenges"}>
              <Textarea value={form.history} onChange={(e) => update("history", e.target.value)} rows={3} />
            </Field>
            <Field label={lang === "ar" ? "المشكلات والطموحات" : "Problems and goals"}>
              <Textarea value={form.goals} onChange={(e) => update("goals", e.target.value)} rows={3} />
            </Field>
            <Field label={lang === "ar" ? "ملاحظات إضافية" : "Additional notes"}>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
            </Field>

            <div className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-deep px-4 py-3 text-xs font-bold text-white transition hover:bg-teal-deep/90">
                <Upload size={15} />
                <span>{uploading ? "..." : lang === "ar" ? "رفع بلانات / PDF" : "Upload plans / PDF"}</span>
                <input type="file" multiple accept="image/*,application/pdf,.pdf" className="hidden" onChange={(e) => uploadPlanFiles(e.target.files)} disabled={uploading} />
              </label>
              {form.plan_images.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {form.plan_images.map((item) => (
                    <div key={item.url} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-xs">
                      <span className="truncate">{item.name}</span>
                      <button type="button" onClick={() => removePlanImage(item.url)} className="text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="button" onClick={submitQuestionnaire} disabled={busy} className="btn-gold flex items-center gap-2">
              <span>{busy ? "..." : lang === "ar" ? "حفظ الاستبيان واختيار الباقة" : "Save and choose package"}</span>
              <Check size={16} />
            </button>
          </div>
        </div>

        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
          <FileText size={14} />
          <span>{lang === "ar" ? "العودة للموقع" : "Back to site"}</span>
        </Link>
      </div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-bold text-teal-deep">
        {label} {required ? <span className="text-gold">*</span> : null}
      </span>
      {children}
    </label>
  );
}
