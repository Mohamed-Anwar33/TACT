import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Facebook, Film, Instagram, Mail, MessageCircle, Phone, Play, Star } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { ContentBlock, SitePage, getCmsPage, pickLang } from "@/lib/cms";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  slug: "home" | "about" | "services" | "portfolio" | "team" | "testimonials" | "contact";
};

export default function CmsPage({ slug }: Props) {
  const { lang } = useLang();
  const [page, setPage] = useState<SitePage | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCmsPage(slug).then((result) => {
      if (!mounted) return;
      setPage(result.page);
      setBlocks(result.blocks);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);

  const hero = blocks.find((block) => block.block_type === "hero") || blocks[0];
  const rest = blocks.filter((block) => block.id !== hero?.id);
  const title = pickLang(lang, page?.title_en, page?.title_ar);
  const heroTitle = pickLang(lang, hero?.title_en, hero?.title_ar) || title;
  const heroBody = pickLang(lang, hero?.body_en, hero?.body_ar);

  return (
    <main className="min-h-screen bg-[#f8f5ee]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <section className="relative min-h-[76vh] overflow-hidden bg-[#0C363A] text-white">
        <HeroMedia block={hero} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C363A] via-[#0C363A]/60 to-black/20" />
        <div className="absolute inset-0 arch-grid opacity-20" />
        <div className="container-luxe relative z-10 flex min-h-[76vh] flex-col justify-end pb-16 pt-36">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C18556]">TACT</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-tight md:text-7xl">{heroTitle}</h1>
          {heroBody && <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 md:text-lg">{heroBody}</p>}
          {slug === "home" && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-gold">{lang === "ar" ? "ابدأ مشروعك" : "Start project"} {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}</Link>
              <Link to="/portfolio" className="btn-ghost-light">{lang === "ar" ? "شاهد أعمالنا" : "View work"}</Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-luxe grid gap-10">
          {rest.map((block, index) => (
            <BlockRenderer key={block.id || block.block_key} block={block} lang={lang} index={index} onPlay={setActiveVideo} />
          ))}
          {slug === "contact" && <ContactForm blocks={blocks} lang={lang} />}
        </div>
      </section>

      {activeVideo && (
        <div className="fixed inset-0 z-[220] grid place-items-center bg-black/90 p-4">
          <button onClick={() => setActiveVideo(null)} className="absolute end-6 top-6 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            {lang === "ar" ? "إغلاق" : "Close"}
          </button>
          <video src={activeVideo} controls autoPlay className="max-h-[82vh] w-full max-w-5xl rounded-lg bg-black object-contain" />
        </div>
      )}
    </main>
  );
}

function HeroMedia({ block }: { block?: ContentBlock }) {
  const media = block?.media_url || block?.metadata?.image || block?.metadata?.video;
  if (!media) return null;
  if (String(media).match(/\.(mp4|webm|mov)$/i)) {
    return <video src={media} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <img src={media} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" />;
}

function BlockRenderer({ block, lang, index, onPlay }: { block: ContentBlock; lang: "ar" | "en"; index: number; onPlay: (url: string) => void }) {
  const title = pickLang(lang, block.title_en, block.title_ar);
  const body = pickLang(lang, block.body_en, block.body_ar);
  const metadata = block.metadata || {};

  if (block.block_type === "list" && (metadata.services_ar || metadata.services_en)) {
    const services = lang === "ar" ? metadata.services_ar || [] : metadata.services_en || [];
    return (
      <CmsSection title={title} body={body}>
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service: any, i: number) => (
            <article key={service.num || i} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[#C18556]">{service.num || String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-3 text-2xl font-semibold text-[#0C363A]">{service.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{service.desc}</p>
            </article>
          ))}
        </div>
      </CmsSection>
    );
  }

  if (block.block_type === "collection" && (metadata.designs || metadata.videos)) {
    const items = [...(metadata.designs || []), ...(metadata.videos || [])];
    return (
      <CmsSection title={title} body={body}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item: any) => (
            <article key={item.id || item.name} className="group overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-[#0C363A]">
                <img src={item.img || item.cover} alt={pick(lang, item.name, item.nameAr)} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                {item.videoUrl && (
                  <button onClick={() => onPlay(item.videoUrl)} className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-[#C18556] text-[#0C363A]"><Play fill="currentColor" /></span>
                  </button>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#C18556]">{pick(lang, item.type, item.typeAr)}</p>
                <h3 className="mt-2 text-xl font-semibold text-[#0C363A]">{pick(lang, item.name, item.nameAr)}</h3>
                {item.desc || item.descAr ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{pick(lang, item.desc, item.descAr)}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </CmsSection>
    );
  }

  if (block.block_type === "collection" && metadata.team) {
    const groups = metadata.team || {};
    const members = [...(groups.owners || []), ...(groups.accounting || []), ...(groups.site || []), ...(groups.design || [])];
    return (
      <CmsSection title={title} body={body}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member: any, i: number) => (
            <article key={`${member.name}-${i}`} className="rounded-lg border bg-white p-5 text-center shadow-sm">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#0C363A] text-2xl font-semibold text-[#C18556]">{pick(lang, member.name, member.nameAr).slice(0, 1)}</div>
              <h3 className="mt-4 font-semibold text-[#0C363A]">{pick(lang, member.name, member.nameAr)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pick(lang, member.role, member.roleAr)}</p>
            </article>
          ))}
        </div>
      </CmsSection>
    );
  }

  if (block.block_type === "collection" && (metadata.review_videos || metadata.testimonials_ar)) {
    return (
      <CmsSection title={title} body={body}>
        <div className="grid gap-5 md:grid-cols-2">
          {(metadata.review_videos || []).map((video: any) => (
            <article key={video.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <button className="relative aspect-video w-full bg-[#0C363A]" onClick={() => onPlay(video.videoUrl)}>
                <img src={video.cover} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Film /></span>
              </button>
              <div className="p-5">
                <h3 className="font-semibold text-[#0C363A]">{video.title}</h3>
              </div>
            </article>
          ))}
          {(metadata.testimonials_ar || []).slice(0, 6).map((quote: string, i: number) => (
            <blockquote key={i} className="rounded-lg border bg-white p-6 shadow-sm">
              <Star className="mb-4 h-5 w-5 fill-[#C18556] text-[#C18556]" />
              <p className="leading-8 text-muted-foreground">{quote}</p>
            </blockquote>
          ))}
        </div>
      </CmsSection>
    );
  }

  return (
    <CmsSection title={title} body={body} flipped={index % 2 === 1}>
      {block.media_url && (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          {block.media_url.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={block.media_url} controls className="w-full" />
          ) : (
            <img src={block.media_url} alt={title} className="max-h-[560px] w-full object-cover" loading="lazy" />
          )}
        </div>
      )}
    </CmsSection>
  );
}

function CmsSection({ title, body, children, flipped }: { title?: string; body?: string; children?: React.ReactNode; flipped?: boolean }) {
  return (
    <section className={cn("grid gap-8", children && "lg:grid-cols-[0.8fr_1.2fr]", flipped && "lg:grid-cols-[1.2fr_0.8fr]")}>
      <div className={cn(flipped && "lg:order-2")}>
        {title && <h2 className="text-3xl font-semibold text-[#0C363A] md:text-5xl">{title}</h2>}
        {body && <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">{body}</p>}
      </div>
      {children && <div>{children}</div>}
    </section>
  );
}

function ContactForm({ blocks, lang }: { blocks: ContentBlock[]; lang: "ar" | "en" }) {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const contact = useMemo(() => blocks.find((block) => block.block_type === "contact")?.metadata?.contacts || {}, [blocks]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم إرسال رسالتك" : "Message sent");
    setForm({ name: "", phone: "", message: "" });
  }

  return (
    <section className="grid gap-8 rounded-xl bg-[#0C363A] p-6 text-white md:p-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 className="text-3xl font-semibold">{lang === "ar" ? "تواصل معنا" : "Contact us"}</h2>
        <div className="mt-6 grid gap-3 text-white/75">
          {(contact.phones || []).map((phone: string) => <a key={phone} href={`tel:${phone}`} dir="ltr" className="flex items-center gap-2"><Phone size={16} /> {phone}</a>)}
          {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2"><Mail size={16} /> {contact.email}</a>}
          <div className="mt-4 flex gap-3">
            {contact.facebook && <a href={contact.facebook} target="_blank" rel="noreferrer"><Facebook /></a>}
            {contact.instagram && <a href={contact.instagram} target="_blank" rel="noreferrer"><Instagram /></a>}
            {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /></a>}
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <Input placeholder={lang === "ar" ? "الاسم" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder={lang === "ar" ? "رقم الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <Textarea placeholder={lang === "ar" ? "رسالتك" : "Your message"} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <button className="btn-gold justify-self-start" disabled={busy}>{busy ? "..." : lang === "ar" ? "إرسال" : "Send"}</button>
      </form>
    </section>
  );
}

function pick(lang: "ar" | "en", en?: string | null, ar?: string | null) {
  return lang === "ar" ? ar || en || "" : en || ar || "";
}
