import { Link } from "react-router-dom";
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { SITE } from "@/data/site";
import Reveal from "@/components/ui-luxe/Reveal";
import { fallbackContact, getCmsContact, type CmsContact } from "@/lib/publicCms";
import { cn } from "@/lib/utils";

export default function Footer() {
  const { lang } = useLang();
  const [contact, setContact] = useState<CmsContact>(() => fallbackContact());
  
  const currentYear = new Date().getFullYear();
  const phones = contact.phones.length ? contact.phones : SITE.phones;
  const socialLinks = {
    facebook: contact.socialLinks.facebook || SITE.facebook,
    instagram: contact.socialLinks.instagram || SITE.instagram,
    tiktok: contact.socialLinks.tiktok || SITE.tiktok,
  };

  useEffect(() => {
    let alive = true;
    getCmsContact().then((row) => {
      if (alive) setContact(row);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* 1) Top Transition Band */}
      <div className="w-full bg-[#F7F2EA] h-[56px] md:h-[90px] relative flex items-center justify-center">
        <div className="w-[1px] h-full bg-[#C18556]/20 absolute left-1/2 -translate-x-1/2" />
        <div className="w-full h-px bg-[#C18556]/10 absolute top-1/2 -translate-y-1/2" />
        <div className="relative z-10 bg-[#F7F2EA] px-6 py-2 flex flex-col items-center gap-1">
           <span className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-[#C18556]/60 font-bold">
             {lang === "ar" ? "التميز في كل تفصيلة" : "PRECISION IN EVERY DETAIL"}
           </span>
           <div className="text-[#C18556] opacity-30 select-none font-serif text-xl">T</div>

        </div>
      </div>

      {/* 2) Main Footer Panel */}
      <footer className="relative w-full bg-gradient-to-br from-[#061F22] via-[#08282B] to-[#061F22] pt-16 pb-8 border-t border-[#C18556]/30">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" 
             style={{ backgroundImage: `linear-gradient(#C18556 0.5px, transparent 0.5px), linear-gradient(90deg, #C18556 0.5px, transparent 0.5px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none">
          <span className="text-[40vw] font-serif select-none">T</span>
        </div>

        <div className="container-luxe max-w-[1180px] relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1.1fr_0.8fr_0.8fr] gap-12 mb-12">
            
            {/* Column 1: Brand */}
            <Reveal>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Tact Logo" className="w-[140px] md:w-[170px] h-auto object-contain" />
                </div>

                <p className="text-sm leading-[1.9] text-white/90 max-w-[320px] font-serif">
                  {lang === "ar" 
                    ? "نصمم وننفذ مساحات استثنائية تعكس رؤيتك وتفوق توقعاتك، مع دمج الفخامة بالوظيفة في كل تفصيلة معمارية." 
                    : "We design and execute exceptional spaces that reflect your vision and exceed expectations, blending luxury with functionality in every architectural detail."}
                </p>

                <div className="flex items-center gap-3">
                  {[
                    { icon: Facebook, href: socialLinks.facebook, label: "Facebook" },
                    { icon: Instagram, href: socialLinks.instagram, label: "Instagram" },
                    { 
                      icon: (props: any) => (
                        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.13 8.13 0 0 1-1.89-1.44c-.05 2.62-.05 5.24-.01 7.86-.02 2.73-.74 5.6-2.91 7.47-2.12 1.86-5.46 2.31-8.15 1.39-2.48-.82-4.56-2.77-5.27-5.32-.9-3.17.27-6.97 3.03-8.85 1.47-.98 3.32-1.39 5.07-1.16v4.22c-1.01-.17-2.09.06-2.9.73-1.01.81-1.33 2.21-.86 3.42.34 1.05 1.43 1.83 2.53 1.75 1.25-.03 2.37-1.07 2.43-2.32.02-3.11.01-6.22.01-9.34-.04-2.4-.04-4.79-.01-7.18Z" />
                        </svg>
                      ), 
                      href: socialLinks.tiktok,
                      label: "TikTok"
                    },
                  ].map((social, i) => {
                    const Icon = social.icon as any;
                    return (
                      <a 
                        key={i} 
                        href={social.href} 
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="w-[38px] h-[38px] rounded-[6px] border border-[#C18556]/24 bg-white/5 flex items-center justify-center text-white/90 hover:text-[#061F22] hover:bg-[#C18556] hover:border-[#C18556] transition-all duration-300"
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Column 2: Contact */}
            <Reveal delay={100}>
              <div className="flex flex-col">
                <h4 className="text-[15px] text-[#C18556] font-bold mb-[18px] flex flex-col gap-2">
                  {lang === "ar" ? "تواصل معنا" : "CONTACT"}
                  <div className="w-8 h-px bg-[#C18556]/60" />
                </h4>
                
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-[6px] border border-[#C18556]/22 bg-[#C18556]/6 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-[#C18556]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-white/50 uppercase tracking-wider">
                        {lang === "ar" ? "الهاتف" : "PHONE"}
                      </span>
                      {phones.map((phone, i) => (
                        <a key={i} href={`tel:${phone}`} className="text-[15px] font-medium text-white hover:text-[#C18556] transition-all" dir="ltr">
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-[6px] border border-[#C18556]/22 bg-[#C18556]/6 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-[#C18556]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-white/50 uppercase tracking-wider">
                        {lang === "ar" ? "البريد الإلكتروني" : "EMAIL"}
                      </span>
                      <a href={`mailto:${contact.email || SITE.email}`} className="text-[15px] font-medium text-white hover:text-[#C18556] transition-all">
                        {contact.email || SITE.email}
                      </a>
                    </div>
                  </div>

                  {contact.addressEn && (
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-[6px] border border-[#C18556]/22 bg-[#C18556]/6 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-[#C18556]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-white/50 uppercase tracking-wider">
                          {lang === "ar" ? "الموقع" : "LOCATION"}
                        </span>
                        <p className="text-[14px] text-white/80 leading-snug">
                          {lang === "ar" ? contact.addressAr : contact.addressEn}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Column 3: Quick Links */}
            <Reveal delay={200}>
              <div className="flex flex-col">
                <h4 className="text-[15px] text-[#C18556] font-bold mb-[18px] flex flex-col gap-2">
                  {lang === "ar" ? "روابط سريعة" : "QUICK LINKS"}
                  <div className="w-8 h-px bg-[#C18556]/60" />
                </h4>
                <ul className="flex flex-col gap-2">
                  {[
                    { to: "/", labelAr: "الرئيسية", labelEn: "Home" },
                    { to: "/about", labelAr: "من نحن", labelEn: "About Us" },
                    { to: "/portfolio", labelAr: "أعمالنا", labelEn: "Portfolio" },
                    { to: "/testimonials", labelAr: "آراء العملاء", labelEn: "Testimonials" },
                    { to: "/contact", labelAr: "تواصل معنا", labelEn: "Contact" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link 
                        to={link.to} 
                        className={cn(
                          "text-[14px] leading-[2.1] text-white/80 hover:text-[#C18556] transition-all duration-300 flex items-center gap-1 group",
                          lang === "ar" ? "hover:translate-x-[-3px]" : "hover:translate-x-[3px]"
                        )}
                      >
                        {lang === "ar" ? link.labelAr : link.labelEn}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Column 4: Services */}
            <Reveal delay={300}>
              <div className="flex flex-col">
                <h4 className="text-[15px] text-[#C18556] font-bold mb-[18px] flex flex-col gap-2">
                  {lang === "ar" ? "خدماتنا" : "SERVICES"}
                  <div className="w-8 h-px bg-[#C18556]/60" />
                </h4>
                <ul className="flex flex-col gap-2">
                  {[
                    { labelAr: "التصميم المعماري", labelEn: "Architecture" },
                    { labelAr: "التصميم الداخلي", labelEn: "Interior Design" },
                    { labelAr: "التشطيبات", labelEn: "Premium Finishing" },
                    { labelAr: "تنسيق الحدائق", labelEn: "Landscape" },
                  ].map((service, i) => (
                    <li key={i} className="text-[14px] leading-[2.1] text-white/80 transition-colors cursor-default">
                      {lang === "ar" ? service.labelAr : service.labelEn}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* 3) Bottom Bar */}
          <div className="pt-6 mt-12 border-t border-[#C18556]/14 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[12px] uppercase tracking-wider text-white/50">
              © {currentYear} {lang === "ar" ? "نـكـت للتصميم والإنشاء. جميع الحقوق محفوظة" : "TACT ARCHITECTS. ALL RIGHTS RESERVED"}
            </p>
            
            <div className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-[#C18556]/50 font-bold">
              CRAFTED WITH PRECISION
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
