import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Linkedin, Mail, Phone, ChevronRight, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import Reveal from "@/components/ui-luxe/Reveal";
import { cn } from "@/lib/utils";
import { CmsTeamMember, getCmsTeam } from "@/lib/publicCms";

// Fallback images for the three owners are served dynamically from /team-real/

const FALLBACK_OWNERS = [
  { name: "Ahmed Rajeh", nameAr: "أحمد راجح", role: "Civil Engineer", roleAr: "مهندس مدني", img: "/team-real/ahmed-rajeh.png" },
  { name: "Ebrahem Al-Domiaty", nameAr: "إبراهيم الدمياطي", role: "General Manager - Architect", roleAr: "المدير العام - مهندس معماري", img: "/team-real/ebrahem-al-domiaty.png" },
  { name: "Khaled Sabiha", nameAr: "خالد صبيحة", role: "Architect", roleAr: "مهندس معماري", img: "/team-real/khaled-sabiha.png" },
];

function SocialIcon({ icon: Icon }: { icon: any }) {
  return (
    <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 transition-all duration-300 hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556]">
      <Icon size={13} />
    </a>
  );
}

function OwnerPreviewCard({ m, index, lang }: { m: any; index: number; lang: string }) {
  const isRtl = lang === "ar";
  
  return (
    <Reveal delay={index * 150}>
      <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-[#C18556]/20 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-500 hover:border-[#C18556] hover:shadow-[0_0_35px_rgba(193,133,86,0.12)] hover:-translate-y-2">
        {/* Decorative subtle shimmer overlay on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#C18556]/0 via-[#C18556]/[0.01] to-[#C18556]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Circular portrait with luxury double gold border */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border border-[#C18556]/30 p-1 group-hover:border-[#C18556] transition-all duration-500 shadow-lg group-hover:shadow-[0_0_15px_rgba(193,133,86,0.25)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0C363A] flex items-center justify-center">
              <img
                src={m.img}
                alt={isRtl ? m.nameAr : m.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
          
          {/* Subtle gold architectural corner accent */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-[#C18556]/40 group-hover:border-[#C18556] transition-all duration-500" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-[#C18556]/40 group-hover:border-[#C18556] transition-all duration-500" />
        </div>

        {/* Owner Small Badge */}
        <span className="bg-[#C18556]/10 text-[#C18556] px-3.5 py-1 text-[9px] uppercase font-bold tracking-[0.2em] rounded-full border border-[#C18556]/20 mb-4 inline-block shadow-[inset_0_1px_8px_rgba(193,133,86,0.05)]">
          {isRtl ? "شريك مؤسس" : "Owner"}
        </span>

        {/* Info Area */}
        <div className="text-center w-full">
          <h3 className="text-xl font-serif text-white font-bold mb-2 group-hover:text-[#C18556] transition-colors leading-tight">
            {isRtl ? m.nameAr : m.name}
          </h3>
          
          <div className="w-6 h-px bg-[#C18556]/30 mx-auto my-2" />
          
          <p className="text-xs uppercase tracking-widest text-[#C18556]/70 font-semibold mb-6">
            {isRtl ? m.roleAr : m.role}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 pt-4 border-t border-white/5 w-full justify-center">
          <SocialIcon icon={Linkedin} />
          <SocialIcon icon={Mail} />
          <SocialIcon icon={Phone} />
        </div>
      </div>
    </Reveal>
  );
}

export default function TeamPreview({ section }: { section?: any }) {
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const [members, setMembers] = useState<any[]>(FALLBACK_OWNERS);

  useEffect(() => {
    let alive = true;
    getCmsTeam().then((rows: CmsTeamMember[]) => {
      if (!alive || !rows.length) return;
      
      const isOwnerName = (name: string) => {
        return name.includes("راجح") || name.includes("الدمياطي") || name.includes("صبيحة") || 
               name.toLowerCase().includes("rajeh") || name.toLowerCase().includes("domiaty") || name.toLowerCase().includes("sabiha");
      };

      const owners = rows.filter((m: any) => {
        const name = m.nameAr || m.name || "";
        return isOwnerName(name);
      });

      // Show the 3 owners
      const displayRows = owners.length > 0 ? owners.slice(0, 3) : rows.slice(0, 3);

      setMembers(displayRows.map((member, idx) => {
        let img = member.imageUrl;
        if (!img || img.trim() === "" || img.includes("placeholder") || img.includes("avatar")) {
          const name = (member.nameAr || member.name || "").toLowerCase();
          if (name.includes("راجح") || name.includes("rajeh")) img = "/team-real/ahmed-rajeh.png";
          else if (name.includes("الدمياطي") || name.includes("domiaty")) img = "/team-real/ebrahem-al-domiaty.png";
          else if (name.includes("صبيحة") || name.includes("sabiha")) img = "/team-real/khaled-sabiha.png";
          else img = FALLBACK_OWNERS[idx % FALLBACK_OWNERS.length].img;
        }

        // Standardize Roles
        let role = member.role || "";
        let roleAr = member.roleAr || "";
        if (role.toLowerCase().includes("general")) {
          role = "General Manager - Architect";
          roleAr = "المدير العام - مهندس معماري";
        } else if (role.toLowerCase().includes("civil")) {
          role = "Civil Engineer";
          roleAr = "مهندس مدني";
        } else if (role.toLowerCase().includes("arch")) {
          role = "Architect";
          roleAr = "مهندس معماري";
        }

        return {
          name: member.name,
          nameAr: member.nameAr,
          role,
          roleAr,
          img,
        };
      }));
    });
    return () => {
      alive = false;
    };
  }, [section]);

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-[#0C363A]" dir={isRtl ? "rtl" : "ltr"}>
      {/* Architectural Background Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#C18556 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className={cn("absolute top-0 w-px h-full bg-gradient-to-b from-[#C18556]/20 via-[#C18556]/10 to-transparent", isRtl ? "right-12" : "left-12")} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C18556]/5 blur-[120px] rounded-full" />
      </div>

      <div className="container-luxe relative z-10">
        {/* Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-center gap-3 mb-5">
              <Sparkles size={13} className="text-[#C18556] animate-pulse" />
              <span className="text-[#C18556] text-[11px] uppercase tracking-[0.3em] font-bold">
                {isRtl ? "قيادة الشركة" : "COMPANY LEADERSHIP"}
              </span>
              <Sparkles size={13} className="text-[#C18556] animate-pulse" />
            </div>
          </Reveal>
          
          <Reveal delay={150}>
            <h2 className="text-4xl md:text-5xl font-serif text-white font-bold leading-tight mb-6">
              {isRtl ? (
                <>تعرف على <span className="text-[#C18556] italic">الشركاء المؤسسين</span></>
              ) : (
                <>Meet Our <span className="text-[#C18556] italic">Founding Owners</span></>
              )}
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mx-auto max-w-2xl">
              {isRtl 
                ? "العقول القيادية المبدعة التي تقود تاكت للهندسة والتصميم نحو الريادة وصناعة أرقى المساحات السكنية والتجارية."
                : "The creative leadership driving Tact Architecture & Decoration towards standard excellence and premium interior engineering."}
            </p>
          </Reveal>
        </div>

        {/* 3-Column Owners Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {members.map((m, i) => (
            <OwnerPreviewCard key={m.name} m={m} index={i} lang={lang} />
          ))}
        </div>

        {/* Bottom CTA to Full Team */}
        <div className="mt-20 text-center">
          <Reveal delay={500}>
            <Link 
              to="/team" 
              className="group inline-flex items-center justify-center px-10 py-4 border border-[#C18556]/50 bg-transparent text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 hover:bg-[#C18556] hover:text-[#0C363A] hover:border-[#C18556] shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_0_25px_rgba(193,133,86,0.25)]"
            >
              <span>{isRtl ? "تعرف على فريقنا بالكامل" : "MEET THE ENTIRE TEAM"}</span>
              <ChevronRight size={15} className={cn("transition-transform duration-300 ml-2", isRtl ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2")} />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Decorative Corner Architecture Mark */}
      <div className={cn(
        "absolute top-20 opacity-10 pointer-events-none hidden lg:block w-24 h-24 border-t border-[#C18556]",
        isRtl ? "left-20 border-l" : "right-20 border-r"
      )} />
    </section>
  );
}
