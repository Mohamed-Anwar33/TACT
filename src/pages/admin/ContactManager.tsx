import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import SaveButton from "@/components/admin/SaveButton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Mail, Eye, Clock, Trash, Plus, Phone } from "lucide-react";

const db = supabase as any;

export default function ContactManager() {
  const { canManageContent } = useAuth();
  const [form, setForm] = useState<any>({ 
    phone_numbers: [], 
    whatsapp: "", 
    email: "", 
    address_ar: "", 
    address_en: "", 
    map_url: "", 
    facebook: "", 
    instagram: "", 
    tiktok: "",
    youtube: "",
    linkedin: "",
    twitter: ""
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"settings" | "messages">("settings");
  const [viewMsg, setViewMsg] = useState<any | null>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!canManageContent && tab === "settings") setTab("messages");
  }, [canManageContent, tab]);

  async function load() {
    const [cRes, mRes] = await Promise.all([
      db.from("cms_contact_settings").select("*").maybeSingle(),
      db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const d = cRes.data || {};
    setForm({ 
      phone_numbers: Array.isArray(d.phone_numbers) ? d.phone_numbers : [], 
      whatsapp: d.whatsapp || "", 
      email: d.email || "", 
      address_ar: d.address_ar || "", 
      address_en: d.address_en || "", 
      map_url: d.map_url || "", 
      facebook: d.social_links?.facebook || "", 
      instagram: d.social_links?.instagram || "", 
      tiktok: d.social_links?.tiktok || "",
      youtube: d.social_links?.youtube || "",
      linkedin: d.social_links?.linkedin || "",
      twitter: d.social_links?.twitter || ""
    });
    setMessages(mRes.data || []);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const phoneArray = Array.isArray(form.phone_numbers) 
        ? form.phone_numbers.map((s: string) => s.trim()).filter(Boolean)
        : [];

      // Format WhatsApp number
      let whatsappClean = form.whatsapp.trim().replace(/\D/g, "");
      if (whatsappClean.startsWith("00")) {
        whatsappClean = whatsappClean.slice(2);
      }
      if (whatsappClean.startsWith("01") && whatsappClean.length === 11) {
        whatsappClean = "2" + whatsappClean;
      } else if (whatsappClean.startsWith("1") && whatsappClean.length === 10) {
        whatsappClean = "20" + whatsappClean;
      }

      const { error } = await db.from("cms_contact_settings").upsert({ 
        id: true, 
        phone_numbers: phoneArray, 
        whatsapp: whatsappClean, 
        email: form.email, 
        address_ar: form.address_ar, 
        address_en: form.address_en, 
        map_url: form.map_url, 
        social_links: { 
          facebook: form.facebook, 
          instagram: form.instagram, 
          tiktok: form.tiktok,
          youtube: form.youtube,
          linkedin: form.linkedin,
          twitter: form.twitter
        } 
      }, { onConflict: "id" });
      
      if (error) throw error;
      toast.success("تم حفظ بيانات التواصل بنجاح");
      load();
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <>
      <AdminHeader title="تواصل معنا" subtitle="إدارة بيانات التواصل" previewUrl="/contact" />
      <div className="admin-content">
        <div className="admin-tabs">
          {canManageContent && <button className={`admin-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>بيانات التواصل</button>}
          <button className={`admin-tab ${tab === "messages" ? "active" : ""}`} onClick={() => setTab("messages")}>الرسائل ({messages.length})</button>
        </div>
        {tab === "settings" && canManageContent ? (
          <div className="admin-card">
            <div className="card-body">
              <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 600 }}>
                {/* Phone Numbers List */}
                <div className="form-group flex flex-col gap-3">
                  <label className="text-sm font-semibold text-[#0C363A] flex items-center gap-2">
                    <Phone size={16} className="text-[#C18556]" />
                    أرقام الهاتف (تظهر في الفوتر وصفحة تواصل معنا)
                  </label>
                  <div className="flex flex-col gap-2.5">
                    {Array.isArray(form.phone_numbers) && form.phone_numbers.map((phone: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            const newPhones = [...form.phone_numbers];
                            newPhones[idx] = e.target.value;
                            setForm({ ...form, phone_numbers: newPhones });
                          }}
                          placeholder="أدخل رقم الهاتف (مثال: +20123456789)"
                          dir="ltr"
                          className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPhones = form.phone_numbers.filter((_: any, i: number) => i !== idx);
                            setForm({ ...form, phone_numbers: newPhones });
                          }}
                          className="p-2.5 border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-500 rounded-lg transition-all flex items-center justify-center h-10 w-10 flex-shrink-0 shadow-sm"
                          title="حذف الرقم"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {(!Array.isArray(form.phone_numbers) || form.phone_numbers.length === 0) && (
                      <p className="text-xs text-[#0C363A]/40 italic bg-[#f6f3ed] p-3 rounded-lg border border-[#C18556]/10 text-center">
                        لا توجد أرقام هاتف مضافة حالياً. اضغط على الزر أدناه لإضافة رقم جديد.
                      </p>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const currentPhones = Array.isArray(form.phone_numbers) ? form.phone_numbers : [];
                        setForm({ ...form, phone_numbers: [...currentPhones, ""] });
                      }}
                      className="self-start px-4 py-2 border border-[#C18556]/40 text-[#C18556] hover:bg-[#C18556]/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      إضافة رقم هاتف جديد
                    </button>
                  </div>
                </div>

                {/* WhatsApp & Email */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0C363A] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm animate-pulse" />
                      رقم الواتساب العائم (WhatsApp)
                    </label>
                    <Input 
                      value={form.whatsapp} 
                      onChange={e => setForm({ ...form, whatsapp: e.target.value })} 
                      placeholder="رقم الواتساب مع رمز الدولة بدون + (مثال: 20123456789)"
                      dir="ltr" 
                      className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]"
                    />
                    <span className="text-[10px] text-gray-400">
                      هذا الرقم يتحكم في الأيقونة الخضراء العائمة على الشاشة للتواصل المباشر.
                    </span>
                  </div>
                  
                  <div className="form-group flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0C363A] flex items-center gap-2">
                      <Mail size={16} className="text-[#C18556]" />
                      البريد الإلكتروني
                    </label>
                    <Input 
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                      placeholder="example@tact.com"
                      dir="ltr" 
                      className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]"
                    />
                    <span className="text-[10px] text-gray-400">
                      البريد الإلكتروني الرسمي المعروض في الفوتر وصفحة الاتصال.
                    </span>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <label className="text-sm font-semibold text-[#0C363A] mb-3 block">روابط التواصل الاجتماعي</label>
                  
                  {/* WhatsApp note */}
                  <div className="mb-3 flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                    <span className="text-green-500 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.714a.5.5 0 0 0 .614.63l5.98-1.565A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.013-1.378l-.36-.213-3.724.976.994-3.63-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
                      </svg>
                    </span>
                    <p className="text-xs text-green-700 leading-relaxed">
                      <strong>واتساب:</strong> أيقونة الواتساب في الفوتر تستخدم تلقائياً <strong>رقم الواتساب</strong> المُدخَل في الأعلى. لا تحتاج لإدخاله مرة أخرى.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#1877F2" }} />
                        Facebook
                      </label>
                      <Input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} dir="ltr" placeholder="https://facebook.com/..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#E1306C" }} />
                        Instagram
                      </label>
                      <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} dir="ltr" placeholder="https://instagram.com/..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#000" }} />
                        TikTok
                      </label>
                      <Input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} dir="ltr" placeholder="https://tiktok.com/@..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#FF0000" }} />
                        YouTube
                      </label>
                      <Input value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} dir="ltr" placeholder="https://youtube.com/@..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#0A66C2" }} />
                        LinkedIn
                      </label>
                      <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} dir="ltr" placeholder="https://linkedin.com/company/..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                    <div className="form-group">
                      <label className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#000" }} />
                        Twitter / X
                      </label>
                      <Input value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} dir="ltr" placeholder="https://x.com/..." className="bg-white/50 border-[#C18556]/20 focus-visible:border-[#C18556]" />
                    </div>
                  </div>
                </div>

                {/* Map URL */}
                <div className="form-group"><label>رابط الخريطة</label><Input value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} dir="ltr" className="bg-white/50 border-[#C18556]/20" /></div>
                
                <SaveButton loading={busy} label="حفظ بيانات التواصل" />
              </form>
            </div>
          </div>
        ) : (
          <div className="admin-card"><div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>الاسم</th><th>الهاتف</th><th>الرسالة</th><th>التاريخ</th><th></th></tr></thead>
              <tbody>{messages.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td dir="ltr">{m.phone}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</td>
                  <td style={{ fontSize: "0.75rem", color: "#888" }}>{new Date(m.created_at).toLocaleDateString("ar-EG")}</td>
                  <td><button onClick={() => setViewMsg(m)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Eye size={12} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div></div>
        )}
      </div>
      {viewMsg && <div className="confirm-overlay" onClick={() => setViewMsg(null)}><div className="confirm-box" onClick={e => e.stopPropagation()} style={{ textAlign: "start" }}>
        <h3 style={{ fontWeight: 700, color: "#0C363A", marginBottom: "0.5rem" }}>رسالة من {viewMsg.name}</h3>
        <div style={{ fontSize: "0.8rem", color: "#888" }}>الهاتف: <span dir="ltr">{viewMsg.phone}</span></div>
        <p style={{ marginTop: 12, lineHeight: 1.8, background: "#f6f3ed", padding: "1rem", borderRadius: 8 }}>{viewMsg.message}</p>
        <button onClick={() => setViewMsg(null)} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: 8, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}>إغلاق</button>
      </div></div>}
    </>
  );
}
