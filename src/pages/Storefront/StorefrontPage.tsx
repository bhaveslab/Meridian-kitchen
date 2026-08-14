import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getStorefront } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import type { StorefrontResponse } from "../../../shared/types";
import CheckoutForm from "./CheckoutForm";

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<StorefrontResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"menu" | "checkout">("menu");

  useEffect(() => {
    if (!slug) return;
    getStorefront(slug)
      .then(setStorefront)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load this restaurant"));
  }, [slug]);

  const itemsById = useMemo(() => {
    const map = new Map<string, StorefrontResponse["items"][number]>();
    storefront?.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [storefront]);

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ item: itemsById.get(id), quantity: qty }))
        .filter((e): e is { item: StorefrontResponse["items"][number]; quantity: number } => !!e.item),
    [cart, itemsById]
  );

  const totalCents = cartEntries.reduce((sum, e) => sum + e.item.priceCents * e.quantity, 0);
  const totalCount = cartEntries.reduce((sum, e) => sum + e.quantity, 0);

  function setQuantity(itemId: string, quantity: number) {
    setCart((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  if (loadError) {
    return (
      <main className="guest-page">
        <div className="error-banner">{loadError}</div>
      </main>
    );
  }

  if (!storefront) {
    return (
      <main className="guest-page">
        <p>Loading menu…</p>
      </main>
    );
  }

  if (step === "checkout") {
    return (
      <CheckoutForm
        restaurant={storefront.restaurant}
        cartEntries={cartEntries}
        totalCents={totalCents}
        onBack={() => setStep("menu")}
      />
    );
  }

  return (
    <main className="guest-page">
      <h1>{storefront.restaurant.name}</h1>
      {storefront.restaurant.description && <p className="order-meta">{storefront.restaurant.description}</p>}

      {storefront.categories.map((category) => {
        const items = storefront.items.filter((i) => i.categoryId === category.id);
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

      {totalCount > 0 && (
        <div className="cart-bar">
          <span>
            {totalCount} item{totalCount === 1 ? "" : "s"} · <strong>{formatPrice(totalCents)}</strong>
          </span>
          <button type="button" onClick={() => setStep("checkout")}>
            Checkout
          </button>
        </div>
      )}
    </main>
  );
}
