import { useLanguage } from "../lib/LanguageContext";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="language-toggle">
      <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
      <button type="button" className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>
        ES
      </button>
    </div>
  );
}
