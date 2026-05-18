import { useEffect, useState } from "react";
import { 
  Package, Plus, Edit2, Trash2, ChevronDown, ChevronUp, 
  Image as Img, Layers, Settings, Eye, LayoutGrid, Info, FileText
} from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import EditDrawer from "@/components/admin/EditDrawer";
import SaveButton from "@/components/admin/SaveButton";
import MediaUploader from "@/components/admin/MediaUploader";
import MediaPreview from "@/components/admin/MediaPreview";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export default function PackagesManager() {
  const [packages, setPackages] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [optionMedia, setOptionMedia] = useState<any[]>([]);

  // Selection states (for interactive navigation)
  const [activePkgId, setActivePkgId] = useState<string | null>(null);
  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "config">("config");

  // Editing drawers
  const [editPkg, setEditPkg] = useState<any>(null);
  const [editStyle, setEditStyle] = useState<any>(null);
  const [editCat, setEditCat] = useState<any>(null);
  const [editOpt, setEditOpt] = useState<any>(null);
  
  const [busy, setBusy] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ table: string; id: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [a, b, c, d, e] = await Promise.all([
      db.from("packages").select("*").order("sort_order"),
      db.from("package_styles").select("*").order("sort_order"),
      db.from("package_categories").select("*").order("sort_order"),
      db.from("package_options").select("*").order("sort_order"),
      db.from("package_option_media").select("*").order("sort_order"),
    ]);

    const pkgs = a.data || [];
    setPackages(pkgs);
    setStyles(b.data || []);
    setCategories(c.data || []);
    setOptions(d.data || []);
    setOptionMedia(e.data || []);

    // Set default active selections if none chosen
    if (pkgs.length > 0 && !activePkgId) {
      setActivePkgId(pkgs[0].id);
      const firstStyle = (b.data || []).find((s: any) => s.package_id === pkgs[0].id);
      if (firstStyle) setActiveStyleId(firstStyle.id);
    }
  }

  // Auto select first style when active package changes
  useEffect(() => {
    if (activePkgId) {
      const packageStyles = styles.filter(s => s.package_id === activePkgId);
      if (packageStyles.length > 0) {
        // If current activeStyleId is not in the new package's styles, update it
        if (!packageStyles.some(s => s.id === activeStyleId)) {
          setActiveStyleId(packageStyles[0].id);
        }
      } else {
        setActiveStyleId(null);
      }
    }
  }, [activePkgId, styles]);

  async function savePkg(e: React.FormEvent) {
    e.preventDefault();
    if (!editPkg) return;
    setBusy(true);
    try {
      const p = { 
        ...editPkg, 
        sort_order: Number(editPkg.sort_order) || 0,
        features_en: Array.isArray(editPkg.features_en) ? editPkg.features_en : [],
        features_ar: Array.isArray(editPkg.features_ar) ? editPkg.features_ar : []
      };
      const { error } = await db.from("packages").upsert(p, { onConflict: "id" });
      if (error) throw error;
      toast.success("تم حفظ الباقة بنجاح");
      setEditPkg(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveStyle(e: React.FormEvent) {
    e.preventDefault();
    if (!editStyle) return;
    setBusy(true);
    try {
      const { error } = await db.from("package_styles").upsert(editStyle);
      if (error) throw error;
      toast.success("تم حفظ الاستايل بنجاح");
      setEditStyle(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    if (!editCat) return;
    setBusy(true);
    try {
      const { error } = await db.from("package_categories").upsert(editCat);
      if (error) throw error;
      toast.success("تم حفظ التصنيف بنجاح");
      setEditCat(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveOpt(e: React.FormEvent) {
    e.preventDefault();
    if (!editOpt) return;
    setBusy(true);
    try {
      const { error } = await db.from("package_options").upsert(editOpt);
      if (error) throw error;
      toast.success("تم حفظ الخيار بنجاح");
      setEditOpt(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!deleteAction) return;
    const { error } = await db.from(deleteAction.table).delete().eq("id", deleteAction.id);
    if (error) {
      toast.error("فشل الحذف. قد يكون العنصر مرتبطاً ببيانات أخرى.");
    } else {
      toast.success("تم الحذف بنجاح");
      await load();
    }
    setDeleteAction(null);
  }

  async function addOptMedia(optId: string, url: string) {
    const { error } = await db.from("package_option_media").insert({ 
      option_id: optId, 
      url, 
      media_type: "image",
      sort_order: optionMedia.filter(m => m.option_id === optId).length 
    });
    if (error) toast.error(error.message);
    else await load();
  }

  async function removeOptMedia(id: string) {
    const { error } = await db.from("package_option_media").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  }

  async function makeMainImage(mediaItem: any) {
    if (!editOpt) return;
    setBusy(true);
    try {
      const oldMainUrl = editOpt.image_url;
      const newMainUrl = mediaItem.url;

      // 1. Update the option's main image in database
      const { error: optErr } = await db
        .from("package_options")
        .update({ image_url: newMainUrl })
        .eq("id", editOpt.id);
      if (optErr) throw optErr;

      // 2. Swap old main image to replace the new main image's old place in gallery
      if (oldMainUrl) {
        const { error: mediaErr } = await db
          .from("package_option_media")
          .update({ url: oldMainUrl })
          .eq("id", mediaItem.id);
        if (mediaErr) throw mediaErr;
      } else {
        // If there was no old main image, just delete this item from the gallery
        const { error: delErr } = await db
          .from("package_option_media")
          .delete()
          .eq("id", mediaItem.id);
        if (delErr) throw delErr;
      }

      toast.success("تم تعيين الصورة كصورة رئيسية");
      setEditOpt({ ...editOpt, image_url: newMainUrl });
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function moveGalleryItem(idx: number, direction: "prev" | "next") {
    if (!editOpt) return;
    const mediaItems = optionMedia.filter(m => m.option_id === editOpt.id).sort((a, b) => a.sort_order - b.sort_order);
    const targetIdx = direction === "prev" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= mediaItems.length) return;

    setBusy(true);
    try {
      const currentItem = mediaItems[idx];
      const targetItem = mediaItems[targetIdx];

      // Swap sort_order
      const { error: err1 } = await db.from("package_option_media").update({ sort_order: targetItem.sort_order }).eq("id", currentItem.id);
      if (err1) throw err1;

      const { error: err2 } = await db.from("package_option_media").update({ sort_order: currentItem.sort_order }).eq("id", targetItem.id);
      if (err2) throw err2;

      toast.success("تم إعادة ترتيب الصور");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const activePackage = packages.find(p => p.id === activePkgId);
  const packageStyles = styles.filter(s => s.package_id === activePkgId);
  const activeStyle = packageStyles.find(s => s.id === activeStyleId) || packageStyles[0];
  const styleCategories = activeStyle ? categories.filter(c => c.style_id === activeStyle.id) : [];

  return (
    <>
      <AdminHeader 
        title="إدارة الباقات المتطورة" 
        subtitle="تحكم كامل بالباقات، الاستايلات، التصنيفات، والخيارات المعروضة للعميل" 
        previewUrl="/packages"
        actions={
          <button 
            onClick={() => setEditPkg({ id: "", name_en: "", name_ar: "", description_en: "", description_ar: "", price_label: "", unit_label_ar: "للمتر", features_en: [], features_ar: [], sort_order: packages.length, published: true, featured: false })} 
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#073b35", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
          >
            <Plus size={16} /> إضافة باقة جديدة
          </button>
        } 
      />

      <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Navigation Selector for Active Package */}
        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {packages.map((pkg) => {
            const isActive = pkg.id === activePkgId;
            return (
              <button
                key={pkg.id}
                onClick={() => {
                  setActivePkgId(pkg.id);
                  const pkgSt = styles.filter(s => s.package_id === pkg.id);
                  if (pkgSt.length > 0) setActiveStyleId(pkgSt[0].id);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "12px",
                  background: isActive ? "#073b35" : "#fff",
                  color: isActive ? "#fff" : "#444",
                  border: isActive ? "none" : "1px solid #e5e0d5",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isActive ? "0 4px 12px rgba(7,59,53,0.15)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <Package size={16} style={{ color: isActive ? "#c9964c" : "#777" }} />
                <span>{pkg.name_ar}</span>
                {pkg.badge_ar && (
                  <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: "10px", background: isActive ? "rgba(255,255,255,0.15)" : "rgba(193,150,76,0.15)", color: isActive ? "#fff" : "#c9964c" }}>
                    {pkg.badge_ar}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activePackage ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            
            {/* Active Package Banner / Control Panel */}
            <div className="admin-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderBottom: "1px solid #f0ece4", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {activePackage.cover_url && (
                    <img 
                      src={activePackage.cover_url} 
                      alt="" 
                      style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e0d5" }} 
                    />
                  )}
                  <div>
                    <h2 style={{ fontSize: "1.25rem", color: "#073b35", fontWeight: 800, margin: 0 }}>{activePackage.name_ar} ({activePackage.name_en})</h2>
                    <p style={{ fontSize: "0.8rem", color: "#777", margin: "4px 0 0 0" }}>{activePackage.price_label} / {activePackage.unit_label_ar || "متر"} • {activePackage.featured ? "باقة مميزة ⭐" : "باقة قياسية"}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => setEditPkg({ ...activePackage })}
                    className="btn-luxe"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", background: "#fff", color: "#073b35", border: "1px solid #e5e0d5" }}
                  >
                    <Edit2 size={12} /> تعديل بيانات الباقة
                  </button>
                  <button 
                    onClick={() => setDeleteAction({ table: "packages", id: activePackage.id })}
                    className="btn-luxe"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
                  >
                    <Trash2 size={12} /> حذف الباقة بالكامل
                  </button>
                </div>
              </div>

              {/* Layout Switcher (Info vs Configuration) */}
              <div style={{ display: "flex", borderBottom: "1px solid #f0ece4", padding: "0 1.25rem" }}>
                <button 
                  onClick={() => setActiveTab("config")}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "config" ? "2px solid #c9964c" : "2px solid transparent",
                    color: activeTab === "config" ? "#073b35" : "#777",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <Settings size={14} style={{ verticalAlign: -2, marginInlineEnd: 6 }} />
                  تخصيص بنود التشطيب والمواد
                </button>
                <button 
                  onClick={() => setActiveTab("info")}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "info" ? "2px solid #c9964c" : "2px solid transparent",
                    color: activeTab === "info" ? "#073b35" : "#777",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <Info size={14} style={{ verticalAlign: -2, marginInlineEnd: 6 }} />
                  معلومات ومميزات الباقة
                </button>
              </div>

              {/* Tab 1: Info Screen */}
              {activeTab === "info" && (
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#073b35", fontSize: "0.85rem", marginBottom: 6 }}>الوصف عربي</h4>
                      <div style={{ padding: "1rem", background: "#faf8f4", border: "1px solid #eae5dc", borderRadius: "8px", fontSize: "0.8rem", color: "#555" }}>
                        {activePackage.description_ar || "لا يوجد وصف"}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#073b35", fontSize: "0.85rem", marginBottom: 6 }}>Description (EN)</h4>
                      <div style={{ padding: "1rem", background: "#faf8f4", border: "1px solid #eae5dc", borderRadius: "8px", fontSize: "0.8rem", color: "#555" }}>
                        {activePackage.description_en || "No English description available"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontWeight: 700, color: "#073b35", fontSize: "0.85rem", marginBottom: 8 }}>مميزات الباقة (Features)</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#999", display: "block", marginBottom: "4px" }}>المميزات بالعربية</span>
                        <ul style={{ paddingInlineStart: "1.25rem", margin: 0, fontSize: "0.8rem", color: "#555", lineHeight: "1.6" }}>
                          {activePackage.features_ar?.map((feat: string, i: number) => <li key={i}>{feat}</li>) || <li>لا توجد مميزات</li>}
                        </ul>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "#999", display: "block", marginBottom: "4px" }}>English Features</span>
                        <ul style={{ paddingInlineStart: "1.25rem", margin: 0, fontSize: "0.8rem", color: "#555", lineHeight: "1.6" }}>
                          {activePackage.features_en?.map((feat: string, i: number) => <li key={i}>{feat}</li>) || <li>No features</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Configurator Tree Screen */}
              {activeTab === "config" && (
                <div style={{ padding: "1.25rem", background: "#faf8f4" }}>
                  
                  {/* Style Tabs Header (Interactive Switch) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e0d5", paddingBottom: "8px", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#777", marginInlineEnd: "8px" }}>الاستايل النشط:</span>
                      {packageStyles.map((st) => {
                        const isStyleActive = st.id === activeStyleId;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setActiveStyleId(st.id)}
                            style={{
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                              background: isStyleActive ? "#c9964c" : "#fff",
                              color: isStyleActive ? "#fff" : "#444",
                              border: isStyleActive ? "none" : "1px solid #e5e0d5",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            {st.name_ar}
                          </button>
                        );
                      })}
                      
                      <button
                        type="button"
                        onClick={() => setEditStyle({ package_id: activePackage.id, name_en: "", name_ar: "", sort_order: packageStyles.length, published: true })}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "8px",
                          background: "#073b3510",
                          color: "#073b35",
                          border: "1px dashed #073b3540",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Plus size={12} /> إضافة استايل
                      </button>
                    </div>

                    {activeStyle && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button 
                          type="button"
                          onClick={() => setEditStyle({ ...activeStyle })}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.7rem", color: "#666" }}
                          title="تعديل اسم الاستايل"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeleteAction({ table: "package_styles", id: activeStyle.id })}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #fecaca", background: "#fff", cursor: "pointer", fontSize: "0.7rem", color: "#dc2626" }}
                          title="حذف الاستايل بالكامل"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {activeStyle ? (
                    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.25rem" }}>
                      
                      {/* Sidebar Categories List */}
                      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e0d5", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: "6px" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#c9964c" }}>بنود التشطيب (الأقسام)</span>
                          <button
                            type="button"
                            onClick={() => setEditCat({ style_id: activeStyle.id, slug: "", name_en: "", name_ar: "", sort_order: styleCategories.length, published: true })}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#073b35",
                              color: "#fff",
                              border: "none",
                              fontSize: "0.65rem",
                              cursor: "pointer"
                            }}
                          >
                            + إضافة بند
                          </button>
                        </div>

                        {styleCategories.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "1.5rem", color: "#aaa", fontSize: "0.75rem" }}>لا توجد بنود متاحة</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {styleCategories.map((cat) => {
                              const catOpts = options.filter(o => o.category_id === cat.id);
                              return (
                                <div 
                                  key={cat.id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "8px",
                                    background: "#faf8f4",
                                    border: "1px solid #eae5dc",
                                    fontSize: "0.8rem"
                                  }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 700, color: "#073b35" }}>{cat.name_ar}</span>
                                    <span style={{ fontSize: "0.65rem", color: "#888" }}>({catOpts.length} خيار متاح)</span>
                                  </div>
                                  <div style={{ display: "flex", gap: "3px" }}>
                                    <button 
                                      type="button"
                                      onClick={() => setEditCat({ ...cat })}
                                      style={{ border: "none", background: "none", cursor: "pointer", color: "#666", padding: "2px" }}
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setDeleteAction({ table: "package_categories", id: cat.id })}
                                      style={{ border: "none", background: "none", cursor: "pointer", color: "#dc2626", padding: "2px" }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Main Dynamic View of Categories & Options Grid */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {styleCategories.map((cat) => {
                          const catOpts = options.filter(o => o.category_id === cat.id);
                          return (
                            <div key={cat.id} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e0d5", padding: "1.25rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: "8px", marginBottom: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c9964c" }} />
                                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#073b35", margin: 0 }}>{cat.name_ar} ({cat.name_en})</h3>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setEditOpt({ category_id: cat.id, name_en: "", name_ar: "", description_en: "", description_ar: "", image_url: "", sort_order: catOpts.length, published: true })}
                                  style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", background: "#c9964c", color: "#fff", border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                                >
                                  + إضافة خيار جديد لـ {cat.name_ar}
                                </button>
                              </div>

                              {catOpts.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "0.8rem", border: "1px dashed #e5e0d5", borderRadius: "8px" }}>
                                  لا توجد خيارات مضافة بعد لهذا البند. اضغط على الزر بالأعلى لإضافة خامات وصور.
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                                  {catOpts.map((opt) => {
                                    const mediaList = optionMedia.filter(m => m.option_id === opt.id);
                                    return (
                                      <div 
                                        key={opt.id} 
                                        style={{ 
                                          background: "#fff", 
                                          borderRadius: "10px", 
                                          border: "1px solid #e5e0d5", 
                                          overflow: "hidden", 
                                          display: "flex", 
                                          flexDirection: "column", 
                                          justifyContent: "space-between",
                                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                                        }}
                                      >
                                        <div style={{ height: "130px", background: "#eee", position: "relative" }}>
                                          {opt.image_url ? (
                                            <img 
                                              src={opt.image_url} 
                                              alt="" 
                                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            />
                                          ) : (
                                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#bbb" }}>
                                              <Img size={32} />
                                            </div>
                                          )}
                                          <div style={{ position: "absolute", bottom: "8px", insetInlineStart: "8px", background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.6rem" }}>
                                            {mediaList.length + 1} صور
                                          </div>
                                        </div>

                                        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#073b35", margin: 0 }}>{opt.name_ar}</h4>
                                          </div>
                                          <p style={{ fontSize: "0.7rem", color: "#777", margin: 0, height: "32px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {opt.description_ar || "لا يوجد وصف عربي"}
                                          </p>

                                          <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.5rem", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: "2px" }}>
                                              <button 
                                                type="button"
                                                onClick={() => setEditOpt({ ...opt })}
                                                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "2px" }}
                                              >
                                                <Edit2 size={10} /> تعديل وخامات وصور
                                              </button>
                                            </div>
                                            <button 
                                              type="button"
                                              onClick={() => setDeleteAction({ table: "package_options", id: opt.id })}
                                              style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", padding: "4px" }}
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #e5e0d5" }}>
                      <Layers size={40} style={{ color: "#c9964c", opacity: 0.3, marginBottom: "12px" }} />
                      <h4 style={{ color: "#444", fontWeight: 700 }}>لم تضف أي استايلات تشطيب لهذه الباقة بعد</h4>
                      <p style={{ fontSize: "0.8rem", color: "#777", maxWidth: "340px", margin: "8px auto" }}>
                        الاستايلات تسمح للعميل بالاختيار بين أنواع تصاميم مختلفة (كلاسيك، مودرن، إلخ) للباقة نفسها.
                      </p>
                      <button 
                        type="button"
                        onClick={() => setEditStyle({ package_id: activePackage.id, name_en: "", name_ar: "", sort_order: 0, published: true })}
                        style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", background: "#073b35", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}
                      >
                        + إضافة أول استايل الآن
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 16 }}>
            <Package size={48} style={{ color: "#c9964c", opacity: 0.3, marginBottom: 16 }} />
            <p style={{ color: "#666", fontWeight: 700 }}>لم يتم إضافة أي باقات بعد</p>
          </div>
        )}

      </div>

      {/* ─── Drawers / Modals ─── */}

      {/* Package Modal */}
      <EditDrawer 
        open={!!editPkg} 
        title={editPkg?.id && packages.find(p => p.id === editPkg.id) ? "تعديل الباقة" : "إضافة باقة جديدة"} 
        onClose={() => setEditPkg(null)} 
        width={600}
        footer={<SaveButton loading={busy} label="حفظ الباقة" onClick={() => (document.getElementById("pkg-form") as HTMLFormElement)?.requestSubmit()} />}
      >
        {editPkg && (
          <form id="pkg-form" onSubmit={savePkg} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>رمز الباقة الفريد (ID) *</label>
              <Input 
                value={editPkg.id} 
                onChange={e => setEditPkg({ ...editPkg, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })} 
                required 
                dir="ltr" 
                placeholder="مثال: economy, gold, luxury"
                disabled={!!packages.find(p => p.id === editPkg.id)} 
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>الاسم بالكامل (عربي) *</label>
                <Input value={editPkg.name_ar} onChange={e => setEditPkg({ ...editPkg, name_ar: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Name (English) *</label>
                <Input value={editPkg.name_en} onChange={e => setEditPkg({ ...editPkg, name_en: e.target.value })} required dir="ltr" />
              </div>
            </div>

            <div className="form-group">
              <label>الوصف القصير باللغة العربية</label>
              <Textarea value={editPkg.description_ar || ""} onChange={e => setEditPkg({ ...editPkg, description_ar: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Short Description (English)</label>
              <Textarea value={editPkg.description_en || ""} onChange={e => setEditPkg({ ...editPkg, description_en: e.target.value })} rows={2} dir="ltr" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>تسمية السعر (مثال: 5,500 ج.م)</label>
                <Input value={editPkg.price_label || ""} onChange={e => setEditPkg({ ...editPkg, price_label: e.target.value })} placeholder="مثال: 4,500 ج.م" />
              </div>
              <div className="form-group">
                <label>وحدة القياس (عربي)</label>
                <Input value={editPkg.unit_label_ar || "للمتر"} onChange={e => setEditPkg({ ...editPkg, unit_label_ar: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>شارة الباقة (عربي)</label>
                <Input value={editPkg.badge_ar || ""} onChange={e => setEditPkg({ ...editPkg, badge_ar: e.target.value })} placeholder="مثال: الأكثر طلباً" />
              </div>
              <div className="form-group">
                <label>Badge (English)</label>
                <Input value={editPkg.badge_en || ""} onChange={e => setEditPkg({ ...editPkg, badge_en: e.target.value })} dir="ltr" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <div className="form-group">
                <label>الترتيب</label>
                <Input type="number" value={editPkg.sort_order} onChange={e => setEditPkg({ ...editPkg, sort_order: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                <input type="checkbox" checked={editPkg.featured} onChange={e => setEditPkg({ ...editPkg, featured: e.target.checked })} id="pkg-featured" />
                <label htmlFor="pkg-featured" style={{ margin: 0, cursor: "pointer" }}>باقة مميزة ⭐</label>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                <input type="checkbox" checked={editPkg.published} onChange={e => setEditPkg({ ...editPkg, published: e.target.checked })} id="pkg-published" />
                <label htmlFor="pkg-published" style={{ margin: 0, cursor: "pointer" }}>منشورة ومتاحة</label>
              </div>
            </div>

            {editPkg.cover_url && <MediaPreview url={editPkg.cover_url} height={120} />}
            <MediaUploader folder="packages" label="صورة غلاف الباقة الأساسية" accept="image/*" onUploaded={url => setEditPkg({ ...editPkg, cover_url: url })} />
          </form>
        )}
      </EditDrawer>

      {/* Style Modal */}
      <EditDrawer 
        open={!!editStyle} 
        title={editStyle?.id ? "تعديل الاستايل" : "إضافة استايل جديد للباقة"} 
        onClose={() => setEditStyle(null)}
        footer={<SaveButton loading={busy} label="حفظ الاستايل" onClick={() => (document.getElementById("style-form") as HTMLFormElement)?.requestSubmit()} />}
      >
        {editStyle && (
          <form id="style-form" onSubmit={saveStyle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>اسم الاستايل (عربي) *</label>
              <Input value={editStyle.name_ar} onChange={e => setEditStyle({ ...editStyle, name_ar: e.target.value })} required placeholder="مثال: كلاسيك هادئ، الترا مودرن" />
            </div>
            <div className="form-group">
              <label>Name (English) *</label>
              <Input value={editStyle.name_en} onChange={e => setEditStyle({ ...editStyle, name_en: e.target.value })} required dir="ltr" placeholder="e.g. Neo Classic, Modern" />
            </div>
            <div className="form-group">
              <label>ترتيب العرض</label>
              <Input type="number" value={editStyle.sort_order} onChange={e => setEditStyle({ ...editStyle, sort_order: Number(e.target.value) })} />
            </div>
          </form>
        )}
      </EditDrawer>

      {/* Category Modal */}
      <EditDrawer 
        open={!!editCat} 
        title={editCat?.id ? "تعديل بند التشطيب" : "إضافة بند تشطيب جديد"} 
        onClose={() => setEditCat(null)}
        footer={<SaveButton loading={busy} label="حفظ البند" onClick={() => (document.getElementById("cat-form") as HTMLFormElement)?.requestSubmit()} />}
      >
        {editCat && (
          <form id="cat-form" onSubmit={saveCat} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>الرمز التعريفي للبند (Slug / Unique Key) *</label>
              <Input value={editCat.slug} onChange={e => setEditCat({ ...editCat, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} required dir="ltr" placeholder="مثال: flooring, wall-paint, ceiling" />
            </div>
            <div className="form-group">
              <label>اسم البند (عربي) *</label>
              <Input value={editCat.name_ar} onChange={e => setEditCat({ ...editCat, name_ar: e.target.value })} required placeholder="مثال: الأرضيات، دهان الحوائط، الأسقف المعلقة" />
            </div>
            <div className="form-group">
              <label>Name (English) *</label>
              <Input value={editCat.name_en} onChange={e => setEditCat({ ...editCat, name_en: e.target.value })} required dir="ltr" placeholder="e.g. Flooring, Wall Finishes" />
            </div>
            <div className="form-group">
              <label>الترتيب</label>
              <Input type="number" value={editCat.sort_order} onChange={e => setEditCat({ ...editCat, sort_order: Number(e.target.value) })} />
            </div>
          </form>
        )}
      </EditDrawer>

      {/* Option Modal */}
      <EditDrawer 
        open={!!editOpt} 
        title={editOpt?.id ? "تعديل خيار المادة وتفاصيلها" : "إضافة خيار تشطيب ومادة جديدة"} 
        onClose={() => setEditOpt(null)} 
        width={580}
        footer={<SaveButton loading={busy} label="حفظ ومتابعة" onClick={() => (document.getElementById("opt-form") as HTMLFormElement)?.requestSubmit()} />}
      >
        {editOpt && (
          <form id="opt-form" onSubmit={saveOpt} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>اسم المادة/الخيار (عربي) *</label>
                <Input value={editOpt.name_ar} onChange={e => setEditOpt({ ...editOpt, name_ar: e.target.value })} required placeholder="مثال: رخام كرارة إيطالي" />
              </div>
              <div className="form-group">
                <label>Name (English) *</label>
                <Input value={editOpt.name_en} onChange={e => setEditOpt({ ...editOpt, name_en: e.target.value })} required dir="ltr" placeholder="e.g. Italian Carrara Marble" />
              </div>
            </div>

            <div className="form-group">
              <label>مواصفات المادة وتفاصيل التنفيذ (عربي)</label>
              <Textarea value={editOpt.description_ar || ""} onChange={e => setEditOpt({ ...editOpt, description_ar: e.target.value })} rows={2} placeholder="مثال: يركب على مونة أسمنتية، ويشمل التلميع وتعبئة الفواصل بجولي إيطالي." />
            </div>
            <div className="form-group">
              <label>Description & Technical specs (English)</label>
              <Textarea value={editOpt.description_en || ""} onChange={e => setEditOpt({ ...editOpt, description_en: e.target.value })} rows={2} dir="ltr" placeholder="Technical instructions..." />
            </div>

            <div className="form-group">
              <label>ترتيب الظهور</label>
              <Input type="number" value={editOpt.sort_order} onChange={e => setEditOpt({ ...editOpt, sort_order: Number(e.target.value) })} />
            </div>

            {/* Unified Media Manager Section */}
            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#073b35", display: "block", marginBottom: "8px" }}>
                ملفات وصور المادة (صورة الغلاف ومعرض الصور)
              </span>

              {/* Upload Dropzone */}
              <MediaUploader 
                folder="option-media" 
                label="تحميل صور المادة (للغلاف والمعرض)" 
                accept="image/*" 
                multiple={!!editOpt.id} 
                onUploaded={async (url) => {
                  if (!editOpt.id) {
                    // Unsaved option: just set locally as main image
                    setEditOpt({ ...editOpt, image_url: url });
                  } else {
                    // Saved option: insert to DB
                    if (!editOpt.image_url) {
                      setEditOpt({ ...editOpt, image_url: url });
                      await db.from("package_options").update({ image_url: url }).eq("id", editOpt.id);
                      await load();
                    } else {
                      await addOptMedia(editOpt.id, url);
                    }
                  }
                }} 
              />

              {/* Unified List of Images */}
              {((editOpt.image_url) || optionMedia.filter(m => m.option_id === editOpt.id).length > 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#777" }}>الترتيب والتحكم بالصور المعروضة:</span>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    
                    {/* 1. Main Image Item */}
                    {editOpt.image_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fffdf9", border: "1px solid #c9964c40", borderRadius: "10px", padding: "8px 12px" }}>
                        <div style={{ width: "65px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #c9964c40", flexShrink: 0 }}>
                          <img src={editOpt.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fcfbfa" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#073b35" }}>الصورة الرئيسية للبند (غلاف الكارت)</span>
                          <span style={{ fontSize: "0.62rem", color: "#c9964c", background: "#c9964c15", padding: "2px 8px", borderRadius: "10px", alignSelf: "flex-start", width: "fit-content" }}>⭐ الصورة الأساسية</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editOpt.id) {
                              setEditOpt({ ...editOpt, image_url: "" });
                            } else {
                              setBusy(true);
                              const { error } = await db.from("package_options").update({ image_url: null }).eq("id", editOpt.id);
                              if (error) toast.error(error.message);
                              else {
                                setEditOpt({ ...editOpt, image_url: "" });
                                await load();
                              }
                              setBusy(false);
                            }
                          }}
                          style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "11px" }}
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* 2. Gallery Image Items */}
                    {editOpt.id && optionMedia.filter(m => m.option_id === editOpt.id)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((m, idx, arr) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fcfbfa", border: "1px solid #e5e0d5", borderRadius: "10px", padding: "8px 12px" }}>
                          <div style={{ width: "65px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #e5e0d5", flexShrink: 0 }}>
                            <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fcfbfa" }} />
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#444" }}>صورة إضافية بداخل المعرض #{idx + 1}</span>
                            
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => makeMainImage(m)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#c9964c",
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0
                                }}
                              >
                                👑 تعيين كصورة رئيسية
                              </button>
                            </div>
                          </div>

                          {/* Reordering and deleting buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveGalleryItem(idx, "prev")}
                              style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                              title="نقل لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => moveGalleryItem(idx, "next")}
                              style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === arr.length - 1 ? "not-allowed" : "pointer", opacity: idx === arr.length - 1 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                              title="نقل لأسفل"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOptMedia(m.id)}
                              style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "10px", marginInlineStart: "6px" }}
                              title="حذف الصورة"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}

                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </EditDrawer>

      <ConfirmDialog open={!!deleteAction} onConfirm={doDelete} onCancel={() => setDeleteAction(null)} />
    </>
  );
}
