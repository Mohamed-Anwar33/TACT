import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type HoverPreviewProps = {
  imageUrl: string | null;
  label?: string | null;
  lang: "ar" | "en";
};

export default function HoverPreview({ imageUrl, label, lang }: HoverPreviewProps) {
  const [isMouseDevice, setIsMouseDevice] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  // Guard: only active on fine-pointer (mouse) devices to prevent touch screens from sticking
  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsMouseDevice(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setIsMouseDevice(e.matches);
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Manage internal visibility and URL state with a small delay for smooth entry/exit
  useEffect(() => {
    if (imageUrl) {
      setActiveUrl(imageUrl);
      // Subtle delay to trigger CSS transition
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setActiveUrl(null), 250); // wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [imageUrl]);

  if (!isMouseDevice || !activeUrl) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none transition-all duration-300 ease-out select-none",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      {/* Blurred Backdrop overlay */}
      <div className="absolute inset-0 bg-[#061d20]/50 backdrop-blur-[2px] transition-opacity duration-300" />

      {/* Floating Center Card */}
      <div className="relative w-[860px] h-[580px] max-w-[90vw] max-h-[82vh] bg-[#0A2629] border-2 border-gold/50 rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.65)] flex flex-col transform transition-transform duration-300 ease-out">
        {/* Main Image */}
        <div className="flex-1 w-full h-full relative bg-black/40">
          <img
            src={activeUrl}
            alt={label || ""}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Label Footer */}
        {label && (
          <div 
            className="bg-[#0C363A]/95 border-t border-gold/20 px-5 py-4 text-center"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <span className="text-[11px] text-gold uppercase tracking-widest font-mono block mb-1">
              {lang === "ar" ? "معاينة سريعة" : "QUICK VIEW PREVIEW"}
            </span>
            <h4 className="text-white text-sm md:text-base font-serif-ar font-bold truncate">
              {label}
            </h4>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
