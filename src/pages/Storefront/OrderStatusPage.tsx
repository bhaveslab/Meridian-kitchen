import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { getOrder } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { useLanguage } from "../../lib/LanguageContext";
import LanguageToggle from "../../components/LanguageToggle";
import Price from "../../components/Price";
import type { UiStringKey } from "../../../shared/i18n";

const STATUS_COPY_KEY: Record<string, UiStringKey> = {
  received: "statusReceived",
  preparing: "statusPreparing",
  ready: "statusReady",
  out_for_delivery: "statusOutForDelivery",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useLanguage();
  const fetcher = useCallback(() => getOrder(orderId!), [orderId]);
  const { data: order, error } = usePolling(fetcher, 4000);

  return (
    <main className="guest-page">
      <div className="page-header">
        <h1>{t("orderConfirmation")}</h1>
        <LanguageToggle />
      </div>
      <div className="confirmation">
        {error && <div className="error-banner">{error}</div>}
        {order && (
          <>
            {order.paymentStatus === "pending" && <p className="order-meta">{t("confirmingPayment")}</p>}
            {order.paymentStatus === "failed" && <div className="error-banner">{t("paymentFailed")}</div>}
            <span className={`status-badge ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
            <p>{t(STATUS_COPY_KEY[order.status])}</p>
            <ul className="order-items" style={{ textAlign: "left", maxWidth: 360, margin: "1.5rem auto" }}>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    <span className="qty">{item.quantity}×</span> {item.menuItemName}
                  </span>
                  <Price cents={item.unitPriceCents * item.quantity} exchangeRate={order.exchangeRateHnlPerUsd} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
