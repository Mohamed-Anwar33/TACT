import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus, Image as ImageIcon, Film, Eye, ChevronRight, ChevronLeft, FileText } from "lucide-react";
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
import {
  parseAreaNumber,
  CmsAreaRange,
  defaultAreaRanges,
  countProjectsByRange,
  formatAreaValue,
  getAreaRangeForValue,
  getDefaultAreaForRange,
} from "@/lib/publicCms";
import { resolveMediaUrl } from "@/lib/realContent";

const db = supabase as any;
const MAX_EXECUTION_VIDEO_MB = 80;

const blank = {
  id: "", title_en: "", title_ar: "", category_en: "", category_ar: "",
  area: "", description_en: "", description_ar: "", cover_url: "",
  video_url: "", pdf_url: "", tour360_url: "", external_url: "", sort_order: 0, visible: true,
  project_kind: "design",
};

function normalizeProjectMediaUrl(url?: string | null) {
  return resolveMediaUrl(url) || url || "";
}

function normalizeProjectRow(row: any) {
  return {
    ...row,
    cover_url: normalizeProjectMediaUrl(row.cover_url),
    video_url: normalizeProjectMediaUrl(row.video_url),
    pdf_url: normalizeProjectMediaUrl(row.pdf_url),
  };
}

function normalizeProjectMediaRow(row: any) {
  return {
    ...row,
    url: normalizeProjectMediaUrl(row.url),
  };
}

function normalizeAreaRange(range: CmsAreaRange): CmsAreaRange {
  return {
    ...range,
    imageUrl: normalizeProjectMediaUrl(range.imageUrl),
  };
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [section, setSection] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"grid" | "table">("grid");
  const [projectKindTab, setProjectKindTab] = useState<"design" | "execution">("design");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [tempGallery, setTempGallery] = useState<string[]>([]);

  // Area Ranges state variables
  const [areaRanges, setAreaRanges] = useState<CmsAreaRange[]>(defaultAreaRanges);
  const [isEditingRanges, setIsEditingRanges] = useState(false);
  const [tempRanges, setTempRanges] = useState<CmsAreaRange[]>([]);
  const [savingRanges, setSavingRanges] = useState(false);
  const [selectedAreaRangeId, setSelectedAreaRangeId] = useState<string>("all");

  const designCount = projects.filter(p => (p.project_kind || (p.video_url ? "execution" : "design")) === "design").length;
  const executionCount = projects.filter(p => (p.project_kind || (p.video_url ? "execution" : "design")) === "execution").length;
  const areaCounts = countProjectsByRange(projects, areaRanges);
  const tempAreaCounts = countProjectsByRange(projects, tempRanges);

  const filteredProjects = projects.filter(p => {
    const kind = p.project_kind || (p.video_url ? "execution" : "design");
    return kind === projectKindTab;
  });
  
  const displayedProjects = filteredProjects.filter(p => {
    if (projectKindTab !== "design" || selectedAreaRangeId === "all") return true;
    const range = areaRanges.find(r => r.id === selectedAreaRangeId);
    if (!range) return true;
    return getAreaRangeForValue(p.area, [range])?.id === range.id;
  });

  const currentKind = editing?.project_kind || (editing?.video_url ? "execution" : "design");
  const currentEditingRange = currentKind === "design" ? getAreaRangeForValue(editing?.area, areaRanges) : null;
  const currentEditingAreaNumber = parseAreaNumber(editing?.area);

  function describeAreaRange(range?: CmsAreaRange | null) {
    if (!range) return "";
    const min = range.min ?? 0;
    const max = range.max;
    return max === null || max === undefined ? `${min} م² فأكثر` : `${min} إلى ${max} م²`;
  }

  function getProjectAreaRange(project: any) {
    return getAreaRangeForValue(project.area, areaRanges);
  }

  function openNewProject() {
    const selectedRange =
      projectKindTab === "design" && selectedAreaRangeId !== "all"
        ? areaRanges.find((range) => range.id === selectedAreaRangeId)
        : null;

    setTempGallery([]);
    setEditing({
      ...blank,
      project_kind: projectKindTab,
      area: selectedRange ? getDefaultAreaForRange(selectedRange) : "",
      sort_order: projects.length,
      areaRangeHintId: selectedRange?.id || "",
    });
  }

  function updateEditingArea(value: string) {
    const numericValue = value.replace(/[^\d.,]/g, "");
    setEditing({ ...editing, area: numericValue === "" ? "" : formatAreaValue(numericValue) });
  }

  function makeProjectId(project: any) {
    const source = String(project.title_en || project.title_ar || "project").trim();
    const base = source
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `project-${Date.now()}`;

    let candidate = base;
    let suffix = 2;
    while (projects.some((projectRow) => projectRow.id === candidate && projectRow.id !== project.id)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setSelectedAreaRangeId("all");
  }, [projectKindTab]);

  function closeEditor() {
    setEditing(null);
    setTempGallery([]);
  }

  async function load() {
    const [pRes, mRes, sRes, rRes] = await Promise.all([
      db.from("cms_projects").select("*").order("sort_order"),
      db.from("cms_project_media").select("*").order("sort_order"),
      db.from("cms_sections").select("*").eq("page_slug", "home").eq("section_key", "works-preview").maybeSingle(),
      db.from("cms_sections").select("*").eq("page_slug", "portfolio").eq("section_key", "area-ranges").maybeSingle(),
    ]);
    setProjects((pRes.data || []).map(normalizeProjectRow));
    setProjectMedia((mRes.data || []).map(normalizeProjectMediaRow));
    setSection(sRes.data || null);

    if (rRes.data && rRes.data.metadata && Array.isArray(rRes.data.metadata.ranges)) {
      setAreaRanges(rRes.data.metadata.ranges.map(normalizeAreaRange));
    } else {
      setAreaRanges(defaultAreaRanges);
    }
  }

  // Area ranges management helpers
  async function saveAreaRanges(e: React.FormEvent) {
    e.preventDefault();
    setSavingRanges(true);
    try {
      for (const range of tempRanges) {
        if (!range.titleAr.trim() || !range.titleEn.trim()) {
          throw new Error("يجب كتابة العناوين باللغتين العربية والإنجليزية لجميع التقسيمات");
        }
        if (range.min !== null && isNaN(range.min)) {
          throw new Error("يجب كتابة أرقام صحيحة للمساحة الصغرى");
        }
        if (range.max !== null && isNaN(range.max)) {
          throw new Error("يجب كتابة أرقام صحيحة للمساحة الكبرى");
        }
      }

      const { error } = await db.from("cms_sections").upsert({
        page_slug: "portfolio",
        section_key: "area-ranges",
        section_name_en: "Area Ranges",
        section_name_ar: "تقسيمات المساحات",
        metadata: {
          ranges: tempRanges
        },
        visible: true,
        sort_order: 100
      }, { onConflict: "page_slug,section_key" });

      if (error) throw error;

      toast.success("تم حفظ تقسيمات المساحات وصورها الجاذبة بنجاح");
      setIsEditingRanges(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ التقسيمات");
    } finally {
      setSavingRanges(false);
    }
  }

  function moveRange(index: number, direction: "up" | "down") {
    const nextIdx = direction === "up" ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= tempRanges.length) return;
    const next = [...tempRanges];
    const temp = next[index];
    next[index] = next[nextIdx];
    next[nextIdx] = temp;
    setTempRanges(next);
  }

  function deleteRange(index: number) {
    if (confirm("هل أنت متأكد من حذف هذا التقسيم للمساحة؟")) {
      setTempRanges(tempRanges.filter((_, i) => i !== index));
    }
  }

  function addRange() {
    const newId = `range-${Date.now()}`;
    const newRange: CmsAreaRange = {
      id: newId,
      titleAr: "تصنيف جديد",
      titleEn: "New Category",
      min: 0,
      max: null,
      imageUrl: ""
    };
    setTempRanges([...tempRanges, newRange]);
  }

  function updateRangeField(index: number, field: keyof CmsAreaRange, value: any) {
    const next = [...tempRanges];
    next[index] = { ...next[index], [field]: value };
    setTempRanges(next);
  }

  function getMedia(projectId: string) { return projectMedia.filter(m => m.project_id === projectId); }
  function imgCount(projectId: string) { return getMedia(projectId).filter(m => m.media_type === "image").length; }
  function vidCount(projectId: string) { return getMedia(projectId).filter(m => m.media_type === "video").length + (projects.find(p => p.id === projectId)?.video_url ? 1 : 0); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const projectId = editing.id || makeProjectId(editing);
      
      const isNew = !projects.some(p => p.id === projectId);
      let finalCoverUrl = editing.cover_url;
      if (!finalCoverUrl && tempGallery.length > 0) {
        finalCoverUrl = tempGallery[0];
      }
      
      const pinOnHome = !!editing.pinOnHome;
      const projectKind = editing.project_kind || (editing.video_url ? "execution" : "design");
      if (projectKind === "execution" && !editing.video_url) {
        throw new Error("مشروع التنفيذ لازم يكون له فيديو تنفيذ.");
      }
      if (projectKind === "design" && !finalCoverUrl && tempGallery.length === 0 && (!editing.id || imgCount(editing.id) === 0)) {
        throw new Error("مشروع التصميم لازم يكون له صورة واحدة على الأقل.");
      }
      const payload = { 
        ...editing, 
        id: projectId,
        video_url: projectKind === "design" ? "" : editing.video_url,
        cover_url: projectKind === "execution" ? "" : finalCoverUrl, 
        sort_order: Number(editing.sort_order) || 0 
      };
      delete (payload as any).pinOnHome;
      delete (payload as any).project_kind;
      delete (payload as any).areaRangeHintId;
      
      const { error } = await db.from("cms_projects").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      if (projectKind === "execution") {
        await db.from("cms_project_media").delete().eq("project_id", projectId).eq("media_type", "image");
      }

      if (isNew && tempGallery.length > 0) {
        const mediaRows = tempGallery.map((url, idx) => ({
          project_id: projectId,
          media_type: "image",
          role: "gallery",
          url,
          title_en: projectKind === "design" ? "" : `Image ${idx + 1}`,
          title_ar: projectKind === "design" ? "" : `صورة ${idx + 1}`,
          alt_en: projectKind === "design" ? "" : `Image ${idx + 1}`,
          alt_ar: projectKind === "design" ? "" : `صورة ${idx + 1}`,
          visible: true,
          sort_order: (idx + 1) * 10
        }));
        const { error: mediaErr } = await db.from("cms_project_media").insert(mediaRows);
        if (mediaErr) console.error("Error inserting temp gallery:", mediaErr);
      }

      const savedId = projectId;
      if (savedId && section) {
        const selectedIds: string[] = section.metadata?.selectedIds || [];
        let newIds = [...selectedIds];
        if (pinOnHome) {
          newIds = [String(savedId), ...newIds.filter(x => x !== String(savedId))];
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

      toast.success("تم حفظ المشروع ومرفقاته بنجاح");
      closeEditor();
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

  async function togglePin(id: string) {
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
      if (newIds.length >= 12) {
        toast.warning("يمكنك اختيار 12 مشروعاً كحد أقصى للعرض في الصفحة الرئيسية!");
        return;
      }
      newIds = [idStr, ...newIds];
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
      toast.success(newIds.includes(idStr) ? "تم عرض المشروع بالصفحة الرئيسية" : "تم إلغاء عرض المشروع بالصفحة الرئيسية");
      await load();
    } catch (err: any) {
      toast.error("فشل التحديث: " + err.message);
    }
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

  async function moveProject(displayedIdx: number, direction: "up" | "down") {
    const targetDisplayedIdx = direction === "up" ? displayedIdx - 1 : displayedIdx + 1;
    if (targetDisplayedIdx < 0 || targetDisplayedIdx >= displayedProjects.length) return;

    setBusy(true);
    try {
      const nextProjects = [...projects];
      const idxA = projects.findIndex(p => p.id === displayedProjects[displayedIdx].id);
      const idxB = projects.findIndex(p => p.id === displayedProjects[targetDisplayedIdx].id);
      
      if (idxA !== -1 && idxB !== -1) {
        const temp = nextProjects[idxA];
        nextProjects[idxA] = nextProjects[idxB];
        nextProjects[idxB] = temp;
        
        const updates = nextProjects.map((proj, index) => {
          const newOrder = (index + 1) * 10;
          return db.from("cms_projects").update({ sort_order: newOrder }).eq("id", proj.id);
        });

        await Promise.all(updates);
        toast.success("تم إعادة ترتيب المشاريع بنجاح");
        await load();
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إعادة الترتيب");
    } finally {
      setBusy(false);
    }
  }

  async function updateMediaRole(mediaId: string, role: string) {
    setProjectMedia(prev => prev.map(m => m.id === mediaId ? { ...m, role } : m));
    const { error } = await db.from("cms_project_media").update({ role }).eq("id", mediaId);
    if (error) {
      toast.error("حدث خطأ أثناء تحديث تصنيف الصورة");
      await load();
    }
  }

  async function updateMediaField(mediaId: string, field: "title_ar" | "title_en" | "alt_ar" | "alt_en" | "role", value: string) {
    setProjectMedia(prev => prev.map(m => m.id === mediaId ? { ...m, [field]: value } : m));
    const { error } = await db.from("cms_project_media").update({ [field]: value || null }).eq("id", mediaId);
    if (error) {
      toast.error("حدث خطأ أثناء تحديث بيانات الصورة");
      await load();
    }
  }

  async function addMediaToProject(url: string, file: File) {
    if (!editing?.id) return;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    if (currentKind === "design" && mediaType !== "image") {
      toast.error("التصميم يقبل صور فقط.");
      return;
    }
    if (currentKind === "execution" && mediaType !== "video") {
      toast.error("التنفيذ يقبل فيديو فقط.");
      return;
    }
    const currentMedia = getMedia(editing.id);
    const maxOrder = currentMedia.length > 0 ? Math.max(...currentMedia.map(m => m.sort_order)) : 0;
    
    const isDesign = currentKind === "design";
    await db.from("cms_project_media").upsert({ 
      project_id: editing.id, 
      media_type: mediaType, 
      role: "gallery", 
      url, 
      title_en: isDesign ? "" : file.name, 
      title_ar: isDesign ? "" : file.name,
      alt_en: isDesign ? "" : file.name,
      alt_ar: isDesign ? "" : file.name,
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
          <button onClick={openNewProject}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            <Plus size={16} /> إضافة مشروع
          </button>
        }
      />
      <div className="admin-content">
        {/* Premium Switching Bar (Designs vs Executions) */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "1.75rem", flexWrap: "wrap", borderBottom: "1px solid #eae5dc", paddingBottom: "1rem" }}>
          <button 
            type="button"
            className={`section-tab-btn ${projectKindTab === "design" ? "active" : ""}`}
            onClick={() => setProjectKindTab("design")}
            style={{ border: "1px solid" }}
          >
            <ImageIcon size={16} />
            <span>معرض التصميمات (المساحات)</span>
            <span className="badge-num">{designCount}</span>
          </button>
          <button 
            type="button"
            className={`section-tab-btn ${projectKindTab === "execution" ? "active" : ""}`}
            onClick={() => setProjectKindTab("execution")}
            style={{ border: "1px solid" }}
          >
            <Film size={16} />
            <span>معرض التنفيذ الفعلي (الفيديوهات)</span>
            <span className="badge-num">{executionCount}</span>
          </button>
        </div>

        {/* Area Ranges Premium Banner */}
        {projectKindTab === "design" && (
          <div 
            style={{ 
              background: "linear-gradient(135deg, #0C363A 0%, #061F22 100%)", 
              borderRadius: "16px", 
              padding: "1.5rem", 
              marginBottom: "2rem", 
              border: "1px solid #c18556",
              boxShadow: "0 10px 30px rgba(12, 54, 58, 0.15)",
              color: "#fff",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Background elements */}
            <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(193, 133, 86, 0.1)", filter: "blur(40px)" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", position: "relative", zIndex: 2 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.25rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C18556" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>إدارة تقسيمات المساحات وصورها الجاذبة</h2>
                </div>
                <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.7)", maxWidth: "600px", lineHeight: "1.5", margin: "8px 0 0 0" }}>
                  تحكم بشكل كامل في تصنيفات المساحات المعروضة لعملائك، عدل نطاقات المساحات (المتر المربع)، وأضف صور خلفية مذهلة لكل تصنيف لتجذب الزوار وتزيد التفاعل.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setTempRanges([...areaRanges]);
                  setIsEditingRanges(true);
                }}
                style={{ 
                  background: "linear-gradient(90deg, #C18556, #d49c6d)", 
                  color: "#061F22", 
                  border: "none", 
                  padding: "0.6rem 1.25rem", 
                  borderRadius: "8px", 
                  fontWeight: 700, 
                  fontSize: "0.85rem",
                  cursor: "pointer", 
                  boxShadow: "0 4px 15px rgba(193, 133, 86, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Edit2 size={14} />
                تعديل تقسيمات المساحات وصورها
              </button>
            </div>

            {/* Quick overview of categories inside the banner */}
            <div 
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
                gap: "1rem", 
                marginTop: "1.25rem", 
                position: "relative", 
                zIndex: 2 
              }}
            >
              {areaRanges.map((range) => {
                const count = areaCounts[range.id] || 0;
                const isSelected = selectedAreaRangeId === range.id;

                return (
                  <div 
                    key={range.id}
                    onClick={() => setSelectedAreaRangeId(isSelected ? "all" : range.id)}
                    style={{ 
                      background: isSelected ? "rgba(193, 133, 86, 0.15)" : "rgba(255,255,255,0.04)", 
                      border: isSelected ? "1.5px solid #C18556" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.25s ease-in-out",
                      boxShadow: isSelected ? "0 4px 15px rgba(193, 133, 86, 0.3)" : "none",
                      transform: isSelected ? "scale(1.02)" : "none"
                    }}
                  >
                    {range.imageUrl ? (
                      <img 
                        src={range.imageUrl} 
                        alt="" 
                        style={{ width: "50px", height: "50px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} 
                      />
                    ) : (
                      <div 
                        style={{ 
                          width: "50px", 
                          height: "50px", 
                          borderRadius: "6px", 
                          background: "rgba(193, 133, 86, 0.15)", 
                          display: "grid", 
                          placeItems: "center", 
                          color: "#C18556",
                          flexShrink: 0
                        }}
                      >
                        <ImageIcon size={18} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "#fff" }}>
                        {range.titleAr}
                      </h4>
                      <p style={{ fontSize: "0.7rem", color: "#C18556", margin: "2px 0 0", fontWeight: 600 }}>
                        {range.min !== null ? `${range.min}م²` : "0م²"} إلى {range.max !== null ? `${range.max}م²` : "∞"}
                      </p>
                      <span style={{ fontSize: "0.65rem", color: isSelected ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: isSelected ? 700 : 400 }}>
                        {count} مشاريع
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Area Category Pills Bar */}
        {projectKindTab === "design" && (
          <div style={{
            background: "#fbfbfa",
            border: "1px solid #e5e0d5",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            boxShadow: "0 4px 15px rgba(0,0,0,0.01)"
          }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0C363A", marginInlineEnd: "8px" }}>تصفية حسب المساحة:</span>
            
            {/* "All" button */}
            <button
              type="button"
              onClick={() => setSelectedAreaRangeId("all")}
              style={{
                background: selectedAreaRangeId === "all" ? "linear-gradient(90deg, #0C363A, #061F22)" : "#fff",
                color: selectedAreaRangeId === "all" ? "#fff" : "#0C363A",
                border: selectedAreaRangeId === "all" ? "1px solid #0C363A" : "1px solid #e5e0d5",
                borderRadius: "8px",
                padding: "0.45rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: selectedAreaRangeId === "all" ? "0 4px 10px rgba(12, 54, 58, 0.2)" : "none"
              }}
            >
              <span>الكل</span>
              <span style={{ 
                fontSize: "0.68rem", 
                background: selectedAreaRangeId === "all" ? "#C18556" : "rgba(12, 54, 58, 0.1)", 
                color: selectedAreaRangeId === "all" ? "#fff" : "#0C363A",
                borderRadius: "20px",
                padding: "2px 6px",
                fontWeight: 700
              }}>
                {projects.filter(p => (p.project_kind || (p.video_url ? "execution" : "design")) === "design").length}
              </span>
            </button>

            {areaRanges.map((range) => {
              const count = areaCounts[range.id] || 0;
              const isSelected = selectedAreaRangeId === range.id;

              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setSelectedAreaRangeId(range.id)}
                  style={{
                    background: isSelected ? "linear-gradient(90deg, #0C363A, #061F22)" : "#fff",
                    color: isSelected ? "#fff" : "#0C363A",
                    border: isSelected ? "1px solid #0C363A" : "1px solid #e5e0d5",
                    borderRadius: "8px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: isSelected ? "0 4px 10px rgba(12, 54, 58, 0.2)" : "none"
                  }}
                >
                  <span>{range.titleAr}</span>
                  <span style={{ 
                    fontSize: "0.68rem", 
                    background: isSelected ? "#C18556" : "rgba(12, 54, 58, 0.1)", 
                    color: isSelected ? "#fff" : "#0C363A",
                    borderRadius: "20px",
                    padding: "2px 6px",
                    fontWeight: 700
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* View Mode Tabs (Grid vs Table) */}
        <div className="admin-tabs" style={{ borderBottom: "none", marginBottom: "1.25rem", justifyContent: "flex-end" }}>
          <button className={`admin-tab ${tab === "grid" ? "active" : ""}`} onClick={() => setTab("grid")} style={{ borderBottomWidth: 3 }}>عرض البطاقات</button>
          <button className={`admin-tab ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")} style={{ borderBottomWidth: 3 }}>عرض الجدول</button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="admin-card">
            <div className="card-body" style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
              {projectKindTab === "design" ? (
                <ImageIcon size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              ) : (
                <Film size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              )}
              <p>{projectKindTab === "design" ? "لا توجد مشاريع تصميم بعد" : "لا توجد مشاريع تنفيذ بعد"}</p>
              <button onClick={openNewProject} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer" }}>
                إضافة أول مشروع
              </button>
            </div>
          </div>
        ) : displayedProjects.length === 0 ? (
          <div className="admin-card">
            <div className="card-body" style={{ textAlign: "center", padding: "4rem 2rem", color: "#999" }}>
              <ImageIcon size={48} style={{ margin: "0 auto 1.25rem", opacity: 0.25, color: "#C18556" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0C363A", marginBottom: "0.5rem" }}>لا توجد مشاريع في هذا النطاق</h3>
              <p style={{ fontSize: "0.85rem", color: "#8a8578", maxWidth: "400px", margin: "0 auto 1.5rem", lineHeight: "1.6" }}>
                لم يتم تصنيف أي من مشاريع التصميمات الحالية ضمن نطاق المساحة المحدد. يمكنك إضافة مشروع جديد أو العودة لعرض الكل.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button 
                  onClick={() => setSelectedAreaRangeId("all")} 
                  style={{ 
                    padding: "0.5rem 1.5rem", 
                    borderRadius: 8, 
                    background: "#0C363A", 
                    color: "#fff", 
                    border: "none", 
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 10px rgba(12, 54, 58, 0.15)"
                  }}
                >
                  عرض جميع المشاريع
                </button>
                <button 
                  onClick={openNewProject} 
                  style={{ 
                    padding: "0.5rem 1.5rem", 
                    borderRadius: 8, 
                    background: "#fff", 
                    color: "#C18556", 
                    border: "1px solid #C18556", 
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  إضافة مشروع جديد
                </button>
              </div>
            </div>
          </div>
        ) : tab === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {displayedProjects.map((p, idx) => (
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#C18556", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {p.category_ar || p.category_en || "مشروع"}
                    </div>
                    {(() => {
                      const selectedIds: string[] = section?.metadata?.selectedIds || [];
                      const isPinned = selectedIds.includes(String(p.id));
                      return isPinned ? (
                        <span style={{ fontSize: "0.6rem", background: "#fdf2e9", color: "#c18556", border: "1px solid #f5d6c1", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                          ★ بالرئيسية
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0C363A", marginTop: 4 }}>{p.title_ar || p.title_en}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {p.area && <span dir="ltr" style={{ fontSize: "0.7rem", color: "#999" }}>{formatAreaValue(p.area) || p.area}</span>}
                    {projectKindTab === "design" && (() => {
                      const projectRange = getProjectAreaRange(p);
                      return (
                        <span style={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: projectRange ? "rgba(12, 54, 58, 0.08)" : "rgba(216, 71, 40, 0.08)",
                          color: projectRange ? "#0C363A" : "#D84728",
                          border: `1px solid ${projectRange ? "rgba(12, 54, 58, 0.12)" : "rgba(216, 71, 40, 0.18)"}`
                        }}>
                          {projectRange ? projectRange.titleAr : "غير مصنف"}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <StatusBadge visible={p.visible} />
                    <span style={{ fontSize: "0.65rem", color: "#888", background: "#f5f5f4", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <ImageIcon size={10} /> {imgCount(p.id)}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#888", background: "#f5f5f4", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Film size={10} /> {vidCount(p.id)}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f0ece4", display: "flex", justifyContent: "space-between", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ display: "flex", gap: 2, marginInlineEnd: 4 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveProject(idx, "up")}
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e0d5", background: idx === 0 ? "#f9f9f9" : "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, color: "#0C363A", display: "inline-flex", alignItems: "center" }}
                        title="ترتيب لأعلى"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === displayedProjects.length - 1}
                        onClick={() => moveProject(idx, "down")}
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e0d5", background: idx === displayedProjects.length - 1 ? "#f9f9f9" : "#fff", cursor: idx === displayedProjects.length - 1 ? "not-allowed" : "pointer", opacity: idx === displayedProjects.length - 1 ? 0.3 : 1, color: "#0C363A", display: "inline-flex", alignItems: "center" }}
                        title="ترتيب لأسفل"
                      >
                        ▼
                      </button>
                    </div>
                    <button onClick={() => {
                      const selectedIds: string[] = section?.metadata?.selectedIds || [];
                      setTempGallery([]);
                      setEditing({ ...p, project_kind: projectKindTab, pinOnHome: selectedIds.includes(String(p.id)) });
                    }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Edit2 size={12} /> تعديل
                    </button>
                    
                    {(() => {
                      const selectedIds: string[] = section?.metadata?.selectedIds || [];
                      const isPinned = selectedIds.includes(String(p.id));
                      return (
                        <button
                          type="button"
                          onClick={() => togglePin(p.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: "0.72rem",
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
                          {isPinned ? "✕ إزالة" : "★ تثبيت"}
                        </button>
                      );
                    })()}
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
                    <th>الصورة</th><th>المشروع</th><th>التصنيف</th><th>الترتيب</th><th>المساحة</th><th>صور</th><th>فيديو</th><th>الحالة</th><th>الرئيسية</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProjects.map((p, idx) => (
                    <tr key={p.id}>
                      <td><div style={{ width: 56, height: 40, borderRadius: 6, overflow: "hidden", background: "#f0ece4" }}>
                        {p.cover_url && <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div></td>
                      <td style={{ fontWeight: 600 }}>{p.title_ar || p.title_en}</td>
                      <td>{p.category_ar || p.category_en || "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveProject(idx, "up")}
                            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e5e0d5", background: idx === 0 ? "#f9f9f9" : "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, color: "#0C363A", fontSize: "10px", display: "inline-flex", alignItems: "center" }}
                            title="ترتيب لأعلى"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === displayedProjects.length - 1}
                            onClick={() => moveProject(idx, "down")}
                            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e5e0d5", background: idx === displayedProjects.length - 1 ? "#f9f9f9" : "#fff", cursor: idx === displayedProjects.length - 1 ? "not-allowed" : "pointer", opacity: idx === displayedProjects.length - 1 ? 0.3 : 1, color: "#0C363A", fontSize: "10px", display: "inline-flex", alignItems: "center" }}
                            title="ترتيب لأسفل"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                          <span dir="ltr">{formatAreaValue(p.area) || p.area || "-"}</span>
                          {projectKindTab === "design" && (() => {
                            const projectRange = getProjectAreaRange(p);
                            return (
                              <span style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 999,
                                background: projectRange ? "rgba(12, 54, 58, 0.08)" : "rgba(216, 71, 40, 0.08)",
                                color: projectRange ? "#0C363A" : "#D84728",
                              }}>
                                {projectRange ? projectRange.titleAr : "غير مصنف"}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td>{imgCount(p.id)}</td>
                      <td>{vidCount(p.id)}</td>
                      <td><StatusBadge visible={p.visible} /></td>
                      <td>
                        {(() => {
                          const selectedIds: string[] = section?.metadata?.selectedIds || [];
                          const isPinned = selectedIds.includes(String(p.id));
                          return (
                            <button
                              type="button"
                              onClick={() => togglePin(p.id)}
                              style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                border: "1px solid",
                                cursor: "pointer",
                                background: isPinned ? "#C18556" : "#ffffff",
                                color: isPinned ? "#ffffff" : "#C18556",
                                borderColor: "#C18556",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                transition: "all 0.2s"
                              }}
                            >
                              {isPinned ? "★ مثبت" : "➕ تثبيت"}
                            </button>
                          );
                        })()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => {
                            const selectedIds: string[] = section?.metadata?.selectedIds || [];
                            setTempGallery([]);
                            setEditing({ ...p, project_kind: projectKindTab, pinOnHome: selectedIds.includes(String(p.id)) });
                          }} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}><Edit2 size={12} /></button>
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
      <EditDrawer open={!!editing} title={editing?.id && projects.find(p => p.id === editing.id) ? "تعديل المشروع" : "إضافة مشروع جديد"} onClose={closeEditor} width={620}
        footer={<SaveButton loading={busy} label="حفظ المشروع" onClick={() => (document.getElementById("project-form") as HTMLFormElement | null)?.requestSubmit()} />}
      >
        {editing && (
          <form id="project-form" onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>العنوان (عربي)</label><Input value={editing.title_ar} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} required /></div>
              <div className="form-group"><label>Title (EN)</label><Input value={editing.title_en} onChange={e => setEditing({ ...editing, title_en: e.target.value })} required dir="ltr" /></div>
            </div>
            <div className="form-group">
              <label>نوع العنصر في سابقة الأعمال</label>
              <select
                value={editing.project_kind || (editing.video_url ? "execution" : "design")}
                onChange={e => {
                  const nextKind = e.target.value as "design" | "execution";
                  if (nextKind === "execution") setTempGallery([]);
                  setEditing({
                    ...editing,
                    project_kind: nextKind,
                    video_url: nextKind === "design" ? "" : editing.video_url,
                    cover_url: nextKind === "execution" ? "" : editing.cover_url,
                    area: nextKind === "execution" ? "" : editing.area,
                  });
                }}
                style={{ width: "100%", padding: "0.6rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.85rem", background: "#fff" }}
              >
                <option value="design">تصميمات</option>
                <option value="execution">تنفيذ بالفعل</option>
              </select>
              <p style={{ fontSize: "0.68rem", color: "#8a8578", marginTop: 6 }}>
                التصميم يظهر داخل تبويب المساحات. التنفيذ بالفعل يظهر داخل تبويب الفيديوهات فقط.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>{(editing.project_kind || (editing.video_url ? "execution" : "design")) === "execution" ? "نوع التنفيذ (عربي)" : "نوع التصميم (عربي)"}</label><Input value={editing.category_ar || ""} onChange={e => setEditing({ ...editing, category_ar: e.target.value })} placeholder={(editing.project_kind || (editing.video_url ? "execution" : "design")) === "execution" ? "تنفيذ وتشطيب" : "تصميم داخلي"} /></div>
              <div className="form-group"><label>{(editing.project_kind || (editing.video_url ? "execution" : "design")) === "execution" ? "Execution Type (EN)" : "Design Type (EN)"}</label><Input value={editing.category_en || ""} onChange={e => setEditing({ ...editing, category_en: e.target.value })} dir="ltr" placeholder={(editing.project_kind || (editing.video_url ? "execution" : "design")) === "execution" ? "Execution & Finishing" : "Interior Design"} /></div>
            </div>
            <div className="form-group">
              <label>المساحة</label>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0, direction: "ltr" }}>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={currentEditingAreaNumber ?? ""}
                  onChange={e => updateEditingArea(e.target.value)}
                  placeholder="250"
                  dir="ltr"
                  style={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    textAlign: "left",
                    fontVariantNumeric: "tabular-nums"
                  }}
                />
                <span style={{
                  minWidth: 52,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #e5e0d5",
                  borderLeft: "none",
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                  background: "#fbfbfa",
                  color: "#0C363A",
                  fontSize: "0.78rem",
                  fontWeight: 800
                }}>
                  م²
                </span>
              </div>
              {currentKind === "design" && (
                <div style={{
                  marginTop: 8,
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  background: currentEditingRange ? "rgba(12, 54, 58, 0.06)" : "rgba(216, 71, 40, 0.08)",
                  color: currentEditingRange ? "#0C363A" : "#D84728",
                  border: `1px solid ${currentEditingRange ? "rgba(12, 54, 58, 0.12)" : "rgba(216, 71, 40, 0.18)"}`
                }}>
                  {currentEditingRange
                    ? `سيظهر هذا المشروع في: ${currentEditingRange.titleAr} (${describeAreaRange(currentEditingRange)})`
                    : "أدخل رقم مساحة واضح حتى يتم تصنيف المشروع تلقائيًا داخل تقسيمات المساحات."}
                </div>
              )}
            </div>
            <div className="form-group"><label>الوصف (عربي)</label><Textarea value={editing.description_ar || ""} onChange={e => setEditing({ ...editing, description_ar: e.target.value })} rows={3} /></div>
            <div className="form-group"><label>Description (EN)</label><Textarea value={editing.description_en || ""} onChange={e => setEditing({ ...editing, description_en: e.target.value })} rows={3} dir="ltr" /></div>

            {/* Design projects use images only. Execution projects use a single video below. */}
            {currentKind === "design" && (
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                        {displayMedia.map((m, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === displayMedia.length - 1;
                          const isTemp = m.id.startsWith("temp-");
                          return (
                            <div key={m.id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e0d5", display: "flex", flexDirection: "column", background: "#fbfbfa" }}>
                              <div style={{ position: "relative", height: 85 }}>
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
            )}

            {currentKind === "execution" && (
              <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <div style={{ 
                  border: "1px dashed #c18556", 
                  borderRadius: 12, 
                  padding: "1.25rem", 
                  background: "#fbfbfa", 
                  boxShadow: "0 4px 12px rgba(12, 54, 58, 0.02)" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0C363A", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Film size={14} style={{ color: "#C18556" }} />
                      <span>فيديو التنفيذ (ملف أو رابط)</span>
                    </label>
                    {editing.video_url && (
                      <button 
                        type="button" 
                        onClick={() => setEditing({ ...editing, video_url: "" })}
                        style={{ border: "none", background: "rgba(216, 71, 40,0.1)", color: "#D84728", cursor: "pointer", fontSize: "0.68rem", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}
                      >
                        حذف الفيديو الحالي
                      </button>
                    )}
                  </div>

                  {editing.video_url ? (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e0d5" }}>
                      <MediaPreview url={editing.video_url} type="video" height={130} onPlay={() => setVideoPreview(editing.video_url)} />
                      <div style={{ background: "#fff", padding: "8px 12px", borderTop: "1px solid #e5e0d5", fontSize: "0.7rem", color: "#666", wordBreak: "break-all" }}>
                        <span style={{ fontWeight: 600, color: "#0C363A" }}>الرابط الحالي: </span>
                        {editing.video_url}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <MediaUploader
                        folder="projects"
                        label="رفع فيديو التنفيذ (اسحب ملف MP4)"
                        accept="video/mp4,video/webm,video/quicktime"
                        maxSizeMB={MAX_EXECUTION_VIDEO_MB}
                        onUploaded={(url) => setEditing({ ...editing, video_url: url })}
                      />
                      <p style={{ fontSize: "0.65rem", color: "#D84728", fontWeight: 700, margin: 0 }}>
                        الحد الأقصى للفيديو {MAX_EXECUTION_VIDEO_MB} MB. ارفع MP4 مضغوط H.264 للحفاظ على الجودة وسرعة التحميل.
                      </p>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
                        <span style={{ flex: 1, height: 1, background: "#eae5dc" }} />
                        <span style={{ fontSize: "0.65rem", color: "#8a8578", fontWeight: 700 }}>أو أدخل رابط فيديو مباشرة</span>
                        <span style={{ flex: 1, height: 1, background: "#eae5dc" }} />
                      </div>

                      <Input
                        value={editing.video_url || ""}
                        onChange={e => setEditing({ ...editing, video_url: e.target.value })}
                        placeholder="ضع رابط YouTube أو Vimeo أو mp4 هنا..."
                        dir="ltr"
                      />
                    </div>
                  )}

                  <p style={{ fontSize: "0.65rem", color: "#8a8578", marginTop: 8, lineHeight: 1.4 }}>
                    يمكنك سحب وإفلات مقطع فيديو MP4 لرفعه على الخادم، أو لصق رابط فيديو جاهز (من يوتيوب أو فيميو) مباشرة.
                  </p>
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
              <div style={{ 
                border: "1px dashed #eae5dc", 
                borderRadius: 12, 
                padding: "1.25rem", 
                background: "#fbfbfa", 
                boxShadow: "0 4px 12px rgba(12, 54, 58, 0.02)" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0C363A", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <FileText size={14} style={{ color: "#C18556" }} />
                    <span>ملف PDF للمشروع (ملف أو رابط)</span>
                  </label>
                  {editing.pdf_url && (
                    <button 
                      type="button" 
                      onClick={() => setEditing({ ...editing, pdf_url: "" })}
                      style={{ border: "none", background: "rgba(216, 71, 40,0.1)", color: "#D84728", cursor: "pointer", fontSize: "0.68rem", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}
                    >
                      حذف الملف الحالي
                    </button>
                  )}
                </div>

                {editing.pdf_url ? (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e0d5" }}>
                    <MediaPreview url={editing.pdf_url} type="pdf" height={90} />
                    <div style={{ background: "#fff", padding: "8px 12px", borderTop: "1px solid #e5e0d5", fontSize: "0.7rem", color: "#666", wordBreak: "break-all" }}>
                      <span style={{ fontWeight: 600, color: "#0C363A" }}>الرابط الحالي: </span>
                      {editing.pdf_url}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <MediaUploader
                      folder="projects"
                      label="رفع ملف PDF للمشروع"
                      accept="application/pdf,.pdf"
                      onUploaded={(url) => setEditing({ ...editing, pdf_url: url })}
                    />
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
                      <span style={{ flex: 1, height: 1, background: "#eae5dc" }} />
                      <span style={{ fontSize: "0.65rem", color: "#8a8578", fontWeight: 700 }}>أو أدخل رابط PDF مباشرة</span>
                      <span style={{ flex: 1, height: 1, background: "#eae5dc" }} />
                    </div>

                    <Input
                      value={editing.pdf_url || ""}
                      onChange={e => setEditing({ ...editing, pdf_url: e.target.value })}
                      placeholder="ضع رابط ملف PDF هنا..."
                      dir="ltr"
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "1rem" }}>
              <div className="form-group">
                <label>رابط الجولة الافتراضية 360°</label>
                <Input
                  value={editing.tour360_url || ""}
                  onChange={e => setEditing({ ...editing, tour360_url: e.target.value })}
                  placeholder="مثال: https://kuula.co/share/collection/..."
                  dir="ltr"
                  style={{ marginTop: 8 }}
                />
                <p style={{ fontSize: "0.68rem", color: "#8a8578", marginTop: 4 }}>
                  يمكنك إضافة رابط الجولة الافتراضية التفاعلية 360 درجة (مثل Kuula أو Matterport).
                </p>
              </div>
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
            
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="projectPinHome"
                checked={!!editing.pinOnHome}
                onChange={e => setEditing({ ...editing, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
              <label htmlFor="projectPinHome" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                تثبيت وعرض هذا المشروع في الصفحة الرئيسية
              </label>
            </div>
          </form>
        )}
      </EditDrawer>

      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} />

      <EditDrawer 
        open={isEditingRanges} 
        title="إدارة تقسيمات المساحات وصورها الجاذبة" 
        onClose={() => setIsEditingRanges(false)} 
        width={680}
        footer={<SaveButton loading={savingRanges} label="حفظ تقسيمات المساحات" onClick={() => (document.getElementById("ranges-form") as HTMLFormElement | null)?.requestSubmit()} />}
      >
        <form id="ranges-form" onSubmit={saveAreaRanges} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "#f5f5f4", padding: "10px 14px", borderRadius: 8 }}>
            <span style={{ fontSize: "0.78rem", color: "#666", fontWeight: 500 }}>
              * يمكنك إعادة ترتيب المساحات أو إضافتها أو حذفها وتعيين صورة خلفية مميزة لكل منها.
            </span>
            <button 
              type="button" 
              onClick={addRange}
              style={{ 
                padding: "0.45rem 1rem", 
                borderRadius: 8, 
                background: "#0C363A", 
                color: "#fff", 
                border: "none", 
                cursor: "pointer", 
                fontSize: "0.78rem", 
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Plus size={14} /> إضافة تقسيم مساحة
            </button>
          </div>

          <div style={{ border: "1px solid #e5e0d5", borderRadius: 10, padding: "12px", background: "#fff" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#0C363A", marginBottom: 10 }}>
              معاينة تأثير التقسيمات على المشاريع الحالية
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {tempRanges.map((range) => (
                <div key={range.id} style={{ border: "1px solid #f0ece4", borderRadius: 8, padding: "8px 10px", background: "#fbfbfa" }}>
                  <div style={{ fontSize: "0.7rem", color: "#0C363A", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {range.titleAr || "تقسيم مساحة"}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#C18556", marginTop: 2, fontWeight: 700 }}>
                    {describeAreaRange(range)}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#666", marginTop: 4 }}>
                    {(tempAreaCounts[range.id] || 0)} مشروع
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "0.5rem" }}>
            {tempRanges.map((range, index) => {
              const isFirst = index === 0;
              const isLast = index === tempRanges.length - 1;
              return (
                <div 
                  key={range.id} 
                  style={{ 
                    border: "1px solid #e5e0d5", 
                    borderRadius: 12, 
                    padding: "1.25rem", 
                    background: "#fbfbfa", 
                    position: "relative",
                    boxShadow: "0 4px 12px rgba(12, 54, 58, 0.01)"
                  }}
                >
                  {/* Top bar: delete & reorder */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #f0ece4", paddingBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C363A", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#C18556", color: "#fff", display: "grid", placeItems: "center", fontSize: "0.68rem" }}>
                        {index + 1}
                      </span>
                      <span>{range.titleAr || "تقسيم مساحة"}</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Reorder Up */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveRange(index, "up")}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e0d5", background: isFirst ? "#f9f9f9" : "#fff", cursor: isFirst ? "not-allowed" : "pointer", opacity: isFirst ? 0.3 : 1, color: "#0C363A", fontSize: "0.68rem" }}
                        title="ترتيب لأعلى"
                      >
                        ▲ لأعلى
                      </button>
                      {/* Reorder Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveRange(index, "down")}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e0d5", background: isLast ? "#f9f9f9" : "#fff", cursor: isLast ? "not-allowed" : "pointer", opacity: isLast ? 0.3 : 1, color: "#0C363A", fontSize: "0.68rem" }}
                        title="ترتيب لأسفل"
                      >
                        ▼ لأسفل
                      </button>
                      {/* Delete */}
                      <button 
                        type="button" 
                        onClick={() => deleteRange(index)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #F1C5BA", background: "#fff", color: "#D84728", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        title="حذف التقسيم"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Range Titles */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>العنوان (عربي)</label>
                      <Input 
                        value={range.titleAr} 
                        onChange={(e) => updateRangeField(index, "titleAr", e.target.value)} 
                        required 
                        placeholder="مثال: من 150 إلى 200 م²" 
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>العنوان (English)</label>
                      <Input 
                        value={range.titleEn} 
                        onChange={(e) => updateRangeField(index, "titleEn", e.target.value)} 
                        required 
                        dir="ltr"
                        placeholder="e.g. 150 to 200 m²" 
                      />
                    </div>
                  </div>

                  {/* Min and Max Range limits */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>المساحة الصغرى (متر مربع)</label>
                      <Input 
                        type="number"
                        value={range.min !== null && range.min !== undefined ? range.min : ""} 
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          updateRangeField(index, "min", val);
                        }} 
                        required
                        placeholder="0" 
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>المساحة الكبرى (متر مربع - اتركه فارغاً للحد الأقصى المفتوح)</label>
                      <Input 
                        type="number"
                        value={range.max !== null && range.max !== undefined ? range.max : ""} 
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          updateRangeField(index, "max", val);
                        }} 
                        placeholder="مثال: 200" 
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem", padding: "8px 10px", borderRadius: 8, background: "rgba(12, 54, 58, 0.05)", color: "#0C363A", fontSize: "0.72rem", fontWeight: 700 }}>
                    بعد الحفظ سيظهر داخل هذا التقسيم {(tempAreaCounts[range.id] || 0)} مشروع.
                  </div>

                  {/* Background Cover Image Uploader */}
                  <div style={{ borderTop: "1px dashed #eae5dc", paddingTop: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A", display: "block", marginBottom: 6 }}>
                      صورة خلفية جاذبة للبطاقة
                    </label>
                    {range.imageUrl ? (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e0d5" }}>
                          <img src={range.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateRangeField(index, "imageUrl", "")}
                          style={{ border: "none", background: "rgba(216, 71, 40,0.1)", color: "#D84728", cursor: "pointer", fontSize: "0.7rem", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}
                        >
                          حذف الصورة وتغييرها
                        </button>
                      </div>
                    ) : (
                      <MediaUploader 
                        folder="portfolio" 
                        label="رفع صورة خلفية جاذبة" 
                        accept="image/*" 
                        multiple={false} 
                        onUploaded={(url) => updateRangeField(index, "imageUrl", url)} 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </form>
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
