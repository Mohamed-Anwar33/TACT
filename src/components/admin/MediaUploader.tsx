import { Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

type Props = {
  folder: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  onUploaded: (url: string, file: File) => void;
};

type UploadItem = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
  error?: string;
  progress: number;
};

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.substring(0, file.name.lastIndexOf(".")) + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.75
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function MediaUploader({
  folder,
  label = "رفع ملف",
  accept = "image/*,video/*,.pdf",
  multiple = false,
  onUploaded,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const isUploading = items.some(i => i.status === "uploading" || i.status === "pending");

  const updateItem = (idx: number, patch: Partial<UploadItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  async function uploadSingle(rawFile: File, idx: number) {
    updateItem(idx, { status: "uploading", progress: 5 });
    try {
      let file = rawFile;
      if (rawFile.type.startsWith("image/")) {
        updateItem(idx, { progress: 15 });
        file = await compressImage(rawFile);
      }
      const safe = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
      const path = `cms/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safe}`;

      updateItem(idx, { progress: 30 });

      const { error: uploadErr } = await supabase.storage
        .from("tact-media")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) throw uploadErr;

      updateItem(idx, { progress: 70 });

      const { data } = supabase.storage.from("tact-media").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const mediaType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.includes("pdf")
        ? "pdf"
        : "file";

      // Register in media_assets (ignore errors - not critical)
      try {
        await db.from("media_assets").upsert(
          {
            bucket: "tact-media",
            path,
            public_url: publicUrl,
            media_type: mediaType,
            title: file.name,
            alt: file.name,
            size_bytes: file.size,
            source_folder: folder,
            tags: [folder],
          },
          { onConflict: "path" }
        );
      } catch (_) {
        // media_assets registration is optional
      }

      updateItem(idx, { status: "done", progress: 100, url: publicUrl });
      onUploaded(publicUrl, file);
    } catch (err: any) {
      const msg = err?.message || err?.error || "فشل الرفع";
      updateItem(idx, { status: "error", error: msg, progress: 0 });
      toast.error(`فشل رفع ${rawFile.name}: ${msg}`);
    }
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    const startIdx = items.length;
    const newItems: UploadItem[] = fileArr.map(f => ({
      file: f,
      status: "pending" as const,
      progress: 0,
    }));

    setItems(prev => [...prev, ...newItems]);

    // Upload sequentially to avoid overloading
    for (let i = 0; i < fileArr.length; i++) {
      await uploadSingle(fileArr[i], startIdx + i);
    }

    // Clear completed items after a short delay
    setTimeout(() => {
      setItems(prev => prev.filter(it => it.status !== "done"));
    }, 2000);
  }, [items.length, folder]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const activeItems = items.filter(it => it.status !== "done" || Date.now() < 999999999999);

  return (
    <div>
      {/* Upload zone */}
      <label
        className={`upload-zone ${dragOver ? "dragging" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ cursor: isUploading ? "wait" : "pointer" }}
      >
        {isUploading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "#C18556" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0C363A" }}>
              جاري الرفع... ({items.filter(i => i.status === "done").length}/{items.length})
            </span>
          </div>
        ) : (
          <>
            <Upload size={24} style={{ color: "#C18556" }} />
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C363A" }}>{label}</div>
            <div style={{ fontSize: "0.75rem", color: "#8a8578" }}>
              {multiple ? "اسحب الملفات هنا أو اضغط لاختيار عدة ملفات" : "اسحب الملف هنا أو اضغط للاختيار"}
            </div>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={handleInputChange}
          disabled={isUploading}
        />
      </label>

      {/* Upload items list */}
      {items.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: item.status === "error" ? "#FBEDE9" : item.status === "done" ? "#ECF6F4" : "#faf8f4",
                border: `1px solid ${item.status === "error" ? "#F1C5BA" : item.status === "done" ? "#B9D4D0" : "#eae5dc"}`,
                fontSize: "0.78rem",
              }}
            >
              {/* Status icon */}
              {item.status === "uploading" || item.status === "pending" ? (
                <Loader2 size={16} className="animate-spin" style={{ color: "#C18556", flexShrink: 0 }} />
              ) : item.status === "done" ? (
                <CheckCircle2 size={16} style={{ color: "#0F6E66", flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} style={{ color: "#D84728", flexShrink: 0 }} />
              )}

              {/* File name */}
              <span style={{
                flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: item.status === "error" ? "#D84728" : "#333",
              }}>
                {item.file.name}
              </span>

              {/* Size */}
              <span style={{ fontSize: "0.65rem", color: "#999", flexShrink: 0 }}>
                {(item.file.size / 1024 / 1024).toFixed(1)} MB
              </span>

              {/* Progress bar */}
              {(item.status === "uploading" || item.status === "pending") && (
                <div style={{
                  width: 60, height: 4, borderRadius: 2,
                  background: "#e5e0d5", overflow: "hidden", flexShrink: 0,
                }}>
                  <div style={{
                    width: `${item.progress}%`, height: "100%",
                    background: "linear-gradient(90deg, #C18556, #0C363A)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              )}

              {/* Error message */}
              {item.status === "error" && item.error && (
                <span style={{ fontSize: "0.65rem", color: "#D84728", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.error}
                </span>
              )}

              {/* Remove button for errors */}
              {item.status === "error" && (
                <button
                  onClick={() => removeItem(idx)}
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "none", background: "rgba(216, 71, 40,0.1)",
                    color: "#D84728", cursor: "pointer",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
