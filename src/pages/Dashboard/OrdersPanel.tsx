import { useCallback, useState } from "react";
import { getOrders, updateOrderStatus } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { formatTime, minutesSince } from "../../lib/format";
import { ACTIVE_ORDER_STATUSES } from "../../../shared/types";
import type { Order, OrderStatus } from "../../../shared/types";

function getNextStep(order: Order): { label: string; next: OrderStatus } | null {
  switch (order.status) {
    case "received":
      return { label: "Start preparing", next: "preparing" };
    case "preparing":
      return { label: "Mark ready", next: "ready" };
    case "ready":
      return order.fulfillmentType === "delivery"
        ? { label: "Out for delivery", next: "out_for_delivery" }
        : { label: "Complete", next: "completed" };
    case "out_for_delivery":
      return { label: "Complete", next: "completed" };
    default:
      return null;
  }
}

export default function OrdersPanel({ restaurantId }: { restaurantId: string }) {
  const fetcher = useCallback(
    () => getOrders({ restaurantId, statuses: ACTIVE_ORDER_STATUSES }),
    [restaurantId]
  );
  const { data: orders, error, refetch } = usePolling(fetcher, 4000);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function advance(order: Order) {
    const step = getNextStep(order);
    if (!step) return;
    setPendingId(order.id);
    try {
      await updateOrderStatus(order.id, step.next);
      refetch();
    } finally {
      setPendingId(null);
    }
  }

  async function cancel(order: Order) {
    setPendingId(order.id);
    try {
      await updateOrderStatus(order.id, "cancelled");
      refetch();
    } finally {
      setPendingId(null);
    }
  }

  const sorted = [...(orders ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      {sorted.length === 0 ? (
        <p className="empty-state">No active orders.</p>
      ) : (
        <div className="board">
          {sorted.map((order) => {
            const step = getNextStep(order);
            return (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <h3>{order.customerName}</h3>
                  <span className={`status-badge ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
                </div>
                <div className="order-meta">
                  {order.fulfillmentType === "delivery" ? "Delivery" : "Pickup"} · Placed{" "}
                  {formatTime(order.createdAt)} · {minutesSince(order.createdAt)} min ago
                </div>
                {order.fulfillmentType === "delivery" && order.deliveryAddress && (
                  <div className="order-meta">{order.deliveryAddress}</div>
                )}
                <div className="order-meta">{order.customerPhone}</div>
                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        <span className="qty">{item.quantity}×</span> {item.menuItemName}
                      </span>
                    </li>
                  ))}
                </ul>
                {order.notes && <div className="order-notes">Note: {order.notes}</div>}
                <div className="order-actions">
                  {step && (
                    <button type="button" onClick={() => advance(order)} disabled={pendingId === order.id}>
                      {step.label}
                    </button>
                  )}
                  <button type="button" onClick={() => cancel(order)} disabled={pendingId === order.id}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
