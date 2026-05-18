import { Play } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import stoneTexture from "@/assets/teqaan-stone-texture.png";
import videoPreview from "@/assets/teqaan-video-preview.png";

export default function VideoShowcase() {
  return (
    <section className="video-section relative w-full py-24 md:py-36 overflow-hidden" dir="rtl">
      {/* 
        SECTION BACKGROUND LAYERS 
        - Base: Dark Emerald (#0C363A)
        - Gradient: #0C363A to #0C363A
        - Texture: Dark stone / subtle marble
        - Decorative: Vertical framing lines
      */}
      <div className="absolute inset-0 bg-[#0C363A] bg-gradient-to-b from-[#0C363A] to-[#0C363A] pointer-events-none" />
      
      {/* Texture Layer */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: `url(${stoneTexture})`, backgroundSize: '500px' }} 
      />
      
      {/* Framing Lines Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.1] hidden md:flex justify-between px-20">
        <div className="w-px h-full bg-gold" />
        <div className="w-px h-full bg-gold" />
      </div>

      <div className="container-luxe relative z-10">
        <div className="text-center mb-16">
          <Reveal>
            <div className="flex flex-col items-center gap-3">
              <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-medium">فيديو شهادات العملاء</span>
              <h2 className="text-3xl md:text-5xl font-serif-ar text-ivory mt-4">شاهد ماذا يقول عملاؤنا</h2>
              <p className="text-[#99A097] text-sm md:text-base mt-3 max-w-xl mx-auto tracking-wide">
                فيديو موجز يعكس تجربة العمل معنا من الفكرة حتى التسليم
              </p>
            </div>
          </Reveal>
        </div>

        {/* Video Panel */}
        <Reveal delay={200}>
          <div className="relative group max-w-5xl mx-auto cursor-pointer">
            {/* Main Panel */}
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gold/30 shadow-2xl transition-all duration-700 group-hover:border-gold/60">
              {/* Real Video Frame Preview */}
              <img 
                src="/real-content/Finishing videos/Luxury modern-thumb.webp" 
                alt="Luxury Architectural Video Preview" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              
              {/* Dark Cinematic Overlay */}
              <div className="absolute inset-0 bg-teal-deep/40 group-hover:bg-teal-deep/20 transition-colors duration-500" />
              
              {/* Play Button Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Circle Button */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-gold/40 flex items-center justify-center bg-teal-deep/30 backdrop-blur-sm transition-all duration-500 group-hover:bg-gold group-hover:text-teal-deep group-hover:scale-110">
                    <Play size={40} fill="currentColor" className="ml-1.5" />
                  </div>
                </div>
              </div>
              
              {/* Corner Accents */}
              <div className="absolute top-6 left-6 md:top-10 md:left-10 w-12 h-12 border-t border-l border-gold/40 transition-all duration-500 group-hover:w-16 group-hover:h-16" />
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 border-b border-r border-gold/40 transition-all duration-500 group-hover:w-16 group-hover:h-16" />
            </div>
            
            {/* Floating Caption */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-teal-deep/80 backdrop-blur-md border border-gold/20 px-6 py-2 rounded-full hidden md:block">
              <span className="text-gold text-[10px] uppercase tracking-[0.3em] font-medium">تجربة تُقان المعمارية</span>
            </div>
          </div>
        </Reveal>
      </div>
      
      {/* Subtle Bottom vignette shadow */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </section>
  );
}
