import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/realContent";
import {
  PROJECTS,
  REVIEW_VIDEOS,
  SERVICES_AR,
  SERVICES_EN,
  SITE,
  TEAM,
  TESTIMONIALS_AR,
  VIDEO_PROJECTS,
} from "@/data/site";

const db = supabase as any;

export type CmsService = {
  id: string;
  slug: string;
  num: string;
  title: string;
  desc: string;
  detail?: string;
  icon?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export type CmsProject = {
  id: string;
  kind: "img" | "video";
  portfolioKind?: "design" | "execution";
  name: string;
  nameAr: string;
  type: string;
  typeAr: string;
  area?: string;
  areaNumber?: number | null;
  areaRange?: string | null;
  desc?: string;
  descAr?: string;
  img?: string;
  cover?: string;
  videoUrl?: string;
  videoSourceType?: "local" | "youtube" | "vimeo";
  pdf?: string;
  pdfFiles?: { title: string; url: string }[];
  externalUrl?: string;
  images?: string[];
  mediaItems?: {
    id: string;
    url: string;
    role: string;
    title_en?: string | null;
    title_ar?: string | null;
    alt_en?: string | null;
    alt_ar?: string | null;
    media_type: string;
  }[];
  tour360Url?: string;
};

function normalizeArabicDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabic.indexOf(digit);
    if (arabicIndex >= 0) return String(arabicIndex);
    const persianIndex = persian.indexOf(digit);
    return persianIndex >= 0 ? String(persianIndex) : digit;
  });
}

export function parseAreaNumber(area?: string | null) {
  if (!area) return null;
  const normalized = normalizeArabicDigits(String(area));
  const match = normalized.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return Number(match[0].replace(",", "."));
}

export type CmsAreaRange = {
  id: string;
  titleAr: string;
  titleEn: string;
  min: number | null;
  max: number | null;
  imageUrl?: string;
};

export const defaultAreaRanges: CmsAreaRange[] = [
  { id: "less-than-150", titleAr: "أقل من 150 م²", titleEn: "Less than 150 m²", min: 0, max: 149, imageUrl: "" },
  { id: "150-to-200", titleAr: "من 150 إلى 200 م²", titleEn: "150 to 200 m²", min: 150, max: 200, imageUrl: "" },
  { id: "200-to-300", titleAr: "من 200 إلى 300 م²", titleEn: "200 to 300 m²", min: 201, max: 300, imageUrl: "" },
  { id: "more-than-300", titleAr: "أكثر من 300 م²", titleEn: "More than 300 m²", min: 301, max: null, imageUrl: "" },
];

export function formatAreaValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = typeof value === "number" ? value : parseAreaNumber(String(value));
  if (parsed === null || Number.isNaN(parsed)) return "";
  return `${parsed} م²`;
}

export function getAreaRangeForValue(area: number | string | null | undefined, ranges: CmsAreaRange[]) {
  const areaNumber = typeof area === "number" ? area : parseAreaNumber(area);
  if (areaNumber === null || Number.isNaN(areaNumber)) return null;

  return (
    ranges.find((range) => {
      const minMatch = range.min === null || range.min === undefined || areaNumber >= range.min;
      const maxMatch = range.max === null || range.max === undefined || areaNumber <= range.max;
      return minMatch && maxMatch;
    }) || null
  );
}

export function getDefaultAreaForRange(range?: CmsAreaRange | null) {
  if (!range) return "";
  return formatAreaValue(range.min ?? 0);
}

export function countProjectsByRange<T extends { area?: string | null; project_kind?: string | null; video_url?: string | null }>(
  projects: T[],
  ranges: CmsAreaRange[]
) {
  return ranges.reduce<Record<string, number>>((acc, range) => {
    acc[range.id] = projects.filter((project) => {
      const kind = project.project_kind || (project.video_url ? "execution" : "design");
      return kind === "design" && getAreaRangeForValue(project.area, [range])?.id === range.id;
    }).length;
    return acc;
  }, {});
}

export async function getCmsAreaRanges(): Promise<CmsAreaRange[]> {
  const { data, error } = await db
    .from("cms_sections")
    .select("metadata")
    .eq("page_slug", "portfolio")
    .eq("section_key", "area-ranges")
    .maybeSingle();

  if (error || !data || !data.metadata || !Array.isArray(data.metadata.ranges)) {
    return defaultAreaRanges;
  }
  return data.metadata.ranges as CmsAreaRange[];
}

export function getAreaRangeId(area?: string | null) {
  return getAreaRangeForValue(area, defaultAreaRanges)?.id || null;
}

function getVideoSourceType(url?: string | null): CmsProject["videoSourceType"] {
  if (!url) return "local";
  if (/youtu\.be|youtube\.com/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "local";
}

function getFileTitle(url?: string | null) {
  if (!url) return "";
  const cleanUrl = url.split("?")[0].split("#")[0];
  const lastSegment = cleanUrl.split("/").filter(Boolean).pop() || "";
  const decoded = decodeURIComponent(lastSegment);
  return decoded
    .replace(/\.(mp4|webm|mov|m4v)$/i, "")
    .replace(/-thumb$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function getProjectPreviewMedia(project: any): { url: string; type: "image" | "video"; videoUrl?: string } | null {
  if (!project) return null;

  const mediaItems = Array.isArray(project.mediaItems)
    ? project.mediaItems
    : Array.isArray(project.media_items)
      ? project.media_items
      : [];

  const cover =
    project.cover_url ||
    project.coverUrl ||
    project.cover ||
    project.img ||
    project.image_url ||
    mediaItems.find((item: any) => item?.media_type === "image" && ["cover", "main", "gallery"].includes(item.role || "gallery"))?.url ||
    mediaItems.find((item: any) => item?.media_type === "image")?.url;

  if (cover) {
    const url = resolveMediaUrl(cover) || cover;
    return { url, type: "image" };
  }

  const video =
    project.video_url ||
    project.videoUrl ||
    mediaItems.find((item: any) => item?.media_type === "video")?.url;

  if (video) {
    const url = resolveMediaUrl(video) || video;
    return { url, type: "video", videoUrl: url };
  }

  return null;
}

export type CmsTeamMember = {
  id: string;
  slug?: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  department: string;
  bio?: string;
  bioAr?: string;
  imageUrl?: string;
  socialLinks?: Record<string, string>;
};

export type CmsClientReview = {
  id: string;
  name: string;
  nameAr: string;
  client_name_en?: string;
  client_name_ar?: string;
  role: string;
  roleAr: string;
  quote: string;
  quoteAr: string;
  rating: number;
  imageUrl?: string;
  image_url?: string;
  videoUrl?: string;
  video_url?: string;
  videoCoverUrl?: string;
  video_cover_url?: string;
};

export type CmsContact = {
  phones: string[];
  whatsapp: string;
  email: string;
  addressEn?: string;
  addressAr?: string;
  mapUrl?: string;
  socialLinks: Record<string, string>;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
};

export type CmsSectionMedia = {
  id: string;
  role: string;
  mediaType: string;
  url: string;
  titleEn?: string;
  titleAr?: string;
  altEn?: string;
  altAr?: string;
};

export type CmsSection = {
  id: string;
  pageSlug: string;
  sectionKey: string;
  sectionNameEn: string;
  sectionNameAr: string;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  ctaLabelEn?: string;
  ctaLabelAr?: string;
  ctaUrl?: string;
  media: CmsSectionMedia[];
  metadata?: any;
};

export function fallbackServices(lang: "ar" | "en"): CmsService[] {
  const services = lang === "ar" ? SERVICES_AR : SERVICES_EN;
  return services.map((service) => ({
    id: service.num,
    slug: `service-${service.num}`,
    num: service.num,
    title: service.title,
    desc: service.desc,
  }));
}

export function fallbackProjects(): CmsProject[] {
  return [
    ...PROJECTS.map((project) => ({
      kind: "img" as const,
      portfolioKind: "design" as const,
      id: project.id,
      name: project.name,
      nameAr: project.nameAr,
      type: project.type,
      typeAr: project.typeAr,
      area: project.area,
      areaNumber: parseAreaNumber(project.area),
      areaRange: getAreaRangeId(project.area),
      desc: project.desc,
      descAr: project.descAr,
      img: resolveMediaUrl(project.img),
      pdf: resolveMediaUrl(project.pdf),
      pdfFiles: project.pdf ? [{ title: "ملف المشروع PDF", url: resolveMediaUrl(project.pdf) || project.pdf }] : [],
      images: project.images?.map((image) => resolveMediaUrl(image) || image),
      mediaItems: project.images?.map((image, idx) => ({
        id: `fallback-${idx}`,
        url: resolveMediaUrl(image) || image,
        role: "gallery",
        title_en: "",
        title_ar: "",
        media_type: "image",
      })) || [],
    })),
    ...VIDEO_PROJECTS.map((project) => ({
      kind: "video" as const,
      portfolioKind: "execution" as const,
      id: project.id,
      name: getFileTitle(project.videoUrl) || project.name,
      nameAr: getFileTitle(project.videoUrl) || project.nameAr,
      type: project.type,
      typeAr: project.typeAr,
      area: project.area,
      areaNumber: parseAreaNumber(project.area),
      areaRange: getAreaRangeId(project.area),
      videoUrl: resolveMediaUrl(project.videoUrl),
      videoSourceType: getVideoSourceType(project.videoUrl),
      cover: resolveMediaUrl(project.cover),
      mediaItems: [],
    })),
  ];
}

export function fallbackTeam(): CmsTeamMember[] {
  return [
    ...TEAM.owners.map((member, index) => ({ ...member, id: `owner-${index}`, department: "owners" })),
    ...TEAM.accounting.map((member, index) => ({ ...member, id: `accounting-${index}`, department: "accounting" })),
    ...TEAM.site.map((member, index) => ({ ...member, id: `site-${index}`, department: "site" })),
    ...TEAM.design.map((member, index) => ({ ...member, id: `design-${index}`, department: "design" })),
  ];
}

export function fallbackReviews(): CmsClientReview[] {
  return TESTIMONIALS_AR.map((quote, index) => ({
    id: `fallback-review-${index}`,
    name: `Tact Client ${index + 1}`,
    nameAr: "عميل تاكت",
    role: "Client",
    roleAr: "عميل",
    quote,
    quoteAr: quote,
    rating: 5,
  }));
}

export function fallbackReviewVideos() {
  return REVIEW_VIDEOS.map((video) => ({
    ...video,
    videoUrl: resolveMediaUrl(video.videoUrl) || video.videoUrl,
    cover: resolveMediaUrl(video.cover) || video.cover,
  }));
}

export function fallbackContact(): CmsContact {
  return {
    phones: SITE.phones,
    whatsapp: SITE.whatsapp,
    email: SITE.email,
    socialLinks: {
      facebook: SITE.facebook,
      instagram: SITE.instagram,
      tiktok: SITE.tiktok,
      youtube: "",
      linkedin: "",
      twitter: "",
    },
  };
}

export async function getCmsServices(lang: "ar" | "en") {
  const { data, error } = await db.from("cms_services").select("*").eq("visible", true).order("sort_order");
  if (error || !data?.length) return fallbackServices(lang);
  return data.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    num: row.number_label || "",
    title: lang === "ar" ? row.title_ar || row.title_en : row.title_en || row.title_ar,
    desc: lang === "ar" ? row.short_ar || row.short_en || "" : row.short_en || row.short_ar || "",
    detail: lang === "ar" ? row.detail_ar || row.detail_en || "" : row.detail_en || row.detail_ar || "",
    icon: row.icon,
    imageUrl: resolveMediaUrl(row.image_url),
    videoUrl: resolveMediaUrl(row.video_url),
  })) as CmsService[];
}

export async function getCmsProjects() {
  const [{ data, error }, mediaRes] = await Promise.all([
    db.from("cms_projects").select("*").eq("visible", true).order("sort_order"),
    db.from("cms_project_media").select("*").eq("visible", true).order("sort_order"),
  ]);
  if (error || !data?.length) return fallbackProjects();
  const media = mediaRes.data ?? [];
  return data.map((row: any) => {
    const gallery = media
      .filter((item: any) => item.project_id === row.id && item.media_type === "image")
      .map((item: any) => resolveMediaUrl(item.url) || item.url);
    const pdfFiles = [
      row.pdf_url
        ? {
            title: row.title_ar ? `ملف ${row.title_ar}` : "ملف المشروع PDF",
            url: resolveMediaUrl(row.pdf_url) || row.pdf_url,
          }
        : null,
      ...media
        .filter((item: any) => item.project_id === row.id && item.media_type === "pdf")
        .map((item: any) => ({
          title: item.title_ar || item.title_en || "ملف PDF",
          url: resolveMediaUrl(item.url) || item.url,
        })),
    ].filter(Boolean) as { title: string; url: string }[];
    const projectMedia = media
      .filter((item: any) => item.project_id === row.id)
      .map((item: any) => ({
        id: item.id,
        url: resolveMediaUrl(item.url) || item.url,
        role: item.role || "gallery",
        title_en: item.title_en,
        title_ar: item.title_ar,
        alt_en: item.alt_en,
        alt_ar: item.alt_ar,
        media_type: item.media_type,
      }));
    const isVideo = !!row.video_url;
    const areaNumber = parseAreaNumber(row.area);
    const videoFileTitle = isVideo ? getFileTitle(row.video_url) : "";
    const coverUrl = resolveMediaUrl(row.cover_url) || gallery[0] || "";
    return {
      id: row.id,
      kind: isVideo ? "video" : "img",
      portfolioKind: isVideo ? "execution" : "design",
      name: isVideo ? videoFileTitle || row.title_en : row.title_en,
      nameAr: isVideo ? videoFileTitle || row.title_ar : row.title_ar,
      type: row.category_en || "Project",
      typeAr: row.category_ar || row.category_en || "Project",
      area: row.area,
      areaNumber,
      areaRange: getAreaRangeId(row.area),
      desc: row.description_en,
      descAr: row.description_ar,
      img: coverUrl,
      cover: coverUrl,
      videoUrl: resolveMediaUrl(row.video_url),
      videoSourceType: getVideoSourceType(row.video_url),
      pdf: resolveMediaUrl(row.pdf_url),
      pdfFiles,
      externalUrl: row.external_url,
      images: gallery.length ? gallery : coverUrl ? [coverUrl] : [],
      mediaItems: projectMedia,
      tour360Url: row.tour360_url || "",
    } as CmsProject;
  });
}

export async function getCmsTeam() {
  const { data, error } = await db.from("cms_team_members").select("*").eq("visible", true).order("sort_order");
  if (error || !data?.length) return fallbackTeam();
  return data.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name_en,
    nameAr: row.name_ar,
    role: row.role_en || "",
    roleAr: row.role_ar || row.role_en || "",
    department: row.department || "team",
    bio: row.bio_en,
    bioAr: row.bio_ar,
    imageUrl: resolveMediaUrl(row.image_url),
    socialLinks: row.social_links || {},
  })) as CmsTeamMember[];
}

export async function getCmsReviews() {
  const { data, error } = await db.from("cms_client_testimonials").select("*").eq("visible", true).order("sort_order");
  if (error || !data?.length) return fallbackReviews();
  return data.map((row: any) => ({
    id: row.id,
    name: row.client_name_en || "Tact Client",
    nameAr: row.client_name_ar || row.client_name_en || "عميل تاكت",
    client_name_en: row.client_name_en,
    client_name_ar: row.client_name_ar,
    role: row.role_en || "Client",
    roleAr: row.role_ar || row.role_en || "عميل",
    quote: row.quote_en || row.quote_ar || "",
    quoteAr: row.quote_ar || row.quote_en || "",
    rating: row.rating || 5,
    imageUrl: resolveMediaUrl(row.image_url),
    image_url: resolveMediaUrl(row.image_url),
    videoUrl: resolveMediaUrl(row.video_url),
    video_url: resolveMediaUrl(row.video_url),
    videoCoverUrl: resolveMediaUrl(row.video_cover_url),
    video_cover_url: resolveMediaUrl(row.video_cover_url),
  })) as CmsClientReview[];
}

export async function getCmsContact() {
  const { data, error } = await db.from("cms_contact_settings").select("*").maybeSingle();
  if (error || !data) return fallbackContact();
  return {
    phones: data.phone_numbers || [],
    whatsapp: data.whatsapp || "",
    email: data.email || "",
    addressEn: data.address_en,
    addressAr: data.address_ar,
    mapUrl: data.map_url,
    socialLinks: data.social_links || {},
    titleEn: data.title_en,
    titleAr: data.title_ar,
    bodyEn: data.body_en,
    bodyAr: data.body_ar,
  } as CmsContact;
}

export async function getCmsSections(pageSlug: string) {
  const [{ data, error }, mediaRes] = await Promise.all([
    db.from("cms_sections").select("*").eq("page_slug", pageSlug).eq("visible", true).order("sort_order"),
    db.from("cms_section_media").select("*").eq("visible", true).order("sort_order"),
  ]);
  if (error || !data?.length) return [] as CmsSection[];
  const mediaRows = mediaRes.data ?? [];
  return data.map((row: any) => ({
    id: row.id,
    pageSlug: row.page_slug,
    sectionKey: row.section_key,
    sectionNameEn: row.section_name_en,
    sectionNameAr: row.section_name_ar,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    bodyEn: row.body_en,
    bodyAr: row.body_ar,
    ctaLabelEn: row.cta_label_en,
    ctaLabelAr: row.cta_label_ar,
    ctaUrl: row.cta_url,
    metadata: row.metadata,
    media: mediaRows
      .filter((item: any) => item.section_id === row.id)
      .map((item: any) => ({
        id: item.id,
        role: item.role,
        mediaType: item.media_type,
        url: resolveMediaUrl(item.url) || item.url,
        titleEn: item.title_en,
        titleAr: item.title_ar,
        altEn: item.alt_en,
        altAr: item.alt_ar,
      })),
  })) as CmsSection[];
}
