import { Save, Loader2 } from "lucide-react";

type Props = {
  loading?: boolean;
  label?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export default function SaveButton({ loading, label = "حفظ", onClick, type = "submit", className = "" }: Props) {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        padding: "0.6rem 1.5rem", borderRadius: 8,
        background: "#0C363A", color: "#fff", fontWeight: 600,
        fontSize: "0.85rem", border: "none", cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all 0.2s ease",
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}
