import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui-luxe/Reveal";
import stoneTexture from "@/assets/teqaan-stone-texture.png";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageProvider";

const ABOUT_SLIDES = [
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191850_.webp",
  "/real-content/Designs/Shop facade/Screenshot_14-5-2026_191721_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_185926_.webp",
  "/real-content/Designs/students cafe/Screenshot_14-5-2026_191955_.webp",
  "/real-content/Designs/Landscape/Screenshot_14-5-2026_19049_.webp",
];

export default function PhilosophySection() {
  const { lang } = useLang();
  const [currentVisual, setCurrentVisual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVisual((prev) => (prev + 1) % ABOUT_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden py-24 md:py-32 bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Luxury Background Elements */}
      <div className="absolute inset-0 bg-[#DDB57C]/5 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#C18556 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
      
      <div className="container-luxe relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Text Content */}
          <div className={cn(
            "flex flex-col order-2 lg:order-1",
            lang === "ar" ? "lg:pr-12" : "lg:pl-12"
          )}>
            <Reveal>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                  {lang === "ar" ? "من نحن" : "ABOUT US"}
                </span>
                <div className="w-16 h-px bg-[#C18556]/30" />
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h2 className="text-4xl md:text-6xl font-serif text-[#0C363A] leading-[1.1] mb-10">
                {lang === "ar" ? (
                  <>هندسة المعنى <br /> <span className="text-[#C18556]/80 italic">داخل كل مساحة</span></>
                ) : (
                  <>Engineering Meaning <br /> <span className="text-[#C18556]/80 italic">Inside Every Space</span></>
                )}
              </h2>
            </Reveal>

            <Reveal delay={300}>
              <div className="max-w-xl">
                <p className="text-base md:text-lg text-[#0C363A]/70 leading-[1.8] mb-12 space-y-6">
                  {lang === "ar" ? (
                    <>
                      نحن شركة متخصصة في التصميم والتنفيذ والتشطيبات المتكاملة، نعمل برؤية هندسية دقيقة ومعايير تنفيذ عالية. نمتلك خبرة تمتد لأكثر من 12 عامًا في إدارة وتنفيذ المشروعات السكنية والإدارية.
                      <br /><br />
                      نفذنا بنجاح أكثر من 60 مشروعًا، مع التزام كامل بالجودة، والدقة، واحترام تفاصيل كل مساحة. نقدّم تجربة متكاملة تبدأ من استلام الوحدة وحتى مرحلة التسليم النهائي.
                    </>
                  ) : (
                    <>
                      We are a firm specialized in integrated design, execution, and finishing, operating with precise architectural vision and high execution standards. We possess over 12 years of experience in managing and delivering projects.
                      <br /><br />
                      We have successfully completed over 60 projects, with full commitment to quality, precision, and respect for the details of every space. We offer a comprehensive experience from unit handover to final delivery.
                    </>
                  )}
                </p>
              </div>
            </Reveal>

            <Reveal delay={450}>
              <Link 
                to="/about"
                className="inline-flex items-center gap-4 bg-[#0C363A] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#C18556] hover:text-[#0C363A] group"
              >
                {lang === "ar" ? "المزيد عنا" : "LEARN MORE"}
                <ArrowRight size={16} className={cn("transition-transform", lang === "ar" ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2")} />
              </Link>
            </Reveal>
          </div>

          {/* Image Content */}
          <Reveal delay={400} className="relative order-1 lg:order-2">
            <div className="relative group">
              {/* Image Frame */}
              <div className="absolute -inset-4 border border-[#C18556]/20 pointer-events-none" />
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#C18556] -translate-x-2 -translate-y-2" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#C18556] translate-x-2 translate-y-2" />
              
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                {ABOUT_SLIDES.map((src, idx) => (
                  <div
                    key={src}
                    className={cn(
                      "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out",
                      idx === currentVisual ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    )}
                  >
                    <img 
                      src={src} 
                      alt="Tact Project" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                  </div>
                ))}
                
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A]/40 to-transparent pointer-events-none z-20" />
                
                {/* Logo Mark in Corner */}
                <div className="absolute bottom-8 right-8 z-30 opacity-60 w-12 h-12">
                   <img src="/logo.png" alt="Tact Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
              </div>

              {/* Slide Progress */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {ABOUT_SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 transition-all duration-500 rounded-full",
                      i === currentVisual ? "w-8 bg-[#C18556]" : "w-3 bg-[#0C363A]/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
