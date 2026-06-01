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
import { resolveMediaUrl } from "@/lib/realContent";

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
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  // Editing drawers
  const [editPkg, setEditPkg] = useState<any>(null);
  const [editStyle, setEditStyle] = useState<any>(null);
  const [editCat, setEditCat] = useState<any>(null);
  const [editOpt, setEditOpt] = useState<any>(null);
  
  const [busy, setBusy] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ table: string; id: string } | null>(null);

  function makeSlug(value: string, fallback: string) {
    return (
      String(value || fallback)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || `${fallback}-${Date.now()}`
    );
  }

  function makeUniquePackageId(pkg: any) {
    const base = makeSlug(pkg.name_en || pkg.name_ar, "package");
    let candidate = base;
    let suffix = 2;
    while (packages.some((item) => item.id === candidate && item.id !== pkg.id)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  function makeUniqueCategorySlug(category: any) {
    const base = makeSlug(category.name_en || category.name_ar, "category");
    let candidate = base;
    let suffix = 2;
    while (categories.some((item) => item.style_id === category.style_id && item.slug === candidate && item.id !== category.id)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

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

    const pkgs = (a.data || []).map((pkg: any) => ({
      ...pkg,
      cover_url: resolveMediaUrl(pkg.cover_url) || pkg.cover_url
    }));
    setPackages(pkgs);
    setStyles(b.data || []);
    setCategories(c.data || []);
    const opts = (d.data || []).map((opt: any) => ({
      ...opt,
      image_url: resolveMediaUrl(opt.image_url) || opt.image_url
    }));
    setOptions(opts);
    const media = (e.data || []).map((m: any) => ({
      ...m,
      url: resolveMediaUrl(m.url) || m.url
    }));
    setOptionMedia(media);

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

  // Auto select first category when style changes or categories load
  useEffect(() => {
    if (activeStyleId) {
      const styleCats = categories.filter(c => c.style_id === activeStyleId && c.slug !== "style-preview");
      if (styleCats.length > 0) {
        if (!activeCatId || !styleCats.some(c => c.id === activeCatId)) {
          setActiveCatId(styleCats[0].id);
        }
      } else {
        setActiveCatId(null);
      }
    } else {
      setActiveCatId(null);
    }
  }, [activeStyleId, categories, activeCatId]);

  async function savePkg(e: React.FormEvent) {
    e.preventDefault();
    if (!editPkg) return;
    setBusy(true);
    try {
      const p = { 
        ...editPkg, 
        id: editPkg.id || makeUniquePackageId(editPkg),
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
      // 1. Save style data
      const stylePayload = {
        id: editStyle.id || undefined,
        package_id: editStyle.package_id,
        name_en: editStyle.name_en,
        name_ar: editStyle.name_ar,
        sort_order: Number(editStyle.sort_order) || 0,
        published: editStyle.published ?? true
      };

      const { data: savedStyle, error } = await db
        .from("package_styles")
        .upsert(stylePayload)
        .select()
        .single();
      
      if (error) throw error;
      const styleId = savedStyle.id;

      // 2. Handle cover image via style-preview category (Always ensure category & option exist)
      let previewCat = categories.find(c => c.style_id === styleId && c.slug === "style-preview");
      if (!previewCat) {
        const { data: newCat, error: catErr } = await db
          .from("package_categories")
          .insert({
            style_id: styleId,
            slug: "style-preview",
            name_en: "Style Preview",
            name_ar: "معاينة الاستايل",
            sort_order: 0,
            published: true
          })
          .select()
          .single();
        if (catErr) throw catErr;
        previewCat = newCat;
      }

      const previewOpt = options.find(o => o.category_id === previewCat.id);
      if (previewOpt) {
        const { error: optErr } = await db
          .from("package_options")
          .update({ 
            image_url: editStyle.cover_url || null,
            name_en: "Style Preview Option",
            name_ar: "خيار معاينة الاستايل"
          })
          .eq("id", previewOpt.id);
        if (optErr) throw optErr;
      } else {
        const { error: optErr } = await db
          .from("package_options")
          .insert({
            category_id: previewCat.id,
            name_en: "Style Preview Option",
            name_ar: "خيار معاينة الاستايل",
            image_url: editStyle.cover_url || null,
            sort_order: 0,
            published: true
          });
        if (optErr) throw optErr;
      }

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
      const payload = { ...editCat, slug: editCat.slug || makeUniqueCategorySlug(editCat) };
      const { error } = await db.from("package_categories").upsert(payload);
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
      if (deleteAction.table === "package_categories" && deleteAction.id === activeCatId) {
        setActiveCatId(null);
      }
      await load();
    }
    setDeleteAction(null);
  }

  async function addOptMedia(optId: string, url: string, fileName = "") {
    const { error } = await db.from("package_option_media").insert({ 
      option_id: optId, 
      url, 
      media_type: "image",
      alt_ar: fileName,
      alt_en: fileName,
      sort_order: optionMedia.filter(m => m.option_id === optId).length 
    });
    if (error) toast.error(error.message);
    else await load();
  }

  async function updateOptMediaField(id: string, field: "alt_ar" | "alt_en" | "sort_order", value: string | number) {
    setOptionMedia(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    const { error } = await db.from("package_option_media").update({ [field]: value }).eq("id", id);
    if (error) {
      toast.error("فشل تحديث بيانات الصورة");
      await load();
    }
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

  async function moveCategory(idx: number, direction: "up" | "down") {
    if (!activeStyle) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= styleCategories.length) return;

    setBusy(true);
    try {
      const nextCategories = [...styleCategories];
      const temp = nextCategories[idx];
      nextCategories[idx] = nextCategories[targetIdx];
      nextCategories[targetIdx] = temp;

      const updates = nextCategories.map((cat, index) => {
        const newOrder = (index + 1) * 10;
        return db.from("package_categories").update({ sort_order: newOrder }).eq("id", cat.id);
      });

      await Promise.all(updates);
      toast.success("تم إعادة ترتيب الأقسام بنجاح");
      await load();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إعادة الترتيب");
    } finally {
      setBusy(false);
    }
  }

  async function moveOption(categoryId: string, idx: number, direction: "prev" | "next") {
    const catOpts = options.filter(o => o.category_id === categoryId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const targetIdx = direction === "prev" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= catOpts.length) return;

    setBusy(true);
    try {
      const nextOptions = [...catOpts];
      const temp = nextOptions[idx];
      nextOptions[idx] = nextOptions[targetIdx];
      nextOptions[targetIdx] = temp;

      const updates = nextOptions.map((opt, index) => {
        const newOrder = (index + 1) * 10;
        return db.from("package_options").update({ sort_order: newOrder }).eq("id", opt.id);
      });

      await Promise.all(updates);
      toast.success("تم إعادة ترتيب الخيارات بنجاح");
      await load();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إعادة الترتيب");
    } finally {
      setBusy(false);
    }
  }

  async function ensurePreviewOpt(styleId: string) {
    let pCat = categories.find(c => c.style_id === styleId && c.slug === "style-preview");
    if (!pCat) {
      const { data: newCat, error: catErr } = await db
        .from("package_categories")
        .insert({
          style_id: styleId,
          slug: "style-preview",
          name_en: "Style Preview",
          name_ar: "معاينة الاستايل",
          sort_order: 0,
          published: true
        })
        .select()
        .single();
      if (catErr) throw catErr;
      pCat = newCat;
    }

    let pOpt = options.find(o => o.category_id === pCat.id);
    if (!pOpt) {
      const { data: newOpt, error: optErr } = await db
        .from("package_options")
        .insert({
          category_id: pCat.id,
          name_en: "Style Preview Option",
          name_ar: "خيار معاينة الاستايل",
          image_url: null,
          sort_order: 0,
          published: true
        })
        .select()
        .single();
      if (optErr) throw optErr;
      pOpt = newOpt;
    }
    return pOpt;
  }

  async function makeStyleMainImage(mediaItem: any) {
    if (!editStyle || !editStyle.id) return;
    setBusy(true);
    try {
      const opt = await ensurePreviewOpt(editStyle.id);
      const oldMainUrl = opt.image_url;
      const newMainUrl = mediaItem.url;

      // 1. Update the preview option's main image in database
      const { error: optErr } = await db
        .from("package_options")
        .update({ image_url: newMainUrl })
        .eq("id", opt.id);
      if (optErr) throw optErr;

      // 2. Swap old main image to replace the new main image's old place in gallery
      if (oldMainUrl) {
        const { error: mediaErr } = await db
          .from("package_option_media")
          .update({ url: oldMainUrl })
          .eq("id", mediaItem.id);
        if (mediaErr) throw mediaErr;
      } else {
        const { error: delErr } = await db
          .from("package_option_media")
          .delete()
          .eq("id", mediaItem.id);
        if (delErr) throw delErr;
      }

      toast.success("تم تعيين الصورة كصورة رئيسية للاستايل");
      setEditStyle({ ...editStyle, cover_url: newMainUrl });
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function moveStyleGalleryItem(idx: number, direction: "prev" | "next") {
    if (!previewOpt) return;
    const mediaItems = optionMedia.filter(m => m.option_id === previewOpt.id).sort((a, b) => a.sort_order - b.sort_order);
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

      toast.success("تم إعادة ترتيب صور المعرض");
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
  const styleCategories = activeStyle ? categories.filter(c => c.style_id === activeStyle.id && c.slug !== "style-preview") : [];

  const previewCat = editStyle?.id ? categories.find(c => c.style_id === editStyle.id && c.slug === "style-preview") : null;
  const previewOpt = previewCat ? options.find(o => o.category_id === previewCat.id) : null;
  const previewMedia = previewOpt ? optionMedia.filter(m => m.option_id === previewOpt.id).sort((a, b) => a.sort_order - b.sort_order) : [];

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
                      src={resolveMediaUrl(activePackage.cover_url) || ""} 
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
                        onClick={() => setEditStyle({ package_id: activePackage.id, name_en: "", name_ar: "", sort_order: packageStyles.length, published: true, cover_url: "" })}
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
                          onClick={() => {
                            const previewCat = categories.find(c => c.style_id === activeStyle.id && c.slug === "style-preview");
                            const previewOpt = previewCat ? options.find(o => o.category_id === previewCat.id) : null;
                            setEditStyle({ ...activeStyle, cover_url: previewOpt?.image_url || "" });
                          }}
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      
                      {/* Premium Scrollable Categories Tabs Bar */}
                      <div style={{
                        background: "#fff",
                        borderRadius: "14px",
                        border: "1px solid #eae5dc",
                        padding: "0.85rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                      }}>
                        <div className="premium-scrollbar" style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflowX: "auto", flex: 1, paddingBottom: "4px" }}>
                          {styleCategories.map((cat, idx) => {
                            const isActive = cat.id === activeCatId;
                            const catOpts = options.filter(o => o.category_id === cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCatId(cat.id)}
                                className={`pkg-category-tab-btn ${isActive ? "active" : ""}`}
                              >
                                <span className="badge-num">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span>{cat.name_ar}</span>
                                <span className="count-badge">
                                  {catOpts.length}
                                </span>
                              </button>
                            );
                          })}

                          {/* Add Category Button Inline Styled as dashed Tab */}
                          <button
                            type="button"
                            onClick={() => setEditCat({ style_id: activeStyle.id, slug: "", name_en: "", name_ar: "", sort_order: styleCategories.length, published: true })}
                            style={{
                              padding: "0.55rem 1.1rem",
                              borderRadius: "10px",
                              background: "#073b3505",
                              color: "#073b35",
                              border: "1px dashed #073b3540",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.2s"
                            }}
                          >
                            <Plus size={14} />
                            <span>إضافة بند تشطيب جديد</span>
                          </button>
                        </div>
                      </div>

                      {styleCategories.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #e5e0d5" }}>
                          <Layers size={40} style={{ color: "#c9964c", opacity: 0.3, marginBottom: "12px" }} />
                          <h4 style={{ color: "#444", fontWeight: 700 }}>لم تقم بإضافة أي بنود تشطيب لهذا الاستايل بعد</h4>
                          <p style={{ fontSize: "0.85rem", color: "#777", maxWidth: "380px", margin: "8px auto" }}>
                            أضف بنوداً مثل (الأرضيات، التكييف، الأبواب) لتتيح للعميل اختيار الخامات والمواد المناسبة له.
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditCat({ style_id: activeStyle.id, slug: "", name_en: "", name_ar: "", sort_order: styleCategories.length, published: true })}
                            style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", background: "#073b35", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}
                          >
                            + إضافة أول بند تشطيب الآن
                          </button>
                        </div>
                      ) : (
                        (() => {
                          const activeCategory = styleCategories.find(c => c.id === activeCatId) || styleCategories[0];
                          if (!activeCategory) return null;
                          const catOpts = options.filter(o => o.category_id === activeCategory.id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                          const catIdx = styleCategories.findIndex(c => c.id === activeCategory.id);

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                              {/* Focused Category Control Card */}
                              <div style={{
                                background: "#fff",
                                borderRadius: "14px",
                                border: "1px solid #eae5dc",
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1.25rem",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#c9964c" }} />
                                  <div>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#073b35", margin: 0 }}>
                                      {activeCategory.name_ar}
                                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#777", marginInlineStart: "8px" }}>
                                        ({activeCategory.name_en})
                                      </span>
                                    </h3>
                                    <p style={{ fontSize: "0.72rem", color: "#8a8578", margin: "4px 0 0 0" }}>
                                      {catOpts.length} خيار تشطيب متاح
                                    </p>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                  {/* Reordering Controls */}
                                  <div style={{ display: "flex", gap: "2px", border: "1px solid #e5e0d5", borderRadius: "8px", background: "#faf8f4", padding: "2px" }}>
                                    <button
                                      type="button"
                                      disabled={catIdx === 0}
                                      onClick={() => moveCategory(catIdx, "up")}
                                      style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: catIdx === 0 ? "not-allowed" : "pointer",
                                        color: "#555",
                                        display: "grid",
                                        placeItems: "center",
                                        opacity: catIdx === 0 ? 0.3 : 1,
                                        transition: "all 0.2s"
                                      }}
                                      title="ترتيب البند للأمام/أعلى"
                                    >
                                      <ChevronUp size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={catIdx === styleCategories.length - 1}
                                      onClick={() => moveCategory(catIdx, "down")}
                                      style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: catIdx === styleCategories.length - 1 ? "not-allowed" : "pointer",
                                        color: "#555",
                                        display: "grid",
                                        placeItems: "center",
                                        opacity: catIdx === styleCategories.length - 1 ? 0.3 : 1,
                                        transition: "all 0.2s"
                                      }}
                                      title="ترتيب البند للخلف/أسفل"
                                    >
                                      <ChevronDown size={16} />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setEditCat({ ...activeCategory })}
                                    style={{
                                      padding: "0.5rem 1rem",
                                      borderRadius: "8px",
                                      border: "1px solid #eae5dc",
                                      background: "#fff",
                                      color: "#073b35",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    <Edit2 size={13} />
                                    تعديل اسم البند
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteAction({ table: "package_categories", id: activeCategory.id })}
                                    style={{
                                      padding: "0.5rem 1rem",
                                      borderRadius: "8px",
                                      border: "1px solid #fecaca",
                                      background: "#fff",
                                      color: "#dc2626",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    حذف البند بالكامل
                                  </button>

                                  <button 
                                    type="button"
                                    onClick={() => setEditOpt({ category_id: activeCategory.id, name_en: "", name_ar: "", description_en: "", description_ar: "", image_url: "", sort_order: catOpts.length, published: true })}
                                    style={{
                                      padding: "0.55rem 1.25rem",
                                      borderRadius: "8px",
                                      background: "#073b35",
                                      color: "#fff",
                                      border: "none",
                                      fontSize: "0.78rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      boxShadow: "0 4px 12px rgba(7,59,53,0.15)",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    <Plus size={14} style={{ color: "#c9964c" }} />
                                    إضافة خيار/مادة جديدة لـ {activeCategory.name_ar}
                                  </button>
                                </div>
                              </div>

                              {/* Options Grid */}
                              {catOpts.length === 0 ? (
                                <div style={{
                                  textAlign: "center",
                                  padding: "3.5rem 2rem",
                                  color: "#999",
                                  fontSize: "0.82rem",
                                  border: "1px dashed #eae5dc",
                                  background: "#fff",
                                  borderRadius: "12px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px"
                                }}>
                                  <Img size={36} style={{ color: "#c9964c", opacity: 0.4 }} />
                                  <span>لا توجد خيارات مضافة بعد لهذا البند.</span>
                                  <span style={{ fontSize: "0.72rem", color: "#bbb" }}>اضغط على زر الإضافة بالأعلى لتنزيل خامات وصور ومعلومات المواد.</span>
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
                                  {catOpts.map((opt, idx) => {
                                    const mediaList = optionMedia.filter(m => m.option_id === opt.id);
                                    return (
                                      <div 
                                        key={opt.id} 
                                        style={{ 
                                          background: "#fff", 
                                          borderRadius: "12px", 
                                          border: "1px solid #eae5dc", 
                                          overflow: "hidden", 
                                          display: "flex", 
                                          flexDirection: "column", 
                                          justifyContent: "space-between",
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                          transition: "transform 0.2s, box-shadow 0.2s"
                                        }}
                                        className="opt-card"
                                      >
                                        <div style={{ height: "150px", background: "#faf8f4", position: "relative", borderBottom: "1px solid #eae5dc" }}>
                                          {opt.image_url ? (
                                            <img 
                                              src={resolveMediaUrl(opt.image_url) || ""} 
                                              alt="" 
                                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            />
                                          ) : (
                                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#bbb" }}>
                                              <Img size={36} style={{ opacity: 0.3 }} />
                                            </div>
                                          )}
                                          <div style={{
                                            position: "absolute",
                                            bottom: "8px",
                                            insetInlineStart: "8px",
                                            background: "rgba(7, 59, 53, 0.8)",
                                            backdropFilter: "blur(4px)",
                                            color: "#fff",
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            fontSize: "0.62rem",
                                            fontWeight: 700
                                          }}>
                                            {mediaList.length + 1} صور
                                          </div>
                                        </div>

                                        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#073b35", margin: 0 }}>{opt.name_ar}</h4>
                                          </div>
                                          <p style={{ fontSize: "0.72rem", color: "#777", margin: 0, height: "36px", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.4" }}>
                                            {opt.description_ar || "لا يوجد وصف عربي"}
                                          </p>

                                          <div style={{ display: "flex", gap: "4px", alignItems: "center", borderTop: "1px solid #f0ece4", paddingTop: "0.6rem", marginTop: "4px" }}>
                                            <span style={{ fontSize: "0.68rem", color: "#888", marginInlineEnd: "auto" }}>ترتيب الخيار:</span>
                                            
                                            <div style={{ display: "flex", gap: "2px", background: "#faf8f4", border: "1px solid #eae5dc", borderRadius: "6px", padding: "1px" }}>
                                              <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => moveOption(activeCategory.id, idx, "prev")}
                                                style={{
                                                  width: "24px",
                                                  height: "24px",
                                                  borderRadius: "4px",
                                                  border: "none",
                                                  background: idx === 0 ? "transparent" : "#fff",
                                                  cursor: idx === 0 ? "not-allowed" : "pointer",
                                                  opacity: idx === 0 ? 0.3 : 1,
                                                  color: "#555",
                                                  fontSize: "0.62rem",
                                                  display: "grid",
                                                  placeItems: "center"
                                                }}
                                                title="تحريك للأعلى"
                                              >
                                                <ChevronUp size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                disabled={idx === catOpts.length - 1}
                                                onClick={() => moveOption(activeCategory.id, idx, "next")}
                                                style={{
                                                  width: "24px",
                                                  height: "24px",
                                                  borderRadius: "4px",
                                                  border: "none",
                                                  background: idx === catOpts.length - 1 ? "transparent" : "#fff",
                                                  cursor: idx === catOpts.length - 1 ? "not-allowed" : "pointer",
                                                  opacity: idx === catOpts.length - 1 ? 0.3 : 1,
                                                  color: "#555",
                                                  fontSize: "0.62rem",
                                                  display: "grid",
                                                  placeItems: "center"
                                                }}
                                                title="تحريك للأسفل"
                                               >
                                                 <ChevronDown size={14} />
                                              </button>
                                            </div>
                                          </div>

                                          <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.6rem", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <button 
                                              type="button"
                                              onClick={() => setEditOpt({ ...opt })}
                                              style={{
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                border: "1px solid #eae5dc",
                                                background: "#fff",
                                                cursor: "pointer",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                                color: "#073b35",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                transition: "all 0.2s"
                                              }}
                                            >
                                              <Edit2 size={11} style={{ color: "#c9964c" }} />
                                              تعديل الخامات والصور
                                            </button>
                                            
                                            <button 
                                              type="button"
                                              onClick={() => setDeleteAction({ table: "package_options", id: opt.id })}
                                              style={{
                                                width: "26px",
                                                height: "26px",
                                                borderRadius: "6px",
                                                border: "1px solid #fecaca",
                                                background: "#fff",
                                                color: "#dc2626",
                                                cursor: "pointer",
                                                display: "grid",
                                                placeItems: "center",
                                                transition: "all 0.2s"
                                              }}
                                              title="حذف الخيار"
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
                        })()
                      )}

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
                        onClick={() => setEditStyle({ package_id: activePackage.id, name_en: "", name_ar: "", sort_order: 0, published: true, cover_url: "" })}
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

            {/* Bilingual Features Checklist Editor */}
            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#073b35", display: "block", marginBottom: "0.75rem" }}>
                قائمة مميزات الباقة بالتفصيل (Features Checklist)
              </span>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Arabic Features Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c9964c" }}>المميزات بالعربية</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(editPkg.features_ar || []).map((feat: string, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Input 
                          value={feat} 
                          onChange={(e) => {
                            const newFeatures = [...(editPkg.features_ar || [])];
                            newFeatures[idx] = e.target.value;
                            setEditPkg({ ...editPkg, features_ar: newFeatures });
                          }}
                          placeholder={`ميزة #${idx + 1}`}
                          style={{ height: 32, fontSize: "0.75rem" }}
                        />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const newFeatures = [...(editPkg.features_ar || [])];
                            const temp = newFeatures[idx];
                            newFeatures[idx] = newFeatures[idx - 1];
                            newFeatures[idx - 1] = temp;
                            setEditPkg({ ...editPkg, features_ar: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="نقل لأعلى"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === (editPkg.features_ar || []).length - 1}
                          onClick={() => {
                            if (idx === (editPkg.features_ar || []).length - 1) return;
                            const newFeatures = [...(editPkg.features_ar || [])];
                            const temp = newFeatures[idx];
                            newFeatures[idx] = newFeatures[idx + 1];
                            newFeatures[idx + 1] = temp;
                            setEditPkg({ ...editPkg, features_ar: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === (editPkg.features_ar || []).length - 1 ? "not-allowed" : "pointer", opacity: idx === (editPkg.features_ar || []).length - 1 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="نقل لأسفل"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = (editPkg.features_ar || []).filter((_: any, i: number) => i !== idx);
                            setEditPkg({ ...editPkg, features_ar: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="حذف الميزة"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFeatures = [...(editPkg.features_ar || []), ""];
                      setEditPkg({ ...editPkg, features_ar: newFeatures });
                    }}
                    style={{
                      padding: "0.4rem",
                      borderRadius: "6px",
                      background: "#073b350a",
                      color: "#073b35",
                      border: "1px dashed #073b3530",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "4px",
                      textAlign: "center"
                    }}
                  >
                    + إضافة ميزة بالعربية
                  </button>
                </div>

                {/* English Features Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} dir="ltr">
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c9964c", textAlign: "left" }}>Features in English</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(editPkg.features_en || []).map((feat: string, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Input 
                          value={feat} 
                          onChange={(e) => {
                            const newFeatures = [...(editPkg.features_en || [])];
                            newFeatures[idx] = e.target.value;
                            setEditPkg({ ...editPkg, features_en: newFeatures });
                          }}
                          placeholder={`Feature #${idx + 1}`}
                          style={{ height: 32, fontSize: "0.75rem" }}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const newFeatures = [...(editPkg.features_en || [])];
                            const temp = newFeatures[idx];
                            newFeatures[idx] = newFeatures[idx - 1];
                            newFeatures[idx - 1] = temp;
                            setEditPkg({ ...editPkg, features_en: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === (editPkg.features_en || []).length - 1}
                          onClick={() => {
                            if (idx === (editPkg.features_en || []).length - 1) return;
                            const newFeatures = [...(editPkg.features_en || [])];
                            const temp = newFeatures[idx];
                            newFeatures[idx] = newFeatures[idx + 1];
                            newFeatures[idx + 1] = temp;
                            setEditPkg({ ...editPkg, features_en: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === (editPkg.features_en || []).length - 1 ? "not-allowed" : "pointer", opacity: idx === (editPkg.features_en || []).length - 1 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = (editPkg.features_en || []).filter((_: any, i: number) => i !== idx);
                            setEditPkg({ ...editPkg, features_en: newFeatures });
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "10px" }}
                          title="Delete Feature"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFeatures = [...(editPkg.features_en || []), ""];
                      setEditPkg({ ...editPkg, features_en: newFeatures });
                    }}
                    style={{
                      padding: "0.4rem",
                      borderRadius: "6px",
                      background: "#073b350a",
                      color: "#073b35",
                      border: "1px dashed #073b3530",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "4px",
                      textAlign: "center"
                    }}
                  >
                    + Add Feature in English
                  </button>
                </div>
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

            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#073b35", display: "block", marginBottom: "8px" }}>
                صورة غلاف الموديل/الاستايل
              </span>
              {editStyle.cover_url && <MediaPreview url={editStyle.cover_url} height={120} />}
              <MediaUploader 
                folder="style-covers" 
                label="تحميل صورة الغلاف" 
                accept="image/*" 
                onUploaded={url => setEditStyle({ ...editStyle, cover_url: url })} 
              />
            </div>

            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#073b35", display: "block", marginBottom: "8px" }}>
                معرض صور معاينة الاستايل (Style Preview Gallery)
              </span>
              
              {!editStyle.id ? (
                <div style={{ padding: "10px", background: "#faf8f4", border: "1px dashed #eae5dc", borderRadius: "8px", fontSize: "0.74rem", color: "#666", textAlign: "center" }}>
                  يمكنك إضافة وإدارة صور معرض المعاينة الخاصة بالاستايل بعد حفظ الاستايل أولاً.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <MediaUploader 
                    folder="style-media" 
                    label="تحميل صور معرض الاستايل" 
                    accept="image/*" 
                    multiple={true} 
                    onUploaded={async (url, file) => {
                      const opt = await ensurePreviewOpt(editStyle.id);
                      await addOptMedia(opt.id, url, file.name);
                    }} 
                  />

                  {previewMedia.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderBottom: "1px solid #eae5dc", paddingBottom: "6px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#073b35" }}>صور المعرض الإضافية</span>
                        <span style={{ fontSize: "0.65rem", color: "#8a8578" }}>
                          الأسماء المدخلة تظهر على الصور للعميل أثناء استعراض تفاصيل الاستايل.
                        </span>
                      </div>

                      {previewMedia.map((m, idx, arr) => (
                        <div key={m.id} style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "10px", 
                          background: "#fdfdfb", 
                          border: "1px solid #e2dcd0", 
                          borderRadius: "12px", 
                          padding: "12px 14px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px dashed #eae5dc", paddingBottom: "8px" }}>
                            <div style={{ width: "80px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid #d4ceb8", flexShrink: 0 }}>
                              <img src={resolveMediaUrl(m.url) || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", background: "#f5f5f5" }} />
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#073b35" }}>
                                صورة معرض #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => makeStyleMainImage(m)}
                                style={{
                                  background: "rgba(193, 150, 76, 0.1)",
                                  border: "1px solid rgba(193, 150, 76, 0.3)",
                                  color: "#c9964c",
                                  borderRadius: "6px",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: "3px 8px",
                                  width: "fit-content",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "3px"
                                }}
                              >
                                👑 تعيين كصورة غلاف للاستايل
                              </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveStyleGalleryItem(idx, "prev")}
                                style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                                title="نقل لأعلى"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => moveStyleGalleryItem(idx, "next")}
                                style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === arr.length - 1 ? "not-allowed" : "pointer", opacity: idx === arr.length - 1 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                                title="نقل لأسفل"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => removeOptMedia(m.id)}
                                style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "10px", marginInlineStart: "6px" }}
                                title="حذف الصورة"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 65px", gap: 10 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                الاسم على الصورة (عربي) *
                              </label>
                              <Input
                                value={m.alt_ar || ""}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, alt_ar: e.target.value } : item))}
                                onBlur={e => updateOptMediaField(m.id, "alt_ar", e.target.value)}
                                placeholder="مثال: مودرن - 01"
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff" }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                Text on image (English) *
                              </label>
                              <Input
                                value={m.alt_en || ""}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, alt_en: e.target.value } : item))}
                                onBlur={e => updateOptMediaField(m.id, "alt_en", e.target.value)}
                                placeholder="e.g. Modern - 01"
                                dir="ltr"
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff" }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                الترتيب
                              </label>
                              <Input
                                type="number"
                                value={m.sort_order ?? 0}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, sort_order: Number(e.target.value) } : item))}
                                onBlur={e => updateOptMediaField(m.id, "sort_order", Number(e.target.value) || 0)}
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff", textAlign: "center" }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                <span style={{ fontSize: "0.68rem", color: "#8a8578", display: "block", marginTop: "4px" }}>
                  سيظهر كاسم رئيسي للبند، وأيضاً على الصورة مباشرة إذا لم يكن هناك صور معرض بالأسفل.
                </span>
              </div>
              <div className="form-group">
                <label>Name (English) *</label>
                <Input value={editOpt.name_en} onChange={e => setEditOpt({ ...editOpt, name_en: e.target.value })} required dir="ltr" placeholder="e.g. Italian Carrara Marble" />
                <span style={{ fontSize: "0.68rem", color: "#8a8578", display: "block", marginTop: "4px" }}>
                  Appears as main option name, and directly on the image if no gallery images are added below.
                </span>
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
                onUploaded={async (url, file) => {
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
                      await addOptMedia(editOpt.id, url, file.name);
                    }
                  }
                }} 
              />

              {/* Unified List of Images */}
              {((editOpt.image_url) || optionMedia.filter(m => m.option_id === editOpt.id).length > 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderBottom: "1px solid #eae5dc", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#073b35" }}>عناوين وصور المعرض (الأسماء المعروضة على الصور)</span>
                    <span style={{ fontSize: "0.68rem", color: "#8a8578" }}>
                      هنا يمكنك تعديل الأسماء التي تظهر مباشرة فوق الصور للعميل في الباقات (مثل: Concealed - 101). سيتم حفظ تعديلات الأسماء تلقائياً بمجرد الكتابة والانتقال لحقل آخر.
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {/* 1. Main Image Item */}
                    {editOpt.image_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fffdf9", border: "1px solid #c9964c40", borderRadius: "10px", padding: "10px 14px" }}>
                        <div style={{ width: "80px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid #c9964c40", flexShrink: 0 }}>
                          <img src={resolveMediaUrl(editOpt.image_url) || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", background: "#fcfbfa" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#073b35" }}>الصورة الرئيسية للبند (غلاف الكارت)</span>
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
                        <div key={m.id} style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "10px", 
                          background: "#fdfdfb", 
                          border: "1px solid #e2dcd0", 
                          borderRadius: "12px", 
                          padding: "12px 14px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
                        }}>
                          {/* Image preview and actions row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px dashed #eae5dc", paddingBottom: "8px" }}>
                            <div style={{ width: "80px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid #d4ceb8", flexShrink: 0 }}>
                              <img src={resolveMediaUrl(m.url) || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", background: "#f5f5f5" }} />
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#073b35" }}>
                                صورة معرض إضافية #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => makeMainImage(m)}
                                style={{
                                  background: "rgba(193, 150, 76, 0.1)",
                                  border: "1px solid rgba(193, 150, 76, 0.3)",
                                  color: "#c9964c",
                                  borderRadius: "6px",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: "3px 8px",
                                  width: "fit-content",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "3px"
                                }}
                              >
                                👑 تعيين كصورة غلاف الكارت
                              </button>
                            </div>

                            {/* Reordering and deleting buttons */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveGalleryItem(idx, "prev")}
                                style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                                title="نقل لأعلى"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => moveGalleryItem(idx, "next")}
                                style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid #e5e0d5", background: "#fff", color: "#666", cursor: idx === arr.length - 1 ? "not-allowed" : "pointer", opacity: idx === arr.length - 1 ? 0.3 : 1, display: "grid", placeItems: "center", fontSize: "10px" }}
                                title="نقل لأسفل"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => removeOptMedia(m.id)}
                                style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#fecaca", color: "#dc2626", border: "none", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "10px", marginInlineStart: "6px" }}
                                title="حذف الصورة"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Beautifully labeled inputs row */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 65px", gap: 10 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                الاسم على الصورة (عربي) *
                              </label>
                              <Input
                                value={m.alt_ar || ""}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, alt_ar: e.target.value } : item))}
                                onBlur={e => updateOptMediaField(m.id, "alt_ar", e.target.value)}
                                placeholder="مثال: كونسيلد - 101"
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff" }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                Text on image (English) *
                              </label>
                              <Input
                                value={m.alt_en || ""}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, alt_en: e.target.value } : item))}
                                onBlur={e => updateOptMediaField(m.id, "alt_en", e.target.value)}
                                placeholder="e.g. Concealed - 101"
                                dir="ltr"
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff" }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6e685a", marginBottom: 3, display: "block" }}>
                                الترتيب
                              </label>
                              <Input
                                type="number"
                                value={m.sort_order ?? 0}
                                onChange={e => setOptionMedia(prev => prev.map(item => item.id === m.id ? { ...item, sort_order: Number(e.target.value) } : item))}
                                onBlur={e => updateOptMediaField(m.id, "sort_order", Number(e.target.value) || 0)}
                                style={{ height: 32, fontSize: "0.72rem", background: "#fff", textAlign: "center" }}
                              />
                            </div>
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
