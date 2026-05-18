import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageProvider";

const NotFound = () => {
  const { lang } = useLang();
  return (
    <main className="min-h-screen flex items-center justify-center bg-teal-deep text-ivory relative overflow-hidden">
      <div className="absolute inset-0 arch-grid opacity-25" />
      <div className="container-luxe relative text-center">
        <div className="font-serif text-[120px] md:text-[200px] leading-none text-gold">404</div>
        <h1 className="font-serif text-3xl mt-4">{lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <Link to="/" className="btn-gold mt-10 inline-flex">{lang === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
      </div>
    </main>
  );
};

export default NotFound;
