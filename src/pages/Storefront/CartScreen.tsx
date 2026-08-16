import { useNavigate, useOutletContext } from "react-router-dom";
import { useLanguage } from "../../lib/LanguageContext";
import { useCart } from "../../lib/CartContext";
import { translatedName } from "../../lib/translated";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import StorefrontPrice from "../../components/StorefrontPrice";
import type { StorefrontResponse } from "../../../shared/types";

export default function CartScreen() {
  const storefront = useOutletContext<StorefrontResponse>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const cart = useCart();
  const slug = storefront.restaurant.slug;
  const exchangeRate = storefront.restaurant.usdHnlExchangeRate;

  return (
    <div>
      <div className="st-header">
        <button type="button" className="st-back" onClick={() => navigate(`/r/${slug}/menu`)}>
          ←
        </button>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{t("yourOrder")}</strong>
        <StorefrontLangToggle />
      </div>

      {cart.entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{t("emptyCart")}</p>
          <button type="button" className="st-pill st-pill-outline" style={{ padding: "12px 28px" }} onClick={() => navigate(`/r/${slug}/menu`)}>
            {t("browseMenu")}
          </button>
        </div>
      ) : (
        <div style={{ padding: "0 16px" }}>
          {cart.entries.map((entry) => (
            <div className="st-cart-line" key={entry.item.id}>
              {entry.item.imageUrl ? (
                <img className="st-cart-line-thumb" src={entry.item.imageUrl} alt="" />
              ) : (
                <div className="st-cart-line-thumb" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="st-item-name" style={{ fontSize: 15 }}>
                  {translatedName(entry.item.name, entry.item.translations, locale)}
                </div>
                {Object.values(entry.selectedVariants).length > 0 && (
                  <div className="st-item-desc" style={{ WebkitLineClamp: "unset" }}>
                    {Object.values(entry.selectedVariants).join(", ")}
                  </div>
                )}
                <div className="st-stepper" style={{ marginTop: 6 }}>
                  <button type="button" onClick={() => cart.setQuantity(entry.item.id, entry.quantity - 1)}>
                    −
                  </button>
                  <span>{entry.quantity}</span>
                  <button type="button" onClick={() => cart.setQuantity(entry.item.id, entry.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
              <StorefrontPrice cents={entry.unitPriceCents * entry.quantity} exchangeRate={exchangeRate} />
              <button
                type="button"
                className="st-remove"
                onClick={() => cart.setQuantity(entry.item.id, 0)}
                aria-label={t("delete")}
              >
                ×
              </button>
            </div>
          ))}

          <div className="st-summary-card st-card">
            <div className="st-summary-row">
              <span>{t("subtotal")}</span>
              <StorefrontPrice cents={cart.totalCents} exchangeRate={exchangeRate} />
            </div>
          </div>

          <div className="st-sticky-footer" style={{ position: "sticky", padding: "16px 0" }}>
            <button
              type="button"
              className="st-pill st-pill-gold"
              style={{ width: "100%", padding: 15 }}
              onClick={() => navigate(`/r/${slug}/checkout`)}
            >
              {t("checkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
