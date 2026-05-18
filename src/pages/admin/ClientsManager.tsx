import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus, Star, Film } from "lucide-react";
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

const db = supabase as any;
const blankClient = { id: "", slug: "", name_en: "", name_ar: "", logo_url: "", description_en: "", description_ar: "", sort_order: 0, visible: true };
const blankReview = { id: "", client_id: "", client_name_en: "", client_name_ar: "", role_en: "", role_ar: "", quote_en: "", quote_ar: "", rating: 5, image_url: "", video_url: "", video_cover_url: "", sort_order: 0, visible: true };

export default function ClientsManager() {
  const [clients, setClients] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tab, setTab] = useState<"clients" | "reviews">("clients");
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: string } | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const [cRes, rRes] = await Promise.all([
      db.from("cms_clients").select("*").order("sort_order"),
      db.from("cms_client_testimonials").select("*").order("sort_order"),
    ]);
    setClients(cRes.data || []); setReviews(rRes.data || []);
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = await db.from("cms_clients").upsert({ ...editingClient, id: editingClient.id || undefined, sort_order: Number(editingClient.sort_order) || 0 }, { onConflict: "slug" });
      if (error) throw error; toast.success("تم حفظ العميل"); setEditingClient(null); await load();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function saveReview(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = await db.from("cms_client_testimonials").upsert({ ...editingReview, id: editingReview.id || undefined, sort_order: Number(editingReview.sort_order) || 0, rating: Number(editingReview.rating) || 5 });
      if (error) throw error; toast.success("تم حفظ الرأي"); setEditingReview(null); await load();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    await db.from(deleteTarget.table).delete().eq("id", deleteTarget.id);
    toast.success("تم الحذف"); await load(); setDeleteTarget(null);
  }

  return (
    <>
      <AdminHeader title="العملاء" subtitle="إدارة العملاء وآرائهم" previewUrl="/testimonials"
        actions={
          <button onClick={() => tab === "clients" ? setEditingClient({ ...blankClient, sort_order: clients.length }) : setEditingReview({ ...blankReview, sort_order: reviews.length })}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            <Plus size={16} /> {tab === "clients" ? "إضافة عميل" : "إضافة رأي"}
          </button>
        }
      />
      <div className="admin-content">
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "clients" ? "active" : ""}`} onClick={() => setTab("clients")}>العملاء / Logos ({clients.length})</button>
          <button className={`admin-tab ${tab === "reviews" ? "active" : ""}`} onClick={() => setTab("reviews")}>آراء العملاء ({reviews.length})</button>
        </div>

        {tab === "clients" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {clients.map(c => (
              <div key={c.id} className="admin-card" style={{ textAlign: "center", padding: "1.25rem" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 0.75rem", borderRadius: 8, overflow: "hidden", background: "#f5f5f4" }}>
                  {c.logo_url && <img src={c.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                </div>
                <div style={{ fontWeight: 600, color: "#0C363A" }}>{c.name_ar || c.name_en}</div>
                <StatusBadge visible={c.visible} />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 4 }}>
                  <button onClick={() => setEditingClient({ ...c })} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Edit2 size={12} /></button>
                  <button onClick={() => setDeleteTarget({ table: "cms_clients", id: c.id })} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reviews.map(r => (
              <div key={r.id} className="admin-card">
                <div style={{ display: "flex", gap: "1rem", padding: "1rem 1.25rem", alignItems: "flex-start" }}>
                  {r.video_url ? (
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <MediaPreview url={r.video_cover_url || r.video_url} type={r.video_cover_url ? "image" : "video"} height={70} onPlay={() => setVideoPreview(r.video_url)} />
                    </div>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#0C363A" }}>{r.client_name_ar || r.client_name_en || "عميل"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{r.role_ar || r.role_en || ""}</div>
                    <p style={{ fontSize: "0.82rem", color: "#555", marginTop: 4, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.quote_ar || r.quote_en || ""}
                    </p>
                    <div style={{ display: "flex", gap: 4, marginTop: 6, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 1 }}>{Array.from({ length: r.rating || 5 }).map((_, i) => <Star key={i} size={12} fill="#C18556" color="#C18556" />)}</div>
                      <StatusBadge visible={r.visible} />
                      {r.video_url && <span style={{ fontSize: "0.6rem", background: "#f0ece4", padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}><Film size={10} /> فيديو</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setEditingReview({ ...r })} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteTarget({ table: "cms_client_testimonials", id: r.id })} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Edit Drawer */}
      <EditDrawer open={!!editingClient} title={editingClient?.id ? "تعديل العميل" : "إضافة عميل"} onClose={() => setEditingClient(null)}
        footer={<SaveButton loading={busy} label="حفظ" onClick={() => document.getElementById("cl-form")?.requestSubmit()} />}>
        {editingClient && (
          <form id="cl-form" onSubmit={saveClient} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group"><label>Slug</label><Input value={editingClient.slug} onChange={e => setEditingClient({ ...editingClient, slug: e.target.value })} required dir="ltr" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الاسم (عربي)</label><Input value={editingClient.name_ar} onChange={e => setEditingClient({ ...editingClient, name_ar: e.target.value })} required /></div>
              <div className="form-group"><label>Name (EN)</label><Input value={editingClient.name_en} onChange={e => setEditingClient({ ...editingClient, name_en: e.target.value })} required dir="ltr" /></div>
            </div>
            <div className="form-group"><label>اللوجو</label>
              {editingClient.logo_url && <MediaPreview url={editingClient.logo_url} height={80} />}
              <MediaUploader folder="clients" label="رفع لوجو" accept="image/*" onUploaded={url => setEditingClient({ ...editingClient, logo_url: url })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الترتيب</label><Input type="number" value={editingClient.sort_order} onChange={e => setEditingClient({ ...editingClient, sort_order: e.target.value })} /></div>
              <div className="form-group"><label>الحالة</label>
                <select value={editingClient.visible ? "1" : "0"} onChange={e => setEditingClient({ ...editingClient, visible: e.target.value === "1" })} style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5" }}>
                  <option value="1">ظاهر</option><option value="0">مخفي</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </EditDrawer>

      {/* Review Edit Drawer */}
      <EditDrawer open={!!editingReview} title={editingReview?.id ? "تعديل الرأي" : "إضافة رأي"} onClose={() => setEditingReview(null)} width={580}
        footer={<SaveButton loading={busy} label="حفظ الرأي" onClick={() => document.getElementById("rv-form")?.requestSubmit()} />}>
        {editingReview && (
          <form id="rv-form" onSubmit={saveReview} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>اسم العميل (عربي)</label><Input value={editingReview.client_name_ar || ""} onChange={e => setEditingReview({ ...editingReview, client_name_ar: e.target.value })} /></div>
              <div className="form-group"><label>Client Name (EN)</label><Input value={editingReview.client_name_en || ""} onChange={e => setEditingReview({ ...editingReview, client_name_en: e.target.value })} dir="ltr" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الدور (عربي)</label><Input value={editingReview.role_ar || ""} onChange={e => setEditingReview({ ...editingReview, role_ar: e.target.value })} /></div>
              <div className="form-group"><label>Role (EN)</label><Input value={editingReview.role_en || ""} onChange={e => setEditingReview({ ...editingReview, role_en: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="form-group"><label>نص الرأي (عربي)</label><Textarea value={editingReview.quote_ar || ""} onChange={e => setEditingReview({ ...editingReview, quote_ar: e.target.value })} rows={3} /></div>
            <div className="form-group"><label>Quote (EN)</label><Textarea value={editingReview.quote_en || ""} onChange={e => setEditingReview({ ...editingReview, quote_en: e.target.value })} rows={3} dir="ltr" /></div>
            <div className="form-group"><label>التقييم</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setEditingReview({ ...editingReview, rating: s })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Star size={20} fill={s <= (editingReview.rating || 5) ? "#C18556" : "none"} color="#C18556" />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group"><label>فيديو الرأي</label>
              {editingReview.video_url && <MediaPreview url={editingReview.video_url} type="video" height={100} onPlay={() => setVideoPreview(editingReview.video_url)} />}
              <Input value={editingReview.video_url || ""} onChange={e => setEditingReview({ ...editingReview, video_url: e.target.value })} placeholder="Video URL" dir="ltr" style={{ marginTop: 4 }} />
              <MediaUploader folder="client-reviews" label="رفع فيديو" accept="video/*" onUploaded={url => setEditingReview({ ...editingReview, video_url: url })} />
            </div>
            <div className="form-group"><label>غلاف الفيديو</label>
              {editingReview.video_cover_url && <MediaPreview url={editingReview.video_cover_url} height={80} />}
              <Input value={editingReview.video_cover_url || ""} onChange={e => setEditingReview({ ...editingReview, video_cover_url: e.target.value })} placeholder="Video Cover URL" dir="ltr" style={{ marginTop: 4 }} />
              <MediaUploader folder="client-reviews" label="رفع غلاف" accept="image/*" onUploaded={url => setEditingReview({ ...editingReview, video_cover_url: url })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الترتيب</label><Input type="number" value={editingReview.sort_order} onChange={e => setEditingReview({ ...editingReview, sort_order: e.target.value })} /></div>
              <div className="form-group"><label>الحالة</label>
                <select value={editingReview.visible ? "1" : "0"} onChange={e => setEditingReview({ ...editingReview, visible: e.target.value === "1" })} style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5" }}>
                  <option value="1">ظاهر</option><option value="0">مخفي</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </EditDrawer>

      <ConfirmDialog open={!!deleteTarget} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />
      {videoPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.9)", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => setVideoPreview(null)}>
          <video src={videoPreview} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
