import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsService, fallbackServices, getCmsServices } from "@/lib/publicCms";

export default function Services() {
  const { t, lang } = useLang();
  const [services, setServices] = useState<CmsService[]>(() => fallbackServices(lang));

  useEffect(() => {
    let alive = true;
    setServices(fallbackServices(lang));
    getCmsServices(lang).then((rows) => {
      if (alive) setServices(rows);
    });
    return () => {
      alive = false;
    };
  }, [lang]);

  return (
    <main className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <section className="pt-40 pb-20 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <Reveal>
            <SectionEyebrow label={t("services_eyebrow")} />
            <h1 className="display-1 mt-6 max-w-4xl text-balance">{t("services_title")}</h1>
            <p className="mt-6 text-ivory/70 max-w-2xl">{t("services_subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-luxe">
          <div className="space-y-px bg-border border border-border">
            {services.map((s, i) => (
              <Reveal key={s.id || s.num} delay={i * 60}>
                <article className="bg-background grid md:grid-cols-12 gap-6 px-6 md:px-10 py-12 group hover:bg-teal-deep transition-all duration-700 border border-transparent hover:border-gold/40">
                  <div className="md:col-span-1 num-tag group-hover:text-gold text-gold/60 transition-colors">
                    {s.num}
                  </div>
                  
                  <div className="md:col-span-5">
                    <h2 className={cn(
                      "font-serif text-3xl md:text-4xl group-hover:text-ivory transition-colors",
                      lang === "ar" ? "font-serif-ar" : ""
                    )}>
                      {s.title}
                    </h2>
                  </div>

                  <div className="md:col-span-5">
                    <p className="text-muted-foreground leading-loose group-hover:text-ivory/75 transition-colors">
                      {s.desc}
                    </p>
                  </div>

                  <div className="md:col-span-1 flex md:justify-end items-center">
                    <ArrowUpRight 
                      className={cn(
                        "text-gold transition-transform duration-500",
                        lang === "ar" ? "group-hover:-rotate-45" : "group-hover:rotate-45"
                      )} 
                      size={28} 
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
