import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import Reveal from "@/components/ui-luxe/Reveal";
import { CmsService, fallbackServices, getCmsServices, CmsSection } from "@/lib/publicCms";
import { 
  Layout, 
  Building2, 
  Paintbrush, 
  Home, 
  Briefcase, 
  Armchair, 
  HardHat, 
  Key,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  "01": Layout,
  "02": Building2,
  "03": Paintbrush,
  "04": Home,
  "05": Briefcase,
  "06": Armchair,
  "07": HardHat,
  "08": Key,
};

interface ServicesGridProps {
  section?: CmsSection;
}

export default function ServicesGrid({ section }: ServicesGridProps) {
  const { lang } = useLang();
  const [services, setServices] = useState<CmsService[]>(() => fallbackServices(lang));

  useEffect(() => {
    let alive = true;
    setServices(fallbackServices(lang));
    getCmsServices(lang).then((rows) => {
      if (!alive) return;
      const selectedIds: string[] = section?.metadata?.selectedIds || [];
      if (selectedIds.length > 0) {
        const pinned = selectedIds
          .map(id => rows.find(r => String(r.id) === String(id)))
          .filter(Boolean) as CmsService[];
        setServices(pinned);
      } else {
        setServices(rows);
      }
    });
    return () => {
      alive = false;
    };
  }, [lang, section]);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Luxury Background Elements */}
      <div className="absolute inset-0 bg-[#DDB57C]/5 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#C18556 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      {/* Decorative Dots Grid */}
      <div className={cn(
        "absolute top-20 opacity-10 pointer-events-none hidden lg:block",
        lang === "ar" ? "right-10" : "left-10"
      )}>
        <div className="grid grid-cols-6 gap-3">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#C18556]" />
          ))}
        </div>
      </div>

      <div className="container-luxe relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#C18556]/30" />
              <span className="text-[#C18556] text-[11px] uppercase tracking-[0.4em] font-bold">
                {lang === "ar" ? "خدماتنا" : "OUR SERVICES"}
              </span>
              <div className="w-12 h-px bg-[#C18556]/30" />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h2 className="text-4xl md:text-5xl font-serif text-[#0C363A] leading-[1.2] mb-8">
              {section ? (
                lang === "ar" ? section.titleAr || section.titleEn : section.titleEn || section.titleAr
              ) : (
                lang === "ar" ? (
                  <>تجربة متكاملة بتفاصيل <span className="text-[#C18556] italic">تليق بالنظر</span></>
                ) : (
                  <>Integrated Experience with <span className="text-[#C18556] italic">Refined Details</span></>
                )
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-base md:text-lg text-[#0C363A]/60 leading-relaxed mx-auto max-w-2xl">
              {section ? (
                lang === "ar" ? section.bodyAr || section.bodyEn : section.bodyEn || section.bodyAr
              ) : (
                lang === "ar" 
                  ? "نحوّل الفكرة إلى مساحة متكاملة، من التخطيط الأولي حتى أدق تفاصيل التنفيذ، بمعايير هندسية عالمية ورؤية فنية راقية."
                  : "Transforming ideas into integrated spaces, from initial planning to the finest execution details, with international standards and refined vision."
              )}
            </p>
          </Reveal>
        </div>
        
        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.slice(0, 4).map((s, i) => {
            const Icon = ICON_MAP[s.num] || Layout;
            return (
              <Reveal key={s.id || s.num} delay={i * 100}>
                <div className="group relative bg-white/80 backdrop-blur-sm border border-[#C18556]/15 rounded-lg p-8 h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:border-[#C18556]/40 hover:shadow-2xl hover:shadow-[#0C363A]/5">
                  


                  {/* Icon Frame */}
                  <div className="w-14 h-14 rounded-md border border-[#C18556]/20 bg-[#C18556]/5 flex items-center justify-center mb-8 transition-all duration-500 group-hover:bg-[#C18556] group-hover:border-[#C18556]">
                    <Icon size={24} className="text-[#C18556] stroke-[1.5] transition-colors duration-500 group-hover:text-white" />
                  </div>

                  <h3 className="text-xl font-serif text-[#0C363A] mb-4 group-hover:text-[#C18556] transition-colors">
                    {s.title}
                  </h3>
                  
                  <div className="w-10 h-px bg-[#C18556]/30 mb-5 transition-all duration-500 group-hover:w-16 group-hover:bg-[#C18556]" />

                  <p className="text-sm text-[#0C363A]/60 leading-relaxed">
                    {s.desc}
                  </p>

                  {/* Corner Accent Line */}
                  <div className={cn(
                    "absolute bottom-0 w-0 h-1 bg-[#C18556] transition-all duration-500 group-hover:w-full",
                    lang === "ar" ? "right-0" : "left-0"
                  )} />
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Reveal delay={500}>
            <Link 
              to="/services" 
              className="inline-flex items-center gap-3 text-[#0C363A] text-xs font-bold uppercase tracking-[0.2em] transition-all hover:text-[#C18556] group"
            >
              <span className="relative">
                {lang === "ar" ? "اكتشف جميع خدماتنا" : "DISCOVER ALL SERVICES"}
                <span className="absolute -bottom-1 left-0 w-full h-px bg-[#C18556]/30 group-hover:h-0.5 group-hover:bg-[#C18556] transition-all" />
              </span>
              <ArrowRight size={14} className={cn("transition-transform", lang === "ar" ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2")} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
