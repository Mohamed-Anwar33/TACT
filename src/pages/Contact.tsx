import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/data/site";
import { Phone, Mail, Facebook, Instagram, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CmsContact, fallbackContact, getCmsContact } from "@/lib/publicCms";
import SEO from "@/components/layout/SEO";

export default function Contact() {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<CmsContact>(() => fallbackContact());

  useEffect(() => {
    let alive = true;
    getCmsContact().then((row) => {
      if (alive) setContact(row);
    });
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({ name: form.name, phone: form.phone, message: form.message });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "ar" ? "تم إرسال رسالتك" : "Message sent"); setForm({ name: "", phone: "", message: "" });
  };

  const seoTitle = lang === "ar" ? "اتصل بنا" : "Contact Us";
  const seoDesc = lang === "ar"
    ? "تواصل مع فريق عمل تاكت للتصميم والتشطيب لمناقشة مشروعك. نحن هنا لمساعدتك في التخطيط، التصميم، والتنفيذ."
    : "Contact Tact Architecture & Finishing team. We are here to answer questions, provide estimates, and launch your project.";

  return (
    <>
      <SEO 
        title={seoTitle} 
        description={seoDesc}
        keywords={lang === "ar" ? "تواصل مع تاكت, رقم شركة تشطيب, مكتب ديكور التجمع" : "Contact Tact, interior design company Cairo, decoration contractors"}
      />
      <section className="pt-40 pb-16 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <SectionEyebrow label={lang === "ar" ? "تواصل معنا" : "Contact"} />
          <h1 className="display-1 mt-6 max-w-4xl text-balance">{lang === "ar" ? "لنبدأ الحوار" : "Let's start the conversation"}</h1>
        </div>
      </section>

      <section className="py-24">
        <div className="container-luxe grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-secondary">{lang === "ar" ? "هاتف" : "Phone"}</div>
              <div className="mt-3 space-y-2">
                {(contact.phones.length ? contact.phones : SITE.phones).map((p) => (
                  <a key={p} href={`tel:${p}`} className="flex items-center gap-3 font-serif text-lg link-underline" dir="ltr">
                    <Phone size={16} className="text-gold" /> {p}
                  </a>
                ))}
              </div>
            </div>
            <div className="gold-line" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-secondary">{lang === "ar" ? "تابعنا" : "Follow"}</div>
              <div className="flex gap-3 mt-4">
                <a href={contact.socialLinks.facebook || SITE.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 border border-border hover:border-gold flex items-center justify-center transition-all"><Facebook size={18} /></a>
                <a href={contact.socialLinks.instagram || SITE.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 border border-border hover:border-gold flex items-center justify-center transition-all"><Instagram size={18} /></a>
                <a href={contact.socialLinks.tiktok || SITE.tiktok} target="_blank" rel="noreferrer" className="w-12 h-12 border border-border hover:border-gold flex items-center justify-center transition-all">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.13 8.13 0 0 1-1.89-1.44c-.05 2.62-.05 5.24-.01 7.86-.02 2.73-.74 5.6-2.91 7.47-2.12 1.86-5.46 2.31-8.15 1.39-2.48-.82-4.56-2.77-5.27-5.32-.9-3.17.27-6.97 3.03-8.85 1.47-.98 3.32-1.39 5.07-1.16v4.22c-1.01-.17-2.09.06-2.9.73-1.01.81-1.33 2.21-.86 3.42.34 1.05 1.43 1.83 2.53 1.75 1.25-.03 2.37-1.07 2.43-2.32.02-3.11.01-6.22.01-9.34-.04-2.4-.04-4.79-.01-7.18Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="gold-line" />
            <a href={`https://wa.me/${contact.whatsapp || SITE.whatsapp}`} target="_blank" rel="noreferrer" className="btn-gold !w-full">
              <MessageCircle size={16} /> {lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
            </a>
          </div>

          <form onSubmit={submit} className="md:col-span-3 grid gap-5">
            <Input placeholder={lang === "ar" ? "الاسم" : "Name"} className="h-12" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder={lang === "ar" ? "رقم الهاتف" : "Phone"} className="h-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Textarea placeholder={lang === "ar" ? "رسالتك" : "Your message"} className="min-h-40" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <button type="submit" disabled={busy} className="btn-gold self-start disabled:opacity-50">{busy ? "..." : (lang === "ar" ? "إرسال" : "Send")}</button>
          </form>
        </div>
      </section>
    </>
  );
}
