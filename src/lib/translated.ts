import type { Locale } from "../../shared/i18n";
import type { Translations } from "../../shared/types";

export function translatedName(defaultName: string, translations: Translations, locale: Locale): string {
  if (locale === "en") return defaultName;
  return translations.es?.name || defaultName;
}

export function translatedDescription(
  defaultDescription: string | null,
  translations: Translations,
  locale: Locale
): string | null {
  if (locale === "en") return defaultDescription;
  return translations.es?.description || defaultDescription;
}
