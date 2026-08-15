import { formatHnlEstimate, formatPrice } from "../lib/format";

interface Props {
  cents: number;
  exchangeRate?: number | null;
  className?: string;
}

// USD is always the real charge amount; HNL here is a converted estimate only.
export default function StorefrontPrice({ cents, exchangeRate, className }: Props) {
  return (
    <span className={`st-price ${className ?? ""}`}>
      {formatPrice(cents)}
      {exchangeRate ? (
        <span className="st-price-estimate"> (~{formatHnlEstimate(cents, exchangeRate)})</span>
      ) : null}
    </span>
  );
}
