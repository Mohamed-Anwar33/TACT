import { useLang } from "@/i18n/LanguageProvider";
import SectionEyebrow from "@/components/ui-luxe/SectionEyebrow";
import Reveal from "@/components/ui-luxe/Reveal";
import about from "@/assets/about-detail.jpg";
import { Quote } from "lucide-react";

export default function About() {
  const { t, lang } = useLang();
  const values = lang === "ar"
    ? [
        { t: "جودة عالية", d: "معايير صارمة في كل تفصيلة." },
        { t: "التزام بالمواعيد", d: "نسلّم في الوقت المتفق عليه." },
        { t: "تصميم مخصص", d: "نصمم على هويتك واحتياجك." },
        { t: "إشراف هندسي", d: "متابعة دقيقة لكل مرحلة." },
        { t: "تنفيذ متكامل", d: "من الفكرة إلى المفتاح." },
        { t: "تسليم نهائي راقٍ", d: "تجربة تسليم تليق بك." },
      ]
    : [
        { t: "High Quality", d: "Strict standards in every detail." },
        { t: "On-Time Delivery", d: "We deliver on agreed schedules." },
        { t: "Custom Design", d: "Designed to your identity and needs." },
        { t: "Engineering Supervision", d: "Precise oversight at every stage." },
        { t: "Integrated Execution", d: "From idea to keys." },
        { t: "Refined Handover", d: "A handover experience worthy of you." },
      ];

  const timeline = lang === "ar"
    ? [
        { n: "01", t: "الاستشارة", d: "نفهم رؤيتك واحتياجك." },
        { n: "02", t: "التصميم", d: "تصور ثلاثي الأبعاد دقيق." },
        { n: "03", t: "التنفيذ", d: "إدارة شاملة بأعلى المعايير." },
        { n: "04", t: "التشطيب والفرش", d: "اختيار المواد والقطع." },
        { n: "05", t: "التسليم", d: "مساحة جاهزة بأدق التفاصيل." },
      ]
    : [
        { n: "01", t: "Consultation", d: "We understand your vision and needs." },
        { n: "02", t: "Design", d: "Precise 3D visualization." },
        { n: "03", t: "Execution", d: "Full management at top standards." },
        { n: "04", t: "Finishing & Furnishing", d: "Material and piece selection." },
        { n: "05", t: "Handover", d: "A space ready, down to the detail." },
      ];

  return (
    <>
      <section className="pt-40 pb-20 bg-teal-deep text-ivory relative overflow-hidden">
        <div className="absolute inset-0 arch-grid opacity-25" />
        <div className="container-luxe relative">
          <SectionEyebrow label={t("about_eyebrow")} />
          <h1 className="display-1 mt-6 max-w-4xl text-balance">{t("about_title")}</h1>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-luxe grid md:grid-cols-2 gap-16">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden hover-zoom">
              <img src={about} loading="lazy" alt="" className="w-full h-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-[15px] leading-loose text-foreground/85">{t("about_preview")}</p>
            <div className="my-10 gold-line w-24" />
            <div className="flex gap-4 items-start">
              <Quote className="text-gold flex-shrink-0 mt-2" size={32} />
              <p className="font-serif text-2xl md:text-3xl leading-snug text-balance">{t("about_quote")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24 bg-muted/40">
        <div className="container-luxe">
          <SectionEyebrow label={lang === "ar" ? "رحلتنا" : "Our Process"} />
          <h2 className="display-3 mt-5 mb-16 max-w-2xl">{lang === "ar" ? "من الفكرة إلى المفتاح" : "From idea to keys"}</h2>
          <div className="grid md:grid-cols-5 gap-px bg-border">
            {timeline.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="bg-background p-8 h-full">
                  <div className="num-tag">{s.n}</div>
                  <h3 className="font-serif text-xl mt-4">{s.t}</h3>
                  <div className="gold-line w-10 my-4" />
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-luxe">
          <SectionEyebrow label={lang === "ar" ? "قيمنا" : "Our Values"} />
          <h2 className="display-3 mt-5 mb-16">{lang === "ar" ? "ما الذي يجعلنا تاكت" : "What makes us Tact"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <Reveal key={v.t} delay={i * 80}>
                <div className="card-luxe p-8 h-full">
                  <h3 className="font-serif text-xl text-primary">{v.t}</h3>
                  <div className="gold-line w-10 my-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
