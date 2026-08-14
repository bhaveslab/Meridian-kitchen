import { formatHnlEstimate, formatPrice } from "../lib/format";

interface Props {
  cents: number;
  exchangeRate?: number | null;
  className?: string;
}

// USD is always the real charge amount; HNL here is a converted estimate only.
export default function Price({ cents, exchangeRate, className }: Props) {
  if (!exchangeRate) {
    return <span className={className}>{formatPrice(cents)}</span>;
  }
  return (
    <span className={className}>
      {formatPrice(cents)} USD <span className="price-estimate">(~{formatHnlEstimate(cents, exchangeRate)})</span>
    </span>
  );
}
