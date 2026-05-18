import { useEffect, useState } from "react";
import { Search, Copy, Trash2, Image as ImageIcon, Film, FileText } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import MediaUploader from "@/components/admin/MediaUploader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export default function MediaLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() { const { data } = await db.from("media_assets").select("*").order("created_at", { ascending: false }).limit(500); setAssets(data || []); }

  const filtered = assets.filter(a => {
    if (filter === "image" && a.media_type !== "image") return false;
    if (filter === "video" && a.media_type !== "video") return false;
    if (filter === "pdf" && a.media_type !== "pdf") return false;
    if (search && !((a.title || "") + (a.path || "")).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function doDelete() {
    if (!deleteId) return;
    await db.from("media_assets").delete().eq("id", deleteId);
    toast.success("تم الحذف"); await load(); setDeleteId(null);
  }

  const icon = (type: string) => type === "video" ? <Film size={32} /> : type === "pdf" ? <FileText size={32} /> : <ImageIcon size={32} />;

  return (
    <>
      <AdminHeader title="مكتبة الميديا" subtitle="إدارة الصور والفيديوهات" />
      <div className="admin-content">
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-body">
            <MediaUploader folder="library" label="رفع ملف جديد" onUploaded={() => load()} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#aaa" }} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ paddingInlineStart: 36 }} />
          </div>
          {["all", "image", "video", "pdf"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`admin-tab ${filter === f ? "active" : ""}`} style={{ borderBottom: "none", padding: "0.5rem 1rem" }}>
              {f === "all" ? "الكل" : f === "image" ? "صور" : f === "video" ? "فيديو" : "PDF"} ({assets.filter(a => f === "all" || a.media_type === f).length})
            </button>
          ))}
        </div>

        <div className="media-grid">
          {filtered.map(a => (
            <div key={a.id} className="media-thumb">
              {a.media_type === "image" ? (
                <img src={a.public_url} alt={a.title || ""} />
              ) : a.media_type === "video" ? (
                <video src={a.public_url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#0C363A", color: "#C18556" }}>{icon(a.media_type)}</div>
              )}
              <div className="media-overlay">
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.65rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.title || a.path}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { navigator.clipboard.writeText(a.public_url); toast.success("تم نسخ الرابط"); }}
                      style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><Copy size={12} /></button>
                    <button onClick={() => setDeleteId(a.id)}
                      style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(216, 71, 40,0.8)", border: "none", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>لا توجد ملفات</div>}
      </div>
      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} message="هل تريد حذف هذا الملف؟" />
    </>
  );
}
