import { useState, type FormEvent } from "react";
import { checkout } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import type { FulfillmentType, MenuItem, Restaurant } from "../../../shared/types";

interface Props {
  restaurant: Restaurant;
  cartEntries: { item: MenuItem; quantity: number }[];
  totalCents: number;
  onBack: () => void;
}

export default function CheckoutForm({ restaurant, cartEntries, totalCents, onBack }: Props) {
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
        items: cartEntries.map((e) => ({ menuItemId: e.item.id, quantity: e.quantity })),
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  return (
    <main className="guest-page">
      <button type="button" onClick={onBack} style={{ marginBottom: "1rem" }}>
        ← Back to menu
      </button>
      <h1>Checkout</h1>

      <ul className="order-items" style={{ marginBottom: "1.5rem" }}>
        {cartEntries.map((e) => (
          <li key={e.item.id}>
            <span>
              <span className="qty">{e.quantity}×</span> {e.item.name}
            </span>
            <span>{formatPrice(e.item.priceCents * e.quantity)}</span>
          </li>
        ))}
      </ul>
      <p>
        <strong>Total: {formatPrice(totalCents)}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <section className="category-block">
          <h3>Your details</h3>
          <div className="form-row">
            <input
              placeholder="Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <input
              placeholder="Phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input
              placeholder="Email (optional)"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </section>

        <section className="category-block">
          <h3>Fulfillment</h3>
          <div className="form-row">
            <label>
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "pickup"}
                onChange={() => setFulfillmentType("pickup")}
              />{" "}
              Pickup
            </label>
            <label>
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "delivery"}
                onChange={() => setFulfillmentType("delivery")}
              />{" "}
              Delivery
            </label>
          </div>
          {fulfillmentType === "delivery" && (
            <div className="form-row">
              <input
                placeholder="Delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                style={{ flexBasis: "100%" }}
              />
            </div>
          )}
        </section>

        <section className="category-block">
          <h3>Notes for the kitchen (optional)</h3>
          <textarea
            rows={2}
            style={{ width: "100%" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergies, special requests…"
          />
        </section>

        {submitError && <div className="error-banner">{submitError}</div>}

        <div className="cart-bar" style={{ position: "static", border: "none", padding: 0 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? "Redirecting to payment…" : `Pay ${formatPrice(totalCents)}`}
          </button>
        </div>
      </form>
    </main>
  );
}
