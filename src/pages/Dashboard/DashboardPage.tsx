import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStorefront } from "../../lib/api";
import type { Restaurant } from "../../../shared/types";
import OrdersPanel from "./OrdersPanel";
import MenuPanel from "./MenuPanel";

type Tab = "orders" | "menu";

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!slug) return;
    getStorefront(slug)
      .then((data) => setRestaurant(data.restaurant))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load restaurant"));
  }, [slug]);

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{restaurant.name} — Dashboard</h1>
        <Link to={`/r/${restaurant.slug}`}>View storefront</Link>
      </div>
      <div className="tabs">
        <button type="button" className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          Orders
        </button>
        <button type="button" className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>
          Menu
        </button>
      </div>
      {tab === "orders" ? <OrdersPanel restaurantId={restaurant.id} /> : <MenuPanel restaurantId={restaurant.id} />}
    </div>
  );
}
