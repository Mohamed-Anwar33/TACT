import { MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useEffect, useState } from "react";
import { SITE } from "@/data/site";
import { fallbackContact, getCmsContact, type CmsContact } from "@/lib/publicCms";

function formatWhatsappNumber(num: string): string {
  let clean = num.replace(/\D/g, "");
  if (clean.startsWith("00")) {
    clean = clean.slice(2);
  }
  if (clean.startsWith("01") && clean.length === 11) {
    clean = "2" + clean;
  } else if (clean.startsWith("1") && clean.length === 10) {
    clean = "20" + clean;
  }
  return clean;
}

export default function WhatsAppFloat() {
  const { t, dir } = useLang();
  const [contact, setContact] = useState<CmsContact>(() => fallbackContact());
  useEffect(() => {
    let alive = true;
    getCmsContact().then((row) => {
      if (alive) setContact(row);
    });
    return () => {
      alive = false;
    };
  }, []);

  const whatsappNum = formatWhatsappNumber(contact.whatsapp || SITE.whatsapp);

  return (
    <a
      href={`https://wa.me/${whatsappNum}`}
      target="_blank"
      rel="noreferrer"
      aria-label={t("cta_whatsapp")}
      className={`fixed bottom-8 z-[150] ${dir === "rtl" ? "left-8" : "right-8"} group`}
    >
      <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping" />
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gold text-teal-deep shadow-gold transition-transform duration-500 group-hover:scale-110">
        <MessageCircle size={24} />
      </span>
    </a>
  );
}
