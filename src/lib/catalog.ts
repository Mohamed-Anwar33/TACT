import { supabase } from "@/integrations/supabase/client";
import { PACKAGES } from "@/data/site";
import { PACKAGE_CONFIG_MAP } from "@/data/packageConfigMap";
import { resolveMediaUrl } from "@/lib/realContent";

export type CatalogPackage = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  price_label?: string | null;
  unit_label_en?: string | null;
  unit_label_ar?: string | null;
  badge_en?: string | null;
  badge_ar?: string | null;
  features_en: string[];
  features_ar: string[];
  cover_url?: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

export type CatalogOption = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  media?: CatalogOptionMedia[];
  sort_order: number;
};

export type CatalogOptionMedia = {
  id: string;
  media_type: string;
  url: string;
  alt_en?: string | null;
  alt_ar?: string | null;
  sort_order: number;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  options: CatalogOption[];
};

export type CatalogStyle = {
  id: string;
  package_id: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  categories: CatalogCategory[];
};

export type PaymentMethod = {
  id: string;
  type: string;
  label_en: string;
  label_ar: string;
  account_name?: string | null;
  ipa?: string | null;
  phone?: string | null;
  account_number?: string | null;
  qr_url?: string | null;
  instructions_en?: string | null;
  instructions_ar?: string | null;
  sort_order: number;
  active: boolean;
};

const db = supabase as any;

const CATEGORY_ORDER_FALLBACK: Record<string, number> = {
  "style-preview": 0,
  "ceiling": 10,
  "ceilings": 10,
  "suspended-ceilings": 10,
  "flooring": 20,
  "floors": 20,
  "walls": 30,
  "wall-finishes": 30,
  "doors": 40,
  "internal-doors": 40,
  "plumbing": 50,
  "fixtures": 50,
  "windows": 70,
  "ac": 80,
  "air-conditioning": 80,
  "heating": 60,
  "water-heaters": 60,
  // Clean Arabic keys
  "أسقف": 10,
  "الأسقف": 10,
  "الأسقف المعلقة": 10,
  "أرضيات": 20,
  "الأرضيات": 20,
  "حوائط": 30,
  "الحوائط": 30,
  "دهانات": 30,
  "أبواب": 40,
  "الأبواب": 40,
  "الأبواب الداخلية": 40,
  "سباكة": 50,
  "السباكة": 50,
  "سخانات": 60,
  "السخانات": 60,
  "شبابيك": 70,
  "الشبابيك": 70,
  "تكييفات": 80,
  "التكييفات": 80,
  "تكييف": 80,
  // Mojibake fallback keys
  "Ø§Ù„Ø£Ø³Ù‚Ù ": 10,
  "Ø£Ø³Ù‚Ù ": 10,
  "Ø§Ù„Ø£Ø³Ù‚Ù  Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©": 10,
  "Ø§Ù„Ø£Ø±%D8%B6%D9%8A%D8%A7%D8%AA": 20, // URL/UTF-8 encoded safety check
  "Ø§Ù„Ø£Ø±Ø¶ÙŠØ§Øª": 20,
  "Ø£Ø±Ø¶ÙŠØ§Øª": 20,
  "Ø§Ù„Ø­ÙˆØ§Ø¦Ø·": 30,
  "Ø­ÙˆØ§Ø¦Ø·": 30,
  "Ø¯Ù‡Ø§Ù†Ø§Øª": 30,
  "Ø§Ù„Ø£Ø¨ÙˆØ§Ø¨": 40,
  "Ø§Ù„Ø£Ø¨ÙˆØ§Ø¨ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©": 40,
  "Ø§Ù„Ø³Ø¨Ø§ÙƒØ©": 50,
  "Ø³Ø¨Ø§ÙƒØ©": 50,
  "Ø´Ø¨Ø§Ø¨ÙŠÙƒ": 70,
  "ØªÙƒÙŠÙŠÙ Ø§Øª": 80,
  "Ø³Ø®Ø§Ù†Ø§Øª": 60,
};

export function getPackageCategoryWeight(category?: Pick<CatalogCategory, "slug" | "name_ar" | "name_en" | "sort_order"> | null) {
  if (!category) return 999;
  
  // Prioritize database sort_order if valid (> 0)
  if (typeof category.sort_order === "number" && category.sort_order > 0) {
    return category.sort_order;
  }
  
  const candidates = [category.slug, category.name_ar, category.name_en].filter(Boolean).map((value) => String(value).trim());
  
  // 1. First, check direct matches in fallback map
  for (const candidate of candidates) {
    const direct = CATEGORY_ORDER_FALLBACK[candidate] ?? CATEGORY_ORDER_FALLBACK[candidate.toLowerCase()];
    if (direct !== undefined) return direct;
  }
  
  // 2. Next, check partial matching in fallback keys
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const [key, weight] of Object.entries(CATEGORY_ORDER_FALLBACK)) {
      const keyLower = key.toLowerCase();
      if (lower.includes(keyLower) || keyLower.includes(lower)) return weight;
    }
  }
  
  return 999;
}

export function sortPackageCategories<T extends Pick<CatalogCategory, "slug" | "name_ar" | "name_en" | "sort_order">>(categories: T[]) {
  return [...categories].sort((a, b) => {
    const weight = getPackageCategoryWeight(a) - getPackageCategoryWeight(b);
    if (weight !== 0) return weight;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export const fallbackPackages = (): CatalogPackage[] =>
  PACKAGES.map((p, index) => ({
    id: p.id,
    name_en: p.name,
    name_ar: p.nameAr,
    description_en: p.desc,
    description_ar: p.descAr,
    price_label: p.price,
    unit_label_en: "EGP / m2",
    unit_label_ar: "جنيه / م²",
    badge_en: p.badgeEn ?? null,
    badge_ar: p.badgeAr ?? null,
    features_en: p.featuresEn ?? [],
    features_ar: p.featuresAr ?? [],
    featured: !!p.featured,
    published: true,
    sort_order: index + 1,
  }));

export function normalizePackageImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return imageUrl ?? null;

  let url = imageUrl;
  const isEconomyPackage = url.includes("/Packages/economy-");
  const usesSingleDoorFolder = url.includes("/Packages/medium-") || url.includes("/Packages/luxury-");

  if (isEconomyPackage && (url.includes("/modern/Walls/2.webp") || url.endsWith("/modern/Walls/2.webp"))) {
    url = url.replace("/modern/Walls/2.webp", "/modern/Walls/ARTWORK.webp");
  } else if (isEconomyPackage && (url.includes("/modern/Walls/1.webp") || url.endsWith("/modern/Walls/1.webp"))) {
    url = url.replace("/modern/Walls/1.webp", "/modern/Walls/PAINT.webp");
  } else if (!isEconomyPackage && url.includes("/modern/Walls/PAINT.webp")) {
    url = url.replace("/modern/Walls/PAINT.webp", "/modern/Walls/1.webp");
  } else if (!isEconomyPackage && url.includes("/modern/Walls/ARTWORK.webp")) {
    url = url.replace("/modern/Walls/ARTWORK.webp", "/modern/Walls/2.webp");
  }

  if (isEconomyPackage && url.includes("/Doors/single/") && !url.includes("/Doors/Classic/")) {
    url = url.replace("/Doors/single/", "/Doors/");
  } else if (
    usesSingleDoorFolder &&
    url.includes("/Doors/1.webp") &&
    !url.includes("/Doors/single/1.webp") &&
    !url.includes("/Doors/Classic/")
  ) {
    url = url.replace("/Doors/1.webp", "/Doors/single/1.webp");
  } else if (
    usesSingleDoorFolder &&
    url.includes("/Doors/2.webp") &&
    !url.includes("/Doors/single/2.webp") &&
    !url.includes("/Doors/Classic/")
  ) {
    url = url.replace("/Doors/2.webp", "/Doors/single/2.webp");
  }

  if (url.includes("/medium/styles/styles/modern/Flooring/1.webp")) {
    url = url.replace("/medium/styles/styles/modern/Flooring/1.webp", "/medium/styles/styles/modern/Flooring/Porcelien/بورسلين.webp");
  } else if (url.includes("/medium/styles/styles/modern/Flooring/2.webp")) {
    url = url.replace("/medium/styles/styles/modern/Flooring/2.webp", "/medium/styles/styles/modern/Flooring/Ceramic/سيراميك شبيه الباركيه.webp");
  }

  if (url.includes("/luxury/styles/styles/modern/modern/Flooring/1.webp")) {
    url = url.replace("/luxury/styles/styles/modern/modern/Flooring/1.webp", "/luxury/styles/styles/modern/modern/Flooring/Marble/رخام.webp");
  } else if (url.includes("/luxury/styles/styles/modern/modern/Flooring/2.webp") || url.includes("/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب طبيعي.webp")) {
    url = url.replace("/luxury/styles/styles/modern/modern/Flooring/2.webp", "/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب باركيه.webp");
    url = url.replace("/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب طبيعي.webp", "/luxury/styles/styles/modern/modern/Flooring/Parquite/خشب باركيه.webp");
  }

  if (url.includes("/medium/styles/styles/classic/")) {
    url = url.replace("/medium/styles/styles/classic/", "/medium/styles/styles/neoclassic/");
  }
  if (usesSingleDoorFolder && url.includes("/neoclassic/Doors/1.webp")) {
    url = url.replace("/neoclassic/Doors/1.webp", "/neoclassic/Doors/single/1.webp");
  }

  return resolveMediaUrl(url);
}

export const fallbackPackageStyles = (packageId: string): CatalogStyle[] => {
  const styles = PACKAGE_CONFIG_MAP[packageId] ?? PACKAGE_CONFIG_MAP.economy;
  return styles.map((style, styleIndex) => ({
    id: style.styleId,
    package_id: packageId,
    name_en: style.styleNameEn,
    name_ar: style.styleNameAr,
    sort_order: styleIndex + 1,
    categories: sortPackageCategories(style.sections.map((section, sectionIndex) => ({
      id: section.id,
      slug: section.id,
      name_en: section.nameEn,
      name_ar: section.nameAr,
      sort_order: sectionIndex + 1,
      options: section.options.map((option, optionIndex) => {
        const imageUrl = normalizePackageImageUrl(option.img);
        return {
          id: option.id,
          name_en: option.nameEn,
          name_ar: option.nameAr,
          description_en: option.descEn,
          description_ar: option.descAr,
          image_url: imageUrl,
          media: imageUrl
            ? [
                {
                  id: `${option.id}-main`,
                  media_type: "image",
                  url: imageUrl,
                  alt_en: option.nameEn,
                  alt_ar: option.nameAr,
                  sort_order: 0,
                },
              ]
            : [],
          sort_order: optionIndex + 1,
        };
      }),
    }))),
  }));
};

const normalizeJsonList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
};

export async function getPackages(): Promise<CatalogPackage[]> {
  const { data, error } = await db
    .from("packages")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return fallbackPackages();

  return data.map((p: any) => ({
    ...p,
    cover_url: resolveMediaUrl(p.cover_url),
    features_en: normalizeJsonList(p.features_en),
    features_ar: normalizeJsonList(p.features_ar),
  }));
}

export async function getPackage(packageId: string): Promise<CatalogPackage | null> {
  const packages = await getPackages();
  return packages.find((p) => p.id === packageId) ?? null;
}

export async function getPackageStyles(packageId: string): Promise<CatalogStyle[]> {
  const { data: styles, error } = await db
    .from("package_styles")
    .select("*")
    .eq("package_id", packageId)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !styles?.length) return fallbackPackageStyles(packageId);

  const styleIds = styles.map((style: any) => style.id);
  const { data: categories } = await db
    .from("package_categories")
    .select("*")
    .in("style_id", styleIds)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const categoryIds = (categories ?? []).map((category: any) => category.id);
  const { data: options } = categoryIds.length
    ? await db
        .from("package_options")
        .select("*")
        .in("category_id", categoryIds)
        .eq("published", true)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const optionIds = (options ?? []).map((option: any) => option.id);
  const { data: media } = optionIds.length
    ? await db
        .from("package_option_media")
        .select("*")
        .in("option_id", optionIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  return styles.map((style: any) => ({
    id: style.id,
    package_id: style.package_id,
    name_en: style.name_en,
    name_ar: style.name_ar,
    sort_order: style.sort_order ?? 0,
    categories: sortPackageCategories((categories ?? [])
      .filter((category: any) => category.style_id === style.id)
      .map((category: any) => ({
        id: category.id,
        slug: category.slug,
        name_en: category.name_en,
        name_ar: category.name_ar,
        sort_order: category.sort_order ?? 0,
        options: (options ?? [])
          .filter((option: any) => option.category_id === category.id)
          .map((option: any) => {
            const optionMedia = (media ?? [])
              .filter((item: any) => item.option_id === option.id)
              .map((item: any) => ({
                id: item.id,
                media_type: item.media_type,
                url: normalizePackageImageUrl(item.url) ?? item.url,
                alt_en: item.alt_en,
                alt_ar: item.alt_ar,
                sort_order: item.sort_order ?? 0,
              }));
            const imageUrl = normalizePackageImageUrl(option.image_url) ?? optionMedia[0]?.url ?? null;
            return {
              id: option.id,
              name_en: option.name_en,
              name_ar: option.name_ar,
              description_en: option.description_en,
              description_ar: option.description_ar,
              image_url: imageUrl,
              media: optionMedia.length
                ? optionMedia
                : imageUrl
                  ? [
                      {
                        id: `${option.id}-main`,
                        media_type: "image",
                        url: imageUrl,
                        alt_en: option.name_en,
                        alt_ar: option.name_ar,
                        sort_order: 0,
                      },
                    ]
                  : [],
              sort_order: option.sort_order ?? 0,
            };
          }),
      }))),
  }));
}

export async function getUnlockedPackageIds(userId?: string | null, legacyUnlocked = false): Promise<string[]> {
  if (!userId) return [];

  const { data, error } = await db
    .from("package_unlocks")
    .select("package_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!error && data?.length) return data.map((row: any) => row.package_id);
  return legacyUnlocked ? fallbackPackages().map((pkg) => pkg.id) : [];
}

export async function isPackageUnlocked(userId: string | null | undefined, packageId: string, legacyUnlocked = false) {
  const unlocked = await getUnlockedPackageIds(userId, legacyUnlocked);
  return unlocked.includes(packageId);
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await db
    .from("payment_methods")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return [
      {
        id: "fallback-instapay",
        type: "instapay",
        label_en: "InstaPay",
        label_ar: "إنستاباي",
        account_name: "Tact Architecture",
        ipa: "tact@instapay",
        phone: "01032473330",
        instructions_en: "Transfer the deposit, then submit the reference and send the receipt on WhatsApp.",
        instructions_ar: "حوّل العربون ثم سجل رقم العملية وأرسل الإيصال على واتساب.",
        sort_order: 1,
        active: true,
      },
    ];
  }

  return data ?? [];
}
