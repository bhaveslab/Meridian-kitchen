import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { getOrder } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { formatPrice } from "../../lib/format";

const STATUS_COPY: Record<string, string> = {
  received: "Your order has been received.",
  preparing: "The kitchen is preparing your order.",
  ready: "Your order is ready.",
  out_for_delivery: "Your order is out for delivery.",
  completed: "Order complete. Enjoy your meal!",
  cancelled: "This order was cancelled.",
};

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const fetcher = useCallback(() => getOrder(orderId!), [orderId]);
  const { data: order, error } = usePolling(fetcher, 4000);

  return (
    <main className="guest-page">
      <div className="confirmation">
        <h1>Order confirmation</h1>
        {error && <div className="error-banner">{error}</div>}
        {order && (
          <>
            {order.paymentStatus === "pending" && (
              <p className="order-meta">Confirming your payment…</p>
            )}
            {order.paymentStatus === "failed" && (
              <div className="error-banner">Payment failed. Please try ordering again.</div>
            )}
            <span className={`status-badge ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
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
