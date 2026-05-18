import { Play, FileText, ImageIcon } from "lucide-react";

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

  const guessType = type || (url.match(/\.(mp4|webm|mov)$/i) ? "video" : url.match(/\.pdf$/i) ? "pdf" : "image");

  if (guessType === "video") {
    return (
      <div className={`video-card ${className}`} style={{ height }}>
        <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
        <button className="play-btn" onClick={onPlay} type="button">
          <span><Play size={20} fill="currentColor" /></span>
        </button>
      </div>
    );
  }

  if (guessType === "pdf") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}
        style={{ height, background: "#0C363A", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#C18556", textDecoration: "none" }}
      >
        <FileText size={32} />
        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>PDF</span>
      </a>
    );
  }

  return (
    <img
      src={url}
      alt={alt || ""}
      className={className}
      style={{ width: "100%", height, objectFit: "contain", background: "#fcfbfa", border: "1px solid #e5e0d5", borderRadius: 8, display: "block" }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}
