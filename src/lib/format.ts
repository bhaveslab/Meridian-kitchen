export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// USD is always the canonical/charged amount; this is a display-only estimate.
export function formatHnlEstimate(usdCents: number, usdToHnlRate: number): string {
  return `L ${((usdCents / 100) * usdToHnlRate).toFixed(2)}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
