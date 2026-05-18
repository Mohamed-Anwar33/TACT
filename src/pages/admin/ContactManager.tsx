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
    tiktok: "" 
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
      tiktok: d.social_links?.tiktok || "" 
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
          tiktok: form.tiktok 
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group"><label>Facebook</label><Input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} dir="ltr" className="bg-white/50 border-[#C18556]/20" /></div>
                  <div className="form-group"><label>Instagram</label><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} dir="ltr" className="bg-white/50 border-[#C18556]/20" /></div>
                  <div className="form-group"><label>TikTok</label><Input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} dir="ltr" className="bg-white/50 border-[#C18556]/20" /></div>
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
