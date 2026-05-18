import { Link } from "react-router-dom";
import { Eye, Bell } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  previewUrl?: string;
  actions?: React.ReactNode;
};

export default function AdminHeader({ title, subtitle, previewUrl, actions }: Props) {
  return (
    <header className="admin-header">
      <div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
        <h1 className="page-title">{title}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {actions}
        {previewUrl && (
          <Link
            to={previewUrl}
            target="_blank"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.8rem",
              fontWeight: 600, border: "1px solid #e5e0d5", color: "#0C363A",
              background: "#fff", textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C18556"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e0d5"; }}
          >
            <Eye size={16} />
            معاينة
          </Link>
        )}
      </div>
    </header>
  );
}
