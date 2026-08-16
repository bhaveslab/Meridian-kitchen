import { useLanguage } from "../lib/LanguageContext";
import { buildWhatsAppLink } from "../lib/whatsapp";

function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.17c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.71-.83.9-1.11.19-.29.38-.24.63-.15.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

export default function WhatsAppButton({
  phone,
  variant = "pill",
}: {
  phone: string | null | undefined;
  variant?: "pill" | "icon";
}) {
  const { t } = useLanguage();
  const href = buildWhatsAppLink(phone, t("whatsappMessage"));
  if (!href) return null;

  if (variant === "icon") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="st-whatsapp-icon" aria-label={t("whatsappCta")}>
        <WhatsAppGlyph />
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="st-pill st-pill-outline">
      <WhatsAppGlyph />
      {t("whatsappCta")}
    </a>
  );
}
