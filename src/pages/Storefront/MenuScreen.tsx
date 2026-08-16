import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLanguage } from "../../lib/LanguageContext";
import { useCart } from "../../lib/CartContext";
import { translatedDescription, translatedName } from "../../lib/translated";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import StorefrontPrice from "../../components/StorefrontPrice";
import WhatsAppButton from "../../components/WhatsAppButton";
import type { MenuItem, StorefrontResponse } from "../../../shared/types";

export default function MenuScreen() {
  const storefront = useOutletContext<StorefrontResponse>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const cart = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const slug = storefront.restaurant.slug;
  const exchangeRate = storefront.restaurant.usdHnlExchangeRate;
  const hasNeedsPricingItems = storefront.items.some((i) => i.needsPricing);

  const visibleCategories = useMemo(
    () =>
      activeCategory === "all"
        ? storefront.categories
        : storefront.categories.filter((c) => c.id === activeCategory),
    [storefront.categories, activeCategory]
  );

  function openItem(item: MenuItem) {
    navigate(`/r/${slug}/menu/${item.id}`);
  }

  return (
    <div>
      <div className="st-header">
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{t("menuTitle")}</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StorefrontLangToggle />
          <WhatsAppButton phone={storefront.restaurant.phone} variant="icon" />
          <button
            type="button"
            onClick={() => navigate(`/r/${slug}/cart`)}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
            aria-label={t("yourOrder")}
          >
            🛒
            {cart.totalCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--gold-500)",
                  color: "var(--text-on-gold)",
                  fontSize: 9,
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cart.totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="st-category-tabs">
        <button
          type="button"
          className={`st-chip ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          {t("allCategory")}
        </button>
        {storefront.categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`st-chip ${activeCategory === category.id ? "active" : ""}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {translatedName(category.name, category.translations, locale)}
          </button>
        ))}
      </div>

      <div className="st-menu-content">
        {visibleCategories.map((category) => {
          const items = storefront.items.filter((i) => i.categoryId === category.id);
          if (items.length === 0) return null;
          return (
            <section key={category.id}>
              <h2 className="st-category-heading">{translatedName(category.name, category.translations, locale)}</h2>
              {items.map((item) => {
                const isOrderable = item.priceCents > 0;
                const hasVariants = item.variantOptions.length > 0;
                return (
                  <div className="st-item-row" key={item.id} onClick={() => openItem(item)}>
                    {item.imageUrl ? (
                      <img className="st-item-thumb" src={item.imageUrl} alt="" />
                    ) : (
                      <div className="st-item-thumb-placeholder">{t("noPhoto")}</div>
                    )}
                    <div className="st-item-info">
                      <div className="st-item-name">{translatedName(item.name, item.translations, locale)}</div>
                      {item.description && (
                        <div className="st-item-desc">
                          {translatedDescription(item.description, item.translations, locale)}
                        </div>
                      )}
                      {isOrderable ? (
                        <StorefrontPrice cents={item.priceCents} exchangeRate={exchangeRate} />
                      ) : (
                        <span className="st-price">{t("priceVaries")}</span>
                      )}
                      {item.needsPricing && <span> *</span>}
                    </div>
                    {!isOrderable ? (
                      <span className="st-ask-staff">{t("askStaff")}</span>
                    ) : hasVariants ? (
                      <button
                        type="button"
                        className="st-pill st-pill-outline"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openItem(item);
                        }}
                      >
                        {t("addToCart")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="st-quick-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          cart.quickAdd(item.id);
                        }}
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}

        {hasNeedsPricingItems && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20 }}>
            * {locale === "es" ? "Precio provisional, sujeto a confirmación." : "Price is preliminary, subject to confirmation."}
          </p>
        )}
      </div>

      {cart.totalCount > 0 && (
        <button type="button" className="st-cart-bar" onClick={() => navigate(`/r/${slug}/cart`)}>
          <span>
            {t("yourOrder")} ({cart.totalCount})
          </span>
          <StorefrontPrice cents={cart.totalCents} exchangeRate={exchangeRate} />
        </button>
      )}
    </div>
  );
}
