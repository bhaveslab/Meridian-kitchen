import { useCallback } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getOrder } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { useLanguage } from "../../lib/LanguageContext";
import { useCart } from "../../lib/CartContext";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import StorefrontPrice from "../../components/StorefrontPrice";
import type { UiStringKey } from "../../../shared/i18n";
import type { StorefrontResponse } from "../../../shared/types";

const STATUS_COPY_KEY: Record<string, UiStringKey> = {
  received: "statusReceived",
  preparing: "statusPreparing",
  ready: "statusReady",
  out_for_delivery: "statusOutForDelivery",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

export default function OrderStatusPage() {
  const storefront = useOutletContext<StorefrontResponse>();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const cart = useCart();
  const fetcher = useCallback(() => getOrder(orderId!), [orderId]);
  const { data: order, error } = usePolling(fetcher, 4000);

  function startNewOrder() {
    cart.clear();
    navigate(`/r/${storefront.restaurant.slug}`);
  }

  return (
    <div className="st-confirm">
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <StorefrontLangToggle />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {order && (
        <>
          <div className="st-confirm-icon">{order.status === "cancelled" ? "✕" : "✓"}</div>
          <h1 className="st-confirm-title">{t("orderReceived")}</h1>
          <div className="st-confirm-order-number">#{order.id.slice(0, 8).toUpperCase()}</div>

          {order.paymentStatus === "pending" && <p style={{ color: "var(--text-secondary)" }}>{t("confirmingPayment")}</p>}
          {order.paymentStatus === "failed" && <div className="error-banner">{t("paymentFailed")}</div>}

          <span className={`status-badge ${order.status}`} style={{ margin: "8px 0" }}>
            {order.status.replace(/_/g, " ")}
          </span>
          <p style={{ color: "var(--text-secondary)" }}>{t(STATUS_COPY_KEY[order.status])}</p>
          {order.status === "received" && <p style={{ color: "var(--text-secondary)" }}>{t("thankYou")}</p>}

          <ul className="order-items" style={{ textAlign: "left", maxWidth: 320, margin: "1.5rem auto", width: "100%" }}>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  <span className="qty">{item.quantity}×</span> {item.menuItemName}
                </span>
                <StorefrontPrice cents={item.unitPriceCents * item.quantity} exchangeRate={order.exchangeRateHnlPerUsd} />
              </li>
            ))}
          </ul>

          <button type="button" className="st-pill st-pill-outline" style={{ padding: "12px 28px" }} onClick={startNewOrder}>
            {t("startNewOrder")}
          </button>
        </>
      )}
    </div>
  );
}
