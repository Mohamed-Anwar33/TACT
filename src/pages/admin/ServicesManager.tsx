import { useEffect, useState } from "react";
import { 
  Layout, 
  Building2, 
  Paintbrush, 
  Home, 
  Briefcase, 
  Armchair, 
  HardHat, 
  Key,
  Edit2, 
  Trash2, 
  Plus,
  RefreshCw,
  Star
} from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import SaveButton from "@/components/admin/SaveButton";
import EditDrawer from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const ICON_MAP: Record<string, any> = {
  "01": Layout,
  "02": Building2,
  "03": Paintbrush,
  "04": Home,
  "05": Briefcase,
  "06": Armchair,
  "07": HardHat,
  "08": Key,
};

const ICON_LABELS: Record<string, string> = {
  "01": "التصميم الداخلي (01 - نافذة/تخطيط)",
  "02": "التصميم الخارجي (02 - مبنى/برج)",
  "03": "التشطيبات المتكاملة (03 - فرشاة دهان)",
  "04": "تنفيذ الشقق والفيلات (04 - منزل)",
  "05": "تنفيذ المشروعات التجارية (05 - حقيبة عمل)",
  "06": "الأثاث والديكور (06 - كرسي مريح)",
  "07": "الإشراف الهندسي (07 - خوذة مهندس)",
  "08": "تسليم مفتاح (08 - مفتاح)",
};

const blank = { 
  id: "", 
  slug: "", 
  number_label: "01", 
  title_en: "", 
  title_ar: "", 
  short_en: "", 
  short_ar: "", 
  detail_en: "", 
  detail_ar: "", 
  icon: "Layout", 
  image_url: "", 
  video_url: "", 
  sort_order: 0, 
  visible: true 
};

export default function ServicesManager() {
  const [items, setItems] = useState<any[]>([]);
  const [section, setSection] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() { 
    const [iRes, sRes] = await Promise.all([
      db.from("cms_services").select("*").order("sort_order"),
      db.from("cms_sections").select("*").eq("page_slug", "home").eq("section_key", "services-preview").maybeSingle()
    ]);
    setItems(iRes.data || []); 
    setSection(sRes.data || null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const pinOnHome = !!editing.pinOnHome;
      const payload = { ...editing, id: editing.id || undefined, sort_order: Number(editing.sort_order) || 0 };
      delete (payload as any).pinOnHome;

      const { data, error } = await db.from("cms_services").upsert(payload, { onConflict: "slug" }).select("id");
      if (error) throw error;

      const savedId = data?.[0]?.id ? String(data[0].id) : editing.id;
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

      toast.success("تم حفظ الخدمة"); 
      setEditing(null); 
      await load();
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setBusy(false); 
    }
  }

  async function doDelete() { 
    if (!deleteId) return; 
    await db.from("cms_services").delete().eq("id", deleteId); 
    toast.success("تم الحذف"); 
    await load(); 
    setDeleteId(null); 
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
      if (newIds.length >= 4) {
        toast.warning("يمكنك اختيار 4 خدمات كحد أقصى للعرض في الصفحة الرئيسية!");
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
      toast.success(newIds.includes(idStr) ? "تم عرض الخدمة بالصفحة الرئيسية" : "تم إلغاء عرض الخدمة بالصفحة الرئيسية");
      await load();
    } catch (err: any) {
      toast.error("فشل التحديث: " + err.message);
    }
  }

  async function resetToDefault() {
    if (!confirm("هل أنت متأكد من إعادة تعيين الخدمات للقيم الافتراضية للموقع؟ سيؤدي هذا لحذف كافة الخدمات الحالية واستعادة الـ 8 خدمات الأساسية للموقع.")) return;
    setBusy(true);
    try {
      // 1. Delete all current rows in cms_services
      await db.from("cms_services").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 2. Insert the 8 default services
      const defaults = [
        {
          slug: "interior-design",
          number_label: "01",
          title_ar: "التصميم الداخلي",
          title_en: "Interior Design",
          short_ar: "رؤية هندسية متكاملة لكل غرفة، توازن بين الجمال والوظيفة.",
          short_en: "Integrated architectural vision balancing beauty and function.",
          detail_ar: "نقوم بدراسة الفراغات وتوزيع الأثاث والإضاءة واختيار الألوان والخامات بما يحقق الراحة النفسية والجمالية للفراغ.",
          detail_en: "We study spaces, furniture distribution, lighting, colors, and materials to achieve psychological comfort and beauty.",
          sort_order: 10,
          visible: true
        },
        {
          slug: "exterior-design",
          number_label: "02",
          title_ar: "التصميم الخارجي",
          title_en: "Exterior Design",
          short_ar: "واجهات وحدائق ومداخل مصممة بهوية معمارية راقية.",
          short_en: "Facades, gardens, and entrances with refined architectural identity.",
          detail_ar: "تصميم واجهات معمارية كلاسيكية ومودرن، وتصميم اللاندسكيب والحدائق والمداخل بشكل يعكس فخامة المبنى.",
          detail_en: "Designing classic and modern facades, landscape, gardens, and entrances to reflect building luxury.",
          sort_order: 20,
          visible: true
        },
        {
          slug: "full-finishing",
          number_label: "03",
          title_ar: "التشطيبات المتكاملة",
          title_en: "Integrated Finishing",
          short_ar: "تشطيب من الألف إلى الياء بأعلى معايير الجودة والدقة.",
          short_en: "End-to-end finishing at the highest quality standards.",
          detail_ar: "ننفذ كافة أعمال التشطيبات والديكور والكهرباء والسباكة والنجارة والدهانات والأسقف المعلقة بأعلى دقة هندسية.",
          detail_en: "We execute all finishing, decor, electricity, plumbing, carpentry, painting, and false ceilings with highest engineering precision.",
          sort_order: 30,
          visible: true
        },
        {
          slug: "apartment-villa-execution",
          number_label: "04",
          title_ar: "تنفيذ الشقق والفيلات",
          title_en: "Apartments & Villas Execution",
          short_ar: "إدارة كاملة لتنفيذ الوحدات السكنية بمختلف أحجامها.",
          short_en: "Full management for residential units of any size.",
          detail_ar: "نوفّر خدمات التنفيذ المتكامل للفلل والشقق السكنية الفاخرة تحت إشراف نخبة من المهندسين لضمان مطابقة التنفيذ للتصميم.",
          detail_en: "We provide integrated execution services for luxury villas and residential apartments under engineer supervision.",
          sort_order: 40,
          visible: true
        },
        {
          slug: "commercial-office-execution",
          number_label: "05",
          title_ar: "تنفيذ المشروعات التجارية والإدارية",
          title_en: "Commercial & Office Execution",
          short_ar: "محلات، عيادات، مكاتب، ومقرات إدارية.",
          short_en: "Shops, clinics, offices, and corporate spaces.",
          detail_ar: "تصميم وتنفيذ متكامل للفراغات التجارية والمكاتب الإدارية لتهيئة بيئة عمل مريحة وجذابة تزيد الإنتاجية.",
          detail_en: "Integrated design and execution for commercial spaces and offices to create a comfortable, productive workspace.",
          sort_order: 50,
          visible: true
        },
        {
          slug: "furniture-decor",
          number_label: "06",
          title_ar: "الأثاث والديكور",
          title_en: "Furniture & Decor",
          short_ar: "قطع أثاث مفصلة وتنسيق ديكور يعكس هوية المساحة.",
          short_en: "Custom furniture pieces and styling that reflect your identity.",
          detail_ar: "نصمم وننفذ قطع الأثاث الخاصة والمطابخ والدريسنج روم بأعلى خامات الخشب والتشطيبات الفاخرة.",
          detail_en: "We design and execute custom furniture, kitchens, and dressing rooms with highest quality wood and finishes.",
          sort_order: 60,
          visible: true
        },
        {
          slug: "engineering-supervision",
          number_label: "07",
          title_ar: "الإشراف الهندسي",
          title_en: "Engineering Supervision",
          short_ar: "متابعة دقيقة على كل مرحلة لضمان جودة التنفيذ.",
          short_en: "Precise oversight at every phase for guaranteed quality.",
          detail_ar: "إشراف هندسي متكامل ومتابعة استلام البنود من المقاولين ومطابقتها للمواصفات والأصول الهندسية المعترف بها.",
          detail_en: "Full engineering supervision, receiving items from contractors, matching them to standard engineering specifications.",
          sort_order: 70,
          visible: true
        },
        {
          slug: "turnkey-delivery",
          number_label: "08",
          title_ar: "تسليم مفتاح",
          title_en: "Turn-Key Delivery",
          short_ar: "نسلّم المساحة جاهزة للسكن بأدق التفاصيل.",
          short_en: "We hand over the space ready to live in, down to the last detail.",
          detail_ar: "خدمة تسليم مفتاح متكاملة تشمل التصميم والتنفيذ والفرش والتجهيز الكامل لتستلم مساحتك دون أي عناء.",
          detail_en: "Integrated turn-key service including design, execution, furnishing, and full preparation to receive your space hassle-free.",
          sort_order: 80,
          visible: true
        }
      ];

      const { error } = await db.from("cms_services").upsert(defaults, { onConflict: "slug" });
      if (error) throw error;
      toast.success("تم إعادة تعيين الخدمات للقيم الافتراضية بنجاح!");
      await load();
    } catch (err: any) {
      toast.error("فشل إعادة التعيين: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminHeader title="خدماتنا" subtitle="إدارة الخدمات وتفاصيلها" previewUrl="/services"
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={resetToDefault} 
              disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#C18556", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> إعادة تعيين للقيم الافتراضية
            </button>
            <button 
              onClick={() => setEditing({ ...blank, sort_order: (items.length + 1) * 10 })} 
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              <Plus size={16} /> إضافة خدمة
            </button>
          </div>
        }
      />
      <div className="admin-content" style={{ padding: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {items.map((s, i) => {
            const IconComponent = ICON_MAP[s.number_label] || Layout;
            const selectedIds: string[] = section?.metadata?.selectedIds || [];
            const isPinned = selectedIds.includes(String(s.id));
            return (
              <div 
                key={s.id} 
                className="admin-card" 
                style={{ 
                  background: "#fff", 
                  border: "1px solid rgba(193, 133, 86, 0.15)", 
                  borderRadius: 12, 
                  padding: "1.5rem", 
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 30px rgba(12, 54, 58, 0.03)",
                  transition: "all 0.3s ease"
                }}
              >
                {/* Numbering & Pin badge */}
                <div style={{ 
                  position: "absolute", 
                  top: "1.25rem", 
                  left: "1.25rem", 
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  {isPinned && (
                    <span style={{ fontSize: "0.6rem", background: "#fdf2e9", color: "#c18556", border: "1px solid #f5d6c1", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      ★ بالرئيسية
                    </span>
                  )}
                  <span style={{ 
                    fontSize: "0.85rem", 
                    fontWeight: 850, 
                    color: "rgba(193, 133, 86, 0.35)", 
                    fontFamily: "serif" 
                  }}>
                    {s.number_label || String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <div>
                  {/* Icon Frame */}
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 8, 
                    border: "1px solid rgba(193, 133, 86, 0.2)", 
                    background: "rgba(193, 133, 86, 0.05)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    marginBottom: "1.25rem",
                    color: "#C18556"
                  }}>
                    <IconComponent size={20} className="stroke-[1.5]" />
                  </div>

                  {/* Title */}
                  <h3 style={{ 
                    fontSize: "1.05rem", 
                    fontWeight: 700, 
                    color: "#0C363A", 
                    marginBottom: "0.5rem" 
                  }}>
                    {s.title_ar || s.title_en}
                  </h3>

                  {/* Divider line */}
                  <div style={{ width: 30, height: 1, background: "rgba(193, 133, 86, 0.3)", marginBottom: "0.75rem" }} />

                  {/* Description */}
                  <p style={{ 
                    fontSize: "0.8rem", 
                    color: "#666", 
                    lineHeight: "1.5", 
                    marginBottom: "1.5rem" 
                  }}>
                    {s.short_ar || s.short_en || ""}
                  </p>
                </div>

                {/* Footer buttons & status */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  borderTop: "1px solid #f5f2eb", 
                  paddingTop: "0.75rem", 
                  marginTop: "0.5rem" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusBadge visible={s.visible} />
                    
                    <button
                      type="button"
                      onClick={() => togglePin(s.id)}
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: "0.62rem",
                        fontWeight: 600,
                        border: "1px solid",
                        cursor: "pointer",
                        background: isPinned ? "#0C363A" : "#ffffff",
                        color: isPinned ? "#ffffff" : "#0C363A",
                        borderColor: "#0C363A",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        transition: "all 0.2s"
                      }}
                    >
                      {isPinned ? "✕ إزالة" : "★ تثبيت"}
                    </button>
                  </div>
                  
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={() => setEditing({ ...s, pinOnHome: isPinned })} 
                      style={{ 
                        padding: "6px 12px", 
                        borderRadius: 6, 
                        border: "1px solid #e5e0d5", 
                        background: "#fff", 
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.75rem",
                        color: "#555"
                      }}
                    >
                      <Edit2 size={12} /> تعديل
                    </button>
                    <button 
                      onClick={() => setDeleteId(s.id)} 
                      style={{ 
                        padding: "6px 8px", 
                        borderRadius: 6, 
                        border: "1px solid #F1C5BA", 
                        background: "#fff", 
                        cursor: "pointer", 
                        color: "#D84728",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditDrawer open={!!editing} title={editing?.id ? "تعديل الخدمة" : "إضافة خدمة جديدة"} onClose={() => setEditing(null)}
        footer={<SaveButton loading={busy} label="حفظ الخدمة" onClick={() => (document.getElementById("svc-form") as HTMLFormElement)?.requestSubmit()} />}>
        {editing && (
          <form id="svc-form" onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>أيقونة الخدمة</label>
                <select 
                  value={editing.number_label || "01"} 
                  onChange={e => {
                    const num = e.target.value;
                    const defaultSlugs: Record<string, string> = {
                      "01": "interior-design",
                      "02": "exterior-design",
                      "03": "full-finishing",
                      "04": "apartment-villa-execution",
                      "05": "commercial-office-execution",
                      "06": "furniture-decor",
                      "07": "engineering-supervision",
                      "08": "turnkey-delivery",
                    };
                    setEditing({ 
                      ...editing, 
                      number_label: num,
                      slug: editing.slug || defaultSlugs[num] || `service-${num}`
                    });
                  }} 
                  style={{ 
                    width: "100%",
                    padding: "0.5rem 0.75rem", 
                    borderRadius: 6, 
                    border: "1px solid #e5e0d5",
                    fontSize: "0.85rem",
                    color: "#0C363A",
                    background: "#fff"
                  }}
                >
                  {Object.entries(ICON_LABELS).map(([num, label]) => (
                    <option key={num} value={num}>
                      {num} - {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Slug (الرابط الفريد)</label>
                <Input 
                  value={editing.slug} 
                  onChange={e => setEditing({ ...editing, slug: e.target.value })} 
                  required 
                  dir="ltr" 
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>العنوان (عربي)</label><Input value={editing.title_ar} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} required /></div>
              <div className="form-group"><label>Title (EN)</label><Input value={editing.title_en} onChange={e => setEditing({ ...editing, title_en: e.target.value })} required dir="ltr" /></div>
            </div>
            <div className="form-group"><label>الوصف المختصر (عربي)</label><Textarea value={editing.short_ar || ""} onChange={e => setEditing({ ...editing, short_ar: e.target.value })} rows={2} /></div>
            <div className="form-group"><label>Short Description (EN)</label><Textarea value={editing.short_en || ""} onChange={e => setEditing({ ...editing, short_en: e.target.value })} rows={2} dir="ltr" /></div>
            <div className="form-group"><label>الوصف التفصيلي (عربي)</label><Textarea value={editing.detail_ar || ""} onChange={e => setEditing({ ...editing, detail_ar: e.target.value })} rows={3} /></div>
            <div className="form-group"><label>Detail (EN)</label><Textarea value={editing.detail_en || ""} onChange={e => setEditing({ ...editing, detail_en: e.target.value })} rows={3} dir="ltr" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>الترتيب</label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: e.target.value })} /></div>
              <div className="form-group"><label>الحالة</label>
                <select value={editing.visible ? "1" : "0"} onChange={e => setEditing({ ...editing, visible: e.target.value === "1" })} style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5" }}>
                  <option value="1">ظاهر</option><option value="0">مخفي</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="servicePinHome"
                checked={!!editing.pinOnHome}
                onChange={e => setEditing({ ...editing, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
              <label htmlFor="servicePinHome" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                عرض هذه الخدمة في الصفحة الرئيسية
              </label>
            </div>
          </form>
        )}
      </EditDrawer>
      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
