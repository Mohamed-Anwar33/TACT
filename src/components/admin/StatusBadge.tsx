import { Eye, EyeOff } from "lucide-react";

export default function StatusBadge({ visible }: { visible: boolean }) {
  return (
    <span className={`badge-visible ${visible ? "show" : "hide"}`}>
      {visible ? <><Eye size={12} /> ظاهر</> : <><EyeOff size={12} /> مخفي</>}
    </span>
  );
}
