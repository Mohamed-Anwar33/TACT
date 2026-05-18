import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { canAccessAdminPath } from "@/auth/adminPermissions";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "@/styles/admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isStaff, roles, loading } = useAuth();
  const canAccessPath = canAccessAdminPath(roles, location.pathname);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) navigate("/admin/login");
  }, [loading, user, isStaff, navigate]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f3ed" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, border: "2px solid #C18556", display: "grid", placeItems: "center", color: "#C18556", fontWeight: 700, fontSize: "1.2rem", margin: "0 auto 1rem" }}>T</div>
        <div style={{ color: "#0C363A", fontWeight: 600 }}>جاري التحميل...</div>
      </div>
    </div>
  );

  if (!user || !isStaff) return null;

  return (
    <div className="admin-layout" dir="rtl">
      <AdminSidebar />
      <main className="admin-main">
        {canAccessPath ? (
          <Outlet />
        ) : (
          <div className="admin-content">
            <div className="admin-card" style={{ padding: "2rem", textAlign: "center" }}>
              <h2 style={{ color: "#0C363A", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>غير مسموح</h2>
              <p style={{ color: "#786f63", margin: 0 }}>هذا الحساب لا يملك صلاحية فتح هذه الصفحة.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
