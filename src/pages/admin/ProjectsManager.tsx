import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus, Image as ImageIcon, Film, Eye, ChevronRight, ChevronLeft } from "lucide-react";
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

const blank = {
  id: "", title_en: "", title_ar: "", category_en: "", category_ar: "",
  area: "", description_en: "", description_ar: "", cover_url: "",
  video_url: "", pdf_url: "", external_url: "", sort_order: 0, visible: true,
};

export default function ProjectsManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"grid" | "table">("grid");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [tempGallery, setTempGallery] = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setTempGallery([]);
  }, [editing]);

  async function load() {
    const [pRes, mRes] = await Promise.all([
      db.from("cms_projects").select("*").order("sort_order"),
      db.from("cms_project_media").select("*").order("sort_order"),
    ]);
    setProjects(pRes.data || []);
    setProjectMedia(mRes.data || []);
  }

  function getMedia(projectId: string) { return projectMedia.filter(m => m.project_id === projectId); }
  function imgCount(projectId: string) { return getMedia(projectId).filter(m => m.media_type === "image").length; }
  function vidCount(projectId: string) { return getMedia(projectId).filter(m => m.media_type === "video").length + (projects.find(p => p.id === projectId)?.video_url ? 1 : 0); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      if (!editing.id) { toast.error("يجب إدخال Project ID"); setBusy(false); return; }
      
      const isNew = !projects.some(p => p.id === editing.id);
      let finalCoverUrl = editing.cover_url;
      if (!finalCoverUrl && tempGallery.length > 0) {
        finalCoverUrl = tempGallery[0];
      }
      
      const payload = { 
        ...editing, 
        cover_url: finalCoverUrl, 
        sort_order: Number(editing.sort_order) || 0 
      };
      
      const { error } = await db.from("cms_projects").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      if (isNew && tempGallery.length > 0) {
        const mediaRows = tempGallery.map((url, idx) => ({
          project_id: editing.id,
          media_type: "image",
          role: "gallery",
          url,
          title_en: `Image ${idx + 1}`,
          visible: true,
          sort_order: (idx + 1) * 10
        }));
        const { error: mediaErr } = await db.from("cms_project_media").insert(mediaRows);
        if (mediaErr) console.error("Error inserting temp gallery:", mediaErr);
      }

      toast.success("تم حفظ المشروع ومرفقاته بنجاح");
      setEditing(null);
      setTempGallery([]);
      await load();
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function doDelete() {
    if (!deleteId) return;
    await db.from("cms_project_media").delete().eq("project_id", deleteId);
    const { error } = await db.from("cms_projects").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); await load(); }
    setDeleteId(null);
  }

  async function moveMedia(mediaId: string, direction: 'forward' | 'backward') {
    if (!editing?.id) return;
    const projectMediaItems = getMedia(editing.id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = projectMediaItems.findIndex(m => m.id === mediaId);
    if (idx === -1) return;

    const newIdx = direction === 'forward' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= projectMediaItems.length) return;

    const itemA = projectMediaItems[idx];
    const itemB = projectMediaItems[newIdx];

    const oldOrderA = itemA.sort_order;
    const oldOrderB = itemB.sort_order;

    await Promise.all([
      db.from("cms_project_media").update({ sort_order: oldOrderB }).eq("id", itemA.id),
      db.from("cms_project_media").update({ sort_order: oldOrderA }).eq("id", itemB.id),
    ]);

    await load();
    
    // Sync cover if the first item changed
    const updatedMedia = projectMediaItems.map(m => {
      if (m.id === itemA.id) return { ...m, sort_order: oldOrderB };
      if (m.id === itemB.id) return { ...m, sort_order: oldOrderA };
      return m;
    }).sort((a, b) => a.sort_order - b.sort_order);
    
    const firstImg = updatedMedia.find(m => m.media_type === "image")?.url;
    if (firstImg && firstImg !== editing.cover_url) {
      await db.from("cms_projects").update({ cover_url: firstImg }).eq("id", editing.id);
      setEditing({ ...editing, cover_url: firstImg });
      await load();
    }
  }

  async function addMediaToProject(url: string, file: File) {
    if (!editing?.id) return;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const currentMedia = getMedia(editing.id);
    const maxOrder = currentMedia.length > 0 ? Math.max(...currentMedia.map(m => m.sort_order)) : 0;
    
    await db.from("cms_project_media").upsert({ 
      project_id: editing.id, 
      media_type: mediaType, 
      role: "gallery", 
      url, 
      title_en: file.name, 
      visible: true,
      sort_order: maxOrder + 10 
    }, { onConflict: "project_id,url" });
    
    await load();

    // Auto-update cover if it's the first image
    const allMedia = getMedia(editing.id).sort((a, b) => a.sort_order - b.sort_order);
    const firstImg = allMedia.find(m => m.media_type === "image")?.url;
    if (firstImg && firstImg !== editing.cover_url) {
      await db.from("cms_projects").update({ cover_url: firstImg }).eq("id", editing.id);
      setEditing({ ...editing, cover_url: firstImg });
      await load();
    }
  }

  async function removeProjectMedia(mediaId: string) {
    await db.from("cms_project_media").delete().eq("id", mediaId);
    await load();
    
    // Sync cover
    if (editing?.id) {
      const allMedia = getMedia(editing.id).sort((a, b) => a.sort_order - b.sort_order);
      const firstImg = allMedia.find(m => m.media_type === "image")?.url || "";
      await db.from("cms_projects").update({ cover_url: firstImg }).eq("id", editing.id);
      setEditing({ ...editing, cover_url: firstImg });
      await load();
    }
  }

  return (
    <>
      <AdminHeader title="أعمالنا" subtitle="إدارة المشاريع" previewUrl="/portfolio"
        actions={
          <button onClick={() => setEditing({ ...blank, sort_order: projects.length })}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            <Plus size={16} /> إضافة مشروع
          </button>
        }
      />

      <div className="admin-content">
        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "grid" ? "active" : ""}`} onClick={() => setTab("grid")}>عرض البطاقات</button>
          <button className={`admin-tab ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")}>عرض الجدول</button>
        </div>

        {projects.length === 0 ? (
          <div className="admin-card">
            <div className="card-body" style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
              <ImageIcon size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p>لا توجد مشاريع بعد</p>
              <button onClick={() => setEditing({ ...blank })} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer" }}>
                إضافة أول مشروع
              </button>
            </div>
          </div>
        ) : tab === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {projects.map(p => (
              <div key={p.id} className="admin-card" style={{ overflow: "hidden" }}>
                <div style={{ height: 180, background: "#0C363A", position: "relative" }}>
                  {p.cover_url ? (
                    <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : p.video_url ? (
                    <video src={p.video_url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "rgba(193, 133, 86,0.4)" }}>
                      <ImageIcon size={40} />
                    </div>
                  )}
                  {p.video_url && (
                    <button onClick={() => setVideoPreview(p.video_url)} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.3)", border: "none", cursor: "pointer" }}>
                      <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(193, 133, 86,0.9)", display: "grid", placeItems: "center", color: "#0C363A" }}>
                        <Film size={20} />
                      </span>
                    </button>
                  )}
                </div>
                <div style={{ padding: "1rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#C18556", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {p.category_ar || p.category_en || "مشروع"}
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0C363A", marginTop: 4 }}>{p.title_ar || p.title_en}</h3>
                  {p.area && <span style={{ fontSize: "0.7rem", color: "#999" }}>{p.area}</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <StatusBadge visible={p.visible} />
                    <span style={{ fontSize: "0.65rem", color: "#888", background: "#f5f5f4", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <ImageIcon size={10} /> {imgCount(p.id)}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#888", background: "#f5f5f4", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Film size={10} /> {vidCount(p.id)}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f0ece4", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setEditing({ ...p })} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Edit2 size={12} /> تعديل
                    </button>
                  </div>
                  <button onClick={() => setDeleteId(p.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card">
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الصورة</th><th>المشروع</th><th>التصنيف</th><th>المساحة</th><th>صور</th><th>فيديو</th><th>الحالة</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id}>
                      <td><div style={{ width: 56, height: 40, borderRadius: 6, overflow: "hidden", background: "#f0ece4" }}>
                        {p.cover_url && <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div></td>
                      <td style={{ fontWeight: 600 }}>{p.title_ar || p.title_en}</td>
                      <td>{p.category_ar || p.category_en || "-"}</td>
                      <td>{p.area || "-"}</td>
                      <td>{imgCount(p.id)}</td>
                      <td>{vidCount(p.id)}</td>
                      <td><StatusBadge visible={p.visible} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setEditing({ ...p })} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Edit2 size={12} /></button>
                          <button onClick={() => setDeleteId(p.id)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #F1C5BA", background: "#fff", cursor: "pointer", color: "#D84728" }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={!!editing} title={editing?.id && projects.find(p => p.id === editing.id) ? "تعديل المشروع" : "إضافة مشروع جديد"} onClose={() => setEditing(null)} width={620}
        footer={<SaveButton loading={busy} label="حفظ المشروع" onClick={() => (document.getElementById("project-form") as HTMLFormElement | null)?.requestSubmit()} />}
      >
        {editing && (
          <form id="project-form" onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>Project ID / Slug</label>
              <Input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} placeholder="project-slug" required dir="ltr"
                disabled={!!projects.find(p => p.id === editing.id)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>العنوان (عربي)</label><Input value={editing.title_ar} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} required /></div>
              <div className="form-group"><label>Title (EN)</label><Input value={editing.title_en} onChange={e => setEditing({ ...editing, title_en: e.target.value })} required dir="ltr" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>التصنيف (عربي)</label><Input value={editing.category_ar || ""} onChange={e => setEditing({ ...editing, category_ar: e.target.value })} /></div>
              <div className="form-group"><label>Category (EN)</label><Input value={editing.category_en || ""} onChange={e => setEditing({ ...editing, category_en: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="form-group"><label>المساحة</label><Input value={editing.area || ""} onChange={e => setEditing({ ...editing, area: e.target.value })} placeholder="250 m²" dir="ltr" /></div>
            <div className="form-group"><label>الوصف (عربي)</label><Textarea value={editing.description_ar || ""} onChange={e => setEditing({ ...editing, description_ar: e.target.value })} rows={3} /></div>
            <div className="form-group"><label>Description (EN)</label><Textarea value={editing.description_en || ""} onChange={e => setEditing({ ...editing, description_en: e.target.value })} rows={3} dir="ltr" /></div>

            {/* Unified Project Images & Gallery Section */}
            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem", marginTop: "1rem" }}>
              {(() => {
                const isExisting = editing.id && projects.some(p => p.id === editing.id);
                const displayMedia = isExisting
                  ? getMedia(editing.id).sort((a, b) => a.sort_order - b.sort_order)
                  : tempGallery.map((url, idx) => ({ id: `temp-${idx}`, url, media_type: "image", sort_order: idx }));

                return (
                  <>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A", display: "block", marginBottom: 8 }}>
                      صور المشروع ({displayMedia.length})
                    </label>

                    {displayMedia.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 12 }}>
                        {displayMedia.map((m, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === displayMedia.length - 1;
                          const isTemp = m.id.startsWith("temp-");
                          return (
                            <div key={m.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e0d5" }}>
                              <MediaPreview url={m.url} type={m.media_type} height={85} onPlay={() => setVideoPreview(m.url)} />
                              
                              {/* Status Label */}
                              <div style={{ 
                                position: "absolute", top: 4, insetInlineStart: 4, 
                                background: idx === 0 ? "#C18556" : "rgba(12, 54, 58,0.8)", 
                                color: "#fff", fontSize: "0.55rem", padding: "2px 6px", 
                                borderRadius: 4, fontWeight: 700, zIndex: 5,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                              }}>
                                {idx === 0 ? "الغلاف" : idx + 1}
                              </div>

                              {/* Controls Overlay */}
                              <div style={{ 
                                position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, 
                                background: "linear-gradient(transparent, rgba(0,0,0,0.8))", 
                                display: "flex", justifyContent: "center", gap: 8, padding: "8px 4px 4px",
                                zIndex: 10
                              }}>
                                {!isTemp ? (
                                  <>
                                    <button type="button" onClick={() => moveMedia(m.id, 'forward')} disabled={isFirst} 
                                      style={{ border: "none", background: "none", color: "#fff", cursor: isFirst ? "default" : "pointer", opacity: isFirst ? 0.3 : 1, padding: 0 }}>
                                      <ChevronRight size={16} />
                                    </button>
                                    <button type="button" onClick={() => removeProjectMedia(m.id)} 
                                      style={{ border: "none", background: "rgba(216, 71, 40,0.2)", color: "#F1C5BA", cursor: "pointer", borderRadius: "50%", width: 20, height: 20, display: "grid", placeItems: "center" }}>
                                      <Trash2 size={10} />
                                    </button>
                                    <button type="button" onClick={() => moveMedia(m.id, 'backward')} disabled={isLast} 
                                      style={{ border: "none", background: "none", color: "#fff", cursor: isLast ? "default" : "pointer", opacity: isLast ? 0.3 : 1, padding: 0 }}>
                                      <ChevronLeft size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" 
                                      onClick={() => {
                                        const newArr = [...tempGallery];
                                        const tmp = newArr[idx];
                                        newArr[idx] = newArr[idx - 1];
                                        newArr[idx - 1] = tmp;
                                        setTempGallery(newArr);
                                      }} 
                                      disabled={isFirst} 
                                      style={{ border: "none", background: "none", color: "#fff", cursor: isFirst ? "default" : "pointer", opacity: isFirst ? 0.3 : 1, padding: 0 }}>
                                      <ChevronRight size={16} />
                                    </button>
                                    <button type="button" onClick={() => setTempGallery(prev => prev.filter((_, i) => i !== idx))} 
                                      style={{ border: "none", background: "rgba(216, 71, 40,0.2)", color: "#F1C5BA", cursor: "pointer", borderRadius: "50%", width: 20, height: 20, display: "grid", placeItems: "center" }}>
                                      <Trash2 size={10} />
                                    </button>
                                    <button type="button" 
                                      onClick={() => {
                                        const newArr = [...tempGallery];
                                        const tmp = newArr[idx];
                                        newArr[idx] = newArr[idx + 1];
                                        newArr[idx + 1] = tmp;
                                        setTempGallery(newArr);
                                      }} 
                                      disabled={isLast} 
                                      style={{ border: "none", background: "none", color: "#fff", cursor: isLast ? "default" : "pointer", opacity: isLast ? 0.3 : 1, padding: 0 }}>
                                      <ChevronLeft size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <MediaUploader 
                      folder="projects" 
                      label="رفع صور المشروع" 
                      accept="image/*" 
                      multiple={true} 
                      onUploaded={async (url) => {
                        if (isExisting) {
                          await addMediaToProject(url, { name: "image", type: "image/jpeg" } as File);
                        } else {
                          setTempGallery(prev => [...prev, url]);
                        }
                      }} 
                    />
                    <p style={{ fontSize: "0.65rem", color: "#999", marginTop: 8 }}>
                      * أول صورة يتم رفعها ستُعتبر تلقائياً صورة الغلاف للمشروع عند الحفظ. يمكنك سحب الصور وتغيير ترتيبها بالأسهم.
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="form-group"><label>رابط خارجي</label><Input value={editing.external_url || ""} onChange={e => setEditing({ ...editing, external_url: e.target.value })} dir="ltr" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الترتيب</label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: e.target.value })} /></div>
              <div className="form-group"><label>الحالة</label>
                <select value={editing.visible ? "1" : "0"} onChange={e => setEditing({ ...editing, visible: e.target.value === "1" })}
                  style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.85rem" }}>
                  <option value="1">ظاهر</option><option value="0">مخفي</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </EditDrawer>

      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} />

      {/* Video Preview Modal */}
      {videoPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.9)", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => setVideoPreview(null)}>
          <video src={videoPreview} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
