import { useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { checkout } from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";
import { useCart } from "../../lib/CartContext";
import { translatedName } from "../../lib/translated";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import StorefrontPrice from "../../components/StorefrontPrice";
import { formatPrice } from "../../lib/format";
import type { FulfillmentType, StorefrontResponse } from "../../../shared/types";

export default function CheckoutForm() {
  const storefront = useOutletContext<StorefrontResponse>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const cart = useCart();
  const slug = storefront.restaurant.slug;
  const exchangeRate = storefront.restaurant.usdHnlExchangeRate;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cart.entries.length === 0) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { checkoutUrl } = await checkout({
        restaurantId: storefront.restaurant.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        items: cart.entries.map((e) => ({
          menuItemId: e.item.id,
          quantity: e.quantity,
          selectedVariants: e.selectedVariants,
        })),
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="st-header">
        <button type="button" className="st-back" onClick={() => navigate(`/r/${slug}/cart`)}>
          ←
        </button>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{t("checkout")}</strong>
        <StorefrontLangToggle />
      </div>

      <div style={{ padding: 16 }}>
        <div className="st-summary-card st-card">
          {cart.entries.map((e) => (
            <div className="st-summary-row" key={e.item.id}>
              <span>
                {e.quantity}× {translatedName(e.item.name, e.item.translations, locale)}
              </span>
              <StorefrontPrice cents={e.unitPriceCents * e.quantity} exchangeRate={exchangeRate} />
            </div>
          ))}
          <hr className="st-summary-divider" />
          <div className="st-summary-row" style={{ fontWeight: 600 }}>
            <span>{t("total")}</span>
            <StorefrontPrice cents={cart.totalCents} exchangeRate={exchangeRate} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div className="st-eyebrow" style={{ marginBottom: 8 }}>
            {t("yourDetails")}
          </div>
          <div className="form-row">
            <input
              placeholder={t("name")}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <input
              placeholder={t("phone")}
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("emailOptional")}
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="st-eyebrow" style={{ margin: "20px 0 8px" }}>
            {t("fulfillment")}
          </div>
          <div className="st-variant-picker">
            <button
              type="button"
              className={`st-variant-option ${fulfillmentType === "pickup" ? "active" : ""}`}
              onClick={() => setFulfillmentType("pickup")}
            >
              {t("pickup")}
            </button>
            <button
              type="button"
              className={`st-variant-option ${fulfillmentType === "delivery" ? "active" : ""}`}
              onClick={() => setFulfillmentType("delivery")}
            >
              {t("delivery")}
            </button>
          </div>
          {fulfillmentType === "delivery" && (
            <div className="form-row">
              <input
                placeholder={t("deliveryAddress")}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                style={{ flexBasis: "100%" }}
              />
            </div>
          )}

          <div className="st-eyebrow" style={{ margin: "20px 0 8px" }}>
            {t("notesForKitchen")}
          </div>
          <textarea
            rows={2}
            style={{ width: "100%" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
          />

          {submitError && <div className="error-banner">{submitError}</div>}

          <div className="st-sticky-footer" style={{ position: "sticky", padding: "20px 0" }}>
            <button type="submit" className="st-pill st-pill-gold" style={{ width: "100%", padding: 15 }} disabled={submitting}>
              {submitting ? t("redirectingToPayment") : `${t("pay")} · ${formatPrice(cart.totalCents)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
