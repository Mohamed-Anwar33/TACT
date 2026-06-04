import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import SEO from "@/components/layout/SEO";
import { whatsappLink } from "@/data/site";
import { Copy, Check, Lock, Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CatalogPackage, PaymentMethod, getPackages, getPaymentMethods } from "@/lib/catalog";

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.substring(0, file.name.lastIndexOf(".")) + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.75
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function Payment() {
  const { t, lang } = useLang();
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [copied, setCopied] = useState("");
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState({ package_id: "", name: "", phone: "", method: "InstaPay", reference: "", amount: "", proof_url: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      nav("/auth");
      return;
    }

    setUploading(true);
    try {
      const fileToUpload = await compressImage(file);
      const safeName = fileToUpload.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
      const storagePath = `payments/${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from("tact-media")
        .upload(storagePath, fileToUpload, { contentType: fileToUpload.type, upsert: false });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("tact-media").getPublicUrl(storagePath);
      const publicUrl = data.publicUrl;

      setForm((prev) => ({ ...prev, proof_url: publicUrl }));
      toast.success(lang === "ar" ? "تم رفع الإيصال وضغطه بنجاح!" : "Receipt uploaded and compressed successfully!");
    } catch (err: any) {
      toast.error(lang === "ar" ? "فشل رفع الإيصال، يرجى المحاولة مرة أخرى" : `Failed to upload receipt: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [pkgList, methodList] = await Promise.all([getPackages(), getPaymentMethods()]);
      if (!alive) return;
      setPackages(pkgList);
      setMethods(methodList);
      setForm((current) => ({
        ...current,
        package_id: current.package_id || pkgList[0]?.id || "",
        method: methodList[0]?.label_en || "InstaPay",
        name: current.name || profile?.full_name || "",
        phone: current.phone || profile?.phone || "",
      }));
    }
    if (user) load();
    return () => {
      alive = false;
    };
  }, [user, profile?.full_name, profile?.phone]);

  const selectedPackage = useMemo(() => packages.find((pkg) => pkg.id === form.package_id), [packages, form.package_id]);
  const paymentMethod = methods[0] ?? null;
  const transferTarget = paymentMethod?.phone || paymentMethod?.ipa || "";

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      nav("/auth");
      return;
    }
    if (!form.package_id || !form.phone) {
      toast.error(lang === "ar" ? "اختر الباقة وأدخل رقم الهاتف" : "Choose package and enter phone");
      return;
    }
    setBusy(true);
    const { error } = await (supabase as any).from("payment_submissions").insert({
      user_id: user.id,
      package_id: form.package_id,
      name: form.name,
      phone: form.phone,
      method: form.method,
      reference: form.reference,
      proof_url: form.proof_url || null,
      amount: form.amount ? Number(form.amount) : null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "ar" ? "تم تسجيل بيانات الدفع، وسيتم مراجعتها من الإدارة" : "Payment details recorded for admin review");
    setForm((current) => ({ ...current, reference: "", amount: "", proof_url: "" }));
  };

  const copy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
    setTimeout(() => setCopied(""), 1500);
  };

  if (loading || !user) {
    return (
      <section className="pt-40 pb-32 min-h-screen flex items-center justify-center bg-teal-deep text-ivory">
        <div className="text-center">
          <Lock className="mx-auto text-gold mb-4" />
          <p>{lang === "ar" ? "جاري تحويلك لتسجيل الدخول..." : "Redirecting to sign in..."}</p>
        </div>
      </section>
    );
  }

  const steps = lang === "ar"
    ? [
        { n: "01", t: "اختر الباقة", d: "حدد الباقة التي تريد فتحها بعد مراجعة العربون." },
        { n: "02", t: "حوّل العربون", d: "امسح QR كود إنستاباي أو استخدم الرقم الظاهر أسفله." },
        { n: "03", t: "سجل بيانات التحويل", d: "اكتب رقم العملية وارفع رابط الإيصال إن وجد." },
        { n: "04", t: "انتظر التفعيل", d: "بعد التأكيد ستظهر الباقة في حسابك." },
      ]
    : [
        { n: "01", t: "Choose package", d: "Pick the package to unlock after deposit review." },
        { n: "02", t: "Transfer deposit", d: "Scan the InstaPay QR code or use the number shown below." },
        { n: "03", t: "Submit details", d: "Record reference and receipt link if available." },
        { n: "04", t: "Wait for activation", d: "After approval, the package appears in your account." },
      ];

  const seoTitle = lang === "ar" ? "تسجيل الدفع والتحويل" : "Payment & Transfer Details";
  const seoDesc = lang === "ar"
    ? "سجل بيانات تحويل عربون باقة التشطيب الخاصة بك على إينستاباي لتفعيل الباقة والبدء في استخدام مصمم الغرف التفاعلي."
    : "Submit payment details of your deposit transfer to activate your finishing package and start room configurations.";

  return (
    <>
      <SEO 
        title={seoTitle} 
        description={seoDesc} 
        keywords={lang === "ar" ? "تأكيد الدفع تاكت, تحويل عربون تشطيب, إينستاباي تاكت" : "Confirm payment Tact, deposit transfer, InstaPay Egypt"}
      />
      <section className="pt-40 pb-16 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <SectionEyebrow label={lang === "ar" ? "الدفع" : "Payment"} />
          <h1 className="display-1 mt-6 max-w-4xl text-balance">{lang === "ar" ? "تسجيل بيانات العربون" : "Deposit Transfer Details"}</h1>
          <p className="mt-6 text-ivory/70 max-w-2xl">{t("payment_note")}</p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-luxe grid lg:grid-cols-2 gap-12">
          <div className="space-y-px bg-border">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="bg-background p-8 flex gap-6">
                  <div className="num-tag">{step.n}</div>
                  <div>
                    <h3 className="font-serif text-2xl">{step.t}</h3>
                    <div className="gold-line w-10 my-3" />
                    <p className="text-sm text-muted-foreground">{step.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="card-luxe p-10 bg-teal-deep text-ivory border-gold/30">
              <SectionEyebrow label={lang === "ar" ? "QR كود الدفع" : "Payment QR Code"} />
              <div className="mt-8 space-y-6">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{lang === "ar" ? paymentMethod?.label_ar || "إنستاباي" : paymentMethod?.label_en || "InstaPay"}</div>
                  <div className="mt-5 bg-white p-4 border border-gold/30" style={{ borderRadius: 8 }}>
                    {paymentMethod?.qr_url ? (
                      <img src={paymentMethod.qr_url} alt="InstaPay QR Code" className="w-full max-w-[320px] aspect-square mx-auto object-contain" loading="lazy" />
                    ) : (
                      <div className="w-full max-w-[320px] aspect-square mx-auto grid place-items-center text-center text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 p-6">
                        {lang === "ar" ? "لم يتم رفع QR كود الدفع من لوحة التحكم بعد." : "Payment QR code has not been uploaded from the dashboard yet."}
                      </div>
                    )}
                  </div>
                  {transferTarget && (
                    <div className="mt-5 p-4 border border-gold/20 bg-white/5" style={{ borderRadius: 8 }}>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-gold/80">{lang === "ar" ? "رقم/معرف التحويل" : "Transfer number / ID"}</div>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <span className="font-serif text-xl break-all" dir="ltr">{transferTarget}</span>
                        <button type="button" onClick={() => copy(transferTarget)} className="text-gold shrink-0">
                          {copied === transferTarget ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={whatsappLink(lang === "ar" ? "مرحبًا، تم تحويل العربون وأرفق الإثبات" : "Hello, deposit sent - attaching proof")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gold w-full"
                >
                  {lang === "ar" ? "إرسال الإيصال على واتساب" : "Send receipt on WhatsApp"}
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="container-luxe mt-16">
          <Reveal>
            <form onSubmit={submitProof} className="card-luxe p-10 max-w-3xl mx-auto">
              <SectionEyebrow label={lang === "ar" ? "سجل بيانات التحويل" : "Record your transfer"} />
              <h3 className="font-serif text-2xl mt-4 mb-6">{lang === "ar" ? "اختر الباقة واكتب تفاصيل الدفع" : "Choose package and submit transfer details"}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={form.package_id}
                  onChange={(e) => setForm({ ...form, package_id: e.target.value })}
                  className="h-12 border border-border bg-background px-4 text-sm md:col-span-2"
                  required
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {lang === "ar" ? pkg.name_ar : pkg.name_en} - {pkg.price_label ?? ""}
                    </option>
                  ))}
                </select>
                <Input placeholder={lang === "ar" ? "الاسم" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" />
                <Input placeholder={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12" required />
                <Input value={lang === "ar" ? paymentMethod?.label_ar || "إنستاباي" : paymentMethod?.label_en || "InstaPay"} className="h-12" readOnly />
                <Input placeholder={lang === "ar" ? "رقم العملية / المرجع" : "Reference / TX id"} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-12" />
                <Input placeholder={lang === "ar" ? "المبلغ (جنيه)" : "Amount (EGP)"} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-12" />
                <div className="md:col-span-2 mt-2">
                  {uploading ? (
                    <div className="w-full h-24 border border-dashed border-brand-gold/30 bg-background/50 rounded-lg flex flex-col items-center justify-center gap-2 text-brand-gold">
                      <Loader2 className="animate-spin text-brand-gold" size={24} />
                      <span className="text-xs font-bold">
                        {lang === "ar" ? "جاري ضغط ورفع الإيصال..." : "Compressing & uploading..."}
                      </span>
                    </div>
                  ) : form.proof_url ? (
                    <div className="w-full border border-brand-gold/30 bg-background/30 rounded-lg p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded border border-border overflow-hidden bg-white/5 flex items-center justify-center text-brand-gold">
                          <img src={form.proof_url} alt="Receipt Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-brand-dark font-sans">{lang === "ar" ? "تم رفع الإيصال وضغطه بنجاح" : "Receipt uploaded & compressed"}</div>
                          <a href={form.proof_url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-gold hover:underline font-sans">
                            {lang === "ar" ? "عرض الصورة كاملة" : "View full image"}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, proof_url: "" }))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={lang === "ar" ? "حذف الإيصال" : "Delete receipt"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-24 border border-dashed border-border hover:border-brand-gold/50 bg-background/50 hover:bg-background/80 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 group">
                      <Upload className="text-muted-foreground group-hover:text-brand-gold transition-colors" size={20} />
                      <span className="text-xs font-bold text-brand-dark group-hover:text-brand-gold transition-colors font-sans">
                        {lang === "ar" ? "اضغط هنا لرفع صورة الإيصال" : "Click here to upload receipt image"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        {lang === "ar" ? "(يتم ضغط الصورة تلقائياً لتسريع الرفع وحفظ الباقة)" : "(Image compressed automatically for speed)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {selectedPackage && (lang === "ar" ? `سيتم طلب فتح: ${selectedPackage.name_ar}` : `Requested unlock: ${selectedPackage.name_en}`)}
              </div>
              <button disabled={busy} className="btn-gold w-full mt-6 disabled:opacity-50">{busy ? "..." : (lang === "ar" ? "تسجيل الدفع" : "Submit payment")}</button>
              <Link to="/customer" className="block text-center mt-5 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-gold">
                {lang === "ar" ? "العودة لحسابي" : "Back to account"}
              </Link>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
