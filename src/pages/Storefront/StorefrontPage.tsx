import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getStorefront } from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";
import { translatedDescription, translatedName } from "../../lib/translated";
import LanguageToggle from "../../components/LanguageToggle";
import Price from "../../components/Price";
import type { MenuItem, StorefrontResponse } from "../../../shared/types";
import CheckoutForm from "./CheckoutForm";

export interface CartEntry {
  item: MenuItem;
  quantity: number;
  selectedVariants: Record<string, string>;
  unitPriceCents: number;
}

function defaultVariants(item: MenuItem, override?: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const group of item.variantOptions) {
    result[group.key] = override?.[group.key] ?? group.choices[0]?.value ?? "";
  }
  return result;
}

function priceWithVariants(item: MenuItem, selected: Record<string, string>): number {
  let total = item.priceCents;
  for (const group of item.variantOptions) {
    const choice = group.choices.find((c) => c.value === selected[group.key]);
    if (choice) total += choice.priceDeltaCents;
  }
  return total;
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t } = useLanguage();
  const [storefront, setStorefront] = useState<StorefrontResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [variantSelections, setVariantSelections] = useState<Record<string, Record<string, string>>>({});
  const [step, setStep] = useState<"menu" | "checkout">("menu");

  useEffect(() => {
    if (!slug) return;
    getStorefront(slug)
      .then(setStorefront)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load this restaurant"));
  }, [slug]);

  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    storefront?.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [storefront]);

  const cartEntries: CartEntry[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => {
          const item = itemsById.get(id);
          if (!item) return null;
          const selectedVariants = defaultVariants(item, variantSelections[id]);
          return { item, quantity, selectedVariants, unitPriceCents: priceWithVariants(item, selectedVariants) };
        })
        .filter((e): e is CartEntry => e !== null),
    [cart, itemsById, variantSelections]
  );

  const totalCents = cartEntries.reduce((sum, e) => sum + e.unitPriceCents * e.quantity, 0);
  const totalCount = cartEntries.reduce((sum, e) => sum + e.quantity, 0);
  const exchangeRate = storefront?.restaurant.usdHnlExchangeRate;

  function setQuantity(itemId: string, quantity: number) {
    setCart((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  function setVariantChoice(itemId: string, groupKey: string, value: string) {
    setVariantSelections((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [groupKey]: value } }));
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
        <p>{t("loadingMenu")}</p>
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
      <div className="page-header">
        <h1>{storefront.restaurant.name}</h1>
        <LanguageToggle />
      </div>
      {storefront.restaurant.description && <p className="order-meta">{storefront.restaurant.description}</p>}

      {storefront.categories.map((category) => {
        const items = storefront.items.filter((i) => i.categoryId === category.id);
        if (items.length === 0) return null;
        return (
          <section className="category-block" key={category.id}>
            <h3>{translatedName(category.name, category.translations, locale)}</h3>
            {items.map((item) => {
              const selected = defaultVariants(item, variantSelections[item.id]);
              const unitPriceCents = priceWithVariants(item, selected);
              return (
                <div className="guest-item" key={item.id}>
                  <div>
                    <div className="item-name">{translatedName(item.name, item.translations, locale)}</div>
                    {item.description && (
                      <div className="item-desc">
                        {translatedDescription(item.description, item.translations, locale)}
                      </div>
                    )}
                    <div className="item-price">
                      <Price cents={unitPriceCents} exchangeRate={exchangeRate} />
                    </div>
                    {item.variantOptions.map((group) => (
                      <div className="form-row" key={group.key} style={{ marginTop: "0.4rem" }}>
                        {group.choices.map((choice) => (
                          <label key={choice.value}>
                            <input
                              type="radio"
                              name={`${item.id}-${group.key}`}
                              checked={selected[group.key] === choice.value}
                              onChange={() => setVariantChoice(item.id, group.key, choice.value)}
                            />{" "}
                            {locale === "es" ? choice.labelEs : choice.labelEn}
                          </label>
                        ))}
                      </div>
                    ))}
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
              );
            })}
          </section>
        );
      })}

      {totalCount > 0 && (
        <div className="cart-bar">
          <span>
            {totalCount} {totalCount === 1 ? t("item") : t("items")} ·{" "}
            <strong>
              <Price cents={totalCents} exchangeRate={exchangeRate} />
            </strong>
          </span>
          <button type="button" onClick={() => setStep("checkout")}>
            {t("checkout")}
          </button>
        </div>
      )}
    </main>
  );
}
