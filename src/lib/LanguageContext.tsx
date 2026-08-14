import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, translate, type Locale, type UiStringKey } from "../../shared/i18n";

const STORAGE_KEY = "meridian-kitchen-locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: UiStringKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "es" ? "es" : DEFAULT_LOCALE;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t: (key) => translate(key, locale),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
