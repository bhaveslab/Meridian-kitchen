import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { createOrder, getGuestMenu } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import type { GuestMenuResponse } from "../../../shared/types";
import OrderStatusTracker from "./OrderStatusTracker";

export default function GuestOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [menu, setMenu] = useState<GuestMenuResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getGuestMenu(token)
      .then(setMenu)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load menu"));
  }, [token]);

  const itemsById = useMemo(() => {
    const map = new Map<string, GuestMenuResponse["items"][number]>();
    menu?.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [menu]);

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ item: itemsById.get(id), quantity: qty }))
        .filter((e): e is { item: GuestMenuResponse["items"][number]; quantity: number } => !!e.item),
    [cart, itemsById]
  );

  const totalCents = cartEntries.reduce((sum, e) => sum + e.item.priceCents * e.quantity, 0);
  const totalCount = cartEntries.reduce((sum, e) => sum + e.quantity, 0);

  function setQuantity(itemId: string, quantity: number) {
    setCart((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  async function placeOrder() {
    if (!menu || cartEntries.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        tableId: menu.table.id,
        notes: notes.trim() || undefined,
        items: cartEntries.map((e) => ({ menuItemId: e.item.id, quantity: e.quantity })),
      });
      setPlacedOrderId(order.id);
      setCart({});
      setNotes("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrderId) {
    return <OrderStatusTracker orderId={placedOrderId} tableLabel={menu?.table.label} />;
  }

  if (loadError) {
    return (
      <main className="guest-page">
        <div className="error-banner">{loadError}</div>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="guest-page">
        <p>Loading menu…</p>
      </main>
    );
  }

  return (
    <main className="guest-page">
      <h1>{menu.table.label}</h1>
      <p className="order-meta">Browse the menu and build your order.</p>

      {menu.categories.map((category) => {
        const items = menu.items.filter((i) => i.categoryId === category.id);
        if (items.length === 0) return null;
        return (
          <section className="category-block" key={category.id}>
            <h3>{category.name}</h3>
            {items.map((item) => (
              <div className="guest-item" key={item.id}>
                <div>
                  <div className="item-name">{item.name}</div>
                  {item.description && <div className="item-desc">{item.description}</div>}
                  <div className="item-price">{formatPrice(item.priceCents)}</div>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, (cart[item.id] ?? 0) - 1)}
                    disabled={!cart[item.id]}
                  >
                    −
                  </button>
                  <span>{cart[item.id] ?? 0}</span>
                  <button type="button" onClick={() => setQuantity(item.id, (cart[item.id] ?? 0) + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </section>
        );
      })}

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

      {totalCount > 0 && (
        <div className="cart-bar">
          <span>
            {totalCount} item{totalCount === 1 ? "" : "s"} · <strong>{formatPrice(totalCents)}</strong>
          </span>
          <button type="button" onClick={placeOrder} disabled={submitting}>
            {submitting ? "Sending…" : "Place order"}
          </button>
        </div>
      )}
    </main>
  );
}
