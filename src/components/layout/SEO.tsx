import { useEffect } from "react";
import { useLang } from "@/i18n/LanguageProvider";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  schemaData?: object;
}

export default function SEO({
  title,
  description,
  keywords,
  ogImage = "/logo.png",
  canonicalPath = "",
  schemaData,
}: SEOProps) {
  const { lang } = useLang();

  useEffect(() => {
    // 1. Title Tag
    const defaultTitle = lang === "ar"
      ? "تاكت للتصميم والتشطيب | Tact Architecture, Decoration & Furniture"
      : "Tact Architecture, Decoration & Furniture | Elite Finishing";
    document.title = title ? `${title} | ${lang === "ar" ? "تاكت" : "Tact"}` : defaultTitle;

    // Helper to update or create meta tags
    const updateMeta = (name: string, value: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    // 2. Meta Description
    const defaultDesc = lang === "ar"
      ? "تاكت للتصميم المعماري والداخلي والتشطيبات المتكاملة في مصر. تصميمات راقية، تنفيذ فعلي، باقات تشطيب، وأعمال سابقة بجودة صور واضحة وتجربة فاخرة."
      : "Tact Architecture & Design in Egypt. Elite interior designs, turnkey finishing packages, and a high-definition project gallery.";
    updateMeta("description", description || defaultDesc);

    // 3. Meta Keywords
    const defaultKeywords = lang === "ar"
      ? "تاكت, تشطيبات, تصميم داخلي, تصميم معماري, ديكور, فرش, تشطيب شقق, تشطيب فيلات"
      : "Tact, finishing packages, interior design Egypt, decoration, landscaping, luxury apartments";
    updateMeta("keywords", keywords || defaultKeywords);

    // 4. Open Graph Tags
    updateMeta("og:title", title ? `${title} | Tact` : defaultTitle, true);
    updateMeta("og:description", description || defaultDesc, true);
    updateMeta("og:image", ogImage.startsWith("http") ? ogImage : `${window.location.origin}${ogImage}`, true);
    updateMeta("og:url", window.location.href, true);

    // 5. Twitter Card Tags
    updateMeta("twitter:title", title ? `${title} | Tact` : defaultTitle);
    updateMeta("twitter:description", description || defaultDesc);
    updateMeta("twitter:image", ogImage.startsWith("http") ? ogImage : `${window.location.origin}${ogImage}`);

    // 6. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", `${window.location.origin}${canonicalPath || window.location.pathname}`);

    // 7. Schema JSON-LD Script Tag
    let schemaScript = document.getElementById("seo-schema-jsonld");
    if (schemaScript) {
      schemaScript.remove();
    }
    if (schemaData) {
      schemaScript = document.createElement("script");
      schemaScript.setAttribute("type", "application/ld+json");
      schemaScript.setAttribute("id", "seo-schema-jsonld");
      schemaScript.textContent = JSON.stringify(schemaData);
      document.head.appendChild(schemaScript);
    }

    return () => {
      // Clean up dynamic schema tags
      const currentSchema = document.getElementById("seo-schema-jsonld");
      if (currentSchema) {
        currentSchema.remove();
      }
    };
  }, [title, description, keywords, ogImage, canonicalPath, schemaData, lang]);

  return null;
}
