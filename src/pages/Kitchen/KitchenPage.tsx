import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, updateOrderStatus } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { formatTime, minutesSince } from "../../lib/format";
import { ACTIVE_ORDER_STATUSES } from "../../../shared/types";
import type { Order, OrderStatus } from "../../../shared/types";

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  placed: { label: "Start", next: "in_progress" },
  in_progress: { label: "Mark ready", next: "ready" },
  ready: { label: "Serve", next: "served" },
};

export default function KitchenPage() {
  const fetcher = useCallback(() => getOrders({ statuses: ACTIVE_ORDER_STATUSES }), []);
  const { data: orders, error, refetch } = usePolling(fetcher, 4000);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function advance(order: Order) {
    const step = NEXT_STATUS[order.status];
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
    <div className="page">
      <div className="page-header">
        <h1>Kitchen</h1>
        <Link to="/">Home</Link>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {sorted.length === 0 ? (
        <p className="empty-state">No active orders.</p>
      ) : (
        <div className="board">
          {sorted.map((order) => {
            const step = NEXT_STATUS[order.status];
            return (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <h3>{order.tableLabel}</h3>
                  <span className={`status-badge ${order.status}`}>{order.status.replace("_", " ")}</span>
                </div>
                <div className="order-meta">
                  Placed {formatTime(order.createdAt)} · {minutesSince(order.createdAt)} min ago
                </div>
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
