import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus, User } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import SaveButton from "@/components/admin/SaveButton";
import MediaPreview from "@/components/admin/MediaPreview";
import MediaUploader from "@/components/admin/MediaUploader";
import EditDrawer from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/realContent";

const db = supabase as any;
const blank = { id: "", slug: "", name_en: "", name_ar: "", role_en: "", role_ar: "", department: "team", bio_en: "", bio_ar: "", image_url: "", sort_order: 0, visible: true };

export default function TeamManager() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await db.from("cms_team_members").select("*").order("sort_order");
    const normalized = (data || []).map((m: any) => ({
      ...m,
      image_url: resolveMediaUrl(m.image_url) || m.image_url
    }));
    setItems(normalized);
  }

  const filtered = filter === "all" ? items : items.filter(m => m.department === filter);

  function makeMemberSlug(member: any) {
    const source = String(member.name_en || member.name_ar || "team-member").trim();
    const base = source
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `member-${Date.now()}`;

    let candidate = base;
    let suffix = 2;
    while (items.some((item) => item.slug === candidate && item.id !== member.id)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const payload = { ...editing, id: editing.id || undefined, slug: editing.slug || makeMemberSlug(editing), sort_order: Number(editing.sort_order) || 0 };
      const { error } = await db.from("cms_team_members").upsert(payload, { onConflict: "slug" });
      if (error) throw error;
      toast.success("تم حفظ العضو"); setEditing(null); await load();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function doDelete() { if (!deleteId) return; await db.from("cms_team_members").delete().eq("id", deleteId); toast.success("تم الحذف"); await load(); setDeleteId(null); }

  return (
    <>
      <AdminHeader title="فريق العمل" subtitle="إدارة أعضاء الفريق" previewUrl="/team"
        actions={<button onClick={() => setEditing({ ...blank, sort_order: items.length })} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}><Plus size={16} /> إضافة عضو</button>}
      />
      <div className="admin-content">
        <div className="admin-tabs">
          {[{ id: "all", l: "الكل" }, { id: "leadership", l: "الإدارة" }, { id: "design", l: "التصميم" }, { id: "site", l: "الموقع" }].map(f => (
            <button key={f.id} className={`admin-tab ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.l}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {filtered.map(m => (
            <div key={m.id} className="admin-card" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 0.75rem", overflow: "hidden", background: "#0C363A", display: "grid", placeItems: "center", border: "2px solid rgba(193, 133, 86,0.3)" }}>
                {m.image_url ? <img src={resolveMediaUrl(m.image_url) || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={28} color="#C18556" />}
              </div>
              <div style={{ fontWeight: 700, color: "#0C363A", fontSize: "0.9rem" }}>{m.name_ar || m.name_en}</div>
              <div style={{ fontSize: "0.75rem", color: "#C18556", marginTop: 2 }}>{m.role_ar || m.role_en}</div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 4 }}>
                <StatusBadge visible={m.visible} />
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 4 }}>
                <button onClick={() => setEditing({ ...m })} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.75rem" }}><Edit2 size={12} /></button>
                <button onClick={() => setDeleteId(m.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditDrawer open={!!editing} title={editing?.id ? "تعديل العضو" : "إضافة عضو جديد"} onClose={() => setEditing(null)}
        footer={<SaveButton loading={busy} label="حفظ العضو" onClick={() => (document.getElementById("team-form") as HTMLFormElement | null)?.requestSubmit()} />}>
        {editing && (
          <form id="team-form" onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الاسم (عربي)</label><Input value={editing.name_ar} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} required /></div>
              <div className="form-group"><label>Name (EN)</label><Input value={editing.name_en} onChange={e => setEditing({ ...editing, name_en: e.target.value })} required dir="ltr" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الوظيفة (عربي)</label><Input value={editing.role_ar || ""} onChange={e => setEditing({ ...editing, role_ar: e.target.value })} /></div>
              <div className="form-group"><label>Role (EN)</label><Input value={editing.role_en || ""} onChange={e => setEditing({ ...editing, role_en: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="form-group"><label>القسم</label>
              <select value={editing.department} onChange={e => setEditing({ ...editing, department: e.target.value })} style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5" }}>
                <option value="leadership">الإدارة</option><option value="design">التصميم</option><option value="site">الموقع</option><option value="team">عام</option>
              </select>
            </div>
            <div className="form-group"><label>نبذة (عربي)</label><Textarea value={editing.bio_ar || ""} onChange={e => setEditing({ ...editing, bio_ar: e.target.value })} rows={2} /></div>
            <div className="form-group"><label>الصورة</label>
              {editing.image_url && <MediaPreview url={editing.image_url} height={100} />}
              <MediaUploader folder="team" label="رفع صورة العضو" accept="image/*" onUploaded={url => setEditing({ ...editing, image_url: url })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الترتيب</label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: e.target.value })} /></div>
              <div className="form-group"><label>الحالة</label>
                <select value={editing.visible ? "1" : "0"} onChange={e => setEditing({ ...editing, visible: e.target.value === "1" })} style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5" }}>
                  <option value="1">ظاهر</option><option value="0">مخفي</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </EditDrawer>
      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
