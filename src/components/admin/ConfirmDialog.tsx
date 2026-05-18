import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title = "تأكيد الحذف", message = "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.", confirmLabel = "حذف", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <AlertTriangle size={40} style={{ color: "#D84728", margin: "0 auto 1rem" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0C363A", marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ fontSize: "0.85rem", color: "#666", lineHeight: 1.6, marginBottom: "1.5rem" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
          <button onClick={onCancel} style={{ padding: "0.5rem 1.5rem", borderRadius: 8, border: "1px solid #e5e0d5", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            إلغاء
          </button>
          <button onClick={onConfirm} style={{ padding: "0.5rem 1.5rem", borderRadius: 8, border: "none", background: "#D84728", color: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
