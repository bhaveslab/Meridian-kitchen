// wa.me click-to-chat links take digits only: country code + number, no
// "+", spaces, or dashes. restaurants.phone stays human-readable
// (e.g. "+504 9579-8776") for potential display use elsewhere, so the
// digit-stripping happens here rather than at the data layer.
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
