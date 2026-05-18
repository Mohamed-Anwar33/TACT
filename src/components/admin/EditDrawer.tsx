import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
};

export default function EditDrawer({ open, title, onClose, footer, children, width }: Props) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal-container">
        <div className="modal-box" style={width ? { maxWidth: width } : undefined}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-accent" />
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="modal-close" type="button">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="modal-footer">
              <button onClick={onClose} className="modal-cancel-btn" type="button">إلغاء</button>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
