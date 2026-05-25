import { Play, FileText, ImageIcon } from "lucide-react";
import { resolveMediaUrl } from "@/lib/realContent";

type Props = {
  url?: string;
  type?: "image" | "video" | "pdf" | "file";
  alt?: string;
  height?: number;
  className?: string;
  onPlay?: () => void;
};

export default function MediaPreview({ url, type, alt, height = 160, className = "", onPlay }: Props) {
  if (!url) return (
    <div style={{ height, background: "#f0ece4", borderRadius: 8, display: "grid", placeItems: "center", color: "#aaa" }}>
      <ImageIcon size={32} />
    </div>
  );

  const src = resolveMediaUrl(url) || url;
  const guessType = type || (src.match(/\.(mp4|webm|mov)$/i) ? "video" : src.match(/\.pdf$/i) ? "pdf" : "image");

  if (guessType === "video") {
    return (
      <div style={{
        position: "relative",
        width: "100%",
        height,
        background: "#0C363A",
        overflow: "hidden",
        flexShrink: 0
      }} className={className}>
        <video src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted preload="metadata" />
        <button
          className="play-btn"
          onClick={onPlay}
          type="button"
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "transparent", border: "none", cursor: "pointer" }}
        >
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(193,133,86,0.85)", display: "grid", placeItems: "center", color: "#0C363A" }}>
            <Play size={16} fill="currentColor" />
          </span>
        </button>
      </div>
    );
  }

  if (guessType === "pdf") {
    return (
      <a href={src} target="_blank" rel="noreferrer" className={className}
        style={{ height, background: "#0C363A", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#C18556", textDecoration: "none" }}
      >
        <FileText size={32} />
        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>PDF</span>
      </a>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      style={{ width: "100%", height, objectFit: "cover", background: "#f0ece4", display: "block" }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}
