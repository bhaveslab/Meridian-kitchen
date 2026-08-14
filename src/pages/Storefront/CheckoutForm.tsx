import { useState, type FormEvent } from "react";
import { checkout } from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";
import { translatedName } from "../../lib/translated";
import LanguageToggle from "../../components/LanguageToggle";
import Price from "../../components/Price";
import { formatPrice } from "../../lib/format";
import type { FulfillmentType, Restaurant } from "../../../shared/types";
import type { CartEntry } from "./StorefrontPage";

interface Props {
  restaurant: Restaurant;
  cartEntries: CartEntry[];
  totalCents: number;
  onBack: () => void;
}

export default function CheckoutForm({ restaurant, cartEntries, totalCents, onBack }: Props) {
  const { locale, t } = useLanguage();
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
    if (cartEntries.length === 0) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { checkoutUrl } = await checkout({
        restaurantId: restaurant.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfillmentType,
        deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        items: cartEntries.map((e) => ({
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

  const exchangeRate = restaurant.usdHnlExchangeRate;

  return (
    <main className="guest-page">
      <div className="page-header">
        <button type="button" onClick={onBack}>
          {t("backToMenu")}
        </button>
        <LanguageToggle />
      </div>
      <h1>{t("checkout")}</h1>

      <ul className="order-items" style={{ marginBottom: "1.5rem" }}>
        {cartEntries.map((e) => (
          <li key={e.item.id}>
            <span>
              <span className="qty">{e.quantity}×</span> {translatedName(e.item.name, e.item.translations, locale)}
              {Object.entries(e.selectedVariants).length > 0 && (
                <span className="order-meta"> ({Object.values(e.selectedVariants).join(", ")})</span>
              )}
            </span>
            <Price cents={e.unitPriceCents * e.quantity} exchangeRate={exchangeRate} />
          </li>
        ))}
      </ul>
      <p>
        <strong>
          {t("total")}: <Price cents={totalCents} exchangeRate={exchangeRate} />
        </strong>
      </p>

      <form onSubmit={handleSubmit}>
        <section className="category-block">
          <h3>{t("yourDetails")}</h3>
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
        </section>

        <section className="category-block">
          <h3>{t("fulfillment")}</h3>
          <div className="form-row">
            <label>
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "pickup"}
                onChange={() => setFulfillmentType("pickup")}
              />{" "}
              {t("pickup")}
            </label>
            <label>
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "delivery"}
                onChange={() => setFulfillmentType("delivery")}
              />{" "}
              {t("delivery")}
            </label>
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
        </section>

        <section className="category-block">
          <h3>{t("notesForKitchen")}</h3>
          <textarea
            rows={2}
            style={{ width: "100%" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
          />
        </section>

        {submitError && <div className="error-banner">{submitError}</div>}

        <div className="cart-bar" style={{ position: "static", border: "none", padding: 0 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? t("redirectingToPayment") : `${t("pay")} ${formatPrice(totalCents)}`}
          </button>
        </div>
      </form>
    </main>
  );
}
