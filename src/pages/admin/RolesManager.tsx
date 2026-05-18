import { useEffect, useState } from "react";
import { Shield, UserPlus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import EditDrawer from "@/components/admin/EditDrawer";
import SaveButton from "@/components/admin/SaveButton";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const ROLE_LABELS: Record<string, { ar: string; color: string }> = {
  admin: { ar: "مدير عام", color: "#dc2626" },
  manager: { ar: "مدير", color: "#c9964c" },
  client_followup: { ar: "متابعة عملاء", color: "#0d9488" },
  technical_office: { ar: "المكتب الفني", color: "#6366f1" },
  customer: { ar: "عميل", color: "#78716c" },
};

const STAFF_ROLES = ["admin", "manager", "client_followup", "technical_office"];

export default function RolesManager() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("manager");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [pRes, rRes] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("user_roles").select("*"),
    ]);
    setProfiles(pRes.data || []);
    setRoles(rRes.data || []);
  }

  function getUserRoles(uid: string) {
    return roles.filter(r => r.user_id === uid).map(r => r.role as string);
  }

  function getStaffUsers() {
    const staffIds = new Set(roles.filter(r => STAFF_ROLES.includes(r.role)).map(r => r.user_id));
    return profiles.filter(p => staffIds.has(p.id));
  }

  const staffUsers = getStaffUsers();
  const filtered = search
    ? staffUsers.filter(p => (p.full_name || "").includes(search) || (p.email || "").includes(search) || (p.phone || "").includes(search))
    : staffUsers;

  async function assignRole() {
    setBusy(true);
    try {
      const profile = profiles.find(p => p.email === newEmail.trim());
      if (!profile) { toast.error("لم يتم العثور على مستخدم بهذا البريد"); setBusy(false); return; }
      const existing = roles.find(r => r.user_id === profile.id && r.role === newRole);
      if (existing) { toast.error("هذا المستخدم لديه هذا الدور بالفعل"); setBusy(false); return; }
      const { error } = await db.from("user_roles").insert({ user_id: profile.id, role: newRole });
      if (error) throw error;
      toast.success(`تم تعيين ${ROLE_LABELS[newRole]?.ar} لـ ${profile.full_name || profile.email}`);
      setAdding(false);
      setNewEmail("");
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function removeRole() {
    if (!deleteTarget) return;
    const { error } = await db.from("user_roles").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("تم إزالة الدور"); await load(); }
    setDeleteTarget(null);
  }

  return (
    <>
      <AdminHeader title="الصلاحيات" subtitle="إدارة أدوار فريق العمل"
        actions={
          <button onClick={() => setAdding(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 8, background: "#073b35", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            <UserPlus size={16} /> إضافة دور
          </button>
        }
      />

      <div className="admin-content">
        {/* Search */}
        <div style={{ marginBottom: "1.25rem", maxWidth: 400, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", top: 10, insetInlineStart: 12, color: "#999" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." style={{ paddingInlineStart: 36 }} />
        </div>

        {/* Staff Table */}
        <div className="admin-card">
          <div className="card-header"><h3><Shield size={16} style={{ verticalAlign: -2, marginInlineEnd: 6 }} />فريق العمل ({filtered.length})</h3></div>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>المستخدم</th><th>البريد</th><th>الهاتف</th><th>الأدوار</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map(p => {
                  const uRoles = getUserRoles(p.id);
                  const staffRoles = uRoles.filter(r => STAFF_ROLES.includes(r));
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.full_name || "—"}</td>
                      <td dir="ltr" style={{ fontSize: "0.8rem" }}>{p.email || "—"}</td>
                      <td dir="ltr" style={{ fontSize: "0.8rem" }}>{p.phone || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {staffRoles.map(r => (
                            <span key={r} style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: `${ROLE_LABELS[r]?.color}15`, color: ROLE_LABELS[r]?.color, border: `1px solid ${ROLE_LABELS[r]?.color}30` }}>
                              {ROLE_LABELS[r]?.ar}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {staffRoles.filter(r => r !== "admin").map(r => {
                            const roleRow = roles.find(rr => rr.user_id === p.id && rr.role === r);
                            return roleRow ? (
                              <button key={r} onClick={() => setDeleteTarget(roleRow)} title={`إزالة ${ROLE_LABELS[r]?.ar}`}
                                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", cursor: "pointer", color: "#dc2626", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                                <Trash2 size={11} /> {ROLE_LABELS[r]?.ar}
                              </button>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>لا يوجد أعضاء فريق</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <EditDrawer open={adding} title="تعيين دور جديد" onClose={() => setAdding(false)}
        footer={<SaveButton loading={busy} label="تعيين الدور" onClick={assignRole} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label>البريد الإلكتروني للمستخدم</label>
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" dir="ltr" />
          </div>
          <div className="form-group">
            <label>الدور</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #e5e0d5", fontSize: "0.85rem" }}>
              <option value="manager">مدير</option>
              <option value="client_followup">متابعة عملاء</option>
              <option value="technical_office">مدير المكتب الفني</option>
              <option value="admin">مدير عام (Admin)</option>
            </select>
          </div>
          <div style={{ padding: "0.75rem", borderRadius: 8, background: "#faf8f4", border: "1px solid #eae5dc", fontSize: "0.78rem", color: "#666" }}>
            <strong style={{ color: "#073b35" }}>ملاحظة:</strong> يجب أن يكون المستخدم مسجل مسبقاً في الموقع
          </div>
        </div>
      </EditDrawer>

      <ConfirmDialog open={!!deleteTarget} onConfirm={removeRole} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}
