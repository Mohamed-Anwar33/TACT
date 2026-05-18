import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";
import { ArrowUpRight } from "lucide-react";

interface Project { id: string; img: string; name: string; nameAr: string; type: string; typeAr: string; area: string; }

export default function ProjectCard({ p }: { p: Project }) {
  const { lang } = useLang();
  return (
    <Link to={`/portfolio/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted hover-zoom">
        <img src={p.img} alt={lang === "ar" ? p.nameAr : p.name} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-deep/90 via-teal-deep/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-ivory">
          <span className="eyebrow !text-gold mb-2"><span className="gold-divider" />{lang === "ar" ? p.typeAr : p.type}</span>
          <h3 className="text-xl md:text-2xl">{lang === "ar" ? p.nameAr : p.name}</h3>
          <div className="flex items-center justify-between mt-3 text-xs uppercase tracking-[0.25em] text-ivory/70">
            <span>{p.area}</span>
            <ArrowUpRight size={18} className="text-gold transition-transform group-hover:rotate-45" />
          </div>
        </div>
      </div>
    </Link>
  );
}
