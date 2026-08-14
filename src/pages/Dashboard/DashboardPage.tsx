import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStorefront, updateExchangeRate } from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";
import LanguageToggle from "../../components/LanguageToggle";
import type { Restaurant } from "../../../shared/types";
import OrdersPanel from "./OrdersPanel";
import MenuPanel from "./MenuPanel";

type Tab = "orders" | "menu";

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [rateInput, setRateInput] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getStorefront(slug)
      .then((data) => {
        setRestaurant(data.restaurant);
        setRateInput(String(data.restaurant.usdHnlExchangeRate));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load restaurant"));
  }, [slug]);

  async function saveRate() {
    if (!restaurant) return;
    const rate = Number(rateInput);
    if (!rate || rate <= 0) return;
    setSavingRate(true);
    try {
      const updated = await updateExchangeRate(restaurant.slug, rate);
      setRestaurant(updated);
    } finally {
      setSavingRate(false);
    }
  }

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
        <div className="page-header-actions">
          <Link to={`/r/${restaurant.slug}`}>{t("viewStorefront")}</Link>
          <LanguageToggle />
        </div>
      </div>
      <div className="form-row" style={{ alignItems: "center" }}>
        <label htmlFor="exchange-rate">{t("exchangeRateLabel")}</label>
        <input
          id="exchange-rate"
          type="number"
          step="0.01"
          min="0"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          style={{ maxWidth: 100 }}
        />
        <button type="button" onClick={saveRate} disabled={savingRate}>
          {t("save")}
        </button>
      </div>
      <div className="tabs">
        <button type="button" className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          {t("dashboardOrders")}
        </button>
        <button type="button" className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>
          {t("dashboardMenu")}
        </button>
      </div>
      {tab === "orders" ? (
        <OrdersPanel restaurantId={restaurant.id} exchangeRate={restaurant.usdHnlExchangeRate} />
      ) : (
        <MenuPanel restaurantId={restaurant.id} exchangeRate={restaurant.usdHnlExchangeRate} />
      )}
    </div>
  );
}
