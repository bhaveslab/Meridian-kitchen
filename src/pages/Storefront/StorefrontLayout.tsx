import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { getStorefront } from "../../lib/api";
import { CartProvider } from "../../lib/CartContext";
import type { StorefrontResponse } from "../../../shared/types";

export default function StorefrontLayout() {
  const { slug } = useParams<{ slug: string }>();
  const [storefront, setStorefront] = useState<StorefrontResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getStorefront(slug)
      .then(setStorefront)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load this restaurant"));
  }, [slug]);

  if (loadError) {
    return (
      <div className="storefront-theme" style={{ padding: 16 }}>
        <div className="error-banner">{loadError}</div>
      </div>
    );
  }

  if (!storefront) {
    return (
      <div
        className="storefront-theme"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}
      >
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="storefront-theme">
      <CartProvider items={storefront.items}>
        <Outlet context={storefront} />
      </CartProvider>
    </div>
  );
}
