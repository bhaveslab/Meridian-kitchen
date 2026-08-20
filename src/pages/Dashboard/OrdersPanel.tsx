import { useCallback, useState } from "react";
import { getOrders, updateOrderStatus } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { useLanguage } from "../../lib/LanguageContext";
import { formatTime, minutesSince } from "../../lib/format";
import Price from "../../components/Price";
import { ACTIVE_ORDER_STATUSES } from "../../../shared/types";
import type { Order, OrderStatus } from "../../../shared/types";
import type { UiStringKey } from "../../../shared/i18n";

function getNextStep(order: Order): { labelKey: UiStringKey; next: OrderStatus } | null {
  switch (order.status) {
    case "received":
      return { labelKey: "startPreparing", next: "preparing" };
    case "preparing":
      return { labelKey: "markReady", next: "ready" };
    case "ready":
      return order.fulfillmentType === "delivery"
        ? { labelKey: "outForDelivery", next: "out_for_delivery" }
        : { labelKey: "complete", next: "completed" };
    case "out_for_delivery":
      return { labelKey: "complete", next: "completed" };
    default:
      return null;
  }
}

export default function OrdersPanel({ restaurantId, exchangeRate }: { restaurantId: string; exchangeRate: number }) {
  const { t } = useLanguage();
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
        <p className="empty-state">{t("noActiveOrders")}</p>
      ) : (
        <div className="board">
          {sorted.map((order) => {
            const step = getNextStep(order);
            return (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <h3>{order.customerName}</h3>
                    <span className="order-number">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <span className={`status-badge ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
                </div>
                <div className="order-meta">
                  {order.fulfillmentType === "delivery" ? t("delivery") : t("pickup")} · Placed{" "}
                  {formatTime(order.createdAt)} · {minutesSince(order.createdAt)} min ago
                </div>
                {order.fulfillmentType === "delivery" && order.deliveryAddress && (
                  <div className="order-meta">{order.deliveryAddress}</div>
                )}
                <div className="order-meta">
                  {t("phone")}: {order.customerPhone}
                </div>
                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        <span className="qty">{item.quantity}×</span> {item.menuItemName}
                        {Object.values(item.selectedVariants).length > 0 && (
                          <span className="order-meta"> ({Object.values(item.selectedVariants).join(", ")})</span>
                        )}
                      </span>
                      <Price cents={item.unitPriceCents * item.quantity} exchangeRate={exchangeRate} />
                    </li>
                  ))}
                </ul>
                {order.notes && <div className="order-notes">Note: {order.notes}</div>}
                <div className="order-actions">
                  {step && (
                    <button type="button" onClick={() => advance(order)} disabled={pendingId === order.id}>
                      {t(step.labelKey)}
                    </button>
                  )}
                  <button type="button" onClick={() => cancel(order)} disabled={pendingId === order.id}>
                    {t("cancel")}
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
