import { Link, useLocation } from "react-router-dom";
import {
  Home, FileText, Briefcase, Image, Users, MessageSquare,
  Mail, Settings, LogOut, LayoutDashboard, Menu, X, BookOpen,
  Package, Unlock, Shield, UserRound,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { AdminPermission, hasAdminPermission } from "@/auth/adminPermissions";
import { useState } from "react";

const NAV_ITEMS: { group: string; groupEn: string; items: { path: string; icon: any; ar: string; en: string; exact?: boolean; permission: AdminPermission }[] }[] = [
  { group: "لوحة التحكم", groupEn: "Dashboard", items: [
    { path: "/admin", icon: LayoutDashboard, ar: "نظرة عامة", en: "Overview", exact: true, permission: "dashboard" },
  ]},
  { group: "إدارة الصفحات والمحتوى", groupEn: "Content", items: [
    { path: "/admin/pages/home", icon: Home, ar: "الرئيسية", en: "Home Page", permission: "content" },
    { path: "/admin/services", icon: Briefcase, ar: "خدماتنا", en: "Services", permission: "content" },
    { path: "/admin/projects", icon: Image, ar: "أعمالنا", en: "Projects", permission: "content" },
    { path: "/admin/team", icon: Users, ar: "فريق العمل", en: "Team", permission: "content" },
    { path: "/admin/clients", icon: MessageSquare, ar: "عملاء الموقع", en: "Site Clients", permission: "content" },
    { path: "/admin/packages", icon: Package, ar: "الباقات", en: "Packages", permission: "content" },
  ]},
  { group: "متابعة العملاء", groupEn: "Client Follow-up", items: [
    { path: "/admin/contact", icon: Mail, ar: "رسائل العملاء", en: "Client Messages", permission: "clients" },
    { path: "/admin/unlocks", icon: Unlock, ar: "تفعيل الباقات", en: "Package Unlocks", permission: "clients" },
    { path: "/admin/users", icon: UserRound, ar: "المستخدمين المسجلين", en: "Registered Users", permission: "clients" },
    { path: "/admin/selections", icon: FileText, ar: "اختيارات العملاء", en: "Client Selections", permission: "clients" },
    { path: "/admin/questionnaires", icon: FileText, ar: "استبيانات العملاء", en: "Customer Questionnaires", permission: "clients" },
  ]},
  { group: "الإدارة", groupEn: "Admin", items: [
    { path: "/admin/roles", icon: Shield, ar: "الصلاحيات", en: "Roles", permission: "roles" },
    { path: "/admin/settings", icon: Settings, ar: "الإعدادات", en: "Settings", permission: "settings" },
  ]},
];

export default function AdminSidebar() {
  const location = useLocation();
  const { roles, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleGroups = NAV_ITEMS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminPermission(roles, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sidebar = (
    <>
      <div className="logo-block">
        <div className="logo-icon">T</div>
        <div>
          <div className="logo-text">TACT CMS</div>
          <div className="logo-sub">Content Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleGroups.map((group) => (
          <div key={group.group}>
            <div className="nav-label">{group.group}</div>
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-item ${isActive(item.path, item.exact) ? "active" : ""}`}
              >
                <item.icon className="nav-icon" />
                <span>{item.ar}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/" target="_blank" className="nav-item" style={{ marginBottom: 4 }}>
          <Home className="nav-icon" />
          <span>معاينة الموقع</span>
        </Link>
        <button
          onClick={async () => { await signOut(); window.location.href = "/admin/login"; }}
          className="nav-item" style={{ width: "100%", color: "rgba(255,255,255,0.4)" }}
        >
          <LogOut className="nav-icon" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}
        style={{ position: "fixed", top: 12, insetInlineStart: 12, zIndex: 45 }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        {sidebar}
      </aside>

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 39 }}
          onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}
