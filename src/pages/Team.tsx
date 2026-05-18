import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import { 
  Users, 
  Palette, 
  Construction, 
  Briefcase, 
  Award, 
  Sparkles,
  Phone,
  Mail,
  Linkedin,
  Plus
} from "lucide-react";
import { CmsTeamMember, fallbackTeam, getCmsTeam } from "@/lib/publicCms";

// Fallback avatars
import avatarMale from "@/assets/avatar-male.png";
import avatarFemale from "@/assets/avatar-female.png";

const CATEGORIES = [
  { id: "all", labelAr: "كل الفريق", labelEn: "All Members", icon: Users },
  { id: "owners", labelAr: "الشركاء المؤسسون", labelEn: "Owners", icon: Award },
  { id: "accounting", labelAr: "المالية والتسويق", labelEn: "Accounting & Marketing", icon: Briefcase },
  { id: "site", labelAr: "المهندسون التنفيذيون", labelEn: "Site Engineers", icon: Construction },
  { id: "design", labelAr: "مهندسو التصميم", labelEn: "Design Engineers", icon: Palette },
];

export default function Team() {
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const [activeTab, setActiveTab] = useState("all");
  const [members, setMembers] = useState<CmsTeamMember[]>(() => fallbackTeam());

  useEffect(() => {
    let alive = true;
    getCmsTeam().then((rows) => {
      if (!alive) return;
      
      // Programmatically ensure proper department categorization based on name/role
      const processed = rows.map((m: any) => {
        let dept = m.department;
        const name = m.nameAr || m.name || "";
        
        const isOwnerName = name.includes("راجح") || name.includes("الدمياطي") || name.includes("صبيحة") || 
                            name.toLowerCase().includes("rajeh") || name.toLowerCase().includes("domiaty") || name.toLowerCase().includes("sabiha");
        
        if (dept === "leadership" || dept === "owners" || dept === "accounting") {
          if (isOwnerName) {
            dept = "owners";
          } else {
            dept = "accounting";
          }
        }
        
        // Clean roles of any weird spacings
        let role = m.role || "";
        let roleAr = m.roleAr || "";
        if (role.toLowerCase().includes("arch")) {
          if (role.toLowerCase().includes("executive")) {
            role = "Architect - Executive Engineer";
            roleAr = "مهندس معماري تنفيذي";
          } else if (role.toLowerCase().includes("general")) {
            role = "General Manager - Architect";
            roleAr = "المدير العام - مهندس معماري";
          } else {
            role = "Architect";
            roleAr = "مهندس معماري";
          }
        }
        
        return {
          ...m,
          department: dept,
          role,
          roleAr
        };
      });
      
      setMembers(processed);
    });
    return () => {
      alive = false;
    };
  }, []);

  const isOwner = (m: any) => {
    return m.department === "owners";
  };

  const getMemberAvatar = (m: any) => {
    if (m.imageUrl && m.imageUrl.trim() !== "" && !m.imageUrl.includes("placeholder") && !m.imageUrl.includes("avatar")) return m.imageUrl;
    
    const name = (m.nameAr || m.name || "").toLowerCase();
    
    // Exact mapping for all 18 team members to their real cropped photos
    if (name.includes("راجح") || name.includes("rajeh")) return "/team-real/ahmed-rajeh.png";
    if (name.includes("الدمياطي") || name.includes("domiaty")) return "/team-real/ebrahem-al-domiaty.png";
    if (name.includes("صبيحة") || name.includes("sabiha")) return "/team-real/khaled-sabiha.png";
    
    if (name.includes("روان") || name.includes("rawan")) return "/team-real/rawan-el-bargesy.png";
    if (name.includes("أسماء علاء") || name.includes("asmaa alaa")) return "/team-real/asmaa-alaa.png";
    if (name.includes("هالة") || name.includes("hala")) return "/team-real/hala-ibrahem.png";
    
    if (name.includes("لمياء") || name.includes("lamiaa")) return "/team-real/lamiaa-el-halwany.png";
    if (name.includes("زياد") || name.includes("zeyad")) return "/team-real/zeyad-el-salamony.png";
    if (name.includes("زيدي") || name.includes("zedy")) return "/team-real/muhamed-el-zedy.png";
    if (name.includes("عيسى") || name.includes("eissa")) return "/team-real/muhamed-eissa.png";
    
    if (name.includes("قويطة") || name.includes("qwita")) return "/team-real/rabab-abdo-qwita.png";
    if (name.includes("أمنية") || name.includes("omnia")) return "/team-real/omnia-abd-el-salam.png";
    if (name.includes("هايدي") || name.includes("haidy")) return "/team-real/haidy-galal.png";
    if (name.includes("ياقوت") || name.includes("yakout")) return "/team-real/ahmed-yakout.png";
    if (name.includes("هضيبي") || name.includes("hidaby")) return "/team-real/hend-el-hidaby.png";
    if (name.includes("يارا") || name.includes("yara")) return "/team-real/yara-el-shabrawy.png";
    if (name.includes("أماني") || name.includes("amany")) return "/team-real/amany-safan.png";
    if (name.includes("غانم") || name.includes("ghaneem") || name.includes("أسماء غانم")) return "/team-real/asmaa-ghaneem.png";
    
    const isFemale = name.includes("روان") || name.includes("أسماء") || name.includes("هالة") || 
                     name.includes("لمياء") || name.includes("رباب") || name.includes("أمنية") || 
                     name.includes("هايدي") || name.includes("هند") || name.includes("يارا") || 
                     name.includes("أماني");
                     
    return isFemale ? avatarFemale : avatarMale;
  };

  // Group members dynamically
  const ownersList = members.filter(m => isOwner(m));
  const accountingList = members.filter(m => m.department === "accounting");
  const siteList = members.filter(m => m.department === "site");
  const designList = members.filter(m => m.department === "design");

  return (
    <div className="bg-brand-dark min-h-screen text-ivory pb-24 relative overflow-hidden font-arabic" dir={isRtl ? "rtl" : "ltr"}>
      {/* Decorative architectural background lines & dots */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(hsl(var(--brand-gold)) 1.2px, transparent 1.2px)`, backgroundSize: '32px 32px' }} />
      
      {/* Abstract luxurious orbits */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-teal/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[10%] w-px h-[60%] bg-gradient-to-b from-brand-gold/15 via-transparent to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden border-b border-brand-gold/10 bg-gradient-to-b from-[#062427] to-brand-dark">
        {/* Arch grids overlay */}
        <div className="absolute inset-0 arch-grid opacity-[0.03] pointer-events-none" />
        
        <div className="container-luxe relative z-10 text-center">
          <Reveal>
            <div className="flex flex-col items-center justify-center space-y-4 mb-4">
              <img 
                src="/logo.png" 
                alt="Tact Logo" 
                className="h-16 w-16 object-contain drop-shadow-[0_0_12px_rgba(193,133,86,0.25)]"
              />
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-brand-gold/40" />
                <span className="text-brand-gold text-[11px] uppercase tracking-[0.3em] font-bold">
                  {isRtl ? "فريقنا" : "OUR TEAM"}
                </span>
                <div className="w-8 h-px bg-brand-gold/40" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-5">
              {isRtl ? "العقول المبدعة خلف التميز" : "The Minds Behind The Details"}
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="text-ivory/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {isRtl 
                ? "نخبة من المهندسين والمصممين وخبراء التنفيذ يعملون بروح الفريق الواحد لتحويل رؤيتك إلى واقع معماري استثنائي يفوق التوقعات." 
                : "A premier group of engineers, designers, and site executors working in harmony to craft your dream architectural spaces beyond expectation."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Tabs Navigation (Sticky) */}
      <section className="sticky top-[80px] z-40 bg-brand-dark/90 backdrop-blur-md border-b border-brand-gold/10 py-5">
        <div className="container-luxe">
          <div className="flex flex-wrap justify-center gap-3 md:gap-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`relative px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border ${
                  activeTab === cat.id 
                    ? "text-brand-dark bg-brand-gold border-brand-gold shadow-gold font-bold" 
                    : "text-ivory/60 border-white/5 bg-white/[0.02] hover:text-white hover:border-brand-gold/30 hover:bg-white/[0.04]"
                }`}
              >
                <cat.icon size={14} className={activeTab === cat.id ? "opacity-100" : "opacity-75"} />
                <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Team Content Grid */}
      <section className="py-20 relative z-10" key={activeTab}>
        <div className="container-luxe max-w-7xl">
          
          {/* ================= OWNERS SECTION ================= */}
          {(activeTab === "all" || activeTab === "owners") && ownersList.length > 0 && (
            <div className="mb-20">
              <div className="text-center mb-12">
                <Reveal>
                  <div className="inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/25 px-4 py-1.5 rounded-full mb-3">
                    <Sparkles size={13} className="text-brand-gold animate-pulse" />
                    <span className="text-brand-gold text-[10px] uppercase font-bold tracking-[0.25em]">
                      {isRtl ? "مؤسسو الشركة" : "FOUNDERS"}
                    </span>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-2">
                    {isRtl ? "الشركاء المؤسسون" : "Owners & Partners"}
                  </h2>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-gold to-transparent mx-auto mt-3" />
                </Reveal>
              </div>

              {/* Large Premium Owner Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {ownersList.map((m, i) => {
                  const avatar = getMemberAvatar(m);
                  return (
                    <Reveal key={m.id || m.name} delay={i * 150}>
                      <div className="group relative bg-gradient-to-b from-white/[0.06] to-white/[0.01] border border-brand-gold/25 rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-500 hover:border-brand-gold hover:shadow-[0_0_40px_rgba(193,133,86,0.18)] hover:-translate-y-2">
                        {/* Shimmer on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-gold/0 via-brand-gold/[0.02] to-brand-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        {/* Circular Portrait with Golden Glow */}
                        <div className="relative mb-6">
                          <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-brand-gold/30 p-1.5 group-hover:border-brand-gold transition-all duration-500 shadow-xl group-hover:shadow-[0_0_20px_rgba(193,133,86,0.3)]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-brand-dark relative flex items-center justify-center">
                              <img 
                                src={avatar} 
                                alt={isRtl ? m.nameAr : m.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                            </div>
                          </div>
                          
                          {/* Corner geometric marks */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-brand-gold/40 group-hover:border-brand-gold transition-colors duration-500" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-brand-gold/40 group-hover:border-brand-gold transition-colors duration-500" />
                        </div>

                        {/* Owner Badge */}
                        <span className="bg-brand-gold/10 text-brand-gold px-3.5 py-1 text-[9px] uppercase font-bold tracking-[0.2em] rounded-full border border-brand-gold/25 mb-4 inline-block shadow-[inset_0_1px_8px_rgba(193,133,86,0.1)]">
                          {isRtl ? "شريك مؤسس" : "Owner"}
                        </span>

                        <h3 className="font-serif text-2xl text-white font-bold mb-2 group-hover:text-brand-gold transition-colors duration-300">
                          {isRtl ? m.nameAr : m.name}
                        </h3>
                        
                        <div className="w-8 h-px bg-brand-gold/30 my-2" />
                        
                        <p className="text-xs uppercase tracking-widest text-brand-gold/70 font-semibold mb-6">
                          {isRtl ? m.roleAr : m.role}
                        </p>

                        {/* Social Contacts */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5 w-full justify-center">
                          <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-ivory/60 hover:text-brand-gold hover:border-brand-gold hover:bg-brand-gold/5 transition-all duration-300">
                            <Linkedin size={13} />
                          </a>
                          <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-ivory/60 hover:text-brand-gold hover:border-brand-gold hover:bg-brand-gold/5 transition-all duration-300">
                            <Mail size={13} />
                          </a>
                          <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-ivory/60 hover:text-brand-gold hover:border-brand-gold hover:bg-brand-gold/5 transition-all duration-300">
                            <Phone size={13} />
                          </a>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= ACCOUNTING & MARKETING ================= */}
          {(activeTab === "all" || activeTab === "accounting") && accountingList.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-white shrink-0">
                  {isRtl ? "المالية والتسويق" : "Accounting & Marketing"}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-brand-gold/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {accountingList.map((m, i) => (
                  <Reveal key={m.id || m.name} delay={i * 100}>
                    <TeamMemberCard m={m} lang={lang} avatar={getMemberAvatar(m)} isRtl={isRtl} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* ================= SITE ENGINEERS ================= */}
          {(activeTab === "all" || activeTab === "site") && siteList.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-white shrink-0">
                  {isRtl ? "المهندسون التنفيذيون" : "Site & Executive Engineers"}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-brand-gold/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {siteList.map((m, i) => (
                  <Reveal key={m.id || m.name} delay={i * 100}>
                    <TeamMemberCard m={m} lang={lang} avatar={getMemberAvatar(m)} isRtl={isRtl} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* ================= DESIGN ENGINEERS ================= */}
          {(activeTab === "all" || activeTab === "design") && designList.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-white shrink-0">
                  {isRtl ? "مهندسو التصميم والديكور" : "Design Engineers"}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-brand-gold/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {designList.map((m, i) => (
                  <Reveal key={m.id || m.name} delay={i * 100}>
                    <TeamMemberCard m={m} lang={lang} avatar={getMemberAvatar(m)} isRtl={isRtl} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-brand-gold/10 relative z-10 bg-[#062427]">
        <div className="container-luxe text-center max-w-3xl">
          <h2 className="text-3xl font-serif font-bold mb-6 text-white">
            {isRtl ? "هل لديك رؤية لمشروع جديد؟" : "Have a vision for a new project?"}
          </h2>
          <p className="text-ivory/60 text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            {isRtl 
              ? "فريقنا المتكامل جاهز ومستعد لمساعدتك في كل خطوة، بدءاً من الأفكار المبدئية واللوحات الهندسية إلى التسليم النهائي بأقصى درجات الجودة والفخامة." 
              : "Our dedicated team is ready to assist you at every phase, from initial concept rendering to complete key delivery with premium luxury."}
          </p>
          <a href="/contact" className="group inline-flex items-center gap-2 rounded-sm border border-brand-gold bg-brand-gold px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-dark transition-all duration-300 hover:bg-transparent hover:text-brand-gold shadow-gold">
            <span>{isRtl ? "تواصل مع خبرائنا الآن" : "Contact Our Experts"}</span>
            <Plus size={16} className="rotate-45 group-hover:rotate-0 transition-transform duration-500" />
          </a>
        </div>
      </section>
    </div>
  );
}

// Separate Elegant Card Component for regular team members
function TeamMemberCard({ m, lang, avatar, isRtl }: { m: any; lang: string; avatar: string; isRtl: boolean }) {
  return (
    <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-brand-gold/15 rounded-xl p-5 flex flex-col transition-all duration-500 hover:border-brand-gold/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/20">
      {/* Decorative inner gradient on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-brand-gold/0 via-brand-gold/[0.01] to-brand-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Rectangular Image Area with Glow */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg border border-white/5 mb-5 group-hover:border-brand-gold/25 transition-colors duration-500">
        <img
          src={avatar}
          alt={isRtl ? m.nameAr : m.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          loading="lazy"
        />
        {/* Soft elegant shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-70" />
        
        {/* Architectural corner marks on hover */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-brand-gold/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-brand-gold/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />
      </div>

      {/* Editable Info Area */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-brand-gold transition-colors duration-300">
            {isRtl ? m.nameAr : m.name}
          </h3>
          
          {/* Subtle Golden Divider */}
          <div className="w-6 h-px bg-brand-gold/20 mx-auto my-2 group-hover:w-12 group-hover:bg-brand-gold/40 transition-all duration-500" />
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/80 font-sans">
            {isRtl ? m.roleAr : m.role}
          </p>
        </div>
      </div>
    </div>
  );
}
