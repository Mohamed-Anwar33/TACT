import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, TranslationKey } from "./translations";

type Lang = "ar" | "en";
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: TranslationKey) => string; dir: "rtl" | "ltr"; }
export const LangCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("tact-lang") as Lang) || "ar");
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("tact-lang", lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (k: TranslationKey) => (translations[lang][k] ?? translations.en[k] ?? k) as string;

  return <LangCtx.Provider value={{ lang, setLang, t, dir }}>{children}</LangCtx.Provider>;
}

export const useLang = () => {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};
