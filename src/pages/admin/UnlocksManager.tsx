import { useEffect, useState } from "react";
import { Unlock, Lock, CheckCircle2, Clock, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import EditDrawer from "@/components/admin/EditDrawer";
import SaveButton from "@/components/admin/SaveButton";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const PKG_LABELS: Record<string, string> = { economy: "باقة أساسية", medium: "باقة متوسطة", luxury: "باقة فاخرة" };

export default function UnlocksManager() {
  const [packages, setPackages] = useState<any[]>([]);
  const [unlocks, setUnlocks] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "active" | "all">("pending");
  const [activating, setActivating] = useState<any>(null);
  const [selectedPkg, setSelectedPkg] = useState("");
  const [busy, setBusy] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [detailPayment, setDetailPayment] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [pkgR, unlR, payR, profR] = await Promise.all([
      db.from("packages").select("*").order("sort_order"),
      db.from("package_unlocks").select("*").order("unlocked_at", { ascending: false }),
      db.from("payment_submissions").select("*").order("created_at", { ascending: false }),
      db.from("profiles").select("*"),
    ]);
    setPackages(pkgR.data || []);
    setUnlocks(unlR.data || []);
    setPayments(payR.data || []);
    setProfiles(profR.data || []);
  }

  const getProfile = (uid: string) => profiles.find(p => p.id === uid);
  const getPkgName = (id: string) => packages.find(p => p.id === id)?.name_ar || PKG_LABELS[id] || id;
  const pendingPayments = payments.filter(p => p.status === "pending");
  const activeUnlocks = unlocks.filter(u => u.status === "active");
  const getUserUnlocks = (uid: string) => activeUnlocks.filter(u => u.user_id === uid);

  // Find all profiles with no active unlocks and no pending payment proof
  const getProfilesWithNoUnlocks = () => {
    return profiles.filter(p => {
      const userUnlocks = getUserUnlocks(p.id);
      return userUnlocks.length === 0;
    });
  };

  const profilesPending = getProfilesWithNoUnlocks().filter(p => {
    return !pendingPayments.some(pay => pay.user_id === p.id);
  });

  const pendingRegistrations = profilesPending.map(p => ({
    id: `reg-${p.id}`,
    user_id: p.id,
    name: p.full_name || "—",
    phone: p.phone || "—",
    amount: "تسجيل جديد",
    method: "—",
    reference: "—",
    package_id: null,
    created_at: p.created_at || new Date().toISOString(),
    isNewRegistration: true,
  }));

  const combinedPending = [
    ...pendingPayments,
    ...pendingRegistrations,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredPayments = search
    ? combinedPending.filter(p => {
        const pr = getProfile(p.user_id);
        const nameToSearch = pr?.full_name || p.name || "";
        const phoneToSearch = p.phone || pr?.phone || "";
        return nameToSearch.toLowerCase().includes(search.toLowerCase()) || phoneToSearch.includes(search);
      })
    : combinedPending;

  const filteredUnlocks = search
    ? activeUnlocks.filter(u => { const pr = getProfile(u.user_id); return (pr?.full_name || "").toLowerCase().includes(search.toLowerCase()) || (pr?.email || "").toLowerCase().includes(search.toLowerCase()); })
    : activeUnlocks;

  const filteredProfiles = search
    ? profiles.filter(p =>
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || "").includes(search)
    )
    : profiles;

  async function syncLegacyAccessFlag(userId: string, value: boolean) {
    const { error } = await db.from("profiles").update({ packages_unlocked: value }).eq("id", userId);
    if (error) console.warn("Could not sync legacy package flag", error);
  }

  async function approvePayment(payment: any) {
    if (payment.isNewRegistration) {
      await manualUnlock();
      return;
    }
    setBusy(true);
    try {
      const pkgId = payment.package_id || selectedPkg;
      if (!pkgId) { toast.error("اختر الباقة أولاً"); setBusy(false); return; }
      
      if (pkgId === "all") {
        // Unlock all packages
        const unlockPromises = packages.map(pkg => 
          db.from("package_unlocks").upsert({
            user_id: payment.user_id, package_id: pkg.id, payment_id: payment.id, status: "active",
          }, { onConflict: "user_id,package_id" })
        );
        const results = await Promise.all(unlockPromises);
        const error = results.find(r => r.error)?.error;
        if (error) throw error;
      } else {
        // Create unlock
        const { error: unlockErr } = await db.from("package_unlocks").upsert({
          user_id: payment.user_id, package_id: pkgId, payment_id: payment.id, status: "active",
        }, { onConflict: "user_id,package_id" });
        if (unlockErr) throw unlockErr;
      }

      // Update payment status
      await db.from("payment_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", payment.id);
      await syncLegacyAccessFlag(payment.user_id, true);
      toast.success("تم تفعيل الباقات بنجاح");
      setActivating(null);
      setSelectedPkg("");
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function manualUnlock() {
    if (!activating) return;
    const userId = activating.isNewRegistration ? activating.user_id : activating.id;
    const pkgId = selectedPkg;
    if (!pkgId) { toast.error("اختر باقة"); return; }
    setBusy(true);
    try {
      if (pkgId === "all") {
        // Unlock all packages
        const unlockPromises = packages.map(pkg => 
          db.from("package_unlocks").upsert({
            user_id: userId, package_id: pkg.id, status: "active",
          }, { onConflict: "user_id,package_id" })
        );
        const results = await Promise.all(unlockPromises);
        const error = results.find(r => r.error)?.error;
        if (error) throw error;
      } else {
        const { error } = await db.from("package_unlocks").upsert({
          user_id: userId, package_id: pkgId, status: "active",
        }, { onConflict: "user_id,package_id" });
        if (error) throw error;
      }
      await syncLegacyAccessFlag(userId, true);
      toast.success("تم التفعيل");
      setActivating(null);
      setSelectedPkg("");
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function revokeUnlock() {
    if (!revokeTarget) return;
    await db.from("package_unlocks").delete().eq("id", revokeTarget.id);
    const remaining = unlocks.filter(u => u.user_id === revokeTarget.user_id && u.id !== revokeTarget.id && u.status === "active");
    if (remaining.length === 0) await syncLegacyAccessFlag(revokeTarget.user_id, false);
    toast.success("تم إلغاء التفعيل");
    setRevokeTarget(null);
    await load();
  }

  return (
    <>
      <AdminHeader title="تفعيل الباقات" subtitle="إدارة اشتراكات وتفعيلات المستخدمين" />

      <div className="admin-content">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "طلبات معلقة", value: combinedPending.length, color: "#f59e0b", icon: Clock },
            { label: "باقات مفعلة", value: activeUnlocks.length, color: "#059669", icon: CheckCircle2 },
            { label: "إجمالي المستخدمين", value: profiles.length, color: "#6366f1", icon: Unlock },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}10`, color: s.color }}><s.icon size={20} /></div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Search + Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1", minWidth: 200, maxWidth: 350 }}>
            <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#999" }} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ paddingInlineStart: 36 }} />
          </div>
          <div className="admin-tabs" style={{ marginBottom: 0, border: "none" }}>
            <button className={`admin-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>معلقة ({combinedPending.length})</button>
            <button className={`admin-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>مفعلة ({activeUnlocks.length})</button>
            <button className={`admin-tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>المستخدمين ({profiles.length})</button>
          </div>
        </div>

        {/* Pending Payments */}
        {tab === "pending" && (
          <div className="admin-card">
            <div className="card-header"><h3><Clock size={16} style={{ verticalAlign: -2, marginInlineEnd: 6, color: "#f59e0b" }} />طلبات الدفع المعلقة</h3></div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead><tr><th>العميل</th><th>الهاتف</th><th>المبلغ</th><th>الطريقة</th><th>المرجع</th><th>الباقة</th><th>التاريخ</th><th>إجراء</th></tr></thead>
                <tbody>
                  {filteredPayments.map(p => {
                    const pr = getProfile(p.user_id);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{pr?.full_name || p.name || "—"}</td>
                        <td dir="ltr" style={{ fontSize: "0.8rem" }}>{p.phone || "—"}</td>
                        <td style={{ fontWeight: 600, color: "#073b35" }}>{p.amount || "—"}</td>
                        <td>{p.method || "—"}</td>
                        <td dir="ltr" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{p.reference || "—"}</td>
                        <td>{p.package_id ? getPkgName(p.package_id) : <span style={{ color: "#999" }}>غير محدد</span>}</td>
                        <td style={{ fontSize: "0.75rem", color: "#888" }}>{new Date(p.created_at).toLocaleDateString("ar-EG")}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { setActivating(p); setSelectedPkg(p.package_id || ""); }}
                              style={{ padding: "5px 12px", borderRadius: 6, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={12} /> تفعيل
                            </button>
                            {p.proof_url && (
                              <button onClick={() => setDetailPayment(p)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer" }}>
                                <Eye size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا توجد طلبات معلقة</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active Unlocks */}
        {tab === "active" && (
          <div className="admin-card">
            <div className="card-header"><h3><Unlock size={16} style={{ verticalAlign: -2, marginInlineEnd: 6, color: "#059669" }} />الباقات المفعلة</h3></div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead><tr><th>العميل</th><th>البريد</th><th>الباقة</th><th>تاريخ التفعيل</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {filteredUnlocks.map(u => {
                    const pr = getProfile(u.user_id);
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{pr?.full_name || "—"}</td>
                        <td dir="ltr" style={{ fontSize: "0.8rem" }}>{pr?.email || "—"}</td>
                        <td><span style={{ padding: "3px 10px", borderRadius: 20, background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 600 }}>{getPkgName(u.package_id)}</span></td>
                        <td style={{ fontSize: "0.75rem", color: "#888" }}>{new Date(u.unlocked_at).toLocaleDateString("ar-EG")}</td>
                        <td><span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#059669" }}>مفعلة</span></td>
                        <td>
                          <button onClick={() => setRevokeTarget(u)}
                            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", cursor: "pointer", color: "#dc2626", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3 }}>
                            <Lock size={11} /> إلغاء
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUnlocks.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا توجد باقات مفعلة</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Users */}
        {tab === "all" && (
          <div className="admin-card">
            <div className="card-header"><h3><Unlock size={16} style={{ verticalAlign: -2, marginInlineEnd: 6, color: "#6366f1" }} />كل المستخدمين</h3></div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead><tr><th>العميل</th><th>البريد</th><th>الهاتف</th><th>الباقات</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {filteredProfiles.map(p => {
                    const userUnlocks = getUserUnlocks(p.id);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.full_name || "—"}</td>
                        <td dir="ltr" style={{ fontSize: "0.8rem" }}>{p.email || "—"}</td>
                        <td dir="ltr" style={{ fontSize: "0.8rem" }}>{p.phone || "—"}</td>
                        <td>
                          {userUnlocks.length > 0 ? (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {userUnlocks.map(u => (
                                <span key={u.id} style={{ padding: "3px 10px", borderRadius: 20, background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 600 }}>{getPkgName(u.package_id)}</span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#999", fontSize: "0.8rem" }}>غير مفعل</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: userUnlocks.length > 0 ? "#059669" : "#f59e0b" }}>
                            {userUnlocks.length > 0 ? "مفعل" : "ينتظر التفعيل"}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => { setActivating(p); setSelectedPkg(""); }}
                            style={{ padding: "5px 12px", borderRadius: 6, background: userUnlocks.length > 0 ? "#fff" : "#059669", color: userUnlocks.length > 0 ? "#073b35" : "#fff", border: userUnlocks.length > 0 ? "1px solid #e5e0d5" : "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <Unlock size={12} /> {userUnlocks.length > 0 ? "إضافة باقة" : "تفعيل باقة"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProfiles.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا يوجد مستخدمون مطابقون</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Activate Modal */}
      <EditDrawer open={!!activating} title="تفعيل باقة" onClose={() => { setActivating(null); setSelectedPkg(""); }}
        footer={<SaveButton loading={busy} label="تأكيد التفعيل" onClick={() => activating?.user_id ? approvePayment(activating) : manualUnlock()} />}>
        {activating && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ padding: "1rem", borderRadius: 10, background: "#faf8f4", border: "1px solid #eae5dc" }}>
              <div style={{ fontSize: "0.7rem", color: "#999", textTransform: "uppercase", marginBottom: 4 }}>العميل</div>
              <div style={{ fontWeight: 600, color: "#073b35" }}>{getProfile(activating.user_id || activating.id)?.full_name || activating.name || "—"}</div>
              {activating.amount && <div style={{ fontSize: "0.82rem", color: "#c9964c", marginTop: 4 }}>المبلغ: {activating.amount}</div>}
            </div>
            <div className="form-group">
              <label>اختر الباقة</label>
              <select value={selectedPkg} onChange={e => setSelectedPkg(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.85rem" }}>
                <option value="">— اختر باقة —</option>
                {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name_ar} ({pkg.price_label})</option>)}
                <option value="all">كل الباقات (تفعيل الكل)</option>
              </select>
            </div>
          </div>
        )}
      </EditDrawer>

      {/* Payment proof */}
      {detailPayment?.proof_url && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => setDetailPayment(null)}>
          <img src={detailPayment.proof_url} alt="إيصال الدفع" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <ConfirmDialog open={!!revokeTarget} onConfirm={revokeUnlock} onCancel={() => setRevokeTarget(null)} />
    </>
  );
}
