import { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useLanguage } from "../../lib/LanguageContext";
import { useCart } from "../../lib/CartContext";
import { translatedDescription, translatedName } from "../../lib/translated";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import StorefrontPrice from "../../components/StorefrontPrice";
import { FOOD_GUIDE_CATEGORIES } from "../../../shared/foodGuide";
import type { StorefrontResponse } from "../../../shared/types";

export default function ItemDetailScreen() {
  const storefront = useOutletContext<StorefrontResponse>();
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const cart = useCart();

  const item = storefront.items.find((i) => i.id === itemId);
  const slug = storefront.restaurant.slug;
  const exchangeRate = storefront.restaurant.usdHnlExchangeRate;

  const [quantity, setQuantity] = useState(() => Math.max(1, cart.quantityOf(itemId ?? "")));
  const [variants, setVariants] = useState<Record<string, string>>(() => (item ? cart.variantsFor(item) : {}));

  if (!item) {
    return (
      <div style={{ padding: 16 }}>
        <button type="button" className="st-back" onClick={() => navigate(`/r/${slug}/menu`)}>
          ←
        </button>
      </div>
    );
  }

  const category = storefront.categories.find((c) => c.id === item.categoryId);
  const isOrderable = item.priceCents > 0;
  const unitPriceCents = item.variantOptions.reduce((total, group) => {
    const choice = group.choices.find((c) => c.value === variants[group.key]);
    return total + (choice?.priceDeltaCents ?? 0);
  }, item.priceCents);

  function addToCart() {
    if (!item) return;
    for (const [groupKey, value] of Object.entries(variants)) {
      cart.setVariantChoice(item.id, groupKey, value);
    }
    cart.setQuantity(item.id, quantity);
    navigate(`/r/${slug}/menu`);
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        {item.imageUrl ? (
          <img className="st-detail-photo" src={item.imageUrl} alt="" />
        ) : (
          <div className="st-detail-photo-placeholder">{t("noPhoto")}</div>
        )}
        <div className="st-detail-overlay">
          <button type="button" className="st-back" onClick={() => navigate(-1)}>
            ←
          </button>
          <StorefrontLangToggle />
        </div>
      </div>

      <div className="st-detail-body">
        {category && (
          <div className="st-eyebrow-sage">{translatedName(category.name, category.translations, locale)}</div>
        )}
        <h1 className="st-detail-title">{translatedName(item.name, item.translations, locale)}</h1>

        {item.foodGuideTags.length > 0 && (
          <div className="st-detail-tags">
            {item.foodGuideTags.map((tagKey) => {
              const tag = FOOD_GUIDE_CATEGORIES.find((c) => c.key === tagKey);
              if (!tag) return null;
              return (
                <span className="st-tag" key={tagKey}>
                  {locale === "es" ? tag.labelEs : tag.labelEn}
                </span>
              );
            })}
          </div>
        )}

        {item.description && (
          <p className="st-detail-desc">{translatedDescription(item.description, item.translations, locale)}</p>
        )}

        {isOrderable ? (
          <StorefrontPrice cents={unitPriceCents} exchangeRate={exchangeRate} />
        ) : (
          <span className="st-price">{t("priceVaries")}</span>
        )}
        {item.needsPricing && isOrderable && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {locale === "es" ? "Precio provisional, sujeto a confirmación." : "Price is preliminary, subject to confirmation."}
          </p>
        )}

        {!isOrderable && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>
            {locale === "es"
              ? "Selección rotativa — pregunte al personal por lo disponible hoy."
              : "Rotating selection — ask staff what's available today."}
          </p>
        )}

        {isOrderable && item.variantOptions.length > 0 && (
          <div>
            {item.variantOptions.map((group) => (
              <div className="st-variant-picker" key={group.key}>
                {group.choices.map((choice) => (
                  <button
                    type="button"
                    key={choice.value}
                    className={`st-variant-option ${variants[group.key] === choice.value ? "active" : ""}`}
                    onClick={() => setVariants((prev) => ({ ...prev, [group.key]: choice.value }))}
                  >
                    {locale === "es" ? choice.labelEs : choice.labelEn}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {isOrderable && (
          <div className="st-stepper" style={{ marginTop: 8 }}>
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
              −
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
        )}
      </div>

      {isOrderable && (
        <div className="st-sticky-footer" style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
          <button type="button" className="st-pill st-pill-gold" style={{ width: "100%", padding: 15 }} onClick={addToCart}>
            {t("addToCart")} — <StorefrontPrice cents={unitPriceCents * quantity} />
          </button>
        </div>
      )}
    </div>
  );
}
