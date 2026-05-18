import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import SaveButton from "@/components/admin/SaveButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Mail, Eye, Clock } from "lucide-react";

const db = supabase as any;

export default function ContactManager() {
  const { canManageContent } = useAuth();
  const [form, setForm] = useState<any>({ phone_numbers: "", whatsapp: "", email: "", address_ar: "", address_en: "", map_url: "", facebook: "", instagram: "", tiktok: "" });
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
    setForm({ phone_numbers: (d.phone_numbers || []).join("\n"), whatsapp: d.whatsapp || "", email: d.email || "", address_ar: d.address_ar || "", address_en: d.address_en || "", map_url: d.map_url || "", facebook: d.social_links?.facebook || "", instagram: d.social_links?.instagram || "", tiktok: d.social_links?.tiktok || "" });
    setMessages(mRes.data || []);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = await db.from("cms_contact_settings").upsert({ id: true, phone_numbers: form.phone_numbers.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean), whatsapp: form.whatsapp, email: form.email, address_ar: form.address_ar, address_en: form.address_en, map_url: form.map_url, social_links: { facebook: form.facebook, instagram: form.instagram, tiktok: form.tiktok } }, { onConflict: "id" });
      if (error) throw error;
      toast.success("تم حفظ بيانات التواصل");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
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
          <div className="admin-card"><div className="card-body">
            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 600 }}>
              <div className="form-group"><label>أرقام الهاتف</label><Textarea value={form.phone_numbers} onChange={e => setForm({ ...form, phone_numbers: e.target.value })} rows={3} dir="ltr" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group"><label>واتساب</label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} dir="ltr" /></div>
                <div className="form-group"><label>البريد</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group"><label>Facebook</label><Input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} dir="ltr" /></div>
                <div className="form-group"><label>Instagram</label><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} dir="ltr" /></div>
                <div className="form-group"><label>TikTok</label><Input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} dir="ltr" /></div>
              </div>
              <div className="form-group"><label>رابط الخريطة</label><Input value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} dir="ltr" /></div>
              <SaveButton loading={busy} label="حفظ بيانات التواصل" />
            </form>
          </div></div>
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
