import { useCallback } from "react";
import { getOrder } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { formatPrice } from "../../lib/format";

const STATUS_COPY: Record<string, string> = {
  placed: "Your order has been sent to the kitchen.",
  in_progress: "The kitchen is preparing your order.",
  ready: "Your order is ready to be served!",
  served: "Enjoy your meal.",
  cancelled: "This order was cancelled. Please flag down staff if that's unexpected.",
};

export default function OrderStatusTracker({ orderId, tableLabel }: { orderId: string; tableLabel?: string }) {
  const fetcher = useCallback(() => getOrder(orderId), [orderId]);
  const { data: order, error } = usePolling(fetcher, 4000);

  return (
    <main className="guest-page">
      <div className="confirmation">
        <h1>Order sent{tableLabel ? ` — ${tableLabel}` : ""}</h1>
        {error && <div className="error-banner">{error}</div>}
        {order && (
          <>
            <span className={`status-badge ${order.status}`}>{order.status.replace("_", " ")}</span>
            <p>{STATUS_COPY[order.status]}</p>
            <ul className="order-items" style={{ textAlign: "left", maxWidth: 360, margin: "1.5rem auto" }}>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    <span className="qty">{item.quantity}×</span> {item.menuItemName}
                  </span>
                  <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
