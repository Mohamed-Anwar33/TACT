import { useEffect, useState } from "react";
import { FileText, Search, Printer, Eye, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import EditDrawer from "@/components/admin/EditDrawer";
import SaveButton from "@/components/admin/SaveButton";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { normalizePackageImageUrl } from "@/lib/catalog";

const db = supabase as any;

const PKG_LABELS: Record<string, string> = { 
  economy: "باقة أساسية (Economy)", 
  medium: "باقة متوسطة (Medium)", 
  luxury: "باقة فاخرة (Luxury)" 
};

export default function SelectionsManager() {
  const [selectionsList, setSelectionsList] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeSelection, setActiveSelection] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [selRes, profRes, pkgRes] = await Promise.all([
      db.from("configurator_selections").select("*").order("created_at", { ascending: false }),
      db.from("profiles").select("*"),
      db.from("packages").select("*")
    ]);

    setSelectionsList(selRes.data || []);
    setProfiles(profRes.data || []);
    setPackages(pkgRes.data || []);
  }

  const getProfile = (uid: string) => profiles.find(p => p.id === uid);
  const getPkgName = (id: string) => packages.find(p => p.id === id)?.name_ar || PKG_LABELS[id] || id;

  const filtered = search
    ? selectionsList.filter(s => {
        const pr = getProfile(s.user_id);
        const pkgName = getPkgName(s.package_id);
        return (
          (pr?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (pr?.phone || "").includes(search) ||
          (pkgName || "").toLowerCase().includes(search.toLowerCase())
        );
      })
    : selectionsList;

  async function doDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const { error } = await db.from("configurator_selections").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("تم حذف اختيار العميل بنجاح");
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Parse the client's custom selections object into grouped styles and categories
  const parseSelections = (rawSelections: any) => {
    if (!rawSelections) return {};
    const grouped: Record<string, any[]> = {};

    Object.entries(rawSelections).forEach(([key, val]: [string, any]) => {
      let styleName = val.style || "عام (General)";
      let categoryName = key;

      // If the key has style prefix like styleId_categoryName
      if (key.includes("_")) {
        const idx = key.indexOf("_");
        categoryName = key.substring(idx + 1);
        const styleId = key.substring(0, idx);
        if (styleId === "modern") styleName = "مودرن (Modern)";
        else if (styleId === "neoclassic" || styleId === "classic") styleName = "نيوكلاسيك / كلاسيك";
      }

      if (!grouped[styleName]) {
        grouped[styleName] = [];
      }

      let choiceObj = val.choiceObj || null;
      if (choiceObj && choiceObj.image_url) {
        let url = choiceObj.image_url;
        const isEconomyPackage = url.includes("/Packages/economy-");
        const usesSingleDoorFolder = url.includes("/Packages/medium-") || url.includes("/Packages/luxury-");
        
        // 1. Fix modern walls legacy filenames in economy package
        if (isEconomyPackage && (url.includes("/modern/Walls/2.webp") || url.endsWith("/modern/Walls/2.webp"))) {
          url = url.replace("/modern/Walls/2.webp", "/modern/Walls/ARTWORK.webp");
        } else if (isEconomyPackage && (url.includes("/modern/Walls/1.webp") || url.endsWith("/modern/Walls/1.webp"))) {
          url = url.replace("/modern/Walls/1.webp", "/modern/Walls/PAINT.webp");
        }
        
        // 2. Door folders differ by package: Economy has /Doors/1.webp,
        // while Medium/Luxury have /Doors/single/1.webp.
        if (isEconomyPackage && url.includes("/Doors/single/") && !url.includes("/Doors/Classic/")) {
          url = url.replace("/Doors/single/", "/Doors/");
        } else if (
          usesSingleDoorFolder &&
          url.includes("/Doors/1.webp") &&
          !url.includes("/Doors/single/1.webp") &&
          !url.includes("/Doors/Classic/")
        ) {
          url = url.replace("/Doors/1.webp", "/Doors/single/1.webp");
        } else if (
          usesSingleDoorFolder &&
          url.includes("/Doors/2.webp") &&
          !url.includes("/Doors/single/2.webp") &&
          !url.includes("/Doors/Classic/")
        ) {
          url = url.replace("/Doors/2.webp", "/Doors/single/2.webp");
        }
        
        // 3. Fix Flooring legacy numbers in medium package
        if (url.includes("/medium/styles/styles/modern/Flooring/1.webp")) {
          url = url.replace("/medium/styles/styles/modern/Flooring/1.webp", "/medium/styles/styles/modern/Flooring/Porcelien/بورسلين.webp");
        } else if (url.includes("/medium/styles/styles/modern/Flooring/2.webp")) {
          url = url.replace("/medium/styles/styles/modern/Flooring/2.webp", "/medium/styles/styles/modern/Flooring/Ceramic/سيراميك شبيه الباركيه.webp");
        }
        
        // 4. Fix Flooring legacy numbers in luxury package
        if (url.includes("/luxury/styles/styles/modern/modern/Flooring/1.webp")) {
          url = url.replace("/luxury/styles/styles/modern/modern/Flooring/1.webp", "/luxury/styles/styles/modern/modern/Flooring/Marble/رخام.webp");
        } else if (url.includes("/luxury/styles/styles/modern/modern/Flooring/2.webp") || url.includes("/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب طبيعي.webp")) {
          url = url.replace("/luxury/styles/styles/modern/modern/Flooring/2.webp", "/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب باركيه.webp");
          url = url.replace("/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب طبيعي.webp", "/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب باركيه.webp");
        }
        
        // 5. Fix medium classic style path typos (/classic/ -> /neoclassic/ and /Doors/ -> /Doors/single/)
        if (url.includes("/medium/styles/styles/classic/")) {
          url = url.replace("/medium/styles/styles/classic/", "/medium/styles/styles/neoclassic/");
        }
        if (usesSingleDoorFolder && url.includes("/neoclassic/Doors/1.webp")) {
          url = url.replace("/neoclassic/Doors/1.webp", "/neoclassic/Doors/single/1.webp");
        }

        choiceObj = {
          ...choiceObj,
          image_url: normalizePackageImageUrl(url)
        };
      }

      grouped[styleName].push({
        category: categoryName,
        choice: val.choice || (choiceObj ? (choiceObj.name_ar || choiceObj.name_en) : "غير محدد"),
        choiceObj: choiceObj,
        place: val.place || "غير محدد",
        qty: val.qty || "غير محدد",
        notes: val.notes || "لا توجد ملاحظات"
      });
    });

    return grouped;
  };

  const handlePrint = async () => {
    const printArea = document.getElementById("print-area");
    if (!printArea || !activeSelection) {
      toast.error("تعذر تجهيز التقرير للتصدير");
      return;
    }

    setExportingPdf(true);
    const printWindow = window.open("", "_blank", "width=960,height=900");
    if (!printWindow) {
      setExportingPdf(false);
      toast.error("المتصفح منع فتح نافذة التصدير. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى.");
      return;
    }

    const reportId = `CS-${activeSelection.id.substring(0, 8).toUpperCase()}`;
    const fileTitle = `TACT-${reportId}`;
    const reportHtml = printArea.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${fileTitle}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #111;
              direction: rtl;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            .print-only-container {
              display: block !important;
              position: static !important;
              width: 100% !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
            @media screen {
              body {
                max-width: 210mm;
                margin: 0 auto;
                padding: 12mm;
                box-shadow: 0 0 28px rgba(0,0,0,0.12);
              }
            }
            @media print {
              body {
                width: auto;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${reportHtml}
          <style>
            .print-only-container {
              display: block !important;
              position: static !important;
              width: 100% !important;
              padding: 0 !important;
            }
          </style>
        </body>
      </html>`);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    await Promise.race([
      Promise.all(
        images.map((img) => {
          img.loading = "eager";
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      ),
      new Promise((resolve) => window.setTimeout(resolve, 5000)),
    ]);

    printWindow.focus();
    printWindow.print();
    setExportingPdf(false);
  };

  const activeProfile = activeSelection ? getProfile(activeSelection.user_id) : null;
  const activeParsed = activeSelection ? parseSelections(activeSelection.selections) : {};

  return (
    <>
      <AdminHeader 
        title="اختيارات بنود تشطيب العملاء" 
        subtitle="مراجعة وتصدير تفاصيل تشطيب ومواد الوحدات الخاصة بالعملاء كـ PDF بالصور الكاملة" 
      />

      <div className="admin-content">
        {/* Search */}
        <div style={{ marginBottom: "1.25rem", maxWidth: 420, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#999" }} />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="بحث باسم العميل، الهاتف، أو اسم الباقة..." 
            style={{ paddingInlineStart: 36 }} 
          />
        </div>

        {/* Selections List Card */}
        <div className="admin-card">
          <div className="card-header">
            <h3><FileText size={16} style={{ verticalAlign: -2, marginInlineEnd: 6, color: "#c9964c" }} />قائمة اختيارات العملاء المعتمدة ({filtered.length})</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>رقم الهاتف</th>
                  <th>الباقة المخصصة</th>
                  <th>عدد المواد المختارة</th>
                  <th>تاريخ الإرسال</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const pr = getProfile(s.user_id);
                  const selectionKeys = s.selections ? Object.keys(s.selections) : [];
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{pr?.full_name || "—"}</td>
                      <td dir="ltr" style={{ fontSize: "0.8rem" }}>{pr?.phone || "—"}</td>
                      <td>
                        <span style={{ padding: "3px 10px", borderRadius: 20, background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 600 }}>
                          {getPkgName(s.package_id)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{selectionKeys.length} بند تشطيب</td>
                      <td style={{ fontSize: "0.75rem", color: "#888" }}>
                        {new Date(s.created_at).toLocaleDateString("ar-EG")} · {new Date(s.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button 
                            onClick={() => setActiveSelection(s)}
                            style={{ 
                              padding: "5px 12px", 
                              borderRadius: 6, 
                              background: "#073b35", 
                              color: "#fff", 
                              border: "none", 
                              cursor: "pointer", 
                              fontSize: "0.75rem", 
                              fontWeight: 600, 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 4 
                            }}
                          >
                            <Eye size={12} /> عرض وتصدير PDF
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(s)}
                            style={{ 
                              padding: "5px 8px", 
                              borderRadius: 6, 
                              border: "1px solid #fecaca", 
                              background: "#fff", 
                              cursor: "pointer", 
                              color: "#dc2626" 
                            }}
                            title="حذف هذا التقرير"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                      لا توجد اختيارات مرسلة من العملاء حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selections Visualizer Drawer / Export to PDF Dialog */}
      <EditDrawer 
        open={!!activeSelection} 
        title="تقرير اختيارات التشطيب التفصيلي للعميل" 
        onClose={() => setActiveSelection(null)}
        width={750}
        footer={
          <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
            <button 
              onClick={handlePrint}
              disabled={exportingPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0.6rem 1.25rem",
                borderRadius: 8,
                background: "#c9964c",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                cursor: exportingPdf ? "wait" : "pointer",
                opacity: exportingPdf ? 0.7 : 1,
                boxShadow: "0 4px 10px rgba(201,150,76,0.2)"
              }}
            >
              <Printer size={16} /> طباعة التقرير وتصدير PDF بالصور
            </button>
          </div>
        }
      >
        {activeSelection && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Header: Client & Package Details Card */}
            <div style={{ padding: "1.25rem", borderRadius: 12, background: "#faf8f4", border: "1px solid #eae5dc", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase" }}>العميل الكريم</span>
                <h4 style={{ fontWeight: 800, color: "#073b35", fontSize: "1.1rem", margin: "2px 0" }}>{activeProfile?.full_name || "—"}</h4>
                <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
                  <span>الهاتف: {activeProfile?.phone || "—"}</span>
                  <span style={{ marginInlineStart: 12 }}>البريد: {activeProfile?.email || "—"}</span>
                </div>
              </div>
              <div style={{ textAlign: "left", alignSelf: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", display: "block" }}>الباقة المختارة</span>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: "#073b35", color: "#fff", fontSize: "0.8rem", fontWeight: 700, display: "inline-block", marginTop: 4 }}>
                  {getPkgName(activeSelection.package_id)}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#888", display: "block", marginTop: 6 }}>
                  تم الإرسال: {new Date(activeSelection.created_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
            </div>

            {/* List of Selections grouped by Style */}
            {Object.keys(activeParsed).length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed #e5e0d5", borderRadius: 8, color: "#999" }}>
                لم يتم تسجيل أي بيانات خامات أو اختيارات لهذا التقرير
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {Object.entries(activeParsed).map(([styleName, items]: [string, any[]]) => (
                  <div key={styleName} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    
                    {/* Style Banner */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "2px solid #073b35", paddingBottom: "6px" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9964c" }} />
                      <h4 style={{ color: "#073b35", fontWeight: 800, fontSize: "1.05rem", margin: 0 }}>استايل: {styleName}</h4>
                    </div>

                    {/* Options Details Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {items.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            background: "#fff", 
                            border: "1px solid #e5e0d5", 
                            borderRadius: "10px", 
                            overflow: "hidden", 
                            display: "grid", 
                            gridTemplateColumns: "110px 1fr", 
                            minHeight: "100px" 
                          }}
                        >
                          {/* Image preview */}
                          <div style={{ background: "#eee", display: "grid", placeItems: "center", borderInlineEnd: "1px solid #e5e0d5" }}>
                            {item.choiceObj?.image_url ? (
                              <img 
                                src={item.choiceObj.image_url} 
                                alt="" 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                            ) : (
                              <div style={{ color: "#bbb", fontSize: "0.7rem", fontWeight: 600 }}>بدون صورة</div>
                            )}
                          </div>

                          {/* Selections Data details */}
                          <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "#c9964c", fontWeight: 700 }}>{item.category}</span>
                                <span style={{ fontSize: "0.6rem", background: "#f5f5f4", padding: "1px 6px", borderRadius: 4, color: "#888", fontFamily: "monospace" }}>البند {idx + 1}</span>
                              </div>
                              <h5 style={{ fontWeight: 800, color: "#073b35", fontSize: "0.85rem", margin: "4px 0" }}>{item.choice}</h5>
                              <p style={{ fontSize: "0.72rem", color: "#666", margin: 0, lineHeight: 1.5 }}>
                                {item.choiceObj?.description_ar || "لا يوجد وصف إضافي للمادة المحددة."}
                              </p>
                            </div>
                            
                            {/* Execution metrics */}
                            <div style={{ borderTop: "1px dashed #eae5dc", paddingTop: 6, marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, fontSize: "0.68rem" }}>
                              <div><span style={{ color: "#999" }}>مكان الاستخدام:</span> <strong style={{ color: "#073b35" }}>{item.place}</strong></div>
                              <div><span style={{ color: "#999" }}>الكمية المطلوبة:</span> <strong style={{ color: "#073b35" }}>{item.qty}</strong></div>
                              <div><span style={{ color: "#999" }}>ملاحظات:</span> <strong style={{ color: "#666" }}>{item.notes}</strong></div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </EditDrawer>

      {/* ─── PRINT ONLY HIDDEN VIEW FOR PRECISE PDF A4 EXPORT ─── */}
      {activeSelection && (
        <div id="print-area" className="print-only-container">
          
          {/* Inject Printing CSS Rules locally so it works beautifully */}
          <style>{`
            /* Hide print container on standard screens */
            .print-only-container {
              display: none !important;
            }

            @media print {
              /* Hide all standard screen layout elements completely */
              .admin-sidebar,
              .admin-header,
              .admin-card,
              header,
              aside,
              button,
              .sonner,
              [role="dialog"],
              div[data-state="open"] {
                display: none !important;
              }

              /* Reset parent containers so print area occupies full page */
              .admin-layout,
              .admin-main,
              #root {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #fff !important;
                width: 100% !important;
              }

              /* Display and format the print container */
              .print-only-container {
                display: block !important;
                position: absolute !important;
                inset-x: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: #fff !important;
                color: #000 !important;
                direction: rtl !important;
                text-align: right !important;
                font-family: 'Times New Roman', 'Inter', 'Outfit', sans-serif !important;
                padding: 20px !important;
              }
              .print-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px double #073b35;
                padding-bottom: 12px;
                margin-bottom: 25px;
              }
              .print-logo-icon {
                width: 50px;
                height: 50px;
                border-radius: 8px;
                border: 2px solid #c9964c;
                color: #c9964c;
                display: grid;
                place-items: center;
                font-weight: 700;
                font-size: 1.6rem;
                margin-bottom: 4px;
              }
              .print-company-name {
                font-size: 1.3rem;
                font-weight: 800;
                color: #073b35;
              }
              .print-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                background: #fbf9f5 !important;
                border: 1px solid #eae5dc;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-style-section {
                margin-bottom: 24px;
                break-inside: auto;
                page-break-inside: auto;
              }
              .print-style-title {
                font-size: 1.15rem;
                font-weight: 800;
                color: #073b35;
                border-bottom: 2px solid #073b35;
                padding-bottom: 6px;
                margin-bottom: 15px;
              }
              .print-option-card {
                border: 1px solid #eae5dc;
                border-radius: 8px;
                margin-bottom: 10px;
                display: flex;
                min-height: 104px;
                overflow: hidden;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .print-option-img {
                width: 120px;
                height: 104px;
                object-fit: cover;
                border-inline-end: 1px solid #eae5dc;
              }
              .print-option-details {
                padding: 12px;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .print-option-title {
                font-size: 0.95rem;
                font-weight: 800;
                color: #073b35;
                margin: 0 0 4px 0;
              }
              .print-option-desc {
                font-size: 0.8rem;
                color: #555;
                margin: 0 0 8px 0;
              }
              .print-meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1.5fr;
                gap: 10px;
                font-size: 0.75rem;
                border-top: 1px dashed #eae5dc;
                padding-top: 8px;
                margin-top: 8px;
              }
              .print-signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 50px;
                margin-top: 60px;
                page-break-inside: avoid;
              }
              .print-sig-block {
                text-align: center;
                border-top: 1px solid #aaa;
                padding-top: 10px;
                font-size: 0.85rem;
              }
            }
          `}</style>

          {/* Letterhead */}
          <div className="print-header">
            <div>
              <div className="print-company-name">تاكت للاستشارات الهندسية والمقاولات</div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>شركة التميز والتنفيذ الفاخر للأعمال الإنشائية والديكور</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div className="print-logo-icon" style={{ marginInlineStart: "auto" }}>T</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#c9964c" }}>TACT ARCHITECTS</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#073b35", textDecoration: "underline" }}>تقرير اختيارات بنود التشطيب والمواد المعتمد</h2>
          </div>

          {/* Client & Contract Information */}
          <div className="print-info-grid">
            <div>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#666" }}>اسم العميل الكريم:</span> <strong>{activeProfile?.full_name || "—"}</strong></div>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#666" }}>رقم الهاتف / الواتساب:</span> <strong dir="ltr">{activeProfile?.phone || "—"}</strong></div>
              <div><span style={{ color: "#666" }}>البريد الإلكتروني:</span> <strong>{activeProfile?.email || "—"}</strong></div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#666" }}>الباقة المعتمدة:</span> <strong>{getPkgName(activeSelection.package_id)}</strong></div>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#666" }}>رقم التقرير:</span> <strong>CS-{activeSelection.id.substring(0,8).toUpperCase()}</strong></div>
              <div><span style={{ color: "#666" }}>تاريخ الاعتماد والطباعة:</span> <strong>{new Date().toLocaleDateString("ar-EG")}</strong></div>
            </div>
          </div>

          {/* Grouped Visual visualizer */}
          {Object.entries(activeParsed).map(([styleName, items]: [string, any[]]) => (
            <div key={styleName} className="print-style-section">
              <div className="print-style-title">الاستايل المعماري المختار: {styleName}</div>
              
              {items.map((item, idx) => (
                <div key={idx} className="print-option-card">
                  {item.choiceObj?.image_url && (
                    <img 
                      className="print-option-img" 
                      src={item.choiceObj.image_url} 
                      alt="" 
                    />
                  )}
                  <div className="print-option-details">
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#c9964c", fontWeight: 700, marginBottom: 4 }}>
                        <span>{item.category}</span>
                        <span>بند {idx + 1}</span>
                      </div>
                      <h3 className="print-option-title">{item.choice}</h3>
                      <p className="print-option-desc">{item.choiceObj?.description_ar || "مواصفات المادة أو البند المحدد من الكتالوج الرسمي."}</p>
                    </div>

                    <div className="print-meta-grid">
                      <div><span style={{ color: "#666" }}>مكان الاستخدام:</span> <strong>{item.place}</strong></div>
                      <div><span style={{ color: "#666" }}>الكمية التقريبية:</span> <strong>{item.qty}</strong></div>
                      <div><span style={{ color: "#666" }}>ملاحظات العميل:</span> <strong>{item.notes}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Signoff */}
          <div className="print-signature-section">
            <div className="print-sig-block">
              <strong>اعتماد وإمضاء العميل</strong>
              <div style={{ marginTop: 50, color: "#888" }}>الاسم:......................................................</div>
              <div style={{ marginTop: 10, color: "#888" }}>التوقيع:....................................................</div>
            </div>
            <div className="print-sig-block">
              <strong>اعتماد المكتب الفني لشركة TACT</strong>
              <div style={{ marginTop: 50, color: "#888" }}>المهندس المسؤول:..........................................</div>
              <div style={{ marginTop: 10, color: "#888" }}>الخاتم الرسمي:.............................................</div>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.7rem", color: "#999", marginTop: 50, borderTop: "1px solid #eee", paddingTop: 10 }}>
            هذا المستند يعتبر مستنداً رسمياً معتمداً ومرفقاً بملحق عقد التنفيذ والمقاولة لتحديد وتوريد بنود التشطيب المتفق عليها.
          </div>

        </div>
      )}

      <ConfirmDialog 
        open={!!deleteTarget} 
        onConfirm={doDelete} 
        onCancel={() => setDeleteTarget(null)} 
      />
    </>
  );
}
