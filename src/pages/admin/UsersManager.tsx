import { useEffect, useMemo, useState } from "react";
import { Search, Users, CheckCircle2, Clock, PackageCheck } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { phoneToDisplay } from "@/lib/phoneAuth";

const db = supabase as any;

export default function UsersManager() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [unlocks, setUnlocks] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setBusy(true);
    const [profileRes, paymentRes, unlockRes, questionnaireRes, selectionRes] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("payment_submissions").select("*").order("created_at", { ascending: false }),
      db.from("package_unlocks").select("*"),
      db.from("questionnaires").select("id,user_id,email,phone"),
      db.from("configurator_selections").select("id,user_id"),
    ]);
    setProfiles(profileRes.data || []);
    setPayments(paymentRes.data || []);
    setUnlocks(unlockRes.data || []);
    setQuestionnaires(questionnaireRes.data || []);
    setSelections(selectionRes.data || []);
    setBusy(false);
  }

  const rows = useMemo(() => {
    return profiles.map((profile) => {
      const userPayments = payments.filter((payment) => payment.user_id === profile.id);
      const activeUnlocks = unlocks.filter((unlock) => unlock.user_id === profile.id && unlock.status === "active");
      const userQuestionnaires = questionnaires.filter((item) => item.user_id === profile.id || item.email === profile.email || item.phone === profile.phone);
      const userSelections = selections.filter((item) => item.user_id === profile.id);
      const latestPayment = userPayments[0];
      return {
        ...profile,
        phoneDisplay: phoneToDisplay(profile.phone) || profile.phone || "-",
        paymentsCount: userPayments.length,
        hasPayment: userPayments.length > 0,
        latestPaymentStatus: latestPayment?.status || "none",
        activeUnlocks,
        questionnairesCount: userQuestionnaires.length,
        selectionsCount: userSelections.length,
      };
    });
  }, [profiles, payments, unlocks, questionnaires, selections]);

  const filtered = search
    ? rows.filter((row) => {
        const term = search.toLowerCase();
        return (
          (row.full_name || "").toLowerCase().includes(term) ||
          (row.email || "").toLowerCase().includes(term) ||
          (row.phone || "").toLowerCase().includes(term) ||
          (row.phoneDisplay || "").toLowerCase().includes(term)
        );
      })
    : rows;

  const pendingUsers = rows.filter((row) => !row.hasPayment && row.activeUnlocks.length === 0).length;
  const paidUsers = rows.filter((row) => row.hasPayment).length;
  const activeUsers = rows.filter((row) => row.activeUnlocks.length > 0 || row.packages_unlocked).length;

  return (
    <>
      <AdminHeader title="المستخدمين المسجلين" subtitle="كل الحسابات التي سجلت في الموقع مع حالة الدفع والتفعيل" />
      <div className="admin-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
          {[
            { label: "إجمالي المستخدمين", value: rows.length, icon: Users, color: "#6366f1" },
            { label: "لم يدفعوا بعد", value: pendingUsers, icon: Clock, color: "#f59e0b" },
            { label: "أرسلوا دفعة", value: paidUsers, icon: PackageCheck, color: "#0ea5e9" },
            { label: "مفعلين", value: activeUsers, icon: CheckCircle2, color: "#059669" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${stat.color}10`, color: stat.color }}><Icon size={20} /></div>
                <div><div className="stat-value">{stat.value}</div><div className="stat-label">{stat.label}</div></div>
              </div>
            );
          })}
        </div>

        <div className="admin-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#999" }} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الهاتف..." style={{ paddingInlineStart: 36 }} />
          </div>
        </div>

        <div className="admin-card">
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>الهاتف</th>
                  <th>تاريخ التسجيل</th>
                  <th>الدفع</th>
                  <th>التفعيل</th>
                  <th>استبيانات</th>
                  <th>اختيارات</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>جاري التحميل...</td></tr>
                ) : filtered.length ? filtered.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 700 }}>{row.full_name || "بدون اسم"}</td>
                    <td dir="ltr" style={{ fontSize: "0.8rem" }}>{row.email || "-"}</td>
                    <td dir="ltr" style={{ fontSize: "0.8rem" }}>{row.phoneDisplay}</td>
                    <td style={{ fontSize: "0.75rem", color: "#777" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "-"}</td>
                    <td>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: row.hasPayment ? "#0ea5e9" : "#f59e0b" }}>
                        {row.hasPayment ? `${row.paymentsCount} دفعة (${row.latestPaymentStatus})` : "لم يدفع"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: row.activeUnlocks.length || row.packages_unlocked ? "#059669" : "#999" }}>
                        {row.activeUnlocks.length || row.packages_unlocked ? "مفعل" : "غير مفعل"}
                      </span>
                    </td>
                    <td>{row.questionnairesCount}</td>
                    <td>{row.selectionsCount}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا يوجد مستخدمون مطابقون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
