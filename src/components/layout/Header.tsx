import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Globe, Menu, Phone, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { SITE } from "@/data/site";
import { fallbackContact, getCmsContact, type CmsContact } from "@/lib/publicCms";

export default function Header() {
  const { lang, setLang } = useLang();
  const { user, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<CmsContact>(() => fallbackContact());
  const { pathname } = useLocation();
  const whatsappUrl = `https://wa.me/${contact.whatsapp || SITE.whatsapp}`;
  const primaryPhone = contact.phones[0] || SITE.phones[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    getCmsContact().then((row) => {
      if (alive) setContact(row);
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = [
    { to: "/", ar: "الرئيسية", en: "Home" },
    { to: "/about", ar: "من نحن", en: "About" },
    { to: "/services", ar: "خدماتنا", en: "Services" },
    { to: "/portfolio", ar: "أعمالنا", en: "Portfolio" },
    { to: "/team", ar: "فريق العمل", en: "Team" },
    { to: "/testimonials", ar: "العملاء", en: "Clients" },
    { to: "/contact", ar: "تواصل معنا", en: "Contact" },
  ];

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavLinkClick = (to: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (pathname === to) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] transition-all duration-500",
        scrolled || open ? "bg-brand-dark/95 py-2 shadow-luxe backdrop-blur-xl" : "bg-transparent py-3",
      )}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="container-luxe flex items-center justify-between">
        <Link 
          to="/" 
          onClick={handleLogoClick}
          className="flex items-center gap-3 py-1 transition-all duration-500 hover:scale-105 group"
        >
          <img 
            src="/logo.png" 
            alt="Tact" 
            className="h-16 w-16 object-contain transition-all duration-500 drop-shadow-[0_0_12px_rgba(193,133,86,0.22)] group-hover:drop-shadow-[0_0_22px_rgba(193,133,86,0.45)]" 
          />
        </Link>

        {/* Desktop Navigation Links with Gold Underline Micro-animations */}
        <nav className="hidden lg:flex items-center gap-8">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={(e) => handleNavLinkClick(item.to, e)}
              className={({ isActive }) =>
                cn(
                  "relative py-2 text-sm font-semibold tracking-wide transition-all duration-300 group",
                  isActive ? "text-brand-gold" : "text-white/80 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <span className="relative py-1">
                  {lang === "ar" ? item.ar : item.en}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gold transition-all duration-500 ease-out origin-center",
                      isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                    )}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Buttons & Language Switcher */}
        <div className="flex items-center gap-6">
          {user ? (
            <Link
              to={isAdmin ? "/admin" : "/customer"}
              className="hidden items-center gap-2 rounded-sm border border-brand-gold bg-brand-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition-all hover:bg-transparent hover:text-brand-gold md:flex"
            >
              {isAdmin
                ? (lang === "ar" ? "لوحة التحكم" : "Dashboard")
                : (lang === "ar" ? "بوابة العميل" : "Client Portal")}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-2 rounded-sm border border-brand-gold bg-brand-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition-all hover:bg-transparent hover:text-brand-gold md:flex"
            >
              {lang === "ar" ? "تسجيل دخول" : "Login"}
            </Link>
          )}
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-brand-gold">
            <Globe size={16} />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white lg:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      <div className={cn("lg:hidden overflow-hidden bg-brand-dark transition-all", open ? "max-h-[520px] border-t border-white/10" : "max-h-0")}>
        <div className="container-luxe grid gap-1 py-5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={(e) => handleNavLinkClick(item.to, e)}
              className={({ isActive }) =>
                cn("rounded-sm px-3 py-3 text-lg text-white/75 transition-colors duration-300", isActive && "bg-white/10 text-brand-gold")
              }
            >
              {lang === "ar" ? item.ar : item.en}
            </NavLink>
          ))}
          {user ? (
            <Link 
              to={isAdmin ? "/admin" : "/customer"} 
              className="mt-3 rounded-sm bg-brand-gold px-3 py-3 text-center font-semibold text-brand-dark"
            >
              {isAdmin 
                ? (lang === "ar" ? "لوحة التحكم" : "Dashboard")
                : (lang === "ar" ? "بوابة العميل" : "Client Portal")}
            </Link>
          ) : (
            <Link 
              to="/auth" 
              className="mt-3 rounded-sm bg-brand-gold px-3 py-3 text-center font-semibold text-brand-dark"
            >
              {lang === "ar" ? "تسجيل دخول" : "Login"}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
