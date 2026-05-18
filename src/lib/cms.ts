import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/realContent";

const db = supabase as any;

export type SitePage = {
  slug: string;
  title_en: string;
  title_ar: string;
  sort_order: number;
  published: boolean;
};

export type ContentBlock = {
  id: string;
  page_slug: string;
  block_key: string;
  block_type: string;
  title_en: string | null;
  title_ar: string | null;
  body_en: string | null;
  body_ar: string | null;
  media_url: string | null;
  metadata: any;
  sort_order: number;
  published: boolean;
};

const pageFallback: Record<string, SitePage> = {
  home: { slug: "home", title_ar: "الرئيسية", title_en: "Home", sort_order: 1, published: true },
  about: { slug: "about", title_ar: "من نحن", title_en: "About", sort_order: 2, published: true },
  services: { slug: "services", title_ar: "خدماتنا", title_en: "Services", sort_order: 3, published: true },
  portfolio: { slug: "portfolio", title_ar: "أعمالنا", title_en: "Portfolio", sort_order: 4, published: true },
  team: { slug: "team", title_ar: "فريق العمل", title_en: "Team", sort_order: 5, published: true },
  testimonials: { slug: "testimonials", title_ar: "العملاء", title_en: "Clients", sort_order: 6, published: true },
  contact: { slug: "contact", title_ar: "تواصل معنا", title_en: "Contact", sort_order: 7, published: true },
};

export const corePageSlugs = Object.keys(pageFallback);

export async function getCorePages() {
  const { data, error } = await db
    .from("site_pages")
    .select("*")
    .in("slug", corePageSlugs)
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error || !data?.length) return Object.values(pageFallback);
  return data as SitePage[];
}

export async function getCmsPage(slug: string) {
  const [pageRes, blocksRes] = await Promise.all([
    db.from("site_pages").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
    db.from("content_blocks").select("*").eq("page_slug", slug).eq("published", true).order("sort_order", { ascending: true }),
  ]);

  return {
    page: (pageRes.data as SitePage | null) || pageFallback[slug] || pageFallback.home,
    blocks: ((blocksRes.data || []) as ContentBlock[])
      .filter(Boolean)
      .map((block) => ({ ...block, media_url: resolveMediaUrl(block.media_url) })),
  };
}

export function pickLang(lang: "ar" | "en", en?: string | null, ar?: string | null) {
  return lang === "ar" ? ar || en || "" : en || ar || "";
}
