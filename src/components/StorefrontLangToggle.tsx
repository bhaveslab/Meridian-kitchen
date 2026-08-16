import { useLanguage } from "../lib/LanguageContext";

export default function StorefrontLangToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  return (
    <div className={`st-lang-toggle ${className ?? ""}`}>
      <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
      <button type="button" className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>
        ES
      </button>
    </div>
  );
}
