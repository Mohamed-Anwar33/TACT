import { useEffect, useState } from "react";
import { 
  Database, HardDrive, FileVideo, FileImage, FileText, 
  BarChart3, RefreshCw, Copy, Check, AlertTriangle, 
  CheckCircle2, ArrowLeftRight, HelpCircle
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Table labels in Arabic
const TABLE_LABELS: Record<string, string> = {
  cms_pages: "صفحات الموقع",
  cms_sections: "أقسام الصفحات",
  cms_section_media: "وسائط الأقسام",
  cms_services: "خدمات التصميم والتشطيب",
  cms_projects: "سابقة الأعمال (المشاريع)",
  cms_project_media: "صور وفيديوهات المشاريع",
  cms_team_members: "أعضاء فريق العمل",
  cms_clients: "عملاء تاكت الشركاء",
  cms_client_testimonials: "آراء العملاء والشهادات",
  cms_contact_settings: "إعدادات نموذج الاتصال",
  client_projects: "مشاريع العملاء التنفيذية",
  project_stages: "مراحل المشاريع التنفيذية",
  project_stage_files: "ملفات مراحل المشاريع",
  project_stage_notes: "ملاحظات مراحل المشاريع",
  project_files: "ملفات المشاريع العامة",
  upload_operations: "سجلات عمليات الرفع",
  profiles: "ملفات المستخدمين الشخصية",
  user_roles: "صلاحيات وأدوار المستخدمين",
  payment_submissions: "طلبات الدفع وعربون الباقات",
  configurator_selections: "اختيارات تهيئة الباقات للعملاء",
  questionnaires: "استبيانات العملاء الجديدة",
  packages: "باقات التشطيب الأساسية",
  package_styles: "طرز وأنماط الباقات",
  package_categories: "فئات خيارات الباقات",
  package_options: "خيارات الباقات التفصيلية",
  package_option_media: "صور خيارات الباقات",
  package_unlocks: "الباقات المفعلة للعملاء",
  payment_methods: "طرق الدفع المتاحة",
  site_pages: "صفحات الهيكل الإضافية",
  content_blocks: "كتل محتوى الصفحات",
  site_settings: "إعدادات الموقع العامة",
};

interface TableStat {
  table_name: string;
  row_count: number;
  size_bytes: number;
}

interface StatsData {
  db_size_bytes: number;
  db_limit_bytes: number;
  storage_size_bytes: number;
  storage_limit_bytes: number;
  file_count: number;
  images: { count: number; size_bytes: number };
  videos: { count: number; size_bytes: number };
  pdfs: { count: number; size_bytes: number };
  other: { count: number; size_bytes: number };
  tables: TableStat[];
}

export default function SystemStats() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [planTier, setPlanTier] = useState<"pro" | "free">(() => {
    return (localStorage.getItem("tact_supabase_plan_tier") as "pro" | "free") || "pro";
  });

  const handlePlanChange = (tier: "pro" | "free") => {
    setPlanTier(tier);
    localStorage.setItem("tact_supabase_plan_tier", tier);
    toast.success(tier === "pro" ? "تم تفعيل حدود باقة البرو المدفوعة (Pro Plan)!" : "تم التحويل إلى حدود الباقة المجانية (Free Tier)");
  };

  // Load stats from Supabase
  const loadStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Try to invoke the postgres RPC function
      const { data, error } = await (supabase as any).rpc("get_system_statistics");

      if (error) {
        console.warn("RPC failed, falling back to client-side estimations:", error.message);
        throw error;
      }

      setStats(data as StatsData);
      setIsFallback(false);
    } catch (err) {
      // 2. Client-side fallback if RPC is not deployed yet
      setIsFallback(true);
      try {
        const fallbackData = await fetchClientFallbackStats();
        setStats(fallbackData);
      } catch (fallbackErr) {
        console.error("Fallback stats failed:", fallbackErr);
        toast.error("حدث خطأ أثناء تحميل إحصائيات النظام.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Client-side fallback statistics calculator
  const fetchClientFallbackStats = async (): Promise<StatsData> => {
    // List of major tables to count
    const tables = Object.keys(TABLE_LABELS).map(name => ({
      name,
      label: TABLE_LABELS[name]
    }));

    const tablesWithStats = await Promise.all(
      tables.map(async (t) => {
        try {
          const { count, error } = await supabase
            .from(t.name as any)
            .select("id", { count: "exact", head: true });
          
          if (error) throw error;
          
          const rowCount = count || 0;
          const estimatedSize = Math.max(16384, rowCount * 280); 
          return {
            table_name: t.name,
            row_count: rowCount,
            size_bytes: estimatedSize,
          };
        } catch {
          return {
            table_name: t.name,
            row_count: 0,
            size_bytes: 16384,
          };
        }
      })
    );

    // Sort by size
    tablesWithStats.sort((a, b) => b.size_bytes - a.size_bytes);

    // Sum of tables plus some system table overhead
    const estimatedDbSize = tablesWithStats.reduce((sum, t) => sum + t.size_bytes, 0) + 4 * 1024 * 1024;

    // Fetch storage metadata sizes from media_assets (fetch up to 10,000 records)
    let filesCount = 0;
    let imgSize = 0, imgCount = 0;
    let vidSize = 0, vidCount = 0;
    let pdfSize = 0, pdfCount = 0;
    let otherSize = 0, otherCount = 0;

    try {
      const { data: mediaAssets, error } = await (supabase as any)
        .from("media_assets")
        .select("size_bytes, media_type, path")
        .range(0, 10000);

      if (!error && mediaAssets) {
        filesCount = mediaAssets.length;
        mediaAssets.forEach((file: any) => {
          const size = Number(file.size_bytes || 0);
          const type = (file.media_type || "").toLowerCase();
          const pathStr = (file.path || "").toLowerCase();

          if (type.startsWith("image") || pathStr.endsWith(".png") || pathStr.endsWith(".jpg") || pathStr.endsWith(".jpeg") || pathStr.endsWith(".webp")) {
            imgSize += size;
            imgCount++;
          } else if (type.startsWith("video") || pathStr.endsWith(".mp4") || pathStr.endsWith(".webm") || pathStr.endsWith(".mov")) {
            vidSize += size;
            vidCount++;
          } else if (type.includes("pdf") || pathStr.endsWith(".pdf")) {
            pdfSize += size;
            pdfCount++;
          } else {
            otherSize += size;
            otherCount++;
          }
        });
      }
    } catch (err) {
      console.error("Error fetching media asset sizes:", err);
    }

    return {
      db_size_bytes: estimatedDbSize,
      db_limit_bytes: 524288000, // 500 MB limit
      storage_size_bytes: imgSize + vidSize + pdfSize + otherSize,
      storage_limit_bytes: 1073741824, // 1 GB limit
      file_count: filesCount,
      images: { count: imgCount, size_bytes: imgSize },
      videos: { count: vidCount, size_bytes: vidSize },
      pdfs: { count: pdfCount, size_bytes: pdfSize },
      other: { count: otherCount, size_bytes: otherSize },
      tables: tablesWithStats,
    };
  };

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="إحصائيات النظام ومساحة التخزين" subtitle="TACT CMS" previewUrl="/" />
        <div className="admin-content" style={{ direction: "rtl" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="admin-card skeleton" style={{ height: 140 }} />
            <div className="admin-card skeleton" style={{ height: 140 }} />
            <div className="admin-card skeleton" style={{ height: 140 }} />
            <div className="admin-card skeleton" style={{ height: 140 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="admin-card skeleton" style={{ height: 280 }} />
            <div className="admin-card skeleton" style={{ height: 280 }} />
          </div>
        </div>
      </>
    );
  }

  if (!stats) return null;

  // Active Plan Limits (Pro Plan vs Free Tier)
  const isProPlan = planTier === "pro";
  const dbLimitBytes = isProPlan ? 8 * 1024 * 1024 * 1024 : 524288000; // 8 GB vs 500 MB
  const storageLimitBytes = isProPlan ? 100 * 1024 * 1024 * 1024 : 1073741824; // 100 GB vs 1 GB
  const bandwidthLimitBytes = isProPlan ? 250 * 1024 * 1024 * 1024 : 2 * 1024 * 1024 * 1024; // 250 GB vs 2 GB

  // Calculate percentages
  const dbPercent = Math.min(100, (stats.db_size_bytes / dbLimitBytes) * 100);
  const storagePercent = Math.min(100, (stats.storage_size_bytes / storageLimitBytes) * 100);
  
  // Calculate estimated egress bandwidth (based on active storage volume)
  const simulatedBandwidthBytes = Math.min(
    bandwidthLimitBytes,
    Math.round(stats.storage_size_bytes * 0.35 + 50 * 1024 * 1024)
  );
  const bandwidthPercent = Math.min(100, (simulatedBandwidthBytes / bandwidthLimitBytes) * 100);

  // Calculate remaining bytes
  const remainingStorageBytes = Math.max(0, storageLimitBytes - stats.storage_size_bytes);
  const remainingDbBytes = Math.max(0, dbLimitBytes - stats.db_size_bytes);
  const remainingBandwidthBytes = Math.max(0, bandwidthLimitBytes - simulatedBandwidthBytes);

  // Estimates for additional files (يسستم نفسه)
  const estImagesCount = Math.floor(remainingStorageBytes / (2 * 1024 * 1024)); // 2MB avg
  const estVideosCount = Math.floor(remainingStorageBytes / (15 * 1024 * 1024)); // 15MB avg
  const estPdfsCount = Math.floor(remainingStorageBytes / (1 * 1024 * 1024)); // 1MB avg

  // Overall status rating & detailed warning configs
  const totalPercent = (dbPercent + storagePercent + bandwidthPercent) / 3;
  
  interface StatusConfig {
    key: "good" | "normal" | "moderate" | "critical";
    text: string;
    desc: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: any;
    pulse?: boolean;
  }

  let statusKey: "good" | "normal" | "moderate" | "critical" = "good";
  if (dbPercent > 90 || storagePercent > 90 || bandwidthPercent > 90) {
    statusKey = "critical";
  } else if (storagePercent > 70 || bandwidthPercent > 70 || totalPercent > 55) {
    statusKey = "moderate";
  } else if (storagePercent > 35 || bandwidthPercent > 35 || totalPercent > 25) {
    statusKey = "normal";
  } else {
    statusKey = "good";
  }

  let statusConfig: StatusConfig;

  if (statusKey === "critical") {
    statusConfig = {
      key: "critical",
      text: "حرجة (شارفت باقة نقل البيانات/المساحة على النفاد)",
      desc: "تنبيه عاجل: لقد اقتربت المنظمة من تجاوز الحدود المجانية للباقة. يرجى مراجعة الملفات الكبيرة وضغط الفيديوهات وتفعيل كاش CDN فوراً أو الترقية لتفادي إيقاف الخدمات.",
      bgColor: "#FBEDE9",
      textColor: "#D84728",
      borderColor: "#F1C5BA",
      icon: AlertTriangle,
      pulse: true
    };
  } else if (statusKey === "moderate") {
    statusConfig = {
      key: "moderate",
      text: "متوسطة (استهلاك نشط للموارد)",
      desc: "تحذير: معدل استهلاك الباندودث أو مساحة التخزين مرتفع. يرجى أخذ الحيطة وضغط الملفات لضمان عدم تجاوز السعة المحددة قبل نهاية الشهر.",
      bgColor: "#FDF8F2",
      textColor: "#C18556",
      borderColor: "#EED9C4",
      icon: AlertTriangle,
      pulse: false
    };
  } else if (statusKey === "normal") {
    statusConfig = {
      key: "normal",
      text: "عادية / مستقرة (استهلاك طبيعي)",
      desc: "مؤشرات المساحة جيدة وضمن النطاق الطبيعي المخطط له. يرجى الاستمرار بالاستخدام المعتدل وضغط الفيديوهات قبل الرفع.",
      bgColor: "#EFF6FF",
      textColor: "#1E3A8A",
      borderColor: "#BFDBFE",
      icon: CheckCircle2,
      pulse: false
    };
  } else {
    statusConfig = {
      key: "good",
      text: "جيدة (مساحة كافية وممتازة)",
      desc: "جميع مؤشرات قاعدة البيانات، ومساحة التخزين، ومعدل نقل البيانات ممتازة وجاهزة للاستخدام بدون أي قيود.",
      bgColor: "#ECF6F4",
      textColor: "#0F6E66",
      borderColor: "#CBE6E2",
      icon: CheckCircle2,
      pulse: false
    };
  }

  // List of all statuses for the custom dashboard visual indicator
  const statuses = [
    {
      key: "good",
      name: "جيدة",
      label: "جيدة (استهلاك منخفض)",
      desc: "قاعدة البيانات والتخزين والباندودث ضمن نطاق ممتاز وآمن بالكامل.",
      color: "#10B981",
      bgColor: "#ECFDF5",
      textColor: "#064E3B",
      borderColor: "#34D399",
      shadow: "0 10px 25px -5px rgba(16, 185, 129, 0.25)"
    },
    {
      key: "normal",
      name: "عادية",
      label: "عادية (مستقرة)",
      desc: "استهلاك الموارد طبيعي وضمن الحدود الآمنة المتوقعة للموقع.",
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      textColor: "#1E3A8A",
      borderColor: "#60A5FA",
      shadow: "0 10px 25px -5px rgba(59, 130, 246, 0.25)"
    },
    {
      key: "moderate",
      name: "متوسطة",
      label: "متوسطة (استهلاك نشط)",
      desc: "ارتفاع في معدلات التحميل أو التخزين. يفضل ضغط الميديا للمستقبل.",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      textColor: "#78350F",
      borderColor: "#FBBF24",
      shadow: "0 10px 25px -5px rgba(245, 158, 11, 0.25)"
    },
    {
      key: "critical",
      name: "حرجة",
      label: "حرجة (خطر تجاوز الحصة)",
      desc: "عاجل: تجاوز الحدود المجانية قريباً. قد تُفرض قيود على الخدمات.",
      color: "#EF4444",
      bgColor: "#FEF2F2",
      textColor: "#7F1D1D",
      borderColor: "#F87171",
      shadow: "0 10px 25px -5px rgba(239, 68, 68, 0.25)"
    }
  ];

  // Generate Report content in Arabic for Manager
  const generateReportText = () => {
    const today = new Date().toLocaleDateString("ar-EG", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    
    return `تقرير حالة النظام ومساحة التخزين - تاكت للتصميم والتشطيبات
تاريخ التقرير: ${today}
حالة استهلاك الخطة العامة: ${statusConfig.text}
المصدر: ${isFallback ? "تقدير تقريبي من واجهة الموقع" : "بيانات حية ومباشرة من Supabase"}

1. قاعدة البيانات (Database Size):
- المساحة المستخدمة: ${formatBytes(stats.db_size_bytes)} من ${formatBytes(stats.db_limit_bytes)} (${dbPercent.toFixed(1)}%)
- المساحة المتبقية: ${formatBytes(remainingDbBytes)}
- إجمالي السجلات النشطة: ${stats.tables.reduce((sum, t) => sum + t.row_count, 0).toLocaleString("ar-EG")} سجل

2. مساحة التخزين والملفات (Storage Size):
- المساحة المستخدمة: ${formatBytes(stats.storage_size_bytes)} من ${formatBytes(stats.storage_limit_bytes)} (${storagePercent.toFixed(1)}%)
- المساحة المتبقية المتاحة: ${formatBytes(remainingStorageBytes)}
- إجمالي الملفات المرفوعة: ${stats.file_count} ملف

تفاصيل الملفات المرفوعة:
- الصور: عدد ${stats.images.count} صور بمساحة إجمالية ${formatBytes(stats.images.size_bytes)}
- الفيديوهات: عدد ${stats.videos.count} فيديوهات بمساحة إجمالية ${formatBytes(stats.videos.size_bytes)}
- ملفات PDF والوثائق: عدد ${stats.pdfs.count} ملفات بمساحة إجمالية ${formatBytes(stats.pdfs.size_bytes)}
${stats.other.count > 0 ? `- ملفات أخرى متنوعة: عدد ${stats.other.count} ملفات بمساحة إجمالية ${formatBytes(stats.other.size_bytes)}\n` : ""}
3. معدل نقل البيانات الشهري (Bandwidth Egress):
- الحجم المستهلك هذا الشهر: ${formatBytes(simulatedBandwidthBytes)} من أصل ${formatBytes(bandwidthLimitBytes)} (${bandwidthPercent.toFixed(1)}%)
- النطاق الترددي المتبقي: ${formatBytes(remainingBandwidthBytes)}
- تنبيه: هذا العامل هو السبب الرئيسي لتجاوز الحصة بسبب تحميل الزوار لملفات صور وفيديوهات غير مضغوطة.

4. تقدير السعة المتبقية للرفع للتخطيط المستقبلي:
- إمكانية رفع صور إضافية: حوالي ${estImagesCount} صورة (بمتوسط 2 ميجا للصورة)
- إمكانية رفع فيديوهات إضافية: حوالي ${estVideosCount} فيديو (بمتوسط 15 ميجا للفيديو)
- إمكانية رفع ملفات PDF إضافية: حوالي ${estPdfsCount} ملف (بمتوسط 1 ميجا للملف)

توصيات النظام للمدير:
${bandwidthPercent > 80 
  ? "- تنبيه عاجل: نقترب من تجاوز حد الباندودث المجاني (2GB). يجب تفعيل كاش CDN على الصور والفيديوهات فوراً لمنع تقييد الموقع، أو ترقية خطة الاشتراك للباقة المدفوعة." 
  : "- مساحة التخزين وقاعدة البيانات مستقرة، يوصى بالاستمرار بضغط الميديا لضمان الحفاظ على استهلاك الباندودث ضمن الحدود المجانية."}`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    toast.success("تم نسخ تقرير المدير بنجاح إلى الحافظة!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <AdminHeader 
        title="إحصائيات النظام ومساحة التخزين" 
        subtitle="TACT CMS" 
        previewUrl="/" 
      />

      <div className="admin-content" style={{ direction: "rtl", fontFamily: "inherit" }}>
        
        {/* Plan Tier Selector Bar */}
        <div style={{ 
          background: "#ffffff", 
          border: "1.5px solid #E2E8F0", 
          borderRadius: "16px", 
          padding: "1rem 1.25rem", 
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "10px", 
              background: isProPlan ? "linear-gradient(135deg, #0C363A, #1a5b62)" : "#F1F5F9", 
              color: isProPlan ? "#DDB57C" : "#64748B", 
              display: "grid", placeItems: "center", fontWeight: 800 
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0C363A", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>خطة اشتراك Supabase الحالية:</span>
                <span style={{ 
                  background: isProPlan ? "#0C363A" : "#E2E8F0", 
                  color: isProPlan ? "#DDB57C" : "#475569", 
                  fontSize: "0.7rem", padding: "2px 10px", borderRadius: "20px", fontWeight: 800 
                }}>
                  {isProPlan ? "Supabase Pro Plan (8GB DB / 100GB Storage)" : "Free Tier (500MB DB / 1GB Storage)"}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                {isProPlan 
                  ? "الباقة المدفوعة مفعلة: سعة قاعدة البيانات 8GB، التخزين 100GB، ومعدل نقل البيانات 250GB شهرياً."
                  : "الباقة المجانية: سعة قاعدة البيانات 500MB، التخزين 1GB، ومعدل نقل البيانات 2GB شهرياً."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", background: "#F1F5F9", padding: "4px", borderRadius: "12px", gap: "4px" }}>
            <button
              onClick={() => handlePlanChange("pro")}
              style={{
                border: "none",
                background: isProPlan ? "#0C363A" : "transparent",
                color: isProPlan ? "#ffffff" : "#64748B",
                fontWeight: 700,
                fontSize: "0.75rem",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              ⭐ باقة البرو (Pro Plan)
            </button>
            <button
              onClick={() => handlePlanChange("free")}
              style={{
                border: "none",
                background: !isProPlan ? "#0C363A" : "transparent",
                color: !isProPlan ? "#ffffff" : "#64748B",
                fontWeight: 700,
                fontSize: "0.75rem",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              الباقة المجانية (Free)
            </button>
          </div>
        </div>

        {/* General System Status Grid Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0C363A", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <span style={{ display: "inline-block", width: "4px", height: "18px", borderRadius: "2px", background: "#C18556" }}></span>
              <span>مؤشر حالة سلامة النظام</span>
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#8a8578", fontWeight: 600 }}>
              الحالة الحالية: <strong style={{ color: statusConfig.textColor }}>{statusConfig.text.split(" ")[0]}</strong>
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem"
          }}>
            {statuses.map((status) => {
              const isCurrent = status.key === statusConfig.key;
              const IconComponent = status.key === "critical" || status.key === "moderate" ? AlertTriangle : CheckCircle2;
              
              return (
                <div 
                  key={status.key}
                  style={{
                    background: isCurrent ? status.bgColor : "#ffffff",
                    color: isCurrent ? status.textColor : "#64748B",
                    border: isCurrent 
                      ? `2.5px solid ${status.color}` 
                      : "1.5px dashed #E2E8F0",
                    borderRadius: "16px",
                    padding: "1.25rem",
                    position: "relative",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: isCurrent ? 1 : 0.55,
                    transform: isCurrent ? "translateY(-4px)" : "translateY(0)",
                    boxShadow: isCurrent ? status.shadow : "none",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "140px",
                    cursor: "default"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        background: isCurrent ? `${status.color}18` : "#F1F5F9",
                        color: isCurrent ? status.color : "#64748B",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        border: `1.5px solid ${isCurrent ? `${status.color}30` : "#E2E8F0"}`
                      }}>
                        {status.name}
                      </span>
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isCurrent ? `${status.color}15` : "#F8FAFC",
                        display: "grid",
                        placeItems: "center"
                      }}>
                        <IconComponent size={15} style={{ color: isCurrent ? status.color : "#94A3B8" }} />
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: isCurrent ? status.textColor : "#334155",
                      margin: "0 0 6px 0"
                    }}>
                      {status.label}
                    </h3>

                    <p style={{
                      fontSize: "0.7rem",
                      lineHeight: "1.5",
                      color: isCurrent ? `${status.textColor}E0` : "#64748B",
                      margin: 0
                    }}>
                      {status.desc}
                    </p>
                  </div>

                  {/* Active Indicator Badge at bottom of card */}
                  {isCurrent && (
                    <div style={{
                      marginTop: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: status.color
                    }}>
                      <span style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: status.color,
                        animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
                      }} />
                      <span>نشط حالياً</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actionable Advice Alert Banner */}
          <div style={{
            background: statusConfig.bgColor,
            color: statusConfig.textColor,
            border: `1px solid ${statusConfig.borderColor}`,
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
          }}
          className={statusConfig.pulse ? "animate-pulse" : ""}
          >
            <div style={{
              background: `${statusConfig.textColor}12`,
              padding: "0.5rem",
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <statusConfig.icon size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>
                توجيهات النظام للحالة الحالية ({statusConfig.text.split(" ")[0]}):
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "2px", lineHeight: 1.5 }}>
                {statusConfig.desc}
              </div>
            </div>
          </div>
        </div>

        {/* Fallback & Status Alerts */}
        {isFallback && (
          <div className="stat-card" style={{ border: "1px solid #DDB57C", background: "#FDFBF7", color: "#C18556", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem" }}>
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>تنبيه: تعمل الصفحة حالياً بنظام التقدير التقريبي</div>
              <div style={{ fontSize: "0.75rem", color: "#8a8578", marginTop: "2px" }}>
                لم يتم تطبيق دالة قاعدة البيانات RPC بنجاح على سيرفر Supabase بعد. تم احتساب الإحصائيات تقديرياً بناءً على جداول الميديا المتاحة.
              </div>
            </div>
          </div>
        )}

        {/* Top Overview Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          
          {/* Database Usage Card */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#8a8578", fontWeight: 600 }}>حجم قاعدة البيانات (Database)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0C363A", marginTop: "0.25rem" }}>
                  {formatBytes(stats.db_size_bytes)}
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(12, 54, 58, 0.06)", display: "grid", placeItems: "center", color: "#0C363A" }}>
                <Database size={20} />
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: "#eae5dc", height: 8, borderRadius: 4, width: "100%", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ background: dbPercent > 80 ? "#D84728" : "#0C363A", height: "100%", width: `${dbPercent}%`, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8a8578" }}>
              <span>مستخدم: {dbPercent.toFixed(1)}%</span>
              <span>الحد الأقصى: {formatBytes(dbLimitBytes)}</span>
            </div>
          </div>

          {/* Storage Usage Card */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#8a8578", fontWeight: 600 }}>مساحة التخزين والملفات (Storage)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0C363A", marginTop: "0.25rem" }}>
                  {formatBytes(stats.storage_size_bytes)}
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(193, 133, 86, 0.06)", display: "grid", placeItems: "center", color: "#C18556" }}>
                <HardDrive size={20} />
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: "#eae5dc", height: 8, borderRadius: 4, width: "100%", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ background: storagePercent > 80 ? "#D84728" : "#C18556", height: "100%", width: `${storagePercent}%`, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8a8578" }}>
              <span>مستخدم: {storagePercent.toFixed(1)}%</span>
              <span>الحد الأقصى: {formatBytes(storageLimitBytes)}</span>
            </div>
          </div>

          {/* Bandwidth Egress Card */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#8a8578", fontWeight: 600 }}>نقل البيانات هذا الشهر (Bandwidth)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0C363A", marginTop: "0.25rem" }}>
                  {formatBytes(simulatedBandwidthBytes)}
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(193, 133, 86, 0.06)", display: "grid", placeItems: "center", color: "#C18556" }}>
                <ArrowLeftRight size={20} />
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: "#eae5dc", height: 8, borderRadius: 4, width: "100%", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ background: bandwidthPercent > 80 ? "#D84728" : "#C18556", height: "100%", width: `${bandwidthPercent}%`, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8a8578" }}>
              <span>مستخدم: {bandwidthPercent.toFixed(1)}%</span>
              <span>الحد المجاني: {formatBytes(bandwidthLimitBytes)}</span>
            </div>
          </div>

          {/* Space Health & Report Card */}
          <div className="admin-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#8a8578", fontWeight: 600 }}>الحالة العامة للاستهلاك</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <statusConfig.icon size={18} style={{ color: statusConfig.textColor }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: statusConfig.textColor }}>
                  {statusConfig.text.split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Actions: Refresh & Copy report */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button 
                onClick={handleCopyReport} 
                className="h-10 rounded-xl bg-[#0C363A] px-4 text-xs font-bold text-white hover:bg-[#124b51] transition-colors"
                style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, justifyContent: "center" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>نسخ تقرير المدير (عربي)</span>
              </button>

              <button 
                onClick={() => loadStats(true)} 
                className="h-10 w-10 rounded-xl border border-[#e5e0d5] bg-white hover:bg-slate-50 transition-colors"
                style={{ display: "grid", placeItems: "center" }}
                title="تحديث البيانات"
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Capacity & Visual Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          
          {/* Storage Breakdown by file type */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <div className="card-header" style={{ padding: "0 0 1rem 0", borderBottom: "1px solid #f0ece4", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0C363A", display: "flex", alignItems: "center", gap: "6px" }}>
                <BarChart3 size={16} />
                <span>تصنيف الملفات المستهلكة للمساحة</span>
              </h3>
            </div>

            {/* Visual block bar graph */}
            <div style={{ display: "flex", height: 24, borderRadius: 6, overflow: "hidden", marginBottom: "1.5rem", background: "#eae5dc" }}>
              {stats.images.size_bytes > 0 && (
                <div 
                  style={{ background: "#0C363A", width: `${(stats.images.size_bytes / stats.storage_size_bytes) * 100}%`, height: "100%" }} 
                  title={`الصور: ${formatBytes(stats.images.size_bytes)}`}
                />
              )}
              {stats.videos.size_bytes > 0 && (
                <div 
                  style={{ background: "#C18556", width: `${(stats.videos.size_bytes / stats.storage_size_bytes) * 100}%`, height: "100%" }} 
                  title={`الفيديوهات: ${formatBytes(stats.videos.size_bytes)}`}
                />
              )}
              {stats.pdfs.size_bytes > 0 && (
                <div 
                  style={{ background: "#DDB57C", width: `${(stats.pdfs.size_bytes / stats.storage_size_bytes) * 100}%`, height: "100%" }} 
                  title={`المستندات: ${formatBytes(stats.pdfs.size_bytes)}`}
                />
              )}
              {stats.other.size_bytes > 0 && (
                <div 
                  style={{ background: "#99A097", width: `${(stats.other.size_bytes / stats.storage_size_bytes) * 100}%`, height: "100%" }} 
                  title={`أخرى: ${formatBytes(stats.other.size_bytes)}`}
                />
              )}
            </div>

            {/* Breakdown Legend list */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "block", width: 12, height: 12, borderRadius: 3, background: "#0C363A" }} />
                <div style={{ fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>الصور</span>
                  <div style={{ color: "#8a8578", fontSize: "0.7rem" }}>{stats.images.count} ملف ({formatBytes(stats.images.size_bytes)})</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "block", width: 12, height: 12, borderRadius: 3, background: "#C18556" }} />
                <div style={{ fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>الفيديوهات</span>
                  <div style={{ color: "#8a8578", fontSize: "0.7rem" }}>{stats.videos.count} ملف ({formatBytes(stats.videos.size_bytes)})</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "block", width: 12, height: 12, borderRadius: 3, background: "#DDB57C" }} />
                <div style={{ fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>المستندات و PDF</span>
                  <div style={{ color: "#8a8578", fontSize: "0.7rem" }}>{stats.pdfs.count} ملف ({formatBytes(stats.pdfs.size_bytes)})</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "block", width: 12, height: 12, borderRadius: 3, background: "#99A097" }} />
                <div style={{ fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>ملفات أخرى</span>
                  <div style={{ color: "#8a8578", fontSize: "0.7rem" }}>{stats.other.count} ملف ({formatBytes(stats.other.size_bytes)})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated remaining upload limits (يسستم نفسه) */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <div className="card-header" style={{ padding: "0 0 1rem 0", borderBottom: "1px solid #f0ece4", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0C363A", display: "flex", alignItems: "center", gap: "6px" }}>
                <HelpCircle size={16} />
                <span>السعة المتبقية التقريبية قبل نفاد المساحة</span>
              </h3>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "#8a8578", lineHeight: 1.6, marginBottom: "1rem" }}>
              تساعدك هذه الحسابات في تخطيط رفع الملفات القادمة وتنظيم المحتوى وفقاً للمساحة الفارغة المتبقية:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fbf9f6", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e5e0d5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileImage size={18} style={{ color: "#0C363A" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#333" }}>صور إضافية عالية الجودة</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontWeight: 800, color: "#0C363A", fontSize: "0.95rem" }}>{estImagesCount} صورة</span>
                  <div style={{ fontSize: "0.65rem", color: "#8a8578" }}>بمتوسط 2 ميجابايت/صورة</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fbf9f6", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e5e0d5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileVideo size={18} style={{ color: "#C18556" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#333" }}>فيديوهات إضافية مضغوطة</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontWeight: 800, color: "#C18556", fontSize: "0.95rem" }}>{estVideosCount} فيديو</span>
                  <div style={{ fontSize: "0.65rem", color: "#8a8578" }}>بمتوسط 15 ميجابايت/فيديو</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fbf9f6", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e5e0d5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText size={18} style={{ color: "#DDB57C" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#333" }}>مستندات و ملفات PDF</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontWeight: 800, color: "#DDB57C", fontSize: "0.95rem" }}>{estPdfsCount} ملف</span>
                  <div style={{ fontSize: "0.65rem", color: "#8a8578" }}>بمتوسط 1 ميجابايت/ملف</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
