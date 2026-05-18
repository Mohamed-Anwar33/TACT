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
  const [reviews, setReviews] = useState<any[]>([]);
  const [section, setSection] = useState<any | null>(null);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: string } | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const [rRes, sRes] = await Promise.all([
      db.from("cms_client_testimonials").select("*").order("sort_order"),
      db.from("cms_sections").select("*").eq("page_slug", "home").eq("section_key", "testimonials").maybeSingle(),
    ]);
    setReviews(rRes.data || []);
    setSection(sRes.data || null);
  }

  async function saveReview(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const pinOnHome = !!editingReview.pinOnHome;
      const payload = { ...editingReview };
      delete (payload as any).pinOnHome;

      const { data, error } = await db.from("cms_client_testimonials").upsert({ 
        ...payload, 
        id: payload.id || undefined, 
        sort_order: Number(payload.sort_order) || 0, 
        rating: Number(payload.rating) || 5 
      }).select("id");
      
      if (error) throw error;
      
      const savedId = data?.[0]?.id ? String(data[0].id) : editingReview.id;
      if (savedId && section) {
        const selectedIds: string[] = section.metadata?.selectedIds || [];
        let newIds = [...selectedIds];
        if (pinOnHome) {
          if (!newIds.includes(String(savedId))) {
            newIds.push(String(savedId));
          }
        } else {
          newIds = newIds.filter(x => x !== String(savedId));
        }
        
        await db.from("cms_sections").upsert({
          ...section,
          id: section.id || undefined,
          sort_order: Number(section.sort_order) || 0,
          metadata: {
            ...section.metadata,
            selectedIds: newIds
          }
        }, { onConflict: "page_slug,section_key" });
      }
      
      toast.success("تم حفظ الرأي"); setEditingReview(null); await load();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    await db.from(deleteTarget.table).delete().eq("id", deleteTarget.id);
    toast.success("تم الحذف"); await load(); setDeleteTarget(null);
  }

  async function togglePin(id: string | number) {
    if (!section) {
      toast.error("فشل العثور على إعدادات قسم الصفحة الرئيسية");
      return;
    }
    const selectedIds: string[] = section.metadata?.selectedIds || [];
    const idStr = String(id);
    let newIds = [...selectedIds];
    if (newIds.includes(idStr)) {
      newIds = newIds.filter(x => x !== idStr);
    } else {
      newIds.push(idStr);
    }
    
    const nextSection = {
      ...section,
      metadata: {
        ...section.metadata,
        selectedIds: newIds
      }
    };
    
    try {
      const { error } = await db.from("cms_sections").upsert({
        ...nextSection,
        id: nextSection.id || undefined,
        sort_order: Number(nextSection.sort_order) || 0
      }, { onConflict: "page_slug,section_key" });
      
      if (error) throw error;
      toast.success(newIds.includes(idStr) ? "تم عرض الرأي بالصفحة الرئيسية" : "تم إلغاء عرض الرأي بالصفحة الرئيسية");
      await load();
    } catch (err: any) {
      toast.error("فشل التحديث: " + err.message);
    }
  }

  return (
    <>
      <AdminHeader title="آراء العملاء" subtitle="إدارة آراء وتقييمات العملاء" previewUrl="/testimonials"
        actions={
          <button onClick={() => setEditingReview({ ...blankReview, sort_order: reviews.length })}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            <Plus size={16} /> إضافة رأي جديد
          </button>
        }
      />
      <div className="admin-content">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reviews.map(r => {
            const selectedIds: string[] = section?.metadata?.selectedIds || [];
            const isPinned = selectedIds.includes(String(r.id));
            return (
              <div key={r.id} className="admin-card">
                <div style={{ display: "flex", gap: "1rem", padding: "1rem 1.25rem", alignItems: "flex-start" }}>
                  {r.video_url ? (
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <MediaPreview url={r.video_cover_url || r.video_url} type={r.video_cover_url ? "image" : "video"} height={70} onPlay={() => setVideoPreview(r.video_url)} />
                    </div>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, color: "#0C363A", fontSize: "0.95rem" }}>{r.client_name_ar || r.client_name_en || "عميل"}</div>
                      {isPinned ? (
                        <span style={{ fontSize: "0.68rem", background: "#fdf2e9", color: "#c18556", border: "1px solid #f5d6c1", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                          <Star size={10} fill="#c18556" /> معروض بالصفحة الرئيسية
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.68rem", background: "#f5f5f4", color: "#78716c", border: "1px solid #e5e0d5", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                          صفحة العملاء فقط
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>{r.role_ar || r.role_en || ""}</div>
                    <p style={{ fontSize: "0.82rem", color: "#555", marginTop: 4, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.quote_ar || r.quote_en || ""}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 1 }}>{Array.from({ length: r.rating || 5 }).map((_, i) => <Star key={i} size={12} fill="#C18556" color="#C18556" />)}</div>
                      <StatusBadge visible={r.visible} />
                      {r.video_url && <span style={{ fontSize: "0.6rem", background: "#f0ece4", padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}><Film size={10} /> فيديو</span>}
                      
                      {/* Toggle Homepage selection */}
                      <button
                        type="button"
                        onClick={() => togglePin(r.id)}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          border: "1px solid",
                          cursor: "pointer",
                          background: isPinned ? "#0C363A" : "#ffffff",
                          color: isPinned ? "#ffffff" : "#0C363A",
                          borderColor: "#0C363A",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          transition: "all 0.2s"
                        }}
                      >
                        {isPinned ? "✕ إزالة من الرئيسية" : "➕ عرض في الرئيسية"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setEditingReview({ ...r, pinOnHome: isPinned })} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteTarget({ table: "cms_client_testimonials", id: r.id })} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Edit Drawer */}
      <EditDrawer open={!!editingReview} title={editingReview?.id ? "تعديل الرأي" : "إضافة رأي جديد"} onClose={() => setEditingReview(null)} width={580}
        footer={<SaveButton loading={busy} label="حفظ الرأي" onClick={() => (document.getElementById("rv-form") as HTMLFormElement | null)?.requestSubmit()} />}>
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
            
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="reviewPinHome"
                checked={!!editingReview.pinOnHome}
                onChange={e => setEditingReview({ ...editingReview, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
              <label htmlFor="reviewPinHome" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                عرض هذا الرأي في الصفحة الرئيسية للموقع
              </label>
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
