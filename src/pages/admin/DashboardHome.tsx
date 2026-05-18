import { useEffect, useState } from "react";
import { Briefcase, Image, Users, MessageSquare, Mail, Upload, FileText, BarChart3 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export default function DashboardHome() {
  const [stats, setStats] = useState({ sections: 0, services: 0, projects: 0, team: 0, clients: 0, reviews: 0, media: 0, messages: 0 });

  useEffect(() => {
    Promise.all([
      db.from("cms_sections").select("id", { count: "exact", head: true }),
      db.from("cms_services").select("id", { count: "exact", head: true }),
      db.from("cms_projects").select("id", { count: "exact", head: true }),
      db.from("cms_team_members").select("id", { count: "exact", head: true }),
      db.from("cms_clients").select("id", { count: "exact", head: true }),
      db.from("cms_client_testimonials").select("id", { count: "exact", head: true }),
      db.from("media_assets").select("id", { count: "exact", head: true }),
      db.from("contact_messages").select("id", { count: "exact", head: true }),
    ]).then(([sec, srv, prj, tm, cl, rv, md, msg]) => {
      setStats({
        sections: sec.count || 0, services: srv.count || 0, projects: prj.count || 0,
        team: tm.count || 0, clients: cl.count || 0, reviews: rv.count || 0,
        media: md.count || 0, messages: msg.count || 0,
      });
    });
  }, []);

  const cards = [
    { icon: FileText, label: "أقسام الصفحات", value: stats.sections, color: "#0C363A" },
    { icon: Briefcase, label: "الخدمات", value: stats.services, color: "#0F6E66" },
    { icon: Image, label: "المشاريع", value: stats.projects, color: "#C18556" },
    { icon: Users, label: "فريق العمل", value: stats.team, color: "#0F6E66" },
    { icon: MessageSquare, label: "العملاء", value: stats.clients, color: "#C18556" },
    { icon: BarChart3, label: "آراء العملاء", value: stats.reviews, color: "#DDB57C" },
    { icon: Upload, label: "ملفات الميديا", value: stats.media, color: "#99A097" },
    { icon: Mail, label: "رسائل التواصل", value: stats.messages, color: "#D84728" },
  ];

  return (
    <>
      <AdminHeader title="لوحة التحكم" subtitle="TACT CMS" previewUrl="/" />
      <div className="admin-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {cards.map(c => (
            <div key={c.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${c.color}10`, color: c.color }}>
                <c.icon size={20} />
              </div>
              <div>
                <div className="stat-value">{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <div className="card-header">
            <h3>🎯 مرحباً في لوحة تحكم TACT CMS</h3>
          </div>
          <div className="card-body">
            <p style={{ color: "#666", lineHeight: 1.8, fontSize: "0.9rem" }}>
              من هنا يمكنك إدارة جميع محتويات الموقع: الصفحات، الأقسام، المشاريع، الخدمات، فريق العمل، العملاء، والميديا.
              <br />
              استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
