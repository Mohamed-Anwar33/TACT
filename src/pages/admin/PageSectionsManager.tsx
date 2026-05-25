import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Edit2, Trash2, Plus, Eye, EyeOff, Image as ImageIcon, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Grip, Film, Sparkles, Quote, Download, Star, ArrowRight, ArrowLeft, Layout, Building2, Paintbrush, Home, Briefcase, Armchair, HardHat, Key } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import SaveButton from "@/components/admin/SaveButton";
import MediaPreview from "@/components/admin/MediaPreview";
import MediaUploader from "@/components/admin/MediaUploader";
import EditDrawer from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getProjectPreviewMedia } from "@/lib/publicCms";

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

const PAGE_NAMES: Record<string, { ar: string; en: string }> = {
  home: { ar: "الرئيسية", en: "Home" },
  about: { ar: "من نحن", en: "About" },
  services: { ar: "خدماتنا", en: "Services" },
  portfolio: { ar: "أعمالنا", en: "Portfolio" },
  team: { ar: "فريق العمل", en: "Team" },
  testimonials: { ar: "العملاء", en: "Clients" },
  contact: { ar: "تواصل معنا", en: "Contact" },
};

const SECTION_DEFAULTS: Record<string, { title_ar: string; title_en: string; body_ar: string; body_en: string; cta_label_ar?: string; cta_label_en?: string }> = {
  hero: {
    title_ar: "\u0646\u062d\u0648\u0651\u0644 \u0627\u0644\u0645\u0633\u0627\u062d\u0627\u062a \u0625\u0644\u0649 \u062a\u062c\u0631\u0628\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u062d\u062a\u0649 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    title_en: "We turn spaces into a complete experience — from design to delivery.",
    body_ar: "\u062a\u0635\u0645\u064a\u0645 \u062f\u0627\u062e\u0644\u064a\u060c \u062a\u0646\u0641\u064a\u0630\u060c \u062a\u0634\u0637\u064a\u0628\u0627\u062a\u060c \u0648\u0641\u0631\u0634 \u0646\u0647\u0627\u0626\u064a \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0647\u0646\u062f\u0633\u064a\u0629 \u0631\u0627\u0642\u064a\u0629.",
    body_en: "Interior design, execution, finishing, and final furnishing — crafted to architectural standards.",
    cta_label_ar: "\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u062c\u0631\u0628\u0629",
    cta_label_en: "GET STARTED"
  },
  "about-preview": {
    title_ar: "\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0645\u0639\u0646\u0649 | \u062f\u0627\u062e\u0644 \u0643\u0644 \u0645\u0633\u0627\u062d\u0629",
    title_en: "Engineering Meaning | Inside Every Space",
    body_ar: "\u0646\u062d\u0646 \u0634\u0631\u0643\u0629 \u0645\u062a\u062e\u0635\u0635\u0629 \u0641\u064a \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0648\u0627\u0644\u062a\u0646\u0641\u064a\u0630 \u0648\u0627\u0644\u062a\u0634\u0637\u064a\u0628\u0627\u062a \u0627\u0644\u0645\u062a\u0643\u0627\u0645\u0644\u0629\u060c \u0646\u0639\u0645\u0644 \u0628\u0631\u0624\u064a\u0629 \u0647\u0646\u062f\u0633\u064a\u0629 \u062f\u0642\u064a\u0642\u0629 \u0648\u0645\u0639\u0627\u064a\u064a\u0631 \u062a\u0646\u0641\u064a\u0630 \u0639\u0627\u0644\u064a\u0629. \u0646\u0645\u062a\u0644\u0643 \u062e\u0628\u0631\u0629 \u062a\u0645\u062a\u062f \u0644\u0623\u0643\u062b\u0631 \u0645\u0646 12 \u0639\u0627\u0645\u0627\u064b \u0641\u064a \u0625\u062f\u0627\u0631\u0629 \u0648\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062a \u0627\u0644\u0633\u0643\u0646\u064a\u0629 \u0648\u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629.\n\n\u0646\u0641\u0630\u0646\u0627 \u0628\u0646\u062c\u0627\u062d \u0623\u0643\u062b\u0631 \u0645\u0646 60 \u0645\u0634\u0631\u0648\u0639\u0627\u064b\u060c \u0645\u0639 \u062a\u0644\u0632\u0627\u0645 \u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u062c\u0648\u062f\u0629\u060c \u0648\u0627\u0644\u062f\u0642\u0629\u060c \u0648\u0627\u062d\u062a\u0631\u0627\u0645 \u062a\u0641\u0627\u0635\u064a\u0644 \u0643\u0644 \u0645\u0633\u0627\u062d\u0629. \u0646\u0642\u062f\u0651\u0645 \u062a\u062c\u0631\u0628\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629 \u062a\u0628\u062f\u0623 \u0645\u0646 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0648\u062d\u062f\u0629 \u0648\u062d\u062a\u0649 \u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064a.",
    body_en: "We are a firm specialized in integrated design, execution, and finishing, operating with precise architectural vision and high execution standards. We possess over 12 years of experience in managing and delivering projects.\n\nWe have successfully completed over 60 projects, with full commitment to quality, precision, and respect for the details of every space. We offer a comprehensive experience from unit handover to final delivery.",
    cta_label_ar: "\u0627\u0644\u0645\u0632\u064a\u062f \u0639\u0646\u0627",
    cta_label_en: "LEARN MORE"
  },
  "team-preview": {
    title_ar: "\u062a\u0639\u0631\u0641 \u0639\u0644\u0649 | \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0645\u0624\u0633\u0633\u064a\u0646",
    title_en: "Meet Our | Founding Owners",
    body_ar: "\u0627\u0644\u0639\u0642\u0648\u0644 \u0627\u0644\u0642\u064a\u0627\u062f\u064a\u0629 \u0627\u0644\u0645\u062b\u064a\u0631\u0629 \u0627\u0644\u062a\u064a \u062a\u0642\u0648\u062f \u062a\u0627\u0643\u062a \u0644\u0644\u0647\u0646\u062f\u0633\u0629 \u0648\u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0646\u062d\u0648 \u0627\u0644\u0631\u064a\u0627\u062f\u0629 \u0648\u0635\u0646\u0627\u0639\u0629 \u0623\u0631\u0642\u0649 \u0627\u0644\u0645\u0633\u0627\u062d\u0627\u062a \u0627\u0644\u0633\u0643\u0646\u064a\u0629 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629.",
    body_en: "The creative leadership driving Tact Architecture & Decoration towards standard excellence and premium interior engineering."
  },
  "testimonials": {
    title_ar: "\u062b\u0642\u0629 \u062a\u064f\u0628\u0646\u0649 | \u0645\u0639 \u0643\u0644 \u062a\u0633\u0644\u064a\u0645",
    title_en: "Trust Built | With Every Unit",
    body_ar: "\u0646\u0648\u062b\u0642 \u0622\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u0626\u0646\u0627 \u0628\u0643\u0644 \u0645\u0635\u062f\u0627\u0642\u064a\u0629 \u0639\u0628\u0631 \u062a\u063a\u0637\u064a\u0627\u062a \u0645\u0631\u0626\u064a\u0629 \u0648\u062a\u0641\u0627\u0635\u064a\u0644 \u062d\u064a\u0629 \u0639\u0644\u0649 \u0623\u0631\u0636 \u0627\u0644\u0648\u0627\u0642\u0639 \u062a\u062c\u0633\u062f \u0627\u0644\u062a\u0632\u0627\u0645\u0646\u0627 \u0627\u0644\u062a\u0627\u0645 \u0628\u0627\u0644\u062c\u0648\u062f\u0629 \u0648\u0627\u0644\u062f\u0642\u0629.",
    body_en: "We document our clients' experiences with absolute credibility through video coverage and live updates on the ground."
  },
  "works-preview": {
    title_ar: "\u0633\u0627\u0628\u0642\u0629 \u0623\u0639\u0645\u0627\u0644 | \u062a\u062a\u062d\u062f\u0649 \u062a\u0641\u0627\u0635\u064a\u0644\u0647\u0627",
    title_en: "Portfolio That | Defies Details",
    body_ar: "\u062a\u0635\u0641\u062d \u0645\u0634\u0627\u0631\u064a\u0639\u0646\u0627 \u0627\u0644\u0645\u0642\u0633\u0645\u0626 \u0628\u062f\u0642\u0629 \u0644\u062a\u0644\u0628\u064a \u062a\u0637\u0644\u0639\u0627\u062a\u0643 \u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064a\u0629\u060c \u0645\u0627 \u0628\u064a\u0646 \u0627\u0644\u062a\u0635\u0627\u0645\u064a\u0645 \u062b\u0644\u0627\u062b\u064a\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062f \u0627\u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0637\u0642\u064a\u0629 \u0648\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0641\u0639\u064a \u0639\u0644\u0649 \u0623\u0631\u0636 \u0627\u0644\u0648\u0627\u0642\u0639.",
    body_en: "Browse our projects categorized neatly to match your architectural vision, from high-end 3D designs to real executed walkthroughs.",
    cta_label_ar: "\u0639\u0631\u0636 \u0627\u0644\u0623\u0639\u0645\u0627\u0644",
    cta_label_en: "View Work"
  },
  "services-preview": {
    title_ar: "\u062a\u062c\u0631\u0628\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629 \u0628\u062a\u0641\u0627\u0635\u064a\u0644 | \u062a\u0644\u064a\u0642 \u0628\u0627\u0644\u0646\u0638\u0631",
    title_en: "Integrated Experience with | Refined Details",
    body_ar: "\u0646\u062d\u0648\u0651\u0644 \u0627\u0644\u0641\u0643\u0631\u0629 \u0625\u0644\u0649 \u0645\u0633\u0627\u062d\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629\u060c \u0645\u0646 \u0627\u0644\u062a\u062e\u0635\u064a\u0635 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0623\u0648\u0644\u064a \u062d\u062a\u0649 \u0623\u062f\u0642 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u060c \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0647\u0646\u062f\u0633\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0648\u0631\u0624\u064a\u0629 \u0641\u0646\u064a\u0629 \u0631\u0627\u0642\u064a\u0629.",
    body_en: "Transforming ideas into integrated spaces, from initial planning to the finest execution details, with international standards and refined vision.",
    cta_label_ar: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
    cta_label_en: "View All"
  },
  "packages-cta": {
    title_ar: "\u062e\u062a\u0631 \u0627\u0644\u0628\u0627\u0642\u0629 | \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u0645\u0633\u0627\u062d\u062a\u0643",
    title_en: "Choose the | Perfect Package for Your Space",
    body_ar: "\u0628\u0627\u0642\u0627\u062a \u0645\u0631\u0646\u0629 \u062a\u0646\u0627\u0633\u0628 \u0645\u0631\u0626\u064a\u0629 \u062a\u0646\u0627\u0633\u0628 \u0645\u0631\u0627\u062d\u0644 \u0645\u062e\u062a\u0644\u0641\u0629 \u0645\u0646 \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0648\u0627\u0644\u062a\u0646\u0641\u064a\u0630\u060c \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064a\u0629 \u062a\u062e\u0635\u064a\u0635 \u0627\u0644\u0639\u0631\u0636 \u062d\u0633\u0628 \u0627\u062d\u062a\u064a\u0627\u062c \u0645\u0634\u0631\u0648\u0639\u0643.",
    body_en: "Flexible packages catering to different stages of design and execution, with customizable options to match your project needs and ambitions.",
    cta_label_ar: "\u0637\u0644\u0628 \u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u062c\u0627\u0646\u064a\u0629",
    cta_label_en: "REQUEST CONSULTATION"
  }
};

const blank = {
  id: "", page_slug: "", section_key: "", section_name_en: "", section_name_ar: "",
  title_en: "", title_ar: "", body_en: "", body_ar: "",
  cta_label_en: "", cta_label_ar: "",
  sort_order: 0, visible: true,
};

/* ─── Color accent per section key for visual distinction ─── */
const KEY_COLORS: Record<string, string> = {
  hero: "#C18556",
  "about-preview": "#0F6E66",
  "services-preview": "#0F6E66",
  "works-preview": "#C18556",
  "team-preview": "#99A097",
  testimonials: "#DDB57C",
  "packages-cta": "#D84728",
  "pdf-booklets": "#0F6E66",
};

function getAccent(key: string) {
  return KEY_COLORS[key] || "#C18556";
}

function makeInternalSlug(value: string, fallback: string) {
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

export default function PageSectionsManager() {
  const { slug = "home" } = useParams();
  const page = PAGE_NAMES[slug] || PAGE_NAMES.home;
  const [sections, setSections] = useState<any[]>([]);
  const [sectionMedia, setSectionMedia] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clientReviews, setClientReviews] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [dbTeam, setDbTeam] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);

  // New luxury workspace states
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [statsEditing, setStatsEditing] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState<any>({ ...blank });

/* ─── Stats Editor ─── */
function StatsEditor({ editing, setEditing }: { editing: any; setEditing: (v: any) => void }) {
  const defaultStats = [
    { value_ar: "+12", value_en: "+12", label_ar: "سنة خبرة", label_en: "Years Experience" },
    { value_ar: "+60", value_en: "+60", label_ar: "مشروع منفذ", label_en: "Completed Projects" },
    { value_ar: "متكامل", value_en: "Integrated", label_ar: "من الفكرة للتنفيذ", label_en: "From Concept to Reality" },
    { value_ar: "معتمد", value_en: "Certified", label_ar: "بأعلى معايير الجودة", label_en: "Highest Quality Standards" },
  ];

  let stats: any[];
  try { stats = typeof editing.body_ar === "string" && editing.body_ar.startsWith("[") ? JSON.parse(editing.body_ar) : defaultStats; }
  catch { stats = defaultStats; }

  const update = (idx: number, field: string, val: string) => {
    const next = stats.map((s: any, i: number) => i === idx ? { ...s, [field]: val } : s);
    setEditing({ ...editing, body_ar: JSON.stringify(next), body_en: JSON.stringify(next) });
  };

  const addStat = () => {
    const next = [...stats, { value_ar: "", value_en: "", label_ar: "", label_en: "" }];
    setEditing({ ...editing, body_ar: JSON.stringify(next), body_en: JSON.stringify(next) });
  };

  const removeStat = (idx: number) => {
    const next = stats.filter((_: any, i: number) => i !== idx);
    setEditing({ ...editing, body_ar: JSON.stringify(next), body_en: JSON.stringify(next) });
  };

  return (
    <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#c9964c", fontWeight: 700 }}>الإحصائيات ({stats.length})</span>
        <button type="button" onClick={addStat} style={{ padding: "3px 10px", borderRadius: 6, background: "#073b35", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600 }}>+ إضافة</button>
      </div>

      {/* Preview strip — matches website look */}
      <div style={{ background: "#0C363A", borderRadius: 12, padding: "1.25rem", marginBottom: 16, display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: 12 }}>
        {stats.map((s: any, i: number) => (
          <div key={i} style={{ textAlign: "center", borderInlineStart: i > 0 ? "1px solid rgba(193,133,86,0.2)" : "none", paddingInlineStart: i > 0 ? 12 : 0 }}>
            <div style={{ color: "#c9964c", fontSize: "1.5rem", fontWeight: 700, fontFamily: "serif" }}>{s.value_ar || "—"}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{s.label_ar || "—"}</div>
          </div>
        ))}
      </div>

      {/* Editable cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stats.map((s: any, i: number) => (
          <div key={i} style={{ background: "#faf8f4", borderRadius: 10, border: "1px solid #eae5dc", padding: "0.85rem 1rem", position: "relative" }}>
            <div style={{ position: "absolute", top: 8, insetInlineEnd: 8, display: "flex", gap: 4 }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#c9964c", background: "#c9964c10", padding: "2px 8px", borderRadius: 10 }}>#{i + 1}</span>
              {stats.length > 1 && (
                <button type="button" onClick={() => removeStat(i)} style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 9 }}>✕</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>القيمة (عربي)</label>
                <Input value={s.value_ar || ""} onChange={e => update(i, "value_ar", e.target.value)} placeholder="+12" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#c9964c", textAlign: "center" }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Value (EN)</label>
                <Input value={s.value_en || ""} onChange={e => update(i, "value_en", e.target.value)} placeholder="+12" dir="ltr" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#c9964c", textAlign: "center" }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>التسمية (عربي)</label>
                <Input value={s.label_ar || ""} onChange={e => update(i, "label_ar", e.target.value)} placeholder="سنة خبرة" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Label (EN)</label>
                <Input value={s.label_en || ""} onChange={e => update(i, "label_en", e.target.value)} placeholder="Years Experience" dir="ltr" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



/* ─── Client Reviews Embedded Editor ─── */
function ClientReviewsEditor({ clientReviews, onRefresh, editing, setEditing }: { clientReviews: any[]; onRefresh: () => Promise<void>; editing: any; setEditing: (val: any) => void }) {
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedIds: string[] = editing.metadata?.selectedIds || [];
  const showReviewSlider = editing.metadata?.showReviewSlider !== false;

  const blankReview = {
    id: "",
    client_name_ar: "",
    client_name_en: "",
    role_ar: "",
    role_en: "",
    quote_ar: "",
    quote_en: "",
    rating: 5,
    image_url: "",
    video_url: "",
    video_cover_url: "",
    sort_order: clientReviews.length,
    visible: true,
    pinOnHome: false
  };

  const toggleReviewSlider = async () => {
    const nextEditing = {
      ...editing,
      metadata: {
        ...editing.metadata,
        showReviewSlider: !showReviewSlider
      }
    };
    setEditing(nextEditing);

    try {
      const payload = {
        ...nextEditing,
        id: nextEditing.id || undefined,
        sort_order: Number(nextEditing.sort_order) || 0
      };
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;
      toast.success(!showReviewSlider ? "تم تفعيل سلايدر آراء العملاء" : "تم إلغاء تفعيل سلايدر آراء العملاء");
      await onRefresh();
    } catch (err: any) {
      toast.error("فشل تحديث السلايدر: " + err.message);
    }
  };

  const togglePin = async (id: string | number) => {
    const idStr = String(id);
    let newIds = [...selectedIds];
    if (newIds.includes(idStr)) {
      newIds = newIds.filter(x => x !== idStr);
    } else {
      newIds = [idStr, ...newIds];
    }
    const nextEditing = {
      ...editing,
      metadata: {
        ...editing.metadata,
        selectedIds: newIds
      }
    };
    setEditing(nextEditing);

    try {
      const payload = { 
        ...nextEditing, 
        id: nextEditing.id || undefined, 
        sort_order: Number(nextEditing.sort_order) || 0 
      };
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;
      toast.success("تم تحديث وتثبيت الرأي بالصفحة الرئيسية بنجاح");
      await onRefresh();
    } catch (err: any) {
      toast.error("فشل الحفظ التلقائي: " + err.message);
    }
  };

  async function saveReview(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReview) return;
    setBusy(true);
    try {
      const payload = {
        ...editingReview,
        id: editingReview.id || undefined,
        sort_order: Number(editingReview.sort_order) || 0,
        rating: Number(editingReview.rating) || 5
      };
      const pinOnHome = !!editingReview.pinOnHome;
      delete (payload as any).pinOnHome;

      const { data, error } = await db.from("cms_client_testimonials").upsert(payload).select("id");
      if (error) throw error;
      toast.success("تم حفظ الرأي بنجاح");
      
      const savedId = data?.[0]?.id ? String(data[0].id) : editingReview.id;
      if (savedId) {
        let newIds = [...selectedIds];
        if (pinOnHome) {
          newIds = [String(savedId), ...newIds.filter(x => x !== String(savedId))];
        } else {
          newIds = newIds.filter(x => x !== String(savedId));
        }
        const nextEditing = {
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: newIds
          }
        };
        setEditing(nextEditing);

        try {
          const sectionPayload = { 
            ...nextEditing, 
            id: nextEditing.id || undefined, 
            sort_order: Number(nextEditing.sort_order) || 0 
          };
          await db.from("cms_sections").upsert(sectionPayload, { onConflict: "page_slug,section_key" });
        } catch (e) {
          console.error("Auto-save section failed:", e);
        }
      }

      setEditingReview(null);
      setShowAddForm(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("هل أنت متأكد من حذف رأي هذا العميل نهائياً؟")) return;
    try {
      const { error } = await db.from("cms_client_testimonials").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الرأي بنجاح");
      // Also unpin if deleted
      const idStr = String(id);
      if (selectedIds.includes(idStr)) {
        setEditing({
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: selectedIds.filter(x => x !== idStr)
          }
        });
      }
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleReviewVisibility(review: any) {
    try {
      const { error } = await db.from("cms_client_testimonials")
        .update({ visible: !review.visible })
        .eq("id", review.id);
      if (error) throw error;
      toast.success(review.visible ? "تم إخفاء الرأي" : "تم تفعيل الرأي");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div style={{ border: "1px solid #eae5dc", borderRadius: 12, padding: "1.25rem", background: "#faf8f4", display: "flex", flexDirection: "column", gap: 12, marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0C363A", fontWeight: 800 }}>
          آراء العملاء في قاعدة البيانات ({clientReviews.length})
        </span>
        {!showAddForm && !editingReview && (
          <button type="button" onClick={() => { setEditingReview({ ...blankReview }); setShowAddForm(true); }}
            style={{ padding: "4px 10px", borderRadius: 6, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600 }}>
            + إضافة رأي جديد
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0.75rem 0.9rem", borderRadius: 10, background: "#fff", border: "1px solid #eae5dc" }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0C363A" }}>سلايدر آراء العملاء في الرئيسية</div>
          <div style={{ fontSize: "0.65rem", color: "#8a8578", marginTop: 2 }}>تفعيل أو إخفاء السلايدر الموجود تحت فيديوهات العملاء</div>
        </div>
        <button
          type="button"
          onClick={toggleReviewSlider}
          style={{
            padding: "0.4rem 0.75rem",
            borderRadius: 8,
            border: "1px solid",
            borderColor: showReviewSlider ? "#B9D4D0" : "#e5e0d5",
            background: showReviewSlider ? "#ECF6F4" : "#f5f5f4",
            color: showReviewSlider ? "#0F6E66" : "#78716c",
            fontSize: "0.7rem",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          {showReviewSlider ? "مفعل" : "غير مفعل"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {(showAddForm || editingReview) && (
        <div style={{ background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A" }}>
              {editingReview.id ? "تعديل رأي العميل" : "إضافة رأي عميل جديد"}
            </span>
            <button type="button" onClick={() => { setEditingReview(null); setShowAddForm(false); }}
              style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "0.75rem" }}>إلغاء</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>اسم العميل (عربي)</label>
                <Input value={editingReview.client_name_ar || ""} onChange={e => setEditingReview({ ...editingReview, client_name_ar: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Client Name (EN)</label>
                <Input value={editingReview.client_name_en || ""} onChange={e => setEditingReview({ ...editingReview, client_name_en: e.target.value })} required dir="ltr" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الدور/الوظيفة (عربي)</label>
                <Input value={editingReview.role_ar || ""} onChange={e => setEditingReview({ ...editingReview, role_ar: e.target.value })} placeholder="مثال: تشطيب فيلا التجمع" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Role (EN)</label>
                <Input value={editingReview.role_en || ""} onChange={e => setEditingReview({ ...editingReview, role_en: e.target.value })} placeholder="e.g. Villa Owner" dir="ltr" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>نص الرأي (عربي)</label>
              <Textarea value={editingReview.quote_ar || ""} onChange={e => setEditingReview({ ...editingReview, quote_ar: e.target.value })} rows={2} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>Quote (EN)</label>
              <Textarea value={editingReview.quote_en || ""} onChange={e => setEditingReview({ ...editingReview, quote_en: e.target.value })} rows={2} required dir="ltr" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem", display: "block", marginBottom: 3 }}>التقييم</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setEditingReview({ ...editingReview, rating: s })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Star size={18} fill={s <= (editingReview.rating || 5) ? "#C18556" : "none"} color="#C18556" />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>وسيط الرأي: صورة أو فيديو (اختياري)</label>
              {editingReview.image_url && <MediaPreview url={editingReview.image_url} height={80} />}
              {editingReview.video_url && <MediaPreview url={editingReview.video_url} type="video" height={80} />}
              <MediaUploader
                folder="client-reviews"
                label="رفع صورة أو فيديو"
                accept="image/*,video/*"
                onUploaded={(url, file) => setEditingReview({
                  ...editingReview,
                  image_url: file.type.startsWith("image/") ? url : "",
                  video_url: file.type.startsWith("video/") ? url : "",
                  video_cover_url: ""
                })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الترتيب</label>
                <Input type="number" value={editingReview.sort_order} onChange={e => setEditingReview({ ...editingReview, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الحالة</label>
                <select value={editingReview.visible ? "1" : "0"} onChange={e => setEditingReview({ ...editingReview, visible: e.target.value === "1" })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem" }}>
                  <option value="1">ظاهر</option>
                  <option value="0">مخفي</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <input type="checkbox" id="reviewPinHome"
                checked={!!editingReview.pinOnHome}
                onChange={e => setEditingReview({ ...editingReview, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 15, height: 15 }}
              />
              <label htmlFor="reviewPinHome" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                تثبيت هذا الرأي في الصفحة الرئيسية
              </label>
            </div>

            <button type="button" onClick={saveReview} disabled={busy}
              style={{ marginTop: 8, width: "100%", padding: "0.5rem", borderRadius: 6, border: "none", background: "#0C363A", color: "#fff", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>
              {busy ? "جاري الحفظ..." : "حفظ الرأي في قاعدة البيانات"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", paddingInlineEnd: 4 }}>
        {clientReviews.map((r: any) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 8 }}>
            <div style={{ flex: 1, minWidth: 0, paddingInlineEnd: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0C363A" }}>{r.client_name_ar || r.client_name_en}</span>
                <span style={{ fontSize: "0.6rem", color: "#C18556" }}>({r.role_ar || r.role_en || "عميل"})</span>
              </div>
              <p style={{ fontSize: "0.65rem", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0" }}>
                {r.quote_ar || r.quote_en}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {/* Toggle Home Pin */}
              <button type="button" onClick={() => togglePin(r.id)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: selectedIds.includes(String(r.id)) ? "#faf2e8" : "#ffffff",
                  color: selectedIds.includes(String(r.id)) ? "#C18556" : "#888",
                  borderColor: selectedIds.includes(String(r.id)) ? "#C18556" : "#e5e0d5"
                }}>
                {selectedIds.includes(String(r.id)) ? "🌟 مثبت بالرئيسية" : "➕ تثبيت بالرئيسية"}
              </button>

              {/* Toggle visible */}
              <button type="button" onClick={() => toggleReviewVisibility(r)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: r.visible ? "#ECF6F4" : "#f5f5f4",
                  color: r.visible ? "#0F6E66" : "#78716c",
                  borderColor: r.visible ? "#B9D4D0" : "#e5e0d5"
                }}>
                {r.visible ? "ظاهر" : "مخفي"}
              </button>

              <button type="button" onClick={() => { setEditingReview({ ...r, pinOnHome: selectedIds.includes(String(r.id)) }); setShowAddForm(false); }}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#0C363A", display: "flex", alignItems: "center" }}>
                <Edit2 size={12} />
              </button>

              <button type="button" onClick={() => deleteReview(r.id)}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {clientReviews.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", fontSize: "0.75rem", padding: "1rem" }}>
            لا توجد آراء عملاء مضافة بعد.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Projects/Works Embedded Editor ─── */
function WorksSectionEditor({ dbProjects, onRefresh, editing, setEditing }: { dbProjects: any[]; onRefresh: () => Promise<void>; editing: any; setEditing: (val: any) => void }) {
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedIds: string[] = editing.metadata?.selectedIds || [];

  const blankProject = {
    id: "",
    title_ar: "",
    title_en: "",
    category_ar: "",
    category_en: "",
    area: "",
    description_ar: "",
    description_en: "",
    cover_url: "",
    video_url: "",
    pdf_url: "",
    external_url: "",
    sort_order: dbProjects.length * 10,
    visible: true,
    pinOnHome: false
  };

  const togglePin = async (id: string) => {
    let newIds = [...selectedIds];
    if (newIds.includes(id)) {
      newIds = newIds.filter(x => x !== id);
    } else {
      if (newIds.length >= 12) {
        toast.warning("يمكنك اختيار 12 مشروعاً كحد أقصى للعرض في هذا القسم!");
        return;
      }
      newIds = [id, ...newIds];
    }
    const nextEditing = {
      ...editing,
      metadata: {
        ...editing.metadata,
        selectedIds: newIds
      }
    };
    setEditing(nextEditing);

    try {
      const payload = { 
        ...nextEditing, 
        id: nextEditing.id || undefined, 
        sort_order: Number(nextEditing.sort_order) || 0 
      };
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;
      toast.success("تم تحديث وتثبيت المشروع بالصفحة الرئيسية بنجاح");
      await onRefresh();
    } catch (err: any) {
      toast.error("فشل الحفظ التلقائي: " + err.message);
    }
  };

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProject) return;
    setBusy(true);
    try {
      const baseId = makeInternalSlug(editingProject.title_en || editingProject.title_ar, "project");
      let projectId = editingProject.id || baseId;
      let suffix = 2;
      while (dbProjects.some((project) => project.id === projectId && project.id !== editingProject.id)) {
        projectId = `${baseId}-${suffix}`;
        suffix += 1;
      }
      const payload = {
        ...editingProject,
        id: projectId,
        sort_order: Number(editingProject.sort_order) || 0
      };
      const pinOnHome = !!editingProject.pinOnHome;
      delete (payload as any).pinOnHome;

      const { error } = await db.from("cms_projects").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      toast.success("تم حفظ المشروع بنجاح");

      const savedId = projectId;
      if (savedId) {
        let newIds = [...selectedIds];
        if (pinOnHome) {
          newIds = [String(savedId), ...newIds.filter(x => x !== String(savedId))];
        } else {
          newIds = newIds.filter(x => x !== String(savedId));
        }
        const nextEditing = {
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: newIds
          }
        };
        setEditing(nextEditing);

        try {
          const sectionPayload = { 
            ...nextEditing, 
            id: nextEditing.id || undefined, 
            sort_order: Number(nextEditing.sort_order) || 0 
          };
          await db.from("cms_sections").upsert(sectionPayload, { onConflict: "page_slug,section_key" });
        } catch (e) {
          console.error("Auto-save section failed:", e);
        }
      }

      setEditingProject(null);
      setShowAddForm(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع نهائياً؟")) return;
    try {
      const { error } = await db.from("cms_projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف المشروع بنجاح");
      // Also unpin if deleted
      const idStr = String(id);
      if (selectedIds.includes(idStr)) {
        setEditing({
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: selectedIds.filter(x => x !== idStr)
          }
        });
      }
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleProjectVisibility(project: any) {
    try {
      const { error } = await db.from("cms_projects")
        .update({ visible: !project.visible })
        .eq("id", project.id);
      if (error) throw error;
      toast.success(project.visible ? "تم إخفاء المشروع" : "تم تفعيل المشروع");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div style={{ border: "1px solid #eae5dc", borderRadius: 12, padding: "1.25rem", background: "#faf8f4", display: "flex", flexDirection: "column", gap: 12, marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0C363A", fontWeight: 800 }}>
          المشاريع في قاعدة البيانات ({dbProjects.length})
        </span>
        {!showAddForm && !editingProject && (
          <button type="button" onClick={() => { setEditingProject({ ...blankProject }); setShowAddForm(true); }}
            style={{ padding: "4px 10px", borderRadius: 6, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600 }}>
            + إضافة مشروع جديد
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(showAddForm || editingProject) && (
        <div style={{ background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A" }}>
              {editingProject.id && dbProjects.some(p => p.id === editingProject.id) ? "تعديل المشروع" : "إضافة مشروع جديد"}
            </span>
            <button type="button" onClick={() => { setEditingProject(null); setShowAddForm(false); }}
              style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "0.75rem" }}>إلغاء</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>اسم المشروع (عربي)</label>
                <Input value={editingProject.title_ar || ""} onChange={e => setEditingProject({ ...editingProject, title_ar: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Project Title (EN)</label>
                <Input value={editingProject.title_en || ""} onChange={e => setEditingProject({ ...editingProject, title_en: e.target.value })} required dir="ltr" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>التصنيف (عربي)</label>
                <Input value={editingProject.category_ar || ""} onChange={e => setEditingProject({ ...editingProject, category_ar: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Category (EN)</label>
                <Input value={editingProject.category_en || ""} onChange={e => setEditingProject({ ...editingProject, category_en: e.target.value })} dir="ltr" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>المساحة</label>
                <Input value={editingProject.area || ""} onChange={e => setEditingProject({ ...editingProject, area: e.target.value })} placeholder="450 m²" dir="ltr" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>رابط خارجي</label>
                <Input value={editingProject.external_url || ""} onChange={e => setEditingProject({ ...editingProject, external_url: e.target.value })} placeholder="https://..." dir="ltr" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>صورة الغلاف للمشروع</label>
              {editingProject.cover_url && <MediaPreview url={editingProject.cover_url} height={80} />}
              <MediaUploader folder="projects" label="رفع صورة الغلاف" accept="image/*" onUploaded={url => setEditingProject({ ...editingProject, cover_url: url })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>رابط الفيديو للمشروع</label>
              {editingProject.video_url && <MediaPreview url={editingProject.video_url} type="video" height={80} />}
              <MediaUploader folder="projects" label="رفع فيديو المشروع" accept="video/*" onUploaded={url => setEditingProject({ ...editingProject, video_url: url })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الترتيب</label>
                <Input type="number" value={editingProject.sort_order} onChange={e => setEditingProject({ ...editingProject, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الحالة</label>
                <select value={editingProject.visible ? "1" : "0"} onChange={e => setEditingProject({ ...editingProject, visible: e.target.value === "1" })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem" }}>
                  <option value="1">ظاهر</option>
                  <option value="0">مخفي</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <input type="checkbox" id="projectPinHome"
                checked={!!editingProject.pinOnHome}
                onChange={e => setEditingProject({ ...editingProject, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 15, height: 15 }}
              />
              <label htmlFor="projectPinHome" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                تثبيت هذا المشروع في الصفحة الرئيسية
              </label>
            </div>

            <button type="button" onClick={saveProject} disabled={busy}
              style={{ marginTop: 8, width: "100%", padding: "0.5rem", borderRadius: 6, border: "none", background: "#0C363A", color: "#fff", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>
              {busy ? "جاري الحفظ..." : "حفظ المشروع في قاعدة البيانات"}
            </button>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", paddingInlineEnd: 4 }}>
        {dbProjects.map((p: any) => {
          const previewMedia = getProjectPreviewMedia(p);
          return (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 40, height: 30, borderRadius: 4, overflow: "hidden", background: "#f0ece4", flexShrink: 0, display: "grid", placeItems: "center" }}>
                {previewMedia?.type === "image" ? (
                  <img src={previewMedia.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : previewMedia?.type === "video" ? (
                  <video src={previewMedia.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={14} color="#C18556" />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0C363A" }}>{p.title_ar || p.title_en}</span>
                  <span style={{ fontSize: "0.6rem", color: "#C18556" }}>({p.category_ar || p.category_en || "مشروع"})</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {/* Toggle Home Pin */}
              <button type="button" onClick={() => togglePin(p.id)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: selectedIds.includes(String(p.id)) ? "#faf2e8" : "#ffffff",
                  color: selectedIds.includes(String(p.id)) ? "#C18556" : "#888",
                  borderColor: selectedIds.includes(String(p.id)) ? "#C18556" : "#e5e0d5"
                }}>
                {selectedIds.includes(String(p.id)) ? "🌟 مثبت بالرئيسية" : "➕ تثبيت بالرئيسية"}
              </button>

              {/* Toggle visible */}
              <button type="button" onClick={() => toggleProjectVisibility(p)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: p.visible ? "#ECF6F4" : "#f5f5f4",
                  color: p.visible ? "#0F6E66" : "#78716c",
                  borderColor: p.visible ? "#B9D4D0" : "#e5e0d5"
                }}>
                {p.visible ? "ظاهر" : "مخفي"}
              </button>

              <button type="button" onClick={() => { setEditingProject({ ...p, pinOnHome: selectedIds.includes(String(p.id)) }); setShowAddForm(false); }}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#0C363A", display: "flex", alignItems: "center" }}>
                <Edit2 size={12} />
              </button>

              <button type="button" onClick={() => deleteProject(p.id)}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          );
        })}

        {dbProjects.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", fontSize: "0.75rem", padding: "1rem" }}>
            لا توجد مشاريع مضافة بعد.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Services Section Embedded Editor ─── */
function ServicesSectionEditor({ dbServices, onRefresh, editing, setEditing }: { dbServices: any[]; onRefresh: () => Promise<void>; editing: any; setEditing: (v: any) => void }) {
  const [editingService, setEditingService] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedIds: string[] = editing.metadata?.selectedIds || [];

  const togglePin = async (id: string) => {
    let newIds = [...selectedIds];
    const idStr = String(id);
    if (newIds.includes(idStr)) {
      newIds = newIds.filter(x => x !== idStr);
    } else {
      if (newIds.length >= 4) {
        toast.warning("يمكنك اختيار 4 خدمات كحد أقصى للعرض في الصفحة الرئيسية!");
        return;
      }
      newIds = [idStr, ...newIds];
    }
    const nextEditing = {
      ...editing,
      metadata: {
        ...editing.metadata,
        selectedIds: newIds
      }
    };
    setEditing(nextEditing);

    try {
      const payload = { 
        ...nextEditing, 
        id: nextEditing.id || undefined, 
        sort_order: Number(nextEditing.sort_order) || 0 
      };
      await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      await onRefresh();
    } catch (e) {
      console.error("Auto-save section failed:", e);
    }
  };

  const blankService = {
    slug: "",
    number_label: "01",
    title_ar: "",
    title_en: "",
    short_ar: "",
    short_en: "",
    detail_ar: "",
    detail_en: "",
    sort_order: (dbServices.length + 1) * 10,
    visible: true,
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

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    if (!editingService) return;
    setBusy(true);
    try {
      const payload = {
        ...editingService,
        id: editingService.id || undefined,
        slug: editingService.slug || makeInternalSlug(editingService.title_en || editingService.title_ar, "service"),
        sort_order: Number(editingService.sort_order) || 0
      };
      const { error } = await db.from("cms_services").upsert(payload, { onConflict: "slug" });
      if (error) throw error;
      toast.success("تم حفظ الخدمة بنجاح!");
      setEditingService(null);
      setShowAddForm(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة نهائياً؟")) return;
    try {
      const { error } = await db.from("cms_services").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الخدمة");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleServiceVisibility(service: any) {
    try {
      const { error } = await db.from("cms_services")
        .update({ visible: !service.visible })
        .eq("id", service.id);
      if (error) throw error;
      toast.success(service.visible ? "تم إخفاء الخدمة" : "تم تفعيل الخدمة");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div style={{ border: "1px solid #eae5dc", borderRadius: 12, padding: "1.25rem", background: "#faf8f4", display: "flex", flexDirection: "column", gap: 12, marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0C363A", fontWeight: 800 }}>
          كروت الخدمات في قاعدة البيانات ({dbServices.length})
        </span>
        {!showAddForm && !editingService && (
          <button type="button" onClick={() => { setEditingService({ ...blankService }); setShowAddForm(true); }}
            style={{ padding: "4px 10px", borderRadius: 6, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600 }}>
            + إضافة خدمة جديدة
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(showAddForm || editingService) && (
        <div style={{ background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A" }}>
              {editingService.id ? "تعديل بيانات الخدمة" : "إضافة خدمة جديدة"}
            </span>
            <button type="button" onClick={() => { setEditingService(null); setShowAddForm(false); }}
              style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "0.75rem" }}>إلغاء</button>
          </div>

          <form onSubmit={saveService} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>أيقونة الخدمة</label>
                <select 
                  value={editingService.number_label || "01"} 
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
                    setEditingService({ 
                      ...editingService, 
                      number_label: num,
                      slug: editingService.slug || defaultSlugs[num] || `service-${num}`
                    });
                  }} 
                  style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem", background: "#fff" }}
                >
                  {Object.entries(ICON_LABELS).map(([num, label]) => (
                    <option key={num} value={num}>{num} - {label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>اسم الخدمة (عربي)</label>
                <Input value={editingService.title_ar || ""} onChange={e => setEditingService({ ...editingService, title_ar: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Service Name (EN)</label>
                <Input value={editingService.title_en || ""} onChange={e => setEditingService({ ...editingService, title_en: e.target.value })} required dir="ltr" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>الوصف المختصر (عربي)</label>
              <Textarea value={editingService.short_ar || ""} onChange={e => setEditingService({ ...editingService, short_ar: e.target.value })} rows={2} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>Short Description (EN)</label>
              <Textarea value={editingService.short_en || ""} onChange={e => setEditingService({ ...editingService, short_en: e.target.value })} rows={2} required dir="ltr" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الترتيب</label>
                <Input type="number" value={editingService.sort_order} onChange={e => setEditingService({ ...editingService, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الحالة</label>
                <select value={editingService.visible ? "1" : "0"} onChange={e => setEditingService({ ...editingService, visible: e.target.value === "1" })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem" }}>
                  <option value="1">ظاهر</option>
                  <option value="0">مخفي</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={busy}
              style={{ padding: "8px", borderRadius: 6, background: "#C18556", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, marginTop: 6 }}>
              {busy ? "جاري الحفظ..." : "حفظ بيانات الخدمة"}
            </button>
          </form>
        </div>
      )}

      {/* Services List Grid inside drawer */}
      {!showAddForm && !editingService && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dbServices.map((s, idx) => {
            const IconComponent = ICON_MAP[s.number_label] || Layout;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 10, background: "#fff", border: "1px solid #eae5dc", borderRadius: 10, padding: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(193, 133, 86, 0.1)", display: "grid", placeItems: "center", color: "#C18556", flexShrink: 0 }}>
                  <IconComponent size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A" }}>{s.title_ar || s.title_en}</div>
                  <div style={{ fontSize: "0.6rem", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.short_ar || s.short_en || ""}</div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Pin to Home Toggle */}
                  <button type="button" onClick={() => togglePin(s.id)}
                    style={{
                      padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                      background: selectedIds.includes(String(s.id)) ? "#faf2e8" : "#ffffff",
                      color: selectedIds.includes(String(s.id)) ? "#C18556" : "#888",
                      borderColor: selectedIds.includes(String(s.id)) ? "#C18556" : "#e5e0d5"
                    }}>
                    {selectedIds.includes(String(s.id)) ? "🌟 مثبت بالرئيسية" : "➕ تثبيت بالرئيسية"}
                  </button>

                  <button type="button" onClick={() => toggleServiceVisibility(s)}
                    style={{ background: "none", border: "none", color: s.visible ? "#0F6E66" : "#78716c", cursor: "pointer" }} title={s.visible ? "إخفاء" : "إظهار"}>
                    {s.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button type="button" onClick={() => setEditingService({ ...s })}
                    style={{ background: "none", border: "none", color: "#0C363A", cursor: "pointer" }}>
                    <Edit2 size={12} />
                  </button>
                  <button type="button" onClick={() => deleteService(s.id)}
                    style={{ background: "none", border: "none", color: "#D84728", cursor: "pointer" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Team Members Embedded Editor ─── */
function TeamSectionEditor({ dbTeam, onRefresh, editing, setEditing }: { dbTeam: any[]; onRefresh: () => Promise<void>; editing: any; setEditing: (val: any) => void }) {
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedIds: string[] = editing.metadata?.selectedIds || [];

  const blankMember = {
    id: "",
    slug: "",
    name_ar: "",
    name_en: "",
    role_ar: "",
    role_en: "",
    department: "team",
    bio_ar: "",
    bio_en: "",
    image_url: "",
    sort_order: dbTeam.length * 10,
    visible: true,
    pinOnHome: false
  };

  const togglePin = async (id: string) => {
    let newIds = [...selectedIds];
    if (newIds.includes(id)) {
      newIds = newIds.filter(x => x !== id);
    } else {
      if (newIds.length >= 4) {
        toast.warning("يمكنك اختيار 4 أعضاء كحد أقصى للعرض في هذا القسم!");
        return;
      }
      newIds = [id, ...newIds];
    }
    const nextEditing = {
      ...editing,
      metadata: {
        ...editing.metadata,
        selectedIds: newIds
      }
    };
    setEditing(nextEditing);

    try {
      const payload = { 
        ...nextEditing, 
        id: nextEditing.id || undefined, 
        sort_order: Number(nextEditing.sort_order) || 0 
      };
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;
      toast.success("تم تحديث وتثبيت العضو بالصفحة الرئيسية بنجاح");
      await onRefresh();
    } catch (err: any) {
      toast.error("فشل الحفظ التلقائي: " + err.message);
    }
  };

  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setBusy(true);
    try {
      const payload = {
        ...editingMember,
        id: editingMember.id || undefined,
        slug: editingMember.slug || makeInternalSlug(editingMember.name_en || editingMember.name_ar, "member"),
        sort_order: Number(editingMember.sort_order) || 0
      };
      const pinOnHome = !!editingMember.pinOnHome;
      delete (payload as any).pinOnHome;

      const { data, error } = await db.from("cms_team_members").upsert(payload, { onConflict: "slug" }).select("id");
      if (error) throw error;
      toast.success("تم حفظ عضو الفريق بنجاح");

      const savedId = data?.[0]?.id ? String(data[0].id) : editingMember.id;
      if (savedId) {
        let newIds = [...selectedIds];
        if (pinOnHome) {
          newIds = [String(savedId), ...newIds.filter(x => x !== String(savedId))];
        } else {
          newIds = newIds.filter(x => x !== String(savedId));
        }
        const nextEditing = {
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: newIds
          }
        };
        setEditing(nextEditing);

        try {
          const sectionPayload = { 
            ...nextEditing, 
            id: nextEditing.id || undefined, 
            sort_order: Number(nextEditing.sort_order) || 0 
          };
          await db.from("cms_sections").upsert(sectionPayload, { onConflict: "page_slug,section_key" });
        } catch (e) {
          console.error("Auto-save section failed:", e);
        }
      }

      setEditingMember(null);
      setShowAddForm(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العضو نهائياً؟")) return;
    try {
      const { error } = await db.from("cms_team_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف العضو بنجاح");
      // Also unpin if deleted
      const idStr = String(id);
      if (selectedIds.includes(idStr)) {
        setEditing({
          ...editing,
          metadata: {
            ...editing.metadata,
            selectedIds: selectedIds.filter(x => x !== idStr)
          }
        });
      }
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleMemberVisibility(member: any) {
    try {
      const { error } = await db.from("cms_team_members")
        .update({ visible: !member.visible })
        .eq("id", member.id);
      if (error) throw error;
      toast.success(member.visible ? "تم إخفاء العضو" : "تم تفعيل العضو");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div style={{ border: "1px solid #eae5dc", borderRadius: 12, padding: "1.25rem", background: "#faf8f4", display: "flex", flexDirection: "column", gap: 12, marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0C363A", fontWeight: 800 }}>
          أعضاء الفريق في قاعدة البيانات ({dbTeam.length})
        </span>
        {!showAddForm && !editingMember && (
          <button type="button" onClick={() => { setEditingMember({ ...blankMember }); setShowAddForm(true); }}
            style={{ padding: "4px 10px", borderRadius: 6, background: "#0C363A", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600 }}>
            + إضافة عضو جديد
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(showAddForm || editingMember) && (
        <div style={{ background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0ece4", paddingBottom: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C363A" }}>
              {editingMember.id ? "تعديل بيانات العضو" : "إضافة عضو جديد للفريق"}
            </span>
            <button type="button" onClick={() => { setEditingMember(null); setShowAddForm(false); }}
              style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "0.75rem" }}>إلغاء</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الاسم بالكامل (عربي)</label>
                <Input value={editingMember.name_ar || ""} onChange={e => setEditingMember({ ...editingMember, name_ar: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Full Name (EN)</label>
                <Input value={editingMember.name_en || ""} onChange={e => setEditingMember({ ...editingMember, name_en: e.target.value })} required dir="ltr" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الوظيفة (عربي)</label>
                <Input value={editingMember.role_ar || ""} onChange={e => setEditingMember({ ...editingMember, role_ar: e.target.value })} placeholder="مثال: مهندس تصميم" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>Role (EN)</label>
                <Input value={editingMember.role_en || ""} onChange={e => setEditingMember({ ...editingMember, role_en: e.target.value })} placeholder="e.g. Design Engineer" required dir="ltr" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>القسم</label>
              <select value={editingMember.department} onChange={e => setEditingMember({ ...editingMember, department: e.target.value })}
                style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem" }}>
                <option value="leadership">الإدارة</option>
                <option value="design">التصميم</option>
                <option value="site">الموقع</option>
                <option value="team">عام</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.65rem" }}>صورة العضو</label>
              {editingMember.image_url && <MediaPreview url={editingMember.image_url} height={80} />}
              <MediaUploader folder="team" label="رفع صورة العضو" accept="image/*" onUploaded={url => setEditingMember({ ...editingMember, image_url: url })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الترتيب</label>
                <Input type="number" value={editingMember.sort_order} onChange={e => setEditingMember({ ...editingMember, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: "0.65rem" }}>الحالة</label>
                <select value={editingMember.visible ? "1" : "0"} onChange={e => setEditingMember({ ...editingMember, visible: e.target.value === "1" })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.8rem" }}>
                  <option value="1">ظاهر</option>
                  <option value="0">مخفي</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <input type="checkbox" id="memberPinHome"
                checked={!!editingMember.pinOnHome}
                onChange={e => setEditingMember({ ...editingMember, pinOnHome: e.target.checked })}
                style={{ cursor: "pointer", width: 15, height: 15 }}
              />
              <label htmlFor="memberPinHome" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#C18556", cursor: "pointer", userSelect: "none" }}>
                تثبيت هذا العضو في الصفحة الرئيسية
              </label>
            </div>

            <button type="button" onClick={saveMember} disabled={busy}
              style={{ marginTop: 8, width: "100%", padding: "0.5rem", borderRadius: 6, border: "none", background: "#0C363A", color: "#fff", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>
              {busy ? "جاري الحفظ..." : "حفظ العضو في قاعدة البيانات"}
            </button>
          </div>
        </div>
      )}

      {/* Team Members list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", paddingInlineEnd: 4 }}>
        {dbTeam.map((m: any) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#ffffff", border: "1px solid #eae5dc", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "#0C363A", display: "grid", placeItems: "center", flexShrink: 0 }}>
                {m.image_url ? (
                  <img src={m.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#C18556", fontSize: "0.6rem", fontWeight: 700 }}>{m.name_ar ? m.name_ar[0] : "T"}</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0C363A" }}>{m.name_ar || m.name_en}</span>
                  <span style={{ fontSize: "0.6rem", color: "#C18556" }}>({m.role_ar || m.role_en || "عضو"})</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {/* Toggle Home Pin */}
              <button type="button" onClick={() => togglePin(m.id)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: selectedIds.includes(String(m.id)) ? "#faf2e8" : "#ffffff",
                  color: selectedIds.includes(String(m.id)) ? "#C18556" : "#888",
                  borderColor: selectedIds.includes(String(m.id)) ? "#C18556" : "#e5e0d5"
                }}>
                {selectedIds.includes(String(m.id)) ? "🌟 مثبت بالرئيسية" : "➕ تثبيت بالرئيسية"}
              </button>

              {/* Toggle visible */}
              <button type="button" onClick={() => toggleMemberVisibility(m)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: m.visible ? "#ECF6F4" : "#f5f5f4",
                  color: m.visible ? "#0F6E66" : "#78716c",
                  borderColor: m.visible ? "#B9D4D0" : "#e5e0d5"
                }}>
                {m.visible ? "ظاهر" : "مخفي"}
              </button>

              <button type="button" onClick={() => { setEditingMember({ ...m, pinOnHome: selectedIds.includes(String(m.id)) }); setShowAddForm(false); }}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#0C363A", display: "flex", alignItems: "center" }}>
                <Edit2 size={12} />
              </button>

              <button type="button" onClick={() => deleteMember(m.id)}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {dbTeam.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", fontSize: "0.75rem", padding: "1rem" }}>
            لا يوجد أعضاء مضافين بعد.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Real-Time Section Live Preview ─── */
function SectionLivePreview({ editing, sectionMedia, clientReviews = [], dbProjects = [], dbTeam = [], dbServices = [], statsSection = null }: { editing: any; sectionMedia: any[]; clientReviews?: any[]; dbProjects?: any[]; dbTeam?: any[]; dbServices?: any[]; statsSection?: any }) {
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");
  const [reviewIdx, setReviewIdx] = useState(0);

  const mediaList = sectionMedia.filter(m => m.section_id === editing.id);
  const mainImage = mediaList.find(m => m.media_type === "image")?.url;
  const mainVideo = mediaList.find(m => m.media_type === "video")?.url;

  // Real-time values with dynamic language fallbacks
  const t_title = previewLang === "ar" ? editing.title_ar : editing.title_en;
  const t_body = previewLang === "ar" ? editing.body_ar : editing.body_en;
  const t_cta = previewLang === "ar" ? editing.cta_label_ar : editing.cta_label_en;
  
  const isAr = previewLang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Define styled visual components for each section key
  const renderPreview = () => {
    switch (editing.section_key) {
      case "hero":
        let stats: any[] = [];
        const defaultStats = [
          { value_ar: "+12", value_en: "+12", label_ar: "\u0633\u0646\u0629 \u062e\u0628\u0631\u0629", label_en: "Years Experience" },
          { value_ar: "+60", value_en: "+60", label_ar: "\u0645\u0634\u0631\u0648\u0639 \u0645\u0646\u0641\u0630", label_en: "Completed Projects" },
          { value_ar: "\u0645\u062a\u0643\u0627\u0645\u0644", value_en: "Integrated", label_ar: "\u0645\u0646 \u0627\u0644\u0641\u0643\u0631\u0629 \u0644\u0644\u062a\u0646\u0641\u064a\u0630", label_en: "From Concept to Reality" },
          { value_ar: "\u0645\u0639\u062a\u0645\u062f", value_en: "Certified", label_ar: "\u0628\u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u062c\u0648\u062f\u0629", label_en: "Highest Quality Standards" },
        ];

        if (statsSection) {
          try {
            stats = typeof statsSection.body_ar === "string" && statsSection.body_ar.startsWith("[")
              ? JSON.parse(statsSection.body_ar)
              : [];
          } catch {
            stats = [];
          }
        }
        if (!stats || stats.length === 0) {
          stats = defaultStats;
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              position: "relative",
              background: "#0C363A",
              borderRadius: 12,
              padding: "1.5rem",
              color: "#fff",
              overflow: "hidden",
              border: "1px solid rgba(193, 133, 86, 0.3)",
              height: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              direction: dir
            }}>
              {/* Background Image / Video opacity cover */}
              {(mainImage || mainVideo) && (
                <div style={{ position: "absolute", inset: 0, opacity: 0.25, zIndex: 0 }}>
                  {mainImage ? (
                    <img src={mainImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <video src={mainVideo} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted loop autoPlay />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "#0C363A", opacity: 0.5 }} />
                </div>
              )}

              {/* Architectural Grid overlay */}
              <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(193, 133, 86, 0.15)", pointerEvents: "none", zIndex: 1 }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: 6, borderTop: "2px solid #C18556", borderLeft: "2px solid #C18556" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 6, height: 6, borderTop: "2px solid #C18556", borderRight: "2px solid #C18556" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 6, height: 6, borderBottom: "2px solid #C18556", borderLeft: "2px solid #C18556" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 6, height: 6, borderBottom: "2px solid #C18556", borderRight: "2px solid #C18556" }} />
              </div>

              <div style={{ position: "relative", zIndex: 2, textAlign: isAr ? "right" : "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700, letterSpacing: isAr ? "normal" : "0.2em" }}>
                    {isAr ? "تاكت للعمارة والديكور" : "TACT ARCHITECTURE"}
                  </span>
                  <div style={{ width: 16, height: 1, background: "rgba(193, 133, 86, 0.4)" }} />
                </div>
                <h1 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "serif", lineHeight: 1.2, color: "#fff", marginBottom: 6 }}>
                  {t_title || (isAr ? "فخامة التصميم الهندسي" : "Luxury Architectural Design")}
                </h1>
                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.8)", marginBottom: 12, maxWidth: "85%", lineHeight: 1.4 }}>
                  {t_body || (isAr ? "نص فرعي يصف تفاصيل ورؤية هذا القسم الفاخر على موقع الشركة..." : "Sub-headline text describing the details and premium view of this section...")}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ background: "#C18556", color: "#0C363A", padding: "4px 12px", borderRadius: 2, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {t_cta || (isAr ? "ابدأ التجربة" : "GET STARTED")}
                  </span>
                  <span style={{ border: "1px solid rgba(255,255,255,0.4)", color: "#fff", padding: "4px 12px", borderRadius: 2, fontSize: "0.6rem", fontWeight: 700 }}>
                    {isAr ? "أعمالنا" : "PORTFOLIO"}
                  </span>
                </div>
              </div>
            </div>

            {stats.length > 0 && (
              <div style={{
                background: "#0C363A",
                borderRadius: 12,
                padding: "0.85rem 1rem",
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
                gap: 8,
                border: "1px solid rgba(193, 133, 86, 0.2)",
                direction: dir
              }}>
                {stats.map((s: any, i: number) => (
                  <div key={i} style={{ textAlign: "center", borderInlineStart: i > 0 ? "1px solid rgba(193,133,86,0.15)" : "none", paddingInlineStart: i > 0 ? 8 : 0 }}>
                    <div style={{ color: "#C18556", fontSize: "0.95rem", fontWeight: 700, fontFamily: "serif" }}>
                      {isAr ? s.value_ar : s.value_en}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.5rem", letterSpacing: "0.05em", marginTop: 2 }}>
                      {isAr ? s.label_ar : s.label_en}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "about-preview":
        return (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#0C363A",
            border: "1px solid #eae5dc",
            direction: dir,
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Radial dot overlay */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(#C18556 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, position: "relative", zIndex: 1 }}>
              <div style={{ textAlign: isAr ? "right" : "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                    {isAr ? "من نحن" : "ABOUT US"}
                  </span>
                  <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
                </div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#0C363A", lineHeight: 1.2, marginBottom: 6 }}>
                  {t_title || (isAr ? "هندسة المعنى داخل كل مساحة" : "Engineering Meaning In Every Space")}
                </h2>
                <p style={{ fontSize: "0.65rem", color: "rgba(12, 54, 58, 0.7)", lineHeight: 1.4, marginBottom: 10 }}>
                  {t_body || (isAr ? "خبرة تمتد لأكثر من 12 عاماً في إدارة وتصميم وتشطيب المشروعات الفاخرة بمعايير جودة معتمدة..." : "Over 12 years of architecture experience managing luxurious projects...")}
                </p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0C363A", fontWeight: 700, fontSize: "0.6rem" }}>
                  <span>{t_cta || (isAr ? "المزيد عنا" : "LEARN MORE")}</span>
                  {isAr ? <ArrowLeft size={10} style={{ color: "#C18556" }} /> : <ArrowRight size={10} style={{ color: "#C18556" }} />}
                </div>
              </div>

              {/* Offset Image Container */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: "-4px 4px 4px -4px", border: "1px solid rgba(193, 133, 86, 0.2)" }} />
                <div style={{
                  width: "100%",
                  aspectRatio: "4/5",
                  background: "#0C363A",
                  borderRadius: 4,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  {mainImage ? (
                    <img src={mainImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={18} style={{ color: "rgba(193, 133, 86, 0.4)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
                  )}
                  <div style={{ position: "absolute", bottom: 6, right: 6, width: 14, height: 14, opacity: 0.7 }}>
                    <img src="/logo.png" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }} onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "services-preview":
        const selectedServicesIds: string[] = editing.metadata?.selectedIds || [];
        let activeServices = dbServices.filter((s: any) => s.visible !== false);
        if (selectedServicesIds.length > 0) {
          activeServices = selectedServicesIds
            .map(id => dbServices.find(s => String(s.id) === String(id)))
            .filter(Boolean);
        }
        if (activeServices.length === 0) {
          activeServices = [
            { number_label: "01", title_ar: "التصميم الداخلي", title_en: "Interior Design", short_ar: "رؤية هندسية متكاملة لكل غرفة، توازن بين الجمال والوظيفة." },
            { number_label: "02", title_ar: "التصميم الخارجي", title_en: "Exterior Design", short_ar: "واجهات وحدائق ومداخل مصممة بهوية معمارية راقية." },
            { number_label: "03", title_ar: "التشطيبات المتكاملة", title_en: "Integrated Finishing", short_ar: "تشطيب من الألف إلى الياء بأعلى معايير الجودة والدقة." },
            { number_label: "04", title_ar: "تنفيذ الشقق والفيلات", title_en: "Apartments & Villas Execution", short_ar: "إدارة كاملة لتنفيذ الوحدات السكنية بمختلف أحجامها." },
          ];
        }
        return (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#0C363A",
            border: "1px solid #eae5dc",
            direction: dir,
            textAlign: isAr ? "right" : "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                {isAr ? "خدماتنا" : "OUR SERVICES"}
              </span>
              <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
            </div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#0C363A", marginBottom: 4 }}>
              {t_title || (isAr ? "تجربة متكاملة بتفاصيل تليق بالنظر" : "Integrated Experience with Refined Details")}
            </h2>
            <p style={{ fontSize: "0.65rem", color: "rgba(12,54,58,0.7)", marginBottom: 12 }}>
              {t_body || (isAr ? "نحوّل الفكرة إلى مساحة متكاملة، من التخطيط الأولي حتى أدق تفاصيل التنفيذ..." : "Transforming ideas into integrated spaces, from initial planning...")}
            </p>

            {/* Service Pillars Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {activeServices.slice(0, 4).map((serv: any, i: number) => {
                const IconComponent = ICON_MAP[serv.number_label] || Layout;
                return (
                  <div key={i} style={{
                    background: "rgba(193, 133, 86, 0.03)",
                    border: "1px solid rgba(193, 133, 86, 0.25)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(193, 133, 86, 0.15)", display: "grid", placeItems: "center", color: "#C18556" }}>
                      <IconComponent size={9} />
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 650, color: "#0C363A" }}>
                      {isAr ? (serv.title_ar || serv.title_en) : (serv.title_en || serv.title_ar)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "works-preview":
        const selectedWorkIds = editing.metadata?.selectedIds || [];
        let activeProjects = dbProjects.filter((p: any) => p.visible !== false);
        if (Array.isArray(selectedWorkIds) && selectedWorkIds.length > 0) {
          activeProjects = selectedWorkIds
            .map(id => activeProjects.find(p => p.id === id))
            .filter(Boolean);
        } else {
          activeProjects = [];
        }
        const fallbackProjects = [
          { title_ar: "فيلا مدينتي", title_en: "Madinaty Villa", cover_url: "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp" },
          { title_ar: "مكتب التجمع", title_en: "Tagamoa Office", cover_url: "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp" },
        ];
        const displayProjects = activeProjects;

        return (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#0C363A",
            border: "1px solid #eae5dc",
            direction: dir,
            textAlign: isAr ? "right" : "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                {isAr ? "أعمالنا المميزة" : "FEATURED PORTFOLIO"}
              </span>
              <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
            </div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#0C363A", marginBottom: 4 }}>
              {t_title || (isAr ? "توقيع الفخامة في كل زاوية" : "Luxury Signatures In Every Corner")}
            </h2>
            <p style={{ fontSize: "0.65rem", color: "rgba(12,54,58,0.7)", marginBottom: 12 }}>
              {t_body || (isAr ? "معرض أعمال يضم أرقى الفيلات والوحدات الإدارية المنفذة بأعلى مستويات الجودة..." : "A stellar showcase of the finest villas and high-end finished spaces...")}
            </p>

            {/* Grid of project cards */}
            {displayProjects.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {displayProjects.map((p: any, i: number) => {
                const previewMedia = getProjectPreviewMedia(p);
                return (
                <div key={i} style={{
                  position: "relative",
                  borderRadius: 6,
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  background: "#0C363A",
                  borderBottom: "2.5px solid #C18556"
                }}>
                  {previewMedia?.type === "image" ? (
                    <img src={previewMedia.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                  ) : previewMedia?.type === "video" ? (
                    <video src={previewMedia.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "rgba(193, 133, 86, 0.4)" }}>
                      <ImageIcon size={18} />
                    </div>
                  )}
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    padding: "4px 6px",
                    background: "linear-gradient(to top, rgba(12,54,58,0.95), transparent)",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: 700
                  }}>
                    {isAr ? p.title_ar || p.title_en : p.title_en || p.title_ar}
                  </div>
                </div>
                );
              })}
            </div>
            ) : (
              <div style={{
                minHeight: 110,
                borderRadius: 8,
                border: "1px dashed #DDB57C",
                background: "#faf8f4",
                display: "grid",
                placeItems: "center",
                color: "#8a6d4f",
                fontSize: "0.68rem",
                fontWeight: 700,
                textAlign: "center",
                padding: "1rem"
              }}>
                {isAr ? "لا توجد مشاريع مثبتة للعرض في الصفحة الرئيسية." : "No pinned projects for the home page."}
              </div>
            )}
          </div>
        );

      case "team-preview":
        const selectedTeamIds = editing.metadata?.selectedIds || [];
        let activeTeam = dbTeam.filter((m: any) => m.visible !== false);
        if (Array.isArray(selectedTeamIds) && selectedTeamIds.length > 0) {
          activeTeam = selectedTeamIds
            .map(slug => activeTeam.find(m => m.slug === slug || m.id === slug))
            .filter(Boolean);
        } else {
          activeTeam = activeTeam.slice(0, 4);
        }
        const displayTeam = activeTeam.length > 0 ? activeTeam : [
          { name_ar: "أ. أحمد", name_en: "Ahmed", role_ar: "مهندس تصميم", role_en: "Design Engineer", image_url: "" },
          { name_ar: "م. محمد", name_en: "Mohamed", role_ar: "مهندس تنفيذ", role_en: "Site Engineer", image_url: "" },
          { name_ar: "أ. سارة", name_en: "Sara", role_ar: "مصممة ديكور", role_en: "Interior Designer", image_url: "" },
        ];

        return (
          <div style={{
            background: "#0C363A",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#fff",
            border: "1px solid rgba(193, 133, 86, 0.3)",
            direction: dir,
            textAlign: isAr ? "right" : "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                {isAr ? "فريق العمل" : "TACT TEAM"}
              </span>
              <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
            </div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#fff", marginBottom: 4 }}>
              {t_title || (isAr ? "شغف العمارة والابتكار" : "Passion For Architecture & Innovation")}
            </h2>
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
              {t_body || (isAr ? "نخبة من خيرة المهندسين والمصممين يضعون تفاصيل أحلامك في مقدمة أولوياتهم..." : "A stellar elite of structural engineers and interior designers...")}
            </p>

            {/* Team Bios Row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {displayTeam.map((m: any, i: number) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid #C18556",
                    background: "rgba(193, 133, 86, 0.15)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden"
                  }}>
                    {m.image_url ? (
                      <img src={m.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "0.6rem", color: "#C18556", fontWeight: 700 }}>
                        {m.name_ar ? m.name_ar[0] : "T"}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.5rem",
                    background: "rgba(255,255,255,0.08)",
                    padding: "2px 5px",
                    borderRadius: 4,
                    color: "#C18556",
                    fontWeight: 600,
                    maxWidth: 65,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "center"
                  }}>
                    {isAr ? m.name_ar || m.name_en : m.name_en || m.name_ar}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "testimonials":
        const selectedTestimonialIds = editing.metadata?.selectedIds || [];
        let activeReviews = clientReviews.filter((r: any) => r.visible !== false);
        if (Array.isArray(selectedTestimonialIds) && selectedTestimonialIds.length > 0) {
          activeReviews = selectedTestimonialIds
            .map(id => activeReviews.find(r => r.id === id || String(r.id) === String(id)))
            .filter(Boolean);
        }
        const displayReviews = activeReviews.length > 0 ? activeReviews : clientReviews;
        const hasReviews = displayReviews.length > 0;
        const currentReview = hasReviews ? displayReviews[reviewIdx % displayReviews.length] : null;

        const rQuote = currentReview
          ? (isAr ? currentReview.quote_ar || currentReview.quote_en : currentReview.quote_en || currentReview.quote_ar)
          : (t_body || (isAr ? "جودة تشطيب استثنائية، التزام كامل بالمواعيد، واحترافية متناهية في التعامل..." : "Outstanding finishing quality, absolute commitment, and supreme engineering design..."));

        const rName = currentReview
          ? (isAr ? currentReview.client_name_ar || currentReview.client_name_en : currentReview.client_name_en || currentReview.client_name_ar)
          : (t_title || (isAr ? "أ. أحمد - عميل راقي" : "Mr. Ahmed - Premium Client"));

        const rRole = currentReview
          ? (isAr ? currentReview.role_ar || currentReview.role_en : currentReview.role_en || currentReview.role_ar)
          : (isAr ? "تصميم وتشطيب متكامل" : "Full Space Finishing");

        const rRating = currentReview ? (currentReview.rating || 5) : 5;

        return (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#0C363A",
            border: "1px solid #eae5dc",
            direction: dir,
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Watermark Quote Icon */}
            <div style={{ position: "absolute", top: 8, insetInlineEnd: 12, color: "rgba(193, 133, 86, 0.08)", pointerEvents: "none" }}>
              <Quote size={56} fill="currentColor" style={{ transform: isAr ? "scaleX(-1)" : "none" }} />
            </div>

            <div style={{ position: "relative", zIndex: 1, textAlign: isAr ? "right" : "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                  {isAr ? "عملاؤنا" : "CLIENTS TESTIMONIALS"}
                </span>
                <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
              </div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#0C363A", marginBottom: 8 }}>
                {isAr ? "ثقة تُبنى مع كل تسليم" : "Trust Built With Every Delivery"}
              </h2>

              <div style={{
                background: "#faf8f4",
                border: "1px solid rgba(193, 133, 86, 0.2)",
                borderRadius: 8,
                padding: "10px 12px"
              }}>
                {/* Gold Rating Stars */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 2, color: "#C18556" }}>
                    {Array.from({ length: rRating }).map((_, i) => <Star key={i} size={10} fill="currentColor" color="#C18556" />)}
                  </div>
                  {displayReviews.length > 1 && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => setReviewIdx(prev => (prev - 1 + displayReviews.length) % displayReviews.length)}
                        style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(193,133,86,0.3)", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", color: "#0C363A" }}>
                        {isAr ? <ArrowRight size={8} /> : <ArrowLeft size={8} />}
                      </button>
                      <button type="button" onClick={() => setReviewIdx(prev => (prev + 1) % displayReviews.length)}
                        style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(193,133,86,0.3)", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", color: "#0C363A" }}>
                        {isAr ? <ArrowLeft size={8} /> : <ArrowRight size={8} />}
                      </button>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: "0.75rem", fontFamily: "serif", fontStyle: "italic", lineHeight: 1.4, color: "#0C363A", marginBottom: 8 }}>
                  “{rQuote}”
                </p>

                <div style={{ borderTop: "1px solid rgba(193, 133, 86, 0.1)", paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h5 style={{ fontSize: "0.68rem", fontWeight: 700, color: "#0C363A", margin: 0 }}>
                      {rName}
                    </h5>
                    <span style={{ fontSize: "0.55rem", color: "#C18556", fontWeight: 700, textTransform: "uppercase" }}>
                      {rRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "packages-cta":
        return (
          <div style={{
            background: "linear-gradient(135deg, #0C363A, #0F6E66)",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#fff",
            border: "1px solid rgba(193, 133, 86, 0.3)",
            direction: dir,
            position: "relative",
            overflow: "hidden",
            textAlign: "center"
          }}>
            {/* Elegant double border frame inside */}
            <div style={{ position: "absolute", inset: 6, border: "1px dashed rgba(193, 133, 86, 0.25)", pointerEvents: "none" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: 4 }}>
                {isAr ? "صمم مساحتك الفاخرة" : "DESIGN YOUR LUXURY SPACE"}
              </span>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "serif", color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
                {t_title || (isAr ? "ابدأ رحلة التميز المعماري معنا اليوم" : "Begin Your Architectural Journey With Us")}
              </h2>
              <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.75)", marginBottom: 12, maxWidth: "90%", marginInline: "auto" }}>
                {t_body || (isAr ? "دعنا نساعدك في تصميم وتنفيذ تشطيبات أحلامك بأرقى المواصفات الهندسية وأدق معايير الجودة الفاخرة..." : "Let us help you design and build the home of your dreams with premium specs...")}
              </p>
              
              <span style={{
                display: "inline-block",
                background: "#C18556",
                color: "#0C363A",
                padding: "6px 18px",
                borderRadius: 2,
                fontSize: "0.65rem",
                fontWeight: 700,
                boxShadow: "0 4px 10px rgba(193,133,86,0.25)"
              }}>
                {t_cta || (isAr ? "طلب معاينة مجانية" : "REQUEST CONSULTATION")}
              </span>
            </div>
          </div>
        );

      case "pdf-booklets":
        return (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            color: "#0C363A",
            border: "1px solid #eae5dc",
            direction: dir,
            textAlign: isAr ? "right" : "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ color: "#C18556", fontSize: "0.55rem", fontWeight: 700 }}>
                {isAr ? "كتيبات التصميم" : "PORTFOLIO BOOKLETS"}
              </span>
              <div style={{ width: 12, height: 1, background: "rgba(193,133,86,0.3)" }} />
            </div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "serif", color: "#0C363A", marginBottom: 4 }}>
              {t_title || (isAr ? "دليل أعمالنا المعمارية" : "Architectural Design Guidebooks")}
            </h2>
            <p style={{ fontSize: "0.65rem", color: "rgba(12,54,58,0.7)", marginBottom: 12 }}>
              {t_body || (isAr ? "قم بتحميل كتيبات الأعمال مجاناً واستعرض تفاصيل مشروعاتنا المنفذة والتشطيبات الفاخرة..." : "Download our luxurious design guidebooks and booklets for free...")}</p>

            {/* Book Preview Row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[1, 2].map(n => (
                <div key={n} style={{
                  width: 65,
                  aspectRatio: "3/4",
                  background: "linear-gradient(135deg, #0C363A, #0F6E66)",
                  borderRadius: 4,
                  borderInlineStart: "3px solid #C18556",
                  boxShadow: "3px 3px 8px rgba(0,0,0,0.15)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 6,
                  color: "#fff"
                }}>
                  <span style={{ fontSize: "0.42rem", color: "#C18556", fontWeight: 700 }}>TACT</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.48rem", fontWeight: 600, opacity: 0.9 }}>
                      {n === 1 ? (isAr ? "الكتالوج" : "Catalog") : (isAr ? "النماذج" : "Models")}
                    </span>
                    <Download size={8} style={{ color: "#C18556" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      borderTop: "1px solid #f0ece4",
      paddingTop: "0.85rem",
      marginBottom: "0.5rem",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {/* Header bar with title and language selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} style={{ color: "#C18556" }} />
          <span style={{
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#0C363A",
            fontWeight: 800
          }}>
            {isAr ? "المعاينة الفورية والفاخرة للقسم" : "Section Luxury Live Preview"}
          </span>
        </div>
        
        {/* Toggle between AR and EN mockups */}
        <div style={{
          display: "flex",
          background: "#eae5dc",
          borderRadius: 6,
          padding: 2,
          border: "1px solid #dcd7cc"
        }}>
          <button
            type="button"
            onClick={() => setPreviewLang("ar")}
            style={{
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: "0.6rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: isAr ? "#0C363A" : "transparent",
              color: isAr ? "#fff" : "#78716c",
              transition: "all 0.15s ease"
            }}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setPreviewLang("en")}
            style={{
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: "0.6rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: !isAr ? "#0C363A" : "transparent",
              color: !isAr ? "#fff" : "#78716c",
              transition: "all 0.15s ease"
            }}
          >
            EN
          </button>
        </div>
      </div>

      {/* Renders the beautifully simulated mockup */}
      <div style={{
        background: "#faf8f4",
        border: "1px solid #eae5dc",
        borderRadius: 14,
        padding: 10,
        boxShadow: "inset 0 1px 4px rgba(0,0,0,0.02)"
      }}>
        {renderPreview()}
      </div>
    </div>
  );
}

  const HOME_SECTION_ORDER = [
    "hero",
    "about-preview",
    "team-preview",
    "testimonials",
    "works-preview",
    "services-preview",
    "packages-cta"
  ];

  const SECTION_NAMES_AR: Record<string, string> = {
    "hero": "\u0627\u0644\u0628\u062f\u0627\u064a\u0629",
    "about-preview": "\u0645\u0646 \u0646\u062d\u0646",
    "team-preview": "\u0645\u062e\u062a\u0635\u0631 \u0627\u0644\u0641\u0631\u064a\u0642",
    "testimonials": "\u0622\u0631\u0627\u0621 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
    "works-preview": "\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639",
    "services-preview": "\u0627\u0644\u062e\u062f\u0645\u0627\u062a",
    "packages-cta": "\u0627\u0644\u0628\u0627\u0642\u0627\u062a"
  };

  const displaySections = slug === "home"
    ? HOME_SECTION_ORDER.map(key => sections.find(s => s.section_key === key)).filter(Boolean)
    : sections;

  useEffect(() => { load(); }, [slug]);

  useEffect(() => {
    if (displaySections.length > 0) {
      const idx = Math.min(activeIdx, displaySections.length - 1);
      setEditing(displaySections[idx]);
    } else {
      setEditing(null);
    }
  }, [sections, activeIdx]);

  async function load() {
    const [secRes, mediaRes, reviewsRes, projectsRes, projectMediaRes, teamRes, servicesRes] = await Promise.all([
      db.from("cms_sections").select("*").eq("page_slug", slug).order("sort_order"),
      db.from("cms_section_media").select("*").order("sort_order"),
      db.from("cms_client_testimonials").select("*").order("sort_order"),
      db.from("cms_projects").select("*").order("sort_order"),
      db.from("cms_project_media").select("*").order("sort_order"),
      db.from("cms_team_members").select("*").order("sort_order"),
      db.from("cms_services").select("*").order("sort_order"),
    ]);
    const secList = secRes.data || [];
    setSections(secList);
    setSectionMedia(mediaRes.data || []);
    setClientReviews(reviewsRes.data || []);
    const projectMediaRows = projectMediaRes.data || [];
    setDbProjects((projectsRes.data || []).map((project: any) => ({
      ...project,
      mediaItems: projectMediaRows.filter((item: any) => item.project_id === project.id),
    })));
    setDbTeam(teamRes.data || []);
    setDbServices(servicesRes.data || []);

    if (slug === "home") {
      const statsRow = secList.find((s: any) => s.section_key === "stats-strip");
      if (statsRow) {
        setStatsEditing(statsRow);
      } else {
        setStatsEditing({
          page_slug: "home",
          section_key: "stats-strip",
          section_name_ar: "\u0634\u0631\u064a\u0637 \u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a",
          section_name_en: "Stats Strip",
          visible: true,
          sort_order: 1,
          body_ar: "[]",
          body_en: "[]"
        });
      }
    }
  }

  function openNew() {
    setNewSection({ ...blank, page_slug: slug, sort_order: sections.length * 10 });
    setShowAddModal(true);
  }

  function handleSelectTab(idx: number) {
    setActiveIdx(idx);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const payload = { ...editing, id: editing.id || undefined, sort_order: Number(editing.sort_order) || 0 };
      const { error } = await db.from("cms_sections").upsert(payload, { onConflict: "page_slug,section_key" });
      if (error) throw error;

      if (slug === "home" && editing.section_key === "hero" && statsEditing) {
        const statsPayload = { ...statsEditing, id: statsEditing.id || undefined, sort_order: Number(statsEditing.sort_order) || 0 };
        const { error: statsError } = await db.from("cms_sections").upsert(statsPayload, { onConflict: "page_slug,section_key" });
        if (statsError) throw statsError;
      }

      toast.success("\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0628\u0646\u062c\u0627\u062d");
      await load();
    } catch (err: any) {
      toast.error("\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function moveSection(idx: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= displaySections.length) return;
    
    const current = displaySections[idx];
    const sibling = displaySections[targetIdx];
    
    const currentOrder = current.sort_order;
    const siblingOrder = sibling.sort_order;
    
    try {
      await Promise.all([
        db.from("cms_sections").update({ sort_order: siblingOrder }).eq("id", current.id),
        db.from("cms_sections").update({ sort_order: currentOrder }).eq("id", sibling.id)
      ]);
      toast.success("\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062a\u0631\u062a\u064a\u062b \u0627\u0644\u0642\u0633\u0645");
      setActiveIdx(targetIdx);
      await load();
    } catch (err: any) {
      toast.error("\u0641\u0634\u0644 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u0631\u062a\u064a\u062b: " + err.message);
    }
  }

  async function doDelete() {
    if (!deleteId) return;
    try {
      const { error } = await db.from("cms_sections").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0642\u0633\u0645 \u0628\u0646\u062c\u0627\u062d");
      setActiveIdx(0);
      await load();
    } catch (err: any) {
      toast.error("\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641: " + err.message);
    } finally {
      setDeleteId(null);
    }
  }

  const getMedia = (sectionId: string) => sectionMedia.filter(m => m.section_id === sectionId);
  const getThumb = (sectionId: string) => getMedia(sectionId).find(m => m.media_type === "image")?.url;

  const sectionDefaults = (editing && SECTION_DEFAULTS[editing.section_key]) || { title_ar: "", title_en: "", body_ar: "", body_en: "", cta_label_ar: "", cta_label_en: "" };

  return (
    <>
      <AdminHeader title={page.ar} subtitle={`\u0628\u0646\u0627\u0621 \u0648\u062a\u0646\u0638\u064a\u0645 \u0635\u0641\u062d\u0629 ${page.ar}`} previewUrl={slug === "home" ? "/" : `/${slug}`}
        actions={
          slug !== "home" && (
            <button onClick={openNew} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0.55rem 1.15rem", borderRadius: 8,
              background: "linear-gradient(135deg, #0C363A, #0F6E66)", color: "#fff",
              border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              boxShadow: "0 2px 8px rgba(12, 54, 58,0.3)",
            }}>
              <Plus size={16} /> {"+ \u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645 \u062c\u062f\u064a\u062f"}
            </button>
          )
        }
      />

      <div className="admin-content">
        {/* 1. Horizontal Scroll Section Navigation Top Bar */}
        <div className="sections-top-nav premium-scrollbar" style={{ direction: "rtl" }}>
          {displaySections.map((section, idx) => {
            const isSelected = activeIdx === idx;
            const accent = getAccent(section.section_key);
            const indexLabel = String(idx + 1).padStart(2, "0");
            const labelAr = SECTION_NAMES_AR[section.section_key] || section.section_name_ar || section.section_name_en;
            return (
              <div
                key={section.id}
                className={`sections-tab-capsule ${isSelected ? "active" : ""}`}
                onClick={() => handleSelectTab(idx)}
              >
                <span className="tab-index">{indexLabel}</span>
                <span className="tab-title">{labelAr}</span>
                <span className="tab-subtitle">{section.section_key}</span>
                
                <div className="tab-indicator">
                  <span className={`tab-status-dot ${section.visible ? "visible" : "hidden"}`} />
                  <span>{section.visible ? "\u0638\u0627\u0647\u0631" : "\u0645\u062e\u0641\u064a"}</span>
                </div>

                {slug !== "home" && (
                  <div className="tab-order-controls">
                    <button
                      type="button"
                      className="tab-order-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "up");
                      }}
                      disabled={idx === 0}
                      title="\u062a\u062d\u0631\u064a\u0643 \u0644\u0644\u0623\u0645\u0627\u0645"
                    >
                      <ChevronRight size={10} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button
                      type="button"
                      className="tab-order-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "down");
                      }}
                      disabled={idx === displaySections.length - 1}
                      title="\u062a\u062d\u0631\u064a\u0643 \u0644\u0644\u062e\u0644\u0641"
                    >
                      <ChevronLeft size={10} style={{ transform: "rotate(90deg)" }} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Luxury Dual-Pane Integrated Editor Workspace */}
        <div className="luxury-workspace" style={{ direction: "rtl" }}>
          {/* Right Pane: Luxury Editor Card (60% equivalent) */}
          <div className="admin-card luxury-border" style={{ padding: "1.5rem" }}>
            {editing ? (
              <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eae5dc", paddingBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="text-[17px] font-bold text-[#0C363A]">
                      {SECTION_NAMES_AR[editing.section_key] || editing.section_name_ar || editing.section_name_en}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "#C18556", background: "rgba(193, 133, 86, 0.08)", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                      {editing.section_key}
                    </span>
                  </div>

                  {/* Visibility Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8a8578" }}>{"\u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0631\u0636 \u0628\u0627\u0644\u0635\u0641\u062d\u0629:"}</label>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, visible: !editing.visible })}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor: editing.visible ? "#B9D4D0" : "#e5e0d5",
                        background: editing.visible ? "#ECF6F4" : "#f5f5f4",
                        color: editing.visible ? "#0F6E66" : "#78716c",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {editing.visible ? "\u0638\u0627\u0647\u0631 \u0628\u0627\u0644\u0635\u0641\u062d\u0629" : "\u0645\u062e\u0641\u064a \u0628\u0627\u0644\u0635\u0641\u062d\u0629"}
                    </button>
                  </div>
                </div>

                {/* Specialized Sub-Editors */}
                {editing.section_key === "testimonials" && (
                  <ClientReviewsEditor clientReviews={clientReviews} onRefresh={load} editing={editing} setEditing={setEditing} />
                )}

                {editing.section_key === "works-preview" && (
                  <WorksSectionEditor dbProjects={dbProjects} onRefresh={load} editing={editing} setEditing={setEditing} />
                )}

                {editing.section_key === "team-preview" && (
                  <TeamSectionEditor dbTeam={dbTeam} onRefresh={load} editing={editing} setEditing={setEditing} />
                )}

                {editing.section_key === "services-preview" && (
                  <ServicesSectionEditor dbServices={dbServices} onRefresh={load} editing={editing} setEditing={setEditing} />
                )}

                {/* Main Content Fields */}
                <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#C18556", fontWeight: 700 }}>{"\u0627\u0644\u0645\u062d\u062a\u0645\u0649 \u0627\u0644\u0646\u0635\u064a \u0644\u0644\u0642\u0633\u0645"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label>{"\u0627\u0644\u0639\u0646\u0648\u0627\u0646 (\u0639\u0631\u0628\u064a)"}</label>
                    <Input value={editing.title_ar || ""} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} placeholder={sectionDefaults.title_ar || ""} />
                  </div>
                  <div className="form-group">
                    <label>Title (EN)</label>
                    <Input value={editing.title_en || ""} onChange={e => setEditing({ ...editing, title_en: e.target.value })} dir="ltr" placeholder={sectionDefaults.title_en || ""} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{"\u0627\u0644\u0648\u0635\u0641 / \u0627\u0644\u0645\u062d\u062a\u0648\u064a \u0627\u0644\u0641\u0631\u0639\u064a (\u0639\u0631\u0628\u064a)"}</label>
                  <Textarea value={editing.body_ar || ""} onChange={e => setEditing({ ...editing, body_ar: e.target.value })} rows={3} placeholder={sectionDefaults.body_ar || ""} />
                </div>
                <div className="form-group">
                  <label>Description / Sub-content (EN)</label>
                  <Textarea value={editing.body_en || ""} onChange={e => setEditing({ ...editing, body_en: e.target.value })} rows={3} dir="ltr" placeholder={sectionDefaults.body_en || ""} />
                </div>

                {/* Primary CTA Buttons */}
                <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#C18556", fontWeight: 700 }}>{"\u0632\u0631 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0627\u0644\u0623\u0633\u0627\u0633\u064a (CTA)"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label>{"\u0646\u0635 \u0627\u0644\u0632\u0631 (\u0639\u0631\u0628\u064a)"}</label>
                    <Input value={editing.cta_label_ar || ""} onChange={e => setEditing({ ...editing, cta_label_ar: e.target.value })} placeholder={sectionDefaults.cta_label_ar || ""} />
                  </div>
                  <div className="form-group">
                    <label>CTA Button Label (EN)</label>
                    <Input value={editing.cta_label_en || ""} onChange={e => setEditing({ ...editing, cta_label_en: e.target.value })} dir="ltr" placeholder={sectionDefaults.cta_label_en || ""} />
                  </div>
                </div>

                {/* Embedded Stats Editor for Hero Tab on Homepage */}
                {slug === "home" && editing.section_key === "hero" && statsEditing && (
                  <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#C18556", fontWeight: 700, display: "block", marginBottom: 10 }}>
                      {"\u0634\u0631\u064a\u0637 \u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a (\u0645\u062f\u0645\u062c \u0645\u0639 \u0642\u0633\u0645 \u0627\u0644\u0628\u062f\u0627\u064a\u0629)"}
                    </span>
                    <StatsEditor editing={statsEditing} setEditing={setStatsEditing} />
                  </div>
                )}

                {/* Section Media */}
                {editing.id && !["testimonials", "works-preview", "team-preview", "services-preview"].includes(editing.section_key) && (
                  <div style={{ borderTop: "1px solid #f0ece4", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#C18556", fontWeight: 700, display: "block", marginBottom: 10 }}>
                      {"\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0642\u0633\u0645 (\u0635\u0648\u0631 \u0623\u0648 \u0641\u064a\u062f\u064a\u0648 \u0627\u0644\u062e\u0644\u0641\u064a\u0629)"}
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 12 }}>
                      {getMedia(editing.id).map(m => (
                        <div key={m.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                          <MediaPreview url={m.url} type={m.media_type} height={85} />
                          <button
                            type="button"
                            onClick={async () => {
                              await db.from("cms_section_media").delete().eq("id", m.id);
                              await load();
                            }}
                            style={{
                              position: "absolute",
                              top: 4,
                              insetInlineEnd: 4,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "rgba(216, 71, 40,0.9)",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 10
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <MediaUploader
                      folder="sections"
                      label={"\u0631\u0641\u0639 \u0635\u0648\u0631 \u0623\u0648 \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a"}
                      multiple
                      onUploaded={async (url, file) => {
                        const mediaType = file.type.startsWith("video/") ? "video" : file.type.includes("pdf") ? "pdf" : "image";
                        await db.from("cms_section_media").upsert({
                          section_id: editing.id,
                          role: "section",
                          media_type: mediaType,
                          url,
                          title_ar: file.name,
                          title_en: file.name,
                          visible: true
                        }, { onConflict: "section_id,role,url" });
                        await load();
                      }}
                    />
                  </div>
                )}

                {/* Form Actions Footer */}
                <div style={{ borderTop: "1px solid #eae5dc", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  {slug !== "home" && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(editing.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#F1C5BA] bg-white text-[#D84728] hover:bg-[#fff5f3] active:scale-95 transition-all cursor-pointer font-bold text-xs"
                    >
                      <Trash2 size={12} /> {"\u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u0646\u0647\u0627\u0626\u064a\u0627\u064b"}
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  <button
                    type="submit"
                    disabled={busy}
                    className="gold-gradient-btn"
                  >
                    {busy ? "جاري الحفظ..." : "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#8a8578" }}>
                {"\u0644\u0627 \u064a\u0648\u062c\u062f \u0642\u0633\u0645 \u0645\u062d\u062f\u062f \u0644\u0644\u062a\u0639\u062f\u064a\u0644 \u062d\u0627\u0644\u064a\u0627\u064b. \u0627\u062e\u062a\u0631 \u0642\u0633\u0645\u0627\u064b \u0645\u0646 \u0627\u0644\u0634\u0631\u064a\u0637 \u0627\u0633\u0641\u0644 \u0627\u0644\u0639\u0644\u0648\u064a \u0644\u0644\u0628\u062f\u0621."}
              </div>
            )}
          </div>

          {/* Left Pane: Interactive Live Device Viewport Mockup (40% equivalent) */}
          <div className="mockup-browser">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot red" />
                <div className="mockup-dot yellow" />
                <div className="mockup-dot green" />
              </div>
              <div className="mockup-address">
                tact.co{slug === "home" ? "/" : `/${slug}`}
              </div>
              <div style={{ width: 40 }} />
            </div>
            <div className="mockup-body">
              {editing ? (
                <SectionLivePreview
                  editing={editing}
                  sectionMedia={sectionMedia}
                  clientReviews={clientReviews}
                  dbProjects={dbProjects}
                  dbTeam={dbTeam}
                  dbServices={dbServices}
                  statsSection={slug === "home" && editing.section_key === "hero" ? statsEditing : null}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#8a8578", fontSize: "0.8rem", fontStyle: "italic" }}>
                  {"\u0627\u062e\u062a\u0631 \u0642\u0633\u0645\u0627\u064b \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629 \u0647\u0646\u0627"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Centered Animated Modal for Adding Section */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-container">
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-header-accent" />
                <h3 className="modal-title">{"\u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645 \u062c\u062f\u064a\u062f"}</h3>
                <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const payload = {
                    ...newSection,
                    section_name_ar: newSection.section_name_ar || newSection.title_ar || newSection.section_key,
                    section_name_en: newSection.section_name_en || newSection.title_en || newSection.section_key,
                    page_slug: slug,
                    sort_order: sections.length * 10
                  };
                  delete (payload as any).id;
                  const { error } = await db.from("cms_sections").insert(payload);
                  if (error) throw error;
                  
                  toast.success("\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0633\u0645 \u0628\u0646\u062c\u0627\u062d");
                  setShowAddModal(false);
                  setNewSection({ ...blank });
                  await load();
                } catch (err: any) {
                  toast.error("\u0641\u0634\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0633\u0645: " + err.message);
                } finally {
                  setBusy(false);
                }
              }}>
                <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label>{"\u0645\u0639\u0631\u0641 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0641\u0631\u064a\u062f (Section Key)"}</label>
                    <Input
                      value={newSection.section_key || ""}
                      onChange={e => setNewSection({ ...newSection, section_key: e.target.value })}
                      placeholder="e.g. custom-promo"
                      required
                      dir="ltr"
                    />
                  </div>
                  


                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="form-group">
                      <label>{"\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 (\u0639\u0631\u0628\u064a)"}</label>
                      <Input
                        value={newSection.title_ar || ""}
                        onChange={e => setNewSection({ ...newSection, title_ar: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Full Title (EN)</label>
                      <Input
                        value={newSection.title_en || ""}
                        onChange={e => setNewSection({ ...newSection, title_en: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{"\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0646\u0635\u064a (\u0639\u0631\u0628\u064a)"}</label>
                    <Textarea
                      value={newSection.body_ar || ""}
                      onChange={e => setNewSection({ ...newSection, body_ar: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Section Text Content (EN)</label>
                    <Textarea
                      value={newSection.body_en || ""}
                      onChange={e => setNewSection({ ...newSection, body_en: e.target.value })}
                      rows={3}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-cancel-btn" onClick={() => setShowAddModal(false)} dir="rtl">{"\u0625\u0644\u063a\u0627\u0621"}</button>
                  <button type="submit" disabled={busy} className="gold-gradient-btn">
                    {busy ? "جاري الإضافة..." : "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0633\u0645"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!deleteId} onConfirm={doDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
